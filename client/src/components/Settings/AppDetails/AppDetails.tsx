import { Fragment, useState, useEffect, useMemo, useRef, ChangeEvent, FormEvent } from 'react';

// UI
import { Button, SettingsHeadline, InputGroup } from '../../UI';
import classes from './AppDetails.module.css';
import { useSelector, useDispatch } from 'react-redux';
import { State } from '../../../store/reducers';
import { actionCreators } from '../../../store';
import { bindActionCreators } from 'redux';

// Other
import { checkVersion, VersionStatus } from '../../../utility';
import { AuthForm } from './AuthForm/AuthForm';
import { AppDetailsForm } from '../../../interfaces';

type LocalAppInfo = { name?: string | null; version?: string | null; owner?: string; repo?: string; branches?: { stable?: string; dev?: string }; };

export const AppDetails = (): JSX.Element => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: State) => state.auth);
  const { config } = useSelector((state: State) => state.config);
  const { updateConfig, createNotification } = bindActionCreators(actionCreators, dispatch);

  const [localData, setLocalData] = useState<LocalAppInfo>({});
  const [formData, setFormData] = useState<Partial<AppDetailsForm>>({});
  const [installedVersion, setInstalledVersion] = useState<string>('Loading...');
  const [availableVersion, setAvailableVersion] = useState<string | JSX.Element>('N/A');
  const [changelog, setChangelog] = useState<string>('Loading changelog...');
  const [changelogSource, setChangelogSource] = useState<'local' | 'remote'>('local');
  const lastLocalChangelogRef = useRef<string>('');
  const defaultUpdateUrl = useMemo(() => {
      const owner = localData.owner || 'spiicytuna';
      const repo = localData.repo || 'flame';
      const isDev = localData.name === 'flame-dev';
      const branch = isDev
        ? (localData.branches?.dev || 'tuna-combo')
        : (localData.branches?.stable || 'master');
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/package.json`;
    }, [localData.owner, localData.repo, localData.name, localData.branches?.dev, localData.branches?.stable]);
   
  const tryLoadRemoteChangelog = async (rawUrl?: string) => {
    if (!rawUrl) return;
  
    const fallback = lastLocalChangelogRef.current;
    setChangelogSource('remote');
    setChangelog('Loading...');
  
    try {
      const res = await fetch(rawUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error('bad status');
      const txt = (await res.text()).trim();
      if (txt) {
        setChangelog(txt);
        return;
      }
      throw new Error('empty');
    } catch {
      // LOCAL
      setChangelogSource('local');
      if (fallback) setChangelog(fallback);
    }
  };
  
  // version ??
  const updateAvailableVersionUI = (result: VersionStatus) => {
    // custom ver url ! remote changelog
    const usedDefaults = !!result.changelogRawUrl;
    if (!usedDefaults) {
      setChangelogSource('local');
      if (lastLocalChangelogRef.current) {
        setChangelog(lastLocalChangelogRef.current);
      }
    }
  
    switch (result.status) {
      case 'new': {
        // rem changelog => default urls
        if (usedDefaults) {
          void tryLoadRemoteChangelog(result.changelogRawUrl);
        }
        const v = result.version ?? '?';
        setAvailableVersion(
          result.link ? (
            <a href={result.link} target="_blank" rel="noopener noreferrer">
              NEW! (v{v})
            </a>
          ) : (
            `NEW! (v${v})`
          )
        );
        break;
      }
      case 'current':
      case 'old':
        setAvailableVersion('Up to date');
        break;
      case 'error':
        setAvailableVersion('Error');
        break;
      default:
        setAvailableVersion('N/A');
    }
  };

  useEffect(() => {
    fetch('/api/version')
      .then((res) => res.json())
      .then((data) => {
        setInstalledVersion(data.version || 'Unknown');
        setLocalData(data);
      })
      .catch(() => {
        setInstalledVersion('Unknown');
      });
  
    setChangelog('Loading...');
    fetch('/api/changelog')
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error('bad status'))))
      .then((txt) => {
        if (txt && txt.trim()) {
          setChangelog(txt);
          setChangelogSource('local');
          lastLocalChangelogRef.current = txt;
        }
      })
      .catch(() => {});
  }, []);


  useEffect(() => {
    const useDefaults = config.useDefaults ?? true;
  
    const initialUrl = useDefaults
      ? defaultUpdateUrl
      : (config.updateUrl || defaultUpdateUrl);
  
    setFormData({
      automaticUpdates: config.automaticUpdates,
      useDefaults,
      updateUrl: initialUrl,
      showPopups: config.showPopups ?? true,
    });
  
    if (config.automaticUpdates) {
      const urlOverride = useDefaults ? undefined : (config.updateUrl || undefined);
      checkVersion(false, urlOverride, false)
        .then(updateAvailableVersionUI)
        .catch((e) => {
          console.error('Auto update check failed:', e);
          setAvailableVersion('Error');
        });
    } else {
      setAvailableVersion('N/A');
    }
  }, [config, defaultUpdateUrl]);

  const inputChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    // form => mutable copy
    let newFormData = { ...formData, [name]: type === 'checkbox' ? checked : value };

    if (name === 'automaticUpdates' && checked) {
      newFormData.useDefaults = true;
    }

    if (newFormData.useDefaults && (name === 'useDefaults' || name === 'automaticUpdates')) {
      newFormData.updateUrl = defaultUpdateUrl;
      newFormData.showPopups = true;
    }

    setFormData(newFormData);
  };

  const saveChanges = async () => {
    const payload = { ...config, ...formData };
    if (!payload.automaticUpdates) {
      payload.useDefaults = true;
      payload.updateUrl = '';
    }

    await updateConfig(payload);
  };

  const formSubmitHandler = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await saveChanges();
    } catch (err) {
      createNotification({
        title: 'Error',
        message: 'Failed to save settings.',
      });
    }
  };

  const [checking, setChecking] = useState(false);
  const handleUpdateCheck = async () => {
    if (checking) return;
    setChecking(true);
    try {
      setAvailableVersion('Checking...');
  
      // UNCHECKED auto-check-updates => force defaults check
      const autoChecked = formData.automaticUpdates ?? config.automaticUpdates ?? false;
      const useDefaults = autoChecked
        ? (formData.useDefaults ?? config.useDefaults ?? true)
        : true;
  
      const customUrl = formData.updateUrl ?? config.updateUrl;
      const urlOverride = useDefaults ? undefined : (customUrl || undefined);
  
      const result = await checkVersion(true, urlOverride, true);
      updateAvailableVersionUI(result);
    } catch (e) {
      console.error('Manual update check failed:', e);
      setAvailableVersion('Error');
    } finally {
      setChecking(false);
    }
  };
  

  return (
    <Fragment>
      <SettingsHeadline text="Authentication" />
      <AuthForm />

      {isAuthenticated && (
        <Fragment>
          <hr className={classes.separator} />
          <form onSubmit={formSubmitHandler}>
            <div className={classes.gridContainer}>
              <div className={classes.leftColumn}>
                <SettingsHeadline text="App Version" />
                <p className={classes.text}>Installed version: <span>{installedVersion}</span></p>
                <p className={classes.text}>Available version: <span>{availableVersion}</span></p>
                
                <div className={`${classes.formGroup} ${classes.checkboxContainer}`}>
                  <input type="checkbox" id="autoUpdateCheckbox" name="automaticUpdates" checked={!!formData.automaticUpdates} onChange={inputChangeHandler} />
                  <label htmlFor="autoUpdateCheckbox">Automatically check for updates</label>
                </div>

                {formData.automaticUpdates && (
                  <div className={`${classes.formGroup} ${classes.checkboxContainer}`}>
                    <input type="checkbox" id="useDefaultsCheckbox" name="useDefaults" checked={!!formData.useDefaults} onChange={inputChangeHandler} />
                    <label htmlFor="useDefaultsCheckbox">Use default settings</label>
                  </div>
                )}

                {!formData.useDefaults && formData.automaticUpdates && (
                  <Fragment>
                    <InputGroup>
                      <label htmlFor="updateUrl">Link for version control</label>
                      <input type="text" id="updateUrl" name="updateUrl" value={formData.updateUrl || ''} onChange={inputChangeHandler} />
                    </InputGroup>
                    <div className={`${classes.formGroup} ${classes.checkboxContainer}`}>
                      <input type="checkbox" id="popupCheckbox" name="showPopups" checked={!!formData.showPopups} onChange={inputChangeHandler} />
                      <label htmlFor="popupCheckbox">Popup notifications</label>
                    </div>
                  </Fragment>
                )}
                
                <button
		  type="button"
		  onClick={handleUpdateCheck}
		  disabled={checking}
		  className={classes.checkButton}
		>
		  {checking ? 'Checking…' : 'Check for updates'}
		</button>
              </div>

              <div className={classes.rightColumn}>
		<SettingsHeadline>
		  Changelog <span className={classes.logSource}>{changelogSource === 'remote' ? 'remote' : 'local'}</span>
		</SettingsHeadline>
                <pre className={classes.changelogBox}>{changelog}</pre>
              </div>
            </div>
	    <Button type="submit" className={classes.saveButton}>Save changes</Button>
          </form>
        </Fragment>
      )}
    </Fragment>
  );
};
