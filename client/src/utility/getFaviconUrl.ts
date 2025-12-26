/**
 * Get favicon URL via server-side proxy endpoint
 * The server uses curl to fetch favicons reliably (supports HTTP/2, handles auth, etc.)
 * and caches them for 7 days to improve performance
 * @param url The full URL of the website
 * @returns URL to the proxied/cached favicon
 */
export const getFaviconUrl = (url: string): string => {
  try {
    // Use the server-side favicon proxy endpoint
    // This handles both local and remote URLs with proper curl-based fetching
    const encodedUrl = encodeURIComponent(url);
    return `/api/favicon?url=${encodedUrl}`;
  } catch (error) {
    console.error('Error creating favicon URL:', error);
    return '';
  }
};
