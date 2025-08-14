#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

function getAppDataDir() {
  const appFolder = 'ccpulse';
  switch (process.platform) {
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', appFolder);
    case 'win32':
      return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), appFolder);
    default:
      return path.join(os.homedir(), '.config', appFolder);
  }
}

const appDataDir = getAppDataDir();
const configPath = path.join(appDataDir, 'config.json');
const logPath = path.join(appDataDir, 'logs.txt');

/** @type {{pulseHour:number, pulseMinute:number, message:string, autoStart:boolean, mockMode:boolean}} */
let config = {
  pulseHour: 3,
  pulseMinute: 30,
  message: 'Token window pulse',
  autoStart: false,
  mockMode: true
};

function ensureDirs() {
  try { fs.mkdirSync(appDataDir, { recursive: true }); } catch (_) {}
}

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config = { ...config, ...data };
    }
  } catch (err) {
    console.error('Failed to load config:', err.message);
  }
}

function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (err) {
    console.error('Failed to save config:', err.message);
  }
}

function addLog(message) {
  const timestamp = new Date().toLocaleString('ko-KR');
  const line = `[${timestamp}] ${message}\n`;
  try {
    fs.appendFileSync(logPath, line);
  } catch (_) {}
  console.log(message);
}

function parseArgs() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--real') config.mockMode = false;
    if (a === '--mock') config.mockMode = true;
    if (a === '--message' && i + 1 < args.length) { config.message = args[++i]; }
  }
}

async function executeClaude() {
  const timestamp = new Date().toISOString();
  addLog('════════════════════════════════════════');
  addLog(`🚀 Claude Token Pulse Process Started`);
  addLog(`⏰ Execution time: ${timestamp}`);
  addLog(`📊 Current mode: ${config.mockMode ? 'MOCK MODE (Simulation)' : 'REAL MODE (Real execution)'}`);
  addLog('────────────────────────────────────────');

  if (config.mockMode) {
    addLog(`📌 [MOCK MODE] Running simulation...`);
    addLog(`📝 [MOCK MODE] This is how it would actually run:`);
    addLog(`   1. Start Claude with "claude" command`);
    addLog(`   2. Send message: "${config.message}"`);
    addLog(`   3. Claude responds (token usage starts)`);
    addLog(`   4. Exit with "exit" command`);
    addLog(`⏱️ [MOCK MODE] Simulating... (2 second wait)`);
    await new Promise(r => setTimeout(r, 2000));
    addLog(`📨 [MOCK MODE] Expected behavior:`);
    addLog(`   User: ${config.message}`);
    addLog(`   Claude: [Response message]`);
    addLog(`   User: exit`);
    addLog(`✅ [MOCK MODE] Simulation complete!`);
    addLog(`💡 Token window starts counting from this point`);
    addLog('════════════════════════════════════════\n');
    return 0;
  }

  addLog(`🔄 [REAL MODE] Running actual Claude...`);
  addLog(`📝 Message to send: "${config.message}"`);
  addLog('────────────────────────────────────────');

  try {
    const claude = spawn('claude', [], { shell: true });

    let output = '';
    let errorOutput = '';
    let responseReceived = false;

    claude.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      if (!responseReceived && text.length > 0) {
        responseReceived = true;
        addLog(`📨 Receiving Claude response...`);
      }
    });

    claude.stderr.on('data', (data) => { errorOutput += data.toString(); });

    setTimeout(() => {
      addLog(`📤 Sending message: "${config.message}"`);
      claude.stdin.write(config.message + '\n');
      setTimeout(() => {
        addLog(`🛑 Terminating Claude process...`);
        claude.kill('SIGTERM');
        setTimeout(() => {
          try { claude.stdin.write('\n'); } catch (_) {}
        }, 100);
      }, 3000);
    }, 3000);

    const exitCode = await new Promise((resolve) => {
      claude.on('close', (code) => resolve(code ?? 0));
      claude.on('error', () => resolve(1));
    });

    if (errorOutput) {
      addLog(`⚠️ Error output:`);
      addLog(`   ${errorOutput.substring(0, 200)}...`);
    }

    if (output) {
      const lines = output.split('\n');
      const displayLines = lines.slice(0, 30);
      addLog(`✅ [SUCCESS] Claude execution completed!`);
      addLog('────────────────────────────────────────');
      addLog(`📨 Full conversation (partial):`);
      displayLines.forEach(line => { if (line.trim()) addLog(`   ${line.trim()}`); });
      if (lines.length > 30) addLog(`   ... (${lines.length - 30} more lines)`);
      addLog('────────────────────────────────────────');
      addLog(`📊 Total output: ${output.length} characters, ${lines.length} lines`);
    } else {
      addLog(`❌ Failed to receive response from Claude`);
    }

    addLog(`🎉 Token pulse process completed!`);
    addLog(`📌 Effect: Token window starts counting from now`);
    addLog('════════════════════════════════════════\n');
    return exitCode;
  } catch (err) {
    addLog(`❌ [ERROR] Execution failed: ${err.message}`);
    addLog('════════════════════════════════════════\n');
    return 1;
  }
}

(async function main() {
  ensureDirs();
  loadConfig();
  parseArgs();
  saveConfig(); // 최신 설정 반영
  const code = await executeClaude();
  process.exit(code);
})();
