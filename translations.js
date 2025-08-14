// Multi-language support for CCPulse

const translations = {
    en: {
        // Navigation
        dashboard: 'Dashboard',
        settings: 'Settings',
        schedules: 'Schedules',
        logs: 'Logs',
        about: 'About',
        
        // Dashboard
        currentStatus: 'Current Status',
        active: 'Active',
        inactive: 'Inactive',
        nextRunTime: 'Next Run Time',
        runMode: 'Run Mode',
        activeSchedules: 'Active Schedules',
        nextRuns: 'Next Runs (Max 5)',
        noSchedules: 'No schedules. Add schedules in the Schedules tab and save.',
        noAutoRun: 'Auto-run is disabled or no schedules configured.',
        noActiveSchedules: 'No active schedules.',
        schedulesBased: 'Schedule-based',
        simulation: 'Simulation',
        realExecution: 'Real Execution',
        noScheduledRuns: 'No scheduled runs.',
        noSchedulesHint: 'No schedules. Click "Add Schedule" or presets above.',
        unnamed: 'unnamed',
        daily: 'Daily',
        minInterval: 'min interval',
        days: 'Days',
        within: 'within',
        unknownMode: 'Unknown mode',
        schedulesSaved: 'Schedules saved.',
        settingsSaved: 'Settings saved!',
        confirmClearLogs: 'Delete all logs?',
        newSchedule: 'New Schedule',
        running: 'Running...',
        scheduleName: 'Schedule Name',
        dailyOnce: 'Daily at specific time',
        nMinInterval: 'Every N minutes',
        windowedInterval: 'Interval within time window',
        cronExpression: 'Cron expression',
        delete: 'Delete',
        minutes: 'min',
        startTime: 'Start',
        endTime: 'End',
        cronExample: 'Cron expression (e.g. */15 9-18 * * 1-5)',
        
        // Main process logs
        ccpulseStarted: 'CCPulse Started',
        tokenResetProcessStart: 'Claude Token Pulse Process Started',
        executionTime: 'Execution Time',
        currentMode: 'Current Mode',
        simulationRunning: 'Simulation running...',
        actualExecutionSteps: 'This is how it would actually run',
        step1StartClaude: 'Start Claude with "claude" command',
        step2SendMessage: 'message sent',
        step3ClaudeResponds: 'Claude responds (token usage starts)',
        step4ExitCommand: 'Exit with "exit" command',
        simulatingWait: 'Simulating... (2 second wait)',
        expectedBehavior: 'Expected behavior',
        responseMessage: 'Response message',
        simulationComplete: 'Simulation complete!',
        tokenWindowCounting: 'Token window starts counting from this point',
        schedule: 'Schedule',
        interval: 'Interval',
        unknownModeOrIncomplete: 'Unknown mode or incomplete settings',
        setupFailed: 'setup failed',
        mockModeWarning: 'Currently running in Mock Mode',
        mockModeDesc: 'Only simulating, not actually calling Claude.',
        mockModeHint: 'To run actually, turn off Mock mode in Settings.',
        quickStartGuide: 'Quick Start Guide',
        quickStart1: 'Add your desired schedules in the Schedules tab and save.',
        quickStart2: 'Enable Auto-run in the Settings tab.',
        quickStart3: 'Test immediately with Run Now on the dashboard.',
        quickStart4: 'Even if closed, it continues running in the tray (can reopen from menu).',
        dontShowAgain: 'Don\'t show again',
        goToSchedules: 'Go to Schedules',
        gotIt: 'Got it',
        
        // Buttons
        runNow: 'Run Now',
        toggleAutoRun: 'Toggle Auto-run',
        viewLogs: 'View Logs',
        saveSettings: 'Save Settings',
        addSchedule: 'Add Schedule',
        save: 'Save',
        clearAll: 'Clear All',
        refresh: 'Refresh',
        clearLogs: 'Clear Logs',
        openLogFolder: 'Open Log Folder',
        
        // Settings
        claudeMessage: 'Claude Message',
        claudeMessageHint: 'Single message sent to Claude when actually called.',
        autoRunEnable: 'Enable Auto-run',
        autoRunDesc: 'Automatically runs based on schedules in the Schedules tab.',
        mockMode: 'Mock Mode',
        mockModeDescSetting: 'For testing, does not actually call Claude. When disabled, runs for real.',
        
        // Schedules
        schedulesTitle: 'Schedules',
        schedulesHint: '24-hour format (HH:MM), local timezone',
        preset15min: '15min interval',
        presetHourly: 'Every hour',
        presetWorkday: 'Weekdays 9-18/30min',
        
        // Logs
        executionLogs: 'Execution Logs',
        noLogs: 'No logs.',
        
        // About
        aboutTitle: 'About',
        version: 'CCPulse v1.0.0',
        description: 'A tool to keep your Claude Code token window alive with periodic pulses.',
        features: 'Key Features:',
        feature1: 'Automatically send requests to Claude at set times daily',
        feature2: 'Adjust token window counting start point',
        feature3: 'Run in background from system tray',
        feature4: 'Test without Claude using Mock mode',
        copyright: '© 2025 renechoi. All rights reserved.'
    },
    
    ko: {
        // Navigation
        dashboard: '대시보드',
        settings: '설정',
        schedules: '스케줄',
        logs: '로그',
        about: '정보',
        
        // Dashboard
        currentStatus: '현재 상태',
        active: '활성',
        inactive: '비활성',
        nextRunTime: '다음 실행 시간',
        runMode: '실행 모드',
        activeSchedules: '활성 스케줄',
        nextRuns: '다음 실행(최대 5회)',
        noSchedules: '스케줄이 없습니다. 스케줄 탭에서 추가 후 저장하세요.',
        noAutoRun: '자동 실행이 꺼져 있거나 스케줄이 없습니다.',
        noActiveSchedules: '활성화된 스케줄이 없습니다.',
        schedulesBased: '스케줄 기반',
        simulation: '시뮬레이션',
        realExecution: '실제 실행',
        noScheduledRuns: '예정된 실행이 없습니다.',
        noSchedulesHint: '스케줄이 없습니다. 상단의 스케줄 추가 또는 프리셋을 눌러보세요.',
        unnamed: '이름 없음',
        daily: '매일',
        minInterval: '분 간격',
        days: '요일',
        within: '내',
        unknownMode: '알 수 없는 모드',
        schedulesSaved: '스케줄이 저장되었습니다.',
        settingsSaved: '설정이 저장되었습니다!',
        confirmClearLogs: '모든 로그를 삭제하시겠습니까?',
        newSchedule: '새 스케줄',
        running: '실행 중...',
        scheduleName: '스케줄 이름',
        dailyOnce: '매일 특정 시각 1회',
        nMinInterval: 'N분 간격',
        windowedInterval: '시간 창 내 간격',
        cronExpression: '크론 표현식',
        delete: '삭제',
        minutes: '분',
        startTime: '시작',
        endTime: '종료',
        cronExample: '크론 표현식 (예: */15 9-18 * * 1-5)',
        
        // Main process logs
        ccpulseStarted: 'CCPulse 시작됨',
        tokenResetProcessStart: 'Claude 토큰 펄스 프로세스 시작',
        executionTime: '실행 시간',
        currentMode: '현재 모드',
        simulationRunning: '시뮬레이션 실행 중...',
        actualExecutionSteps: '실제로는 이렇게 실행됩니다',
        step1StartClaude: '"claude" 명령으로 Claude 시작',
        step2SendMessage: '메시지 전송',
        step3ClaudeResponds: 'Claude가 응답 (토큰 사용 시작)',
        step4ExitCommand: '"exit" 명령으로 종료',
        simulatingWait: '시뮬레이션 중... (2초 대기)',
        expectedBehavior: '예상 동작',
        responseMessage: '응답 메시지',
        simulationComplete: '시뮬레이션 완료!',
        tokenWindowCounting: '토큰 윈도우가 이 시점부터 카운팅됩니다',
        schedule: '스케줄',
        interval: '간격',
        unknownModeOrIncomplete: '알 수 없는 모드 또는 설정 불완전',
        setupFailed: '설정 실패',
        mockModeWarning: '현재 Mock 모드로 실행 중',
        mockModeDesc: '실제로 Claude를 호출하지 않고 시뮬레이션만 합니다.',
        mockModeHint: '실제 실행을 원하시면 설정에서 Mock 모드를 끄세요.',
        quickStartGuide: '빠른 시작 가이드',
        quickStart1: '스케줄 탭에서 원하는 스케줄을 추가하고 저장하세요.',
        quickStart2: '설정 탭에서 자동 실행 활성화를 켜세요.',
        quickStart3: '대시보드의 지금 실행으로 즉시 동작을 테스트할 수 있습니다.',
        quickStart4: '창을 닫아도 트레이에서 계속 실행됩니다(메뉴로 다시 열기 가능).',
        dontShowAgain: '다시 보지 않기',
        goToSchedules: '스케줄로 이동',
        gotIt: '확인',
        
        // Buttons
        runNow: '지금 실행',
        toggleAutoRun: '자동 실행 전환',
        viewLogs: '로그 보기',
        saveSettings: '설정 저장',
        addSchedule: '스케줄 추가',
        save: '저장',
        clearAll: '초기화',
        refresh: '새로고침',
        clearLogs: '로그 삭제',
        openLogFolder: '로그 폴더 열기',
        
        // Settings
        claudeMessage: 'Claude 메시지',
        claudeMessageHint: '실제 호출 시 Claude에 전송되는 단일 메시지입니다.',
        autoRunEnable: '자동 실행 활성화',
        autoRunDesc: '스케줄 탭의 설정된 스케줄 기준으로 자동 실행합니다.',
        mockMode: 'Mock 모드',
        mockModeDescSetting: '테스트용으로 Claude를 실제 호출하지 않습니다. 해제 시 실제로 실행됩니다.',
        
        // Schedules
        schedulesTitle: '스케줄',
        schedulesHint: '24시간 표기(HH:MM), 로컬 시간대 기준',
        preset15min: '15분 간격',
        presetHourly: '매시간',
        presetWorkday: '평일 9-18시/30분',
        
        // Logs
        executionLogs: '실행 로그',
        noLogs: '로그가 없습니다.',
        
        // About
        aboutTitle: '정보',
        version: 'CCPulse v1.0.0',
        description: 'Claude Code의 토큰 윈도우를 주기적인 펄스로 활성 상태로 유지하는 도구입니다.',
        features: '주요 기능:',
        feature1: '매일 설정된 시간에 자동으로 Claude에 요청 전송',
        feature2: '토큰 윈도우 카운팅 시작 시점 조절',
        feature3: '시스템 트레이에서 백그라운드 실행',
        feature4: 'Mock 모드로 Claude 없이도 테스트 가능',
        copyright: '© 2025 renechoi. All rights reserved.'
    }
};

// Language management
let currentLanguage = 'en';

function setLanguage(lang) {
    if (!translations[lang]) {
        console.warn(`Language '${lang}' not found, falling back to English`);
        lang = 'en';
    }
    currentLanguage = lang;
    localStorage.setItem('ccpulse-language', lang);
    return translations[lang];
}

function getLanguage() {
    return currentLanguage;
}

function t(key) {
    return translations[currentLanguage][key] || translations.en[key] || key;
}

function loadSavedLanguage() {
    const saved = localStorage.getItem('ccpulse-language');
    if (saved && translations[saved]) {
        currentLanguage = saved;
    } else {
        // Default to English
        currentLanguage = 'en';
    }
    return currentLanguage;
}

// Export for Node.js (Electron main process)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        translations,
        setLanguage,
        getLanguage,
        t,
        loadSavedLanguage
    };
}

// Export for browser (Electron renderer process)
if (typeof window !== 'undefined') {
    window.i18n = {
        translations,
        setLanguage,
        getLanguage,
        t,
        loadSavedLanguage
    };
}