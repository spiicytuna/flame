const express = require('express');
const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Cache directory for favicons
const FAVICON_CACHE_DIR = path.join(__dirname, '../data/favicon-cache');

// Ensure cache directory exists
if (!fs.existsSync(FAVICON_CACHE_DIR)) {
  fs.mkdirSync(FAVICON_CACHE_DIR, { recursive: true });
}

/**
 * Check if a hostname is a local/private IP address
 */
function isLocalIP(hostname) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
  );
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname + (urlObj.port && urlObj.port !== '80' && urlObj.port !== '443' ? ':' + urlObj.port : '');
  } catch (err) {
    return null;
  }
}

/**
 * Try to fetch favicon from common locations
 */
async function tryFetchFavicon(domain, isLocal) {
  const protocol = isLocal ? 'http' : 'https';
  const commonPaths = [
    '/favicon.ico',
    '/apple-touch-icon.png',
    '/apple-touch-icon-precomposed.png',
  ];

  for (const faviconPath of commonPaths) {
    const faviconUrl = `${protocol}://${domain}${faviconPath}`;
    try {
      // Use curl to check if URL is accessible
      execSync(`curl -I -L -s -m 3 -A "Mozilla/5.0" "${faviconUrl}"`, {
        stdio: 'pipe'
      });
      return faviconUrl;
    } catch (err) {
      // Continue to next path
    }
  }

  // Fallback
  return `${protocol}://${domain}/favicon.ico`;
}

/**
 * Download favicon using curl
 */
function downloadFavicon(faviconUrl, outputPath) {
  try {
    execSync(`curl -L -s -m 10 -A "Mozilla/5.0" -o "${outputPath}" "${faviconUrl}"`, {
      stdio: 'pipe'
    });

    // Check if file was created and has content
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      if (stats.size > 0) {
        // Validate that it's actually an image file, not HTML/text
        try {
          const fileTypeOutput = execSync(`file -b --mime-type "${outputPath}"`, {
            stdio: 'pipe',
            encoding: 'utf-8'
          }).trim();

          // Check if it's an image MIME type
          if (fileTypeOutput.startsWith('image/')) {
            return true;
          }
        } catch (err) {
          // file command failed, clean up and return false
        }
      }
      fs.unlinkSync(outputPath);
    }
    return false;
  } catch (err) {
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    return false;
  }
}

/**
 * GET /api/favicon?url=<url>
 * Fetches and caches favicon for the given URL
 */
router.get('/', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  const domain = extractDomain(url);
  if (!domain) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Create cache filename from domain hash
  const hash = crypto.createHash('md5').update(domain).digest('hex');
  const cacheFile = path.join(FAVICON_CACHE_DIR, `${hash}.ico`);

  // Check cache first
  if (fs.existsSync(cacheFile)) {
    const stats = fs.statSync(cacheFile);
    // Serve from cache if less than 7 days old
    const age = Date.now() - stats.mtimeMs;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (age < maxAge) {
      return res.sendFile(cacheFile);
    }
  }

  // Try to fetch favicon
  try {
    const isLocal = isLocalIP(domain);
    const faviconUrl = await tryFetchFavicon(domain, isLocal);

    if (downloadFavicon(faviconUrl, cacheFile)) {
      return res.sendFile(cacheFile);
    }

    // If direct fetch failed, try Google's service
    const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    if (downloadFavicon(googleUrl, cacheFile)) {
      return res.sendFile(cacheFile);
    }

    // All methods failed
    return res.status(404).json({ error: 'Favicon not found' });
  } catch (err) {
    console.error(`[Favicon] Error fetching favicon for ${domain}:`, err.message);
    return res.status(500).json({ error: 'Failed to fetch favicon' });
  }
});

module.exports = router;
