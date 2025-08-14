const { ipcRenderer } = require('electron');

let currentConfig = {};

function t(key) {
    const lang = localStorage.getItem('ccpulse-language') || 'en';
    if (typeof translations !== 'undefined' && translations[lang] && translations[lang][key]) {
        return translations[lang][key];
    }
    return translations['ko'][key] || key;
}

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const buttons = document.querySelectorAll('.nav-button');
    buttons.forEach(button => button.classList.remove('active'));
    const target = document.getElementById(pageName);
    if (target) target.classList.add('active');
    document.querySelectorAll('.nav-button').forEach(button => {
        if (button.dataset.page === pageName) {
            button.classList.add('active');
        }
    });
    if (pageName === 'logs') {
        refreshLogs();
    }
}

async function loadSettings() {
    if (!currentConfig.__initialized) {
        currentConfig = await ipcRenderer.invoke('get-config');
    }
    
    updateDashboard();
    
    const msgEl = document.getElementById('message');
    if (msgEl) msgEl.value = currentConfig.message ?? '';
    const autoEl = document.getElementById('auto-start');
    if (autoEl) autoEl.checked = !!currentConfig.autoStart;
    const mockEl = document.getElementById('mock-mode');
    if (mockEl) mockEl.checked = !!currentConfig.mockMode;
}

