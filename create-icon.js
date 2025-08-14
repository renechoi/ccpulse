const fs = require('fs');
const { createCanvas } = require('canvas');

// 간단한 PNG 아이콘 생성 (Canvas 없이)
const width = 64;
const height = 64;

// PNG 헤더와 간단한 색상 데이터로 기본 아이콘 생성
// 보라색 그라데이션 효과의 간단한 아이콘
const createSimpleIcon = () => {
    // SVG로 아이콘 생성
    const svg = `
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect width="64" height="64" rx="12" fill="url(#grad)"/>
        <text x="32" y="40" font-family="Arial" font-size="28" font-weight="bold" fill="white" text-anchor="middle">CT</text>
    </svg>`;
    
    fs.writeFileSync('icon.svg', svg);
    console.log('icon.svg created!');
    
    // 빈 PNG 파일 생성 (임시)
    // 실제 PNG는 외부 도구로 변환 필요
    const buffer = Buffer.from([]);
    fs.writeFileSync('icon.png', buffer);
    console.log('Empty icon.png created - convert SVG to PNG manually');
};

createSimpleIcon();