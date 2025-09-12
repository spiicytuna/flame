import axios from 'axios';
import { store } from '../store/store';
import { createNotification } from '../store/action-creators';

export type VersionStatus = {
  status: 'new' | 'current' | 'old' | 'error';
  version?: string;
  link?: string;
  remoteUrl?: string;
  changelogRawUrl?: string;
};

// parse numbers.dots => ver2.8.0-rc1 => 2.8.0
function extractCoreVersion(s?: string | null): string | null {
  if (!s) return null;
  const m = String(s).match(/(\d+(?:\.\d+)+)/);
  return m ? m[1] : null;
}

// COMPARE
function cmpSemverCore(a: string, b: string): number {
  const A = a.split('.').map(n => parseInt(n, 10));
  const B = b.split('.').map(n => parseInt(n, 10));
  const L = Math.max(A.length, B.length);
  for (let i = 0; i < L; i++) {
    const ai = A[i] ?? 0, bi = B[i] ?? 0;
    if (ai > bi) return 1;
    if (ai < bi) return -1;
  }
  return 0;
}

// import JSON
type AppInfo = {
  name?: string | null;
  version?: string | null;
  owner?: string;
  repo?: string;
  branches?: { stable?: string; dev?: string };
};


async function getLocalAppInfo(): Promise<AppInfo> {
  try {
    const res = await fetch('/api/version');
    return await res.json();
  } catch {
    return {};
  }
}

function parseRemoteVersion(raw: string): string | null {
  // JSON => version:
  try {
    const obj = JSON.parse(raw);
    return extractCoreVersion(obj?.version ?? null);
  } catch {
    // .env => VITE_APP_VERSION=...
    const m = raw.match(/^\s*VITE_APP_VERSION\s*=\s*["']?([0-9A-Za-z.\-_]+)["']?\s*$/m);
    return extractCoreVersion(m ? m[1] : null);
  }
  return null;
}

// https://github.com/<owner>/<repo> => raw GH URL
function deriveGithubHome(remoteUrl: string | undefined): string | undefined {
  if (!remoteUrl) return;
  try {
    const u = new URL(remoteUrl);
    const parts = u.pathname.split('/').filter(Boolean);
    if (u.hostname === 'raw.githubusercontent.com' && parts.length >= 2) {
      const [owner, repo] = parts;
      return `https://github.com/${owner}/${repo}`;
    }
    if (u.hostname === 'github.com' && parts.length >= 2) {
      const [owner, repo] = parts;
      return `https://github.com/${owner}/${repo}`;
    }
  } catch {}
  return;
}

export async function checkVersion(
  isForced: boolean = false,
  urlOverride?: string,   // custom URL ??
  showNotifications: boolean = true
): Promise<VersionStatus> {
  const { name: pkgName, version: localVersionMaybe, owner, repo, branches } = await getLocalAppInfo();

  // hardcode spiicytuna => override versionCheck.json
  const ownerRepo = `${owner || 'spiicytuna'}/${repo || 'flame'}`;
  const branch = (pkgName === 'flame-dev')
    ? (branches?.dev || 'tuna-combo')
    : (branches?.stable || 'master');

  const defaults = {
    defaultUrl:  `https://raw.githubusercontent.com/${ownerRepo}/${branch}/package.json`,
    changelog:   `https://github.com/${ownerRepo}/blob/${branch}/CHANGELOG.md`,
    changelogRaw:`https://raw.githubusercontent.com/${ownerRepo}/${branch}/CHANGELOG.md`,
  };

  const remoteUrl = urlOverride ?? defaults.defaultUrl;

  // normalize
  const normalize = (u?: string) => {
    if (!u) return '';
    try {
      const x = new URL(u);
      return x.origin + x.pathname.replace(/\/+$/, '');
    } catch {
      return u.replace(/\/+$/, '');
    }
  };
  const isDefault = normalize(remoteUrl) === normalize(defaults.defaultUrl);

  // link target => custom => repo home | tuna => hardcoded
  const customLink = deriveGithubHome(remoteUrl);
  const linkForUpdate = isDefault ? defaults.changelog : customLink;


  // RAW changelog
  const changelogRawUrl = isDefault ? defaults.changelogRaw : undefined;

  try {
    const remoteRes = await axios.get(remoteUrl, { transformResponse: [(d) => d] });
    const remoteVersion = parseRemoteVersion(remoteRes.data);
    const localVersionRaw = typeof localVersionMaybe === 'string' ? localVersionMaybe : undefined;
    const localVersion = extractCoreVersion(localVersionRaw) || undefined;

    if (!remoteVersion) throw new Error('Unable to parse remote version');

    if (!localVersion) {
      if (isForced && showNotifications) {
        store.dispatch<any>(createNotification({ title: 'Error', message: 'Could not read local version.' }));
      }
      return { status: 'error', version: remoteVersion, link: linkForUpdate, remoteUrl, changelogRawUrl };
    }

    const cmp = cmpSemverCore(remoteVersion, localVersion)

    if (cmp > 0) {
      if (showNotifications) {
        store.dispatch<any>(createNotification({
          title: 'Info',
          message: `New version is available! (${remoteVersion})`,
          url: linkForUpdate,
        }));
      }
      return { status: 'new', version: remoteVersion, link: linkForUpdate, remoteUrl, changelogRawUrl };
    }

    if (cmp === 0) {
      if (isForced && showNotifications) {
        store.dispatch<any>(createNotification({
          title: 'Info',
          message: 'You are using the latest version!',
        }));
      }
      return { status: 'current', version: remoteVersion, link: linkForUpdate, remoteUrl, changelogRawUrl };
    }

    // local is newer ??
    if (isForced && showNotifications) {
      store.dispatch<any>(createNotification({
        title: 'Info',
        message: 'You are ahead of the remote version.',
      }));
    }
    return { status: 'old', version: remoteVersion, link: linkForUpdate, remoteUrl, changelogRawUrl };
  } catch (err) {
    console.error('Update Check Error:', err);
    if (isForced && showNotifications) {
      store.dispatch<any>(createNotification({
        title: 'Error',
        message: 'Failed to check for updates. Check URL and network.',
      }));
    }
    return { status: 'error' };
  }
}