function updateDashboard() {
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const nextRun = document.getElementById('next-run');
    const runMode = document.getElementById('run-mode');
    const modeWarning = document.getElementById('mode-warning');
    const summaryList = document.getElementById('schedules-summary-list');
    const nextRunsList = document.getElementById('next-runs-list');
    
    if (currentConfig.autoStart) {
        statusIndicator.classList.remove('inactive');
        statusIndicator.classList.add('active');
        const lang = localStorage.getItem('ccpulse-language') || 'en';
        statusText.textContent = translations[lang]['active'];

        if (Array.isArray(currentConfig.schedules) && currentConfig.schedules.length > 0) {
            const lang = localStorage.getItem('ccpulse-language') || 'en';
            nextRun.textContent = translations[lang]['schedulesBased'];
            if (summaryList) {
                const active = currentConfig.schedules.filter(s => s && s.active !== false);
                if (active.length === 0) {
                    summaryList.innerHTML = `<div style="color: var(--muted);">${t('noActiveSchedules') || '활성화된 스케줄이 없습니다.'}</div>`;
                } else {
                    summaryList.innerHTML = '';
                    active.forEach(s => {
                        const line = document.createElement('div');
                        line.style.display = 'flex';
                        line.style.alignItems = 'center';
                        line.style.justifyContent = 'space-between';
                        const left = document.createElement('div');
                        left.innerHTML = `<strong>${s.name || `(${t('unnamed') || '이름 없음'})`}</strong>`;
                        const right = document.createElement('div');
                        right.style.opacity = '0.9';
                        right.style.fontFamily = 'monospace';
                        let desc = '';
                        if (s.mode === 'onceAt') {
                            desc = `${t('daily') || '매일'} ${s.time || 'HH:MM'}`;
                        } else if (s.mode === 'everyNMinutes') {
                            desc = `${s.minutes || 15}${t('minInterval') || '분 간격'}`;
                        } else if (s.mode === 'windowedInterval') {
                            const lang = (typeof localStorage !== 'undefined' && (localStorage.getItem('ccpulse-language') || 'en')) || 'en';
                            const daysLabel = lang === 'en' ? 'Days' : '요일';
                            const days = Array.isArray(s.days) && s.days.length ? `, ${daysLabel}: ${formatDays(s.days)}` : '';
                            desc = `${s.windowStart || '09:00'}~${s.windowEnd || '18:00'} ${t('within') || '내'} ${s.minutes || 30}${t('minInterval') || '분 간격'}${days}`;
                        } else if (s.mode === 'cron') {
                            desc = `cron: ${s.cron || ''}`;
                        } else {
                            desc = t('unknownMode') || '알 수 없는 모드';
                        }
                        right.textContent = desc;
                        line.appendChild(left);
                        line.appendChild(right);
                        summaryList.appendChild(line);
                    });
                }
            }
            if (nextRunsList) {
                const previews = computeNextRunsPreview(currentConfig, 5);
                if (previews.length === 0) {
                    nextRunsList.innerHTML = `<span style="color: var(--muted);">${t('noScheduledRuns') || '예정된 실행이 없습니다.'}</span>`;
                } else {
                    nextRunsList.innerHTML = '';
                    previews.forEach(ts => {
                        const chip = document.createElement('span');
                        chip.style.padding = '6px 10px';
                        chip.style.border = '1px solid var(--border)';
                        chip.style.borderRadius = '999px';
                        chip.style.background = 'var(--surface)';
                        chip.style.fontSize = '12px';
                        const currentLang = localStorage.getItem('ccpulse-language') || 'en';
                        chip.textContent = new Date(ts).toLocaleString(currentLang === 'en' ? 'en-US' : 'ko-KR');
                        nextRunsList.appendChild(chip);
                    });
                }
            }
        } else {
            const now = new Date();
            const next = new Date();
            next.setHours(currentConfig.pulseHour ?? 3, currentConfig.pulseMinute ?? 30, 0, 0);
            if (next <= now) next.setDate(next.getDate() + 1);
            const currentLang = localStorage.getItem('ccpulse-language') || 'en';
            nextRun.textContent = next.toLocaleString(currentLang === 'en' ? 'en-US' : 'ko-KR');
        }
    } else {
        statusIndicator.classList.remove('active');
        statusIndicator.classList.add('inactive');
        const lang = localStorage.getItem('ccpulse-language') || 'en';
        statusText.textContent = translations[lang]['inactive'];
        nextRun.textContent = '-';
    }
    
    const lang = localStorage.getItem('ccpulse-language') || 'en';
    if (currentConfig.mockMode) {
        runMode.textContent = `🔧 MOCK MODE (${translations[lang]['simulation']})`;
        runMode.style.color = '#ff9800';
        if (modeWarning) {
            modeWarning.style.display = 'block';
        }
    } else {
        runMode.textContent = `✅ REAL MODE (${translations[lang]['realExecution']})`;
        runMode.style.color = '#4caf50';
        if (modeWarning) {
            modeWarning.style.display = 'none';
        }
    }
    if (Array.isArray(currentConfig.schedules) && currentConfig.schedules.length > 0) {
        if (summaryList) {
            const active = currentConfig.schedules.filter(s => s && s.active !== false);
            if (active.length === 0) {
                summaryList.innerHTML = '<div style="color: var(--muted);">활성화된 스케줄이 없습니다.</div>';
            } else {
                summaryList.innerHTML = '';
                active.forEach(s => {
                    const line = document.createElement('div');
                    line.style.display = 'flex';
                    line.style.alignItems = 'center';
                    line.style.justifyContent = 'space-between';
                    const left = document.createElement('div');
                    left.innerHTML = `<strong>${s.name || `(${t('unnamed') || '이름 없음'})`}</strong>`;
                    const right = document.createElement('div');
                    right.style.opacity = '0.9';
                    right.style.fontFamily = 'monospace';
                    let desc = '';
                    if (s.mode === 'onceAt') {
                        desc = `${t('daily') || '매일'} ${s.time || 'HH:MM'}`;
                    } else if (s.mode === 'everyNMinutes') {
                        desc = `${s.minutes || 15}${t('minInterval') || '분 간격'}`;
                    } else if (s.mode === 'windowedInterval') {
                        const lang = (typeof localStorage !== 'undefined' && (localStorage.getItem('ccpulse-language') || 'en')) || 'en';
                        const daysLabel = lang === 'en' ? 'Days' : '요일';
                        const days = Array.isArray(s.days) && s.days.length ? `, ${daysLabel}: ${formatDays(s.days)}` : '';
                        desc = `${s.windowStart || '09:00'}~${s.windowEnd || '18:00'} ${t('within') || '내'} ${s.minutes || 30}${t('minInterval') || '분 간격'}${days}`;
                    } else if (s.mode === 'cron') {
                        desc = `cron: ${s.cron || ''}`;
                    } else {
                        desc = t('unknownMode') || '알 수 없는 모드';
                    }
                    right.textContent = desc;
                    line.appendChild(left);
                    line.appendChild(right);
                    summaryList.appendChild(line);
                });
            }
        }
        if (nextRunsList) {
            const previews = computeNextRunsPreview(currentConfig, 5);
            if (previews.length === 0) {
                nextRunsList.innerHTML = '<span style="color: var(--muted);">예정된 실행이 없습니다.</span>';
            } else {
                nextRunsList.innerHTML = '';
                previews.forEach(ts => {
                    const chip = document.createElement('span');
                    chip.style.padding = '6px 10px';
                    chip.style.border = '1px solid var(--border)';
                    chip.style.borderRadius = '999px';
                    chip.style.background = 'var(--surface)';
                    chip.style.fontSize = '12px';
                    const currentLang = localStorage.getItem('ccpulse-language') || 'en';
                    chip.textContent = new Date(ts).toLocaleString(currentLang === 'en' ? 'en-US' : 'ko-KR');
                    nextRunsList.appendChild(chip);
                });
            }
        }
    } else {
        if (summaryList) {
            summaryList.innerHTML = `<div style="color: var(--muted);">${t('noSchedules')}</div>`;
        }
        if (nextRunsList) {
            nextRunsList.innerHTML = `<span style="color: var(--muted);">${t('noAutoRun')}</span>`;
        }
    }
}

