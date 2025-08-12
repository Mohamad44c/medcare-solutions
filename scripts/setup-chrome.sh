#!/bin/bash

# Exit on error
set -e

echo "Setting up Chrome for Puppeteer..."

# Install Puppeteer dependencies
echo "Installing Puppeteer and its dependencies..."
npm install puppeteer@10.1.0 puppeteer-core@10.1.0 chrome-aws-lambda@10.1.0

# Create the .puppeteerrc.cjs file if it doesn't exist
if [ ! -f ".puppeteerrc.cjs" ]; then
  echo "Creating .puppeteerrc.cjs configuration file..."
  cat > .puppeteerrc.cjs << 'EOL'
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
          skipDownload: false,
          // Use downloaded Chrome in development
          executablePath: process.platform === 'darwin' 
            ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
            : process.platform === 'win32'
            ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
            : '/usr/bin/google-chrome',
        },
};
EOL
fi

echo "Chrome setup complete!"
