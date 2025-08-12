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
          // Skip download in development (use installed Chrome)
          skipDownload: true,
          // Use system Chrome in development
          executablePath:
            process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
        },
};