function computeNextRunsPreview(cfg, limit = 5) {
    try {
        const out = [];
        const now = new Date();
        const schedules = (cfg.schedules || []).filter(s => s && s.active !== false);
        if (schedules.length === 0) return [];
        let candidates = [];
        schedules.forEach(s => {
            if (s.mode === 'onceAt') {
                const t = parseHHMMLocal(s.time || '03:30');
                if (!t) return;
                let d = new Date(now);
                d.setHours(t.h, t.m, 0, 0);
                if (d <= now) d.setDate(d.getDate() + 1);
                for (let i = 0; i < 20; i++) {
                    candidates.push(d.getTime() + i * 24 * 60 * 60 * 1000);
                }
            } else if (s.mode === 'everyNMinutes') {
                const n = Math.max(1, Number(s.minutes || 15));
                const start = new Date(now);
                start.setSeconds(0, 0);
                const offset = (start.getMinutes() % n);
                if (offset !== 0) start.setMinutes(start.getMinutes() + (n - offset));
                let cur = start.getTime();
                for (let i = 0; i < 20; i++) {
                    candidates.push(cur);
                    cur += n * 60 * 1000;
                }
            } else if (s.mode === 'windowedInterval') {
                const n = Math.max(1, Number(s.minutes || 30));
                const startStr = s.windowStart || '09:00';
                const endStr = s.windowEnd || '18:00';
                const days = Array.isArray(s.days) ? s.days : [];
                for (let day = 0; day < 7; day++) {
                    const base = new Date(now);
                    base.setDate(base.getDate() + day);
                    base.setSeconds(0, 0);
                    const st = parseHHMMLocal(startStr);
                    const en = parseHHMMLocal(endStr);
                    if (!st || !en) continue;
                    const winStart = new Date(base);
                    winStart.setHours(st.h, st.m, 0, 0);
                    const winEnd = new Date(base);
                    winEnd.setHours(en.h, en.m, 0, 0);
                    if (Array.isArray(days) && days.length > 0) {
                        const dow = winStart.getDay();
                        if (!days.includes(dow)) continue;
                    }
                    let cur = new Date(winStart);
                    if (cur < now) {
                        const diffMin = Math.ceil((now.getTime() - cur.getTime()) / 60000);
                        const steps = Math.ceil(diffMin / n);
                        cur = new Date(cur.getTime() + steps * n * 60000);
                    }
                    while (cur <= winEnd && candidates.length < 200) {
                        candidates.push(cur.getTime());
                        cur = new Date(cur.getTime() + n * 60000);
                    }
                }
            } else if (s.mode === 'cron' && typeof s.cron === 'string') {
            }
        });
        candidates = Array.from(new Set(candidates)).filter(ts => ts > now.getTime());
        candidates.sort((a, b) => a - b);
        return candidates.slice(0, limit);
    } catch (_) {
        return [];
    }
}

function parseHHMMLocal(hhmm) {
    const m = (hhmm || '').match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = Number(m[1]);
    const mn = Number(m[2]);
    if (h < 0 || h > 23 || mn < 0 || mn > 59) return null;
    return { h, m: mn };
}

function formatDays(daysArray) {
    try {
        const lang = (typeof localStorage !== 'undefined' && (localStorage.getItem('ccpulse-language') || 'en')) || 'en';
        const labels = lang === 'en' ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] : ['일','월','화','수','목','금','토']; // 0=일
        const uniq = Array.from(new Set(daysArray.filter(d => d >= 0 && d <= 6)));
        if (uniq.length === 0) return '';
        return uniq.map(d => labels[d]).join(',');
    } catch (_) {
        return '';
    }
}

