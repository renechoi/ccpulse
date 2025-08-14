const { app, BrowserWindow, Tray, Menu, ipcMain, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const cron = require('node-cron');
const { translations } = require('./translations');

let mainWindow;
let tray;
let cronJob;
let scheduleJobs = [];
let currentLanguage = 'en';

function t(key) {
    const lang = currentLanguage;
    return (translations[lang] && translations[lang][key]) || (translations.en[key]) || key;
}

let config = {
    pulseHour: 6,
    pulseMinute: 0,
    message: 'Hello',
    autoStart: false,
    mockMode: false, // 기본값을 실모드로 (사용자가 필요 시 Mock 선택)
    openTerminalWindow: true, // Real 모드에서 터미널 창을 띄워 실행
    schedules: []
};

const configPath = path.join(app.getPath('userData'), 'config.json');
const logPath = path.join(app.getPath('userData'), 'logs.txt');

function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            const savedConfig = JSON.parse(data);
            config = { ...config, ...savedConfig };
            if (savedConfig.language) {
                currentLanguage = savedConfig.language;
            }
        }
    } catch (error) {
        console.error('Failed to load config:', error);
    }
}

function saveConfig() {
    try {
        const configWithLang = { ...config, language: currentLanguage };
        fs.writeFileSync(configPath, JSON.stringify(configWithLang, null, 2));
    } catch (error) {
        console.error('Failed to save config:', error);
    }
}

function addLog(message) {
    const timestamp = new Date().toLocaleString('ko-KR');
    const logMessage = `[${timestamp}] ${message}\n`;
    
    fs.appendFileSync(logPath, logMessage);
    
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('new-log', { timestamp, message });
    }
}

