#!/bin/bash

# CCPulse - One-click Installation Script
# https://github.com/renechoi/ccpulse

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Display banner
echo ""
echo "╔════════════════════════════════════════╗"
echo "║          CCPulse Installer            ║"
echo "║         GUI Edition v1.0.0             ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Detect OS
OS=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
else
    printf "%b\n" "${RED}❌ Unsupported OS. Only macOS/Linux are supported.${NC}"
    exit 1
fi

echo "🔍 System detected: $OS"

# Check Node.js
if ! command -v node &> /dev/null; then
    printf "%b\n" "${YELLOW}⚠️  Node.js not found. Installing...${NC}"
    
    if [[ "$OS" == "macos" ]]; then
        # Ensure Homebrew is installed
        if ! command -v brew &> /dev/null; then
            echo "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        echo "Installing Node.js..."
        brew install node
    else
        # Linux (Ubuntu/Debian)
        echo "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
else
    printf "%b\n" "${GREEN}✅ Node.js found: $(node -v)${NC}"
fi

# Installation directory
INSTALL_DIR="$HOME/.ccpulse"
echo "📁 Install path: $INSTALL_DIR"

# Check existing installation
if [ -d "$INSTALL_DIR" ]; then
    printf "%b\n" "${YELLOW}⚠️  Existing installation found.${NC}"
    read -p "Overwrite? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 1
    fi
    rm -rf "$INSTALL_DIR"
fi

# Download and install
echo "📥 Downloading latest version..."
git clone https://github.com/renechoi/ccpulse.git "$INSTALL_DIR" 2>/dev/null || \
    (cd "$INSTALL_DIR" && git pull)

cd "$INSTALL_DIR"

# Create background postinstall script
cat > "$INSTALL_DIR/.postinstall.sh" << 'EOF'
#!/bin/bash
set -e
cd "$HOME/.ccpulse"
export NPM_CONFIG_PRODUCTION=false
export npm_config_production=false
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
export ELECTRON_CACHE="$HOME/.cache/electron"
mkdir -p "$ELECTRON_CACHE" >/dev/null 2>&1 || true
echo "[postinstall] installing dependencies..."
npm install --include=dev --no-audit --fund=false 2>&1 || npm install --include=dev 2>&1 || npm install 2>&1
echo "[postinstall] done"
EOF
chmod +x "$INSTALL_DIR/.postinstall.sh"

echo "📦 Starting dependency installation (live logs below)"
echo "   → This may take several minutes depending on your network."
"$INSTALL_DIR/.postinstall.sh" > "$INSTALL_DIR/install.log" 2>&1 &
POST_PID=$!
# Stream logs in real-time
tail -n +1 -f "$INSTALL_DIR/install.log" &
TAIL_PID=$!
wait $POST_PID
STATUS=$?
kill $TAIL_PID 2>/dev/null || true
if [ $STATUS -ne 0 ]; then
  echo "❌ Dependency installation failed. See logs: $INSTALL_DIR/install.log"
  exit 1
fi
echo "✅ Dependencies installed successfully."

# Create launcher (choose writable BIN directory automatically)
echo "🔧 Creating launcher..."

# Choose a writable BIN directory
BIN_DIR=""
if [ -d "/opt/homebrew/bin" ] && [ -w "/opt/homebrew/bin" ]; then
  BIN_DIR="/opt/homebrew/bin"
elif [ -d "/usr/local/bin" ] && [ -w "/usr/local/bin" ]; then
  BIN_DIR="/usr/local/bin"
else
  BIN_DIR="$HOME/.local/bin"
  mkdir -p "$BIN_DIR"
fi

LAUNCHER_PATH="$BIN_DIR/ccpulse"
cat > "$LAUNCHER_PATH" << 'EOF'
#!/bin/bash
cd "$HOME/.ccpulse"
# Run via local electron binary (install deps on first run if missing)
if [ ! -x "$HOME/.ccpulse/node_modules/.bin/electron" ]; then
  echo "[launcher] installing dependencies (first run)..."
  "$HOME/.ccpulse/.postinstall.sh" || {
    echo "[launcher] install failed. See $HOME/.ccpulse/install.log";
    exit 1;
  }