function saveSettings() {
    const newConfig = {
        message: (document.getElementById('message')?.value || 'Hello'),
        autoStart: !!document.getElementById('auto-start')?.checked,
        mockMode: !!document.getElementById('mock-mode')?.checked
    };
    ipcRenderer.send('save-config', newConfig);
}

function runNow() {
    ipcRenderer.send('run-now');
    
    const button = event.target;
    button.textContent = '⏳ ' + (t('running') || '실행 중...');
    button.disabled = true;
    
    setTimeout(() => {
        button.textContent = '▶️ ' + t('runNow');
        button.disabled = false;
    }, 2000);
}

async function toggleAutoStart() {
    const newValue = !currentConfig.autoStart;
    currentConfig.autoStart = newValue;
    updateDashboard();
    const autoEl = document.getElementById('auto-start');
    if (autoEl) autoEl.checked = newValue;
    ipcRenderer.send('save-config', { autoStart: newValue });
}

async function refreshLogs() {
    const logs = await ipcRenderer.invoke('get-logs');
    const container = document.getElementById('logs-container');
    
    if (!logs) {
        container.innerHTML = `<div style="color: #999; text-align: center; padding: 20px;">${t('noLogs')}</div>`;
        return;
    }
    
    const lines = logs.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        container.innerHTML = `<div style="color: #999; text-align: center; padding: 20px;">${t('noLogs')}</div>`;
        return;
    }
    
    container.innerHTML = '';
    
    lines.reverse().forEach(line => {
        const match = line.match(/\[(.*?)\] (.*)/);
        if (match) {
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.innerHTML = `
                <div class="log-timestamp">${match[1]}</div>
                <div class="log-message">${match[2]}</div>
            `;
            container.appendChild(entry);
        }
    });
    
    container.scrollTop = 0;
}

function clearLogs() {
    if (confirm(t('confirmClearLogs') || '모든 로그를 삭제하시겠습니까?')) {
        ipcRenderer.send('clear-logs');
    }
}

function openLogsFolder() {
    ipcRenderer.send('open-logs-folder');
}

ipcRenderer.on('config-saved', async () => {
    try {
        const latest = await ipcRenderer.invoke('get-config');
        currentConfig = { ...latest, __initialized: true };
        updateDashboard();
        const msgEl = document.getElementById('message');
        if (msgEl) msgEl.value = currentConfig.message ?? '';
        const autoEl = document.getElementById('auto-start');
        if (autoEl) autoEl.checked = !!currentConfig.autoStart;
        const mockEl = document.getElementById('mock-mode');
        if (mockEl) mockEl.checked = !!currentConfig.mockMode;
        if (Array.isArray(currentConfig.schedules)) {
            setSchedulesLocal(currentConfig.schedules);
            renderSchedules();
        }
    } catch (_) {}
    const ctx = window.__ccpulseSaveContext;
    if (ctx === 'schedules') {
        alert(t('schedulesSaved') || '스케줄이 저장되었습니다.');
    } else if (ctx === 'settings') {
        alert(t('settingsSaved') || '설정이 저장되었습니다!');
    }
    window.__ccpulseSaveContext = undefined;
});

ipcRenderer.on('new-log', (event, data) => {
    if (document.getElementById('logs').classList.contains('active')) {
        refreshLogs();
    }
});

ipcRenderer.on('logs-cleared', () => {
    refreshLogs();
});

window.addEventListener('DOMContentLoaded', () => {
    loadSettings().then(() => {
        try {
            if (Array.isArray(currentConfig.schedules)) {
                setSchedulesLocal(currentConfig.schedules);
            }
        } catch (_) {}
        initSchedulesUI();
        try {
            maybeShowQuickStartOnboarding();
        } catch (_) {}
    });
    
    setInterval(updateDashboard, 5000);
});

ipcRenderer.on('init-config', (_event, initConfig) => {
    currentConfig = { ...initConfig, __initialized: true };
    // 대시보드/설정 폼 즉시 갱신
    try {
        updateDashboard();
        document.getElementById('pulse-hour').value = currentConfig.pulseHour;
        document.getElementById('pulse-minute').value = currentConfig.pulseMinute;
        document.getElementById('message').value = currentConfig.message;
        document.getElementById('auto-start').checked = currentConfig.autoStart;
        document.getElementById('mock-mode').checked = currentConfig.mockMode;
    } catch (_) {}
    try { maybeShowQuickStartOnboarding(); } catch (_) {}
});