function executeClaude() {
    const timestamp = new Date().toISOString();
    addLog('════════════════════════════════════════');
    addLog(`🚀 Claude Token Pulse Process Started`);
    addLog(`⏰ Execution Time: ${timestamp}`);
    addLog(`📊 Current Mode: ${config.mockMode ? 'MOCK MODE (Simulation)' : 'REAL MODE (Real Execution)'}`);
    addLog('────────────────────────────────────────');
    
    if (config.mockMode) {
        addLog(`📌 [MOCK MODE] Simulation running...`);
        addLog(`📝 [MOCK MODE] This is how it would actually run:`);
        addLog(`   1. Start Claude with "claude" command`);
        addLog(`   2. Send message: "${config.message}"`);
        addLog(`   3. Claude responds (token usage starts)`);
        addLog(`   4. Exit with "exit" command`);
        addLog(`⏱️ [MOCK MODE] Simulating... (2 second wait)`);
        
        setTimeout(() => {
            addLog(`📨 [MOCK MODE] Expected behavior:`);
            addLog(`   User: ${config.message}`);
            addLog(`   Claude: [Response message]`);
            addLog(`   User: exit`);
            addLog(`✅ [MOCK MODE] Simulation complete!`);
            addLog(`💡 Token window starts counting from this point`);
            addLog('════════════════════════════════════════\n');
        }, 2000);
        return;
    }
    
    addLog(`🔄 [REAL MODE] Running Claude...`);
    addLog(`📝 Message to send: "${config.message}"`);
    addLog('────────────────────────────────────────');
    
    if (config.openTerminalWindow && process.platform === 'darwin') {
        try {
            const messageAS = String(config.message)
                .replace(/\\/g, "\\\\")
                .replace(/"/g, '\\"');

            const osaScript = [
                'tell application "Terminal"',
                '  activate',
                '  -- Open a dedicated session window running claude',
                '  do script "claude"',
                '  set theWin to front window',
                '  delay 3',
                '  -- Trust prompt auto-confirm: choose 1 then Enter (safe even if not shown)',
                '  do script "1" in selected tab of theWin',
                '  delay 0.3',
                '  do script "" in selected tab of theWin',
                '  delay 0.6',
                `  do script "${messageAS}" in selected tab of theWin`,
                '  delay 0.5',
                '  do script "" in selected tab of theWin',
                '  delay 1.0',
                '  -- Interrupt any ongoing generation (Esc, then Ctrl-C)\n',
                '  activate',
                '  tell application "System Events" to key code 53',
                '  delay 0.3',
                '  tell application "System Events" to keystroke "c" using control down',
                '  delay 0.7',
                '  -- Leave Claude TUI using slash command\n',
                '  do script "/exit" in selected tab of theWin',
                '  delay 0.7',
                '  do script "" in selected tab of theWin',
                '  delay 0.8',
                '  -- Close the shell session\n',
                '  do script "exit" in selected tab of theWin',
                '  delay 0.5',
                '  do script "" in selected tab of theWin',
                '  -- Wait until idle, then close window to avoid prompts\n',
                '  set t to selected tab of theWin',
                '  set maxWait to 60',
                '  repeat with i from 1 to maxWait',
                '    if busy of t is false then exit repeat',
                '    delay 0.25',
                '  end repeat',
                '  try',
                '    close theWin',
                '  end try',
                'end tell'
            ].join('\n');

            addLog('🖥️ Starting Claude in macOS Terminal...');
            const { spawn } = require('child_process');
            const osa = spawn('osascript', ['-e', osaScript]);
            let osaErr = '';
            osa.stderr.on('data', (d) => { osaErr += d.toString(); });
            osa.on('close', (code) => {
                if (osaErr.trim()) {
                    addLog(`⚠️ osascript error: ${osaErr.trim().split('\n')[0]}`);
                    if (/Not authorized|not permitted|Not authorised/i.test(osaErr)) {
                        addLog('🛡️ macOS Automation 권한이 거부되어 Terminal 제어가 차단되었습니다.');
                        addLog('➡️ 시스템 설정 > 개인정보 보호 및 보안 > 자동화 에서 이 앱(또는 osascript)이 Terminal을 제어하도록 허용하세요.');
                        addLog('➡️ 또는 터미널에서 다음을 실행하여 프롬프트를 다시 띄울 수 있습니다:');
                        addLog('   osascript -e "tell application \"Terminal\" to do script \"echo ok\""');
                    }
                }
                addLog(`🪟 Terminal trigger completed (osascript exit code: ${code})`);
                addLog('⚠️ Detailed output in Terminal window is not collected in app logs.');
            });
            return; // 터미널로 실행하는 경우 이 함수는 여기서 종료
        } catch (error) {
            addLog(`⚠️ Error setting up terminal execution. Falling back to background execution: ${error.message}`);
        }
    }
    
    addLog(`🔧 Execution process:`);
    addLog(`   1. Run Claude`);
    addLog(`   2. Send message: "${config.message}"`);
    addLog(`   3. Send exit command`);
    addLog(`⏱️ Running Claude... (max 30 seconds wait)`);
    
    const startTime = Date.now();
    
    const { spawn } = require('child_process');
    
    try {
        const claude = spawn('claude', [], {
            shell: true,
            windowsHide: true
        });
        
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
        
        claude.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        claude.on('close', (code) => {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            
            if (code !== 0 && code !== null) {
                addLog(`⚠️ Claude process exit code: ${code}`);
            }
            
            if (errorOutput) {
                addLog(`⚠️ Error output:`);
                addLog(`   ${errorOutput.substring(0, 200)}...`);
            }
            
            if (output) {
                addLog(`✅ [SUCCESS] Claude execution completed! (${duration} seconds)`);
                addLog('────────────────────────────────────────');
                addLog(`📨 Full conversation:`);
                
                const lines = output.split('\n');
                const displayLines = lines.slice(0, 30); // 처음 30줄만 표시
                
                displayLines.forEach(line => {
                    if (line.trim()) {
                        if (line.includes('Claude') || line.includes('Assistant')) {
                            addLog(`   🤖 ${line.trim()}`);
                        } else {
                            addLog(`   ${line.trim()}`);
                        }
                    }
                });
                
                if (lines.length > 30) {
                    addLog(`   ... (${lines.length - 30} more lines)`);
                }
                
                addLog('────────────────────────────────────────');
                addLog(`📊 Total output: ${output.length} characters, ${lines.length} lines`);
            } else {
                addLog(`❌ No response received from Claude`);
            }
            
            addLog(`🎉 Token pulse process completed!`);
            addLog(`📌 Effect: Token window starts counting from now`);
            addLog(`📅 Next run: ${config.autoStart ? `Daily at ${config.pulseHour}:${String(config.pulseMinute).padStart(2, '0')}` : 'Auto-run disabled'}`);
            addLog('════════════════════════════════════════\n');
        });
        
        claude.on('error', (err) => {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            addLog(`❌ [ERROR] Claude execution failed! (${duration}s)`);
            addLog(`📛 Error: ${err.message}`);
            
            if (err.message.includes('ENOENT') || err.message.includes('claude')) {
                addLog('────────────────────────────────────────');
                addLog('⚠️ Claude is not installed or not in PATH!');
                addLog('💡 Solutions:');
                addLog('   1. Check Claude Code installation:');
                addLog('      npm install -g @anthropic-ai/claude-code');
                addLog('   2. Test "claude" command in terminal');
                addLog('   3. Check PATH environment variable');
                addLog('   4. Or use Mock mode (enable in settings)');
            }
            addLog('════════════════════════════════════════\n');
        });
        
        // 초기화 대기 후 표준 종료 시퀀스(엔터 → 메시지 → 엔터 → exit → 종료)
        setTimeout(() => {
            addLog('↩️ Initial enter input');
            try { claude.stdin.write('\n'); } catch (_) {}
            setTimeout(() => {
                addLog(`📤 Sending message: "${config.message}"`);
                try { claude.stdin.write(config.message + '\n'); } catch (_) {}
                setTimeout(() => {
                    addLog(`📤 Sending exit`);
                    try { claude.stdin.write('exit\n'); } catch (_) {}
                    try { claude.stdin.end(); } catch (_) {}
                }, 1000);
            }, 300);
        }, 2000);
        
    } catch (error) {
        addLog(`❌ [ERROR] Unexpected error occurred!`);
        addLog(`📛 Error: ${error.message}`);
        addLog('════════════════════════════════════════\n');
    }
}

// 크론잡 설정
function clearAllSchedules() {
    try {
        scheduleJobs.forEach(job => {
            try { job.stop && job.stop(); } catch (_) {}
        });
    } catch (_) {}
    scheduleJobs = [];
}

function toTwo(n) { return String(n).padStart(2, '0'); }

function parseHHMM(hhmm) {
    if (!hhmm || typeof hhmm !== 'string') return null;
    const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = Number(m[1]);
    const mi = Number(m[2]);
    if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
    return { hour: h, minute: mi };
}

function isWithinWindow(now, startHHMM, endHHMM, days) {
    if (Array.isArray(days) && days.length > 0) {
        const dow = now.getDay(); // 0=Sun
        if (!days.includes(dow)) return false;
    }
    const start = parseHHMM(startHHMM);
    const end = parseHHMM(endHHMM);
    if (!start || !end) return true; // 잘못된 입력이면 윈도우 제한 없음
    const curMinutes = now.getHours() * 60 + now.getMinutes();
    const s = start.hour * 60 + start.minute;
    const e = end.hour * 60 + end.minute;
    if (s <= e) {
        return curMinutes >= s && curMinutes <= e;
    }
    // 자정 넘김 윈도우
    return curMinutes >= s || curMinutes <= e;
}

function ensureSchedulesBackCompat() {
    // 스케줄 배열이 이미 존재하면(비어 있어도) 백필하지 않음
    if (Array.isArray(config.schedules)) return;
    // 레거시 설정만 있는 경우에 한해서 최초 1회 마이그레이션
    if (typeof config.pulseHour === 'number' && typeof config.pulseMinute === 'number') {
        config.schedules = [
            { id: Date.now(), name: 'Daily', mode: 'onceAt', time: `${toTwo(config.pulseHour)}:${toTwo(config.pulseMinute)}`, active: true }
        ];
    } else {
        config.schedules = [];
    }
}

function setupAllSchedules() {
    clearAllSchedules();
    ensureSchedulesBackCompat();
    if (!config.autoStart) {
        addLog('⏸️ Auto-run disabled');
        return;
    }
    const active = (config.schedules || []).filter(s => s && s.active !== false);
    if (active.length === 0) {
        addLog('⚠️ No active schedules. Please add schedules in the Schedules tab.');
        return;
    }
    active.forEach(s => {
        try {
            if (s.mode === 'onceAt') {
                const time = parseHHMM(s.time || '03:30') || { hour: 3, minute: 30 };
                const spec = `${time.minute} ${time.hour} * * *`;
                const job = cron.schedule(spec, () => executeClaude(), { scheduled: true });
                scheduleJobs.push(job);
                addLog(`⏰ [Schedule] ${s.name || 'Daily once'}: Daily ${toTwo(time.hour)}:${toTwo(time.minute)}`);
            } else if (s.mode === 'everyNMinutes') {
                const n = Math.max(1, Number(s.minutes || 15));
                const spec = `*/${n} * * * *`;
                const job = cron.schedule(spec, () => executeClaude(), { scheduled: true });
                scheduleJobs.push(job);
                addLog(`⏰ [Schedule] ${s.name || 'Interval'}: ${n}min interval`);
            } else if (s.mode === 'windowedInterval') {
                const n = Math.max(1, Number(s.minutes || 30));
                const spec = `*/${n} * * * *`;
                const job = cron.schedule(spec, () => {
                    const now = new Date();
                    if (isWithinWindow(now, s.windowStart || '09:00', s.windowEnd || '18:00', Array.isArray(s.days) ? s.days : [])) {
                        executeClaude();
                    }
                }, { scheduled: true });
                scheduleJobs.push(job);
                addLog(`⏰ [Schedule] ${s.name || 'Windowed interval'}: ${s.windowStart || '09:00'}~${s.windowEnd || '18:00'} within ${n}min interval`);
            } else if (s.mode === 'cron' && typeof s.cron === 'string' && s.cron.trim()) {
                const spec = s.cron.trim();
                const job = cron.schedule(spec, () => executeClaude(), { scheduled: true });
                scheduleJobs.push(job);
                addLog(`⏰ [Schedule] ${s.name || 'cron'}: ${spec}`);
            } else {
                addLog(`⚠️ [Schedule] ${s.name || '(unnamed)'}: Unknown mode or incomplete settings`);
            }
        } catch (e) {
            addLog(`❌ [Schedule] ${s.name || '(unnamed)'} setup failed: ${e.message}`);
        }
    });
}

// Load language setting
function loadLanguageSetting() {
    try {
        const configPath = path.join(app.getPath('userData'), 'config.json');
        if (fs.existsSync(configPath)) {
            const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (savedConfig.language) {
                currentLanguage = savedConfig.language;
            }
        }
    } catch (e) {
        // Default to English if error
        currentLanguage = 'en';
    }
}

// 메인 윈도우 생성
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show: false // 시작시 숨김 (초기 설정 주입 후 표시)
    });
    
    mainWindow.loadFile('index.html');
    
    // 초기 설정을 DOM 로드 직후 즉시 주입하고 창을 표시
    mainWindow.webContents.on('did-finish-load', () => {
        try {
            if (!mainWindow || mainWindow.isDestroyed()) return;
            mainWindow.webContents.send('init-config', config);
        } catch (_) {}
        mainWindow.show();
    });
    
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
}

