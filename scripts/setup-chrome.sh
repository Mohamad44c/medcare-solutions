#!/bin/bash

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "Installing Chrome for macOS..."
    if ! command -v brew &> /dev/null; then
        echo "Homebrew not found. Please install Homebrew first."
        exit 1
    fi
    brew install --cask google-chrome
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "Installing Chrome for Linux..."
    if command -v apt-get &> /dev/null; then
        # Debian/Ubuntu
        sudo apt-get update
        sudo apt-get install -y google-chrome-stable
    elif command -v dnf &> /dev/null; then
        # Fedora
        sudo dnf install -y google-chrome-stable
    else
        echo "Unsupported Linux distribution"
        exit 1
    fi
else
    echo "Unsupported operating system"
    exit 1
fi

# Install Puppeteer dependencies
echo "Installing Puppeteer..."
pnpm install

# Set environment variable
echo "export PUPPETEER_EXECUTABLE_PATH=$(which google-chrome)" >> ~/.zshrc
echo "export PUPPETEER_EXECUTABLE_PATH=$(which google-chrome)" >> ~/.bashrc

echo "Setup complete! Please restart your terminal or run:"
echo "source ~/.zshrc # if using zsh"
echo "source ~/.bashrc # if using bash"