// ===== 스케줄 UI (로직 미구현, 로컬 저장만) =====
function getSchedulesLocal() {
    try {
        const raw = localStorage.getItem('ccpulse_schedules');
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
        return [];
    }
}

function setSchedulesLocal(schedules) {
    localStorage.setItem('ccpulse_schedules', JSON.stringify(schedules || []));
}

function initSchedulesUI() {
    try {
        if (currentConfig && Array.isArray(currentConfig.schedules)) {
            setSchedulesLocal(currentConfig.schedules);
        }
    } catch (_) {}
    renderSchedules();
}

function addPreset(kind) {
    const presets = {
        every15: { name: t('preset15min') || '15분 간격', mode: 'everyNMinutes', minutes: 15, active: true },
        hourly: { name: t('presetHourly') || '매시간', mode: 'everyNMinutes', minutes: 60, active: true },
        workday: { name: t('presetWorkday') || '평일 9-18시/30분', mode: 'windowedInterval', minutes: 30, windowStart: '09:00', windowEnd: '18:00', days: [1,2,3,4,5], active: true }
    };
    const schedules = getSchedulesLocal();
    schedules.push({ id: Date.now(), ...presets[kind] });
    setSchedulesLocal(schedules);
    renderSchedules();
    updateDashboard();
}

function addSchedule() {
    const schedules = getSchedulesLocal();
    const lang = localStorage.getItem('ccpulse-language') || 'en';
    schedules.push({ id: Date.now(), name: translations[lang]['newSchedule'], mode: 'onceAt', time: '06:00', active: true });
    setSchedulesLocal(schedules);
    renderSchedules();
    updateDashboard();
}

function removeSchedule(id) {
    const schedules = getSchedulesLocal().filter(s => s.id !== id);
    setSchedulesLocal(schedules);
    renderSchedules();
    updateDashboard();
}

function updateScheduleField(id, field, value) {
    const schedules = getSchedulesLocal();
    const idx = schedules.findIndex(s => s.id === id);
    if (idx >= 0) {
        schedules[idx][field] = value;
        setSchedulesLocal(schedules);
        // 입력 중 깜빡임/커서 이동 방지: 모드 변경시에만 재렌더
        if (field === 'mode') {
            renderSchedules();
            updateDashboard();
        }
    }
}