// 트레이 생성 - 아이콘 없이
function createTray() {
    // 빈 아이콘 생성
    const icon = nativeImage.createEmpty();
    tray = new Tray(icon);
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '열기',
            click: () => {
                mainWindow.show();
            }
        },
        {
            label: '지금 실행',
            click: () => {
                executeClaude();
            }
        },
        { type: 'separator' },
        {
            label: '자동 시작',
            type: 'checkbox',
            checked: config.autoStart,
            click: (menuItem) => {
                config.autoStart = menuItem.checked;
                saveConfig();
                setupAllSchedules();
            }
        },
        { type: 'separator' },
        {
            label: '종료',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);
    
    tray.setToolTip('CCPulse');
    tray.setContextMenu(contextMenu);
    
    tray.on('double-click', () => {
        mainWindow.show();
    });
}

// IPC 핸들러
ipcMain.handle('get-config', () => config);
ipcMain.handle('get-logs', () => {
    try {
        if (fs.existsSync(logPath)) {
            return fs.readFileSync(logPath, 'utf8');
        }
    } catch (error) {
        console.error('Failed to read logs:', error);
    }
    return '';
});

// IPC: language setting update
ipcMain.on('update-language', (event, lang) => {
    if (lang === 'en' || lang === 'ko') {
        currentLanguage = lang;
        saveConfig();
    }
});

ipcMain.on('save-config', (event, newConfig) => {
    config = { ...config, ...newConfig };
    saveConfig();
    setupAllSchedules();
    event.reply('config-saved');
});

ipcMain.on('run-now', () => {
    executeClaude();
});

ipcMain.on('clear-logs', () => {
    fs.writeFileSync(logPath, '');
    mainWindow.webContents.send('logs-cleared');
    addLog('📋 Logs cleared');
});

ipcMain.on('open-logs-folder', () => {
    shell.openPath(app.getPath('userData'));
});

// 앱 이벤트
app.whenReady().then(() => {
    loadConfig();
    loadLanguageSetting();
    createWindow();
    createTray();
    setupAllSchedules();
    
    addLog('🎉 CCPulse Started');

    // 스모크 테스트 모드: CI/자동화 환경에서 GUI를 잠깐 띄웠다가 종료
    if (process.env.HEADLESS_SMOKETEST) {
        addLog('🧪 Headless smoke test mode active: Auto-exit after 2 seconds');
        setTimeout(() => {
            app.isQuitting = true;
            app.quit();
        }, 2000);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});