fi
exec "$HOME/.ccpulse/node_modules/.bin/electron" "$HOME/.ccpulse"
EOF
chmod +x "$LAUNCHER_PATH"

# Add BIN_DIR to PATH in shell rc file if missing
case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *)
printf "%b\n" "🔧 Adding $BIN_DIR to PATH..."
    if [ -n "$ZSH_VERSION" ] || [ "$(basename "$SHELL")" = "zsh" ]; then
      RC_FILE="$HOME/.zshrc"
    else
      RC_FILE="$HOME/.bashrc"
    fi
    if [ ! -f "$RC_FILE" ] || ! grep -q "export PATH=\"$BIN_DIR:\$PATH\"" "$RC_FILE" 2>/dev/null; then
      echo "export PATH=\"$BIN_DIR:\$PATH\"" >> "$RC_FILE"
      printf "%b\n" "   → PATH added to $RC_FILE. Open a new terminal or run 'source $RC_FILE'."
    fi
    ;;
esac

# Create desktop shortcut (macOS)
if [[ "$OS" == "macos" ]]; then
    echo "🖥️  Creating desktop shortcut..."
    cat > "$HOME/Desktop/CCPulse.command" << 'EOF'
#!/bin/bash
cd "$HOME/.ccpulse"
npm start
EOF
    chmod +x "$HOME/Desktop/CCPulse.command"
fi

# Auto-start option
echo ""
printf "%b\n" "${YELLOW}Enable auto-start on system login? (y/n)${NC}"
if [ -t 0 ]; then
  read -p "(y/n): " -n 1 -r
  echo
else
  REPLY=n
fi
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [[ "$OS" == "macos" ]]; then
        # Create macOS LaunchAgent
        mkdir -p "$HOME/Library/LaunchAgents"
        cat > "$HOME/Library/LaunchAgents/com.claude.ccpulse.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.claude.ccpulse</string>
    <key>ProgramArguments</key>
    <array>
        <string>$HOME/.ccpulse/node_modules/.bin/electron</string>
        <string>$HOME/.ccpulse</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
EOF
        launchctl load "$HOME/Library/LaunchAgents/com.claude.ccpulse.plist"
        printf "%b\n" "${GREEN}✅ Auto-start enabled.${NC}"
    else
        # Linux systemd user service
        mkdir -p "$HOME/.config/systemd/user"
        cat > "$HOME/.config/systemd/user/ccpulse.service" << EOF
[Unit]
Description=CCPulse
After=graphical-session.target

[Service]
Type=simple
ExecStart=$HOME/.ccpulse/node_modules/.bin/electron $HOME/.ccpulse
Restart=on-failure

[Install]
WantedBy=default.target
EOF
        systemctl --user enable ccpulse.service
        printf "%b\n" "${GREEN}✅ Auto-start enabled.${NC}"
    fi
fi

echo ""
echo "════════════════════════════════════════"
printf "%b\n" "${GREEN}🎉 Installation completed successfully!${NC}"
echo "════════════════════════════════════════"
echo ""
echo "How to run:"
echo "  1. Terminal: ccpulse"
echo "  2. Desktop shortcut: double-click CCPulse"
echo ""
echo "How to uninstall:"
echo "  curl -fsSL https://raw.githubusercontent.com/renechoi/ccpulse/main/scripts/uninstall.sh | bash"
echo ""
echo "Need help? https://github.com/renechoi/ccpulse/issues"
echo ""

# Launch now option
if [ -t 0 ]; then
  read -p "Launch now? (y/n): " -n 1 -r
  echo
else
  REPLY=n
fi
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ccpulse &
    printf "%b\n" "${GREEN}✨ CCPulse is running!${NC}"
fi