function renderSchedules() {
    const container = document.getElementById('schedules-container');
    if (!container) return;
    const schedules = getSchedulesLocal();
    container.innerHTML = '';
    if (schedules.length === 0) {
        container.innerHTML = `<div class="info-box">${t('noSchedulesHint') || '스케줄이 없습니다. 상단의 스케줄 추가 또는 프리셋을 눌러보세요.'}</div>`;
        return;
    }
    schedules.forEach(s => {
        const wrap = document.createElement('div');
        wrap.className = 'info-box';
        wrap.style.marginBottom = '12px';
        wrap.innerHTML = `
            <div style="display:flex; gap:12px; align-items:center; flex-wrap: wrap;">
                <input class="form-control" style="max-width: 220px;" value="${s.name || ''}" placeholder="${t('scheduleName') || '스케줄 이름'}" oninput="updateScheduleField(${s.id}, 'name', this.value)">
                <select class="form-control" style="max-width: 200px;" onchange="updateScheduleField(${s.id}, 'mode', this.value)">
                    <option value="onceAt" ${s.mode==='onceAt'?'selected':''}>${t('dailyOnce') || '매일 특정 시각 1회'}</option>
                    <option value="everyNMinutes" ${s.mode==='everyNMinutes'?'selected':''}>${t('nMinInterval') || 'N분 간격'}</option>
                    <option value="windowedInterval" ${s.mode==='windowedInterval'?'selected':''}>${t('windowedInterval') || '시간 창 내 간격'}</option>
                    <option value="cron" ${s.mode==='cron'?'selected':''}>${t('cronExpression') || '크론 표현식'}</option>
                </select>
                <label class="checkbox-group" style="margin-left:8px;">
                    <input type="checkbox" ${s.active?'checked':''} onchange="updateScheduleField(${s.id}, 'active', this.checked)">
                    <span>${t('active')}</span>
                </label>
                <button class="btn btn-danger" onclick="removeSchedule(${s.id})">${t('delete') || '삭제'}</button>
            </div>
            <div style="display:flex; gap:12px; margin-top:10px; flex-wrap: wrap;">
                ${s.mode==='onceAt' ? `
                    <input class="form-control" style="max-width:120px;" value="${s.time||'06:00'}" placeholder="HH:MM" oninput="updateScheduleField(${s.id}, 'time', this.value)">
                ` : ''}
                ${s.mode==='everyNMinutes' ? `
                    <input type="number" class="form-control" style="max-width:120px;" value="${s.minutes||15}" min="1" placeholder="${t('minutes') || '분'}" oninput="updateScheduleField(${s.id}, 'minutes', parseInt(this.value)||1)">
                ` : ''}
                ${s.mode==='windowedInterval' ? `
                    <input class="form-control" style="max-width:120px;" value="${s.windowStart||'09:00'}" placeholder="${t('startTime') || '시작'} HH:MM" oninput="updateScheduleField(${s.id}, 'windowStart', this.value)">
                    <input class="form-control" style="max-width:120px;" value="${s.windowEnd||'18:00'}" placeholder="${t('endTime') || '종료'} HH:MM" oninput="updateScheduleField(${s.id}, 'windowEnd', this.value)">
                    <input type="number" class="form-control" style="max-width:120px;" value="${s.minutes||30}" min="1" placeholder="${t('minutes') || '분'}" oninput="updateScheduleField(${s.id}, 'minutes', parseInt(this.value)||1)">
                ` : ''}
                ${s.mode==='cron' ? `
                    <input class="form-control" style="max-width:280px;" value="${s.cron||''}" placeholder="${t('cronExample') || '크론 표현식 (예: */15 9-18 * * 1-5)'}" oninput="updateScheduleField(${s.id}, 'cron', this.value)">
                ` : ''}
            </div>
        `;
        container.appendChild(wrap);
    });
}

function saveSchedulesUI() {
    // 저장: 로컬스토리지 + 메인 프로세스 config.schedules에 반영
    const schedules = getSchedulesLocal();
    try {
        window.__ccpulseSaveContext = 'schedules';
        ipcRenderer.send('save-config', { schedules });
    } catch (_) {}
}

function clearSchedulesUI() {
    localStorage.removeItem('ccpulse_schedules');
    renderSchedules();
    updateDashboard();
}

// ===== Onboarding (first run quick start) =====
function showQuickStartModal() {
    const m = document.getElementById('quickstart-modal');
    if (!m) return;
    m.style.display = 'flex';
    const close = () => { m.style.display = 'none'; };
    const closeBtn = document.getElementById('qs-close-btn');
    const okBtn = document.getElementById('qs-ok');
    const toSchedules = document.getElementById('qs-open-schedules');
    const dontShow = document.getElementById('qs-dont-show');
    const dontShowWrap = document.getElementById('qs-dont-show-wrap');
    if (closeBtn) closeBtn.onclick = () => {
        if (dontShow && dontShow.checked) persistDontShowQuickStart();
        close();
    };
    if (okBtn) okBtn.onclick = () => {
        if (dontShow && dontShow.checked) persistDontShowQuickStart();
        close();
    };
    if (toSchedules) toSchedules.onclick = () => {
        if (dontShow && dontShow.checked) persistDontShowQuickStart();
        close();
        showPage('schedules');
    };
}

function persistDontShowQuickStart() {
    try {
        currentConfig.showQuickStartOnLaunch = false;
        ipcRenderer.send('save-config', { showQuickStartOnLaunch: false });
    } catch (_) {}
}

function maybeShowQuickStartOnboarding() {
    // Show if enabled in config; default true for first run
    if (currentConfig && currentConfig.showQuickStartOnLaunch !== false) {
        const dontShowWrap = document.getElementById('qs-dont-show-wrap');
        if (dontShowWrap) dontShowWrap.style.display = 'flex';
        showQuickStartModal();
    }
}

// Always-available entry point
function openQuickStart() {
    const dontShow = document.getElementById('qs-dont-show');
    const dontShowWrap = document.getElementById('qs-dont-show-wrap');
    if (dontShow) dontShow.checked = false; // not to persist by default when opening manually
    if (dontShowWrap) dontShowWrap.style.display = 'none';
    showQuickStartModal();
}