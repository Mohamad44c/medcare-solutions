/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes for Vercel deployment
  cacheDirectory: '/tmp/puppeteer',
  // Use installed Chrome in development, download in production
  chrome:
    process.env.NODE_ENV === 'production'
      ? {
          // Download Chrome in production (Vercel)
          skipDownload: false,
          // Specify a custom download path for Vercel
          downloadPath: '/tmp',
        }
      : {
          // Allow downloading Chrome in development if needed
          skipDownload: false,
          // Use system Chrome in development if available
          executablePath:
            process.platform === 'darwin'
              ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
              : process.platform === 'win32'
                ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
                : '/usr/bin/google-chrome',
        },
};
