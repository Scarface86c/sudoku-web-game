// SuperSudoku Version Management
// Version: 2.0.0 - Major update with GitHub Issues implementation

const SUPERSUDOKU_VERSION = {
    major: 2,
    minor: 0,
    patch: 0,
    build: '2025.07.29',
    name: 'SuperSudoku',
    fullVersion: '2.0.0',
    codename: 'GitHub Issues Edition',
    releaseDate: '2025-07-29',
    features: [
        'GitHub Issues Implementation',
        'SuperSudoku Rebranding',
        'Enhanced Dark Mode',
        'Optimized Number Pad Layout',
        'Kids Mode with Colors & Symbols',
        'Database & Highscore System',
        'Improved Mobile Responsiveness'
    ],
    changelog: {
        '2.0.0': {
            date: '2025-07-29',
            changes: [
                '[NEW] SuperSudoku branding and identity',
                '[NEW] Kids mode with colors and symbols',
                '[NEW] Database and highscore system',
                '[FIXED] Dark mode number visibility (Issue #1)',
                '[FIXED] Number pad layout optimization (Issue #2)',
                '[FIXED] Mobile responsiveness improvements (Issue #5)',
                '[ENHANCED] Complete UI/UX overhaul',
                '[ENHANCED] Version management system'
            ]
        },
        '1.0.0': {
            date: '2025-07-29',
            changes: [
                '[INITIAL] Multi-size Sudoku grids (4x4, 6x6, 9x9, 16x16)',
                '[INITIAL] Progressive Web App functionality',
                '[INITIAL] Responsive design and accessibility',
                '[INITIAL] Advanced hint system'
            ]
        }
    }
};

// Version display utilities
function getVersionString() {
    return `${SUPERSUDOKU_VERSION.name} v${SUPERSUDOKU_VERSION.fullVersion}`;
}

function getFullVersionInfo() {
    return {
        name: SUPERSUDOKU_VERSION.name,
        version: SUPERSUDOKU_VERSION.fullVersion,
        codename: SUPERSUDOKU_VERSION.codename,
        build: SUPERSUDOKU_VERSION.build,
        releaseDate: SUPERSUDOKU_VERSION.releaseDate,
        features: SUPERSUDOKU_VERSION.features
    };
}

function displayVersionInfo() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                       ${SUPERSUDOKU_VERSION.name}                        ║
║                    Version ${SUPERSUDOKU_VERSION.fullVersion}                     ║
║              ${SUPERSUDOKU_VERSION.codename}              ║
║                                                              ║
║  🎮 Multi-size grids (4x4, 6x6, 9x9, 16x16)                ║
║  🎨 Kids mode with colors and symbols                       ║
║  🏆 Database and highscore system                          ║
║  📱 Enhanced mobile responsiveness                          ║
║  🌙 Improved dark mode visibility                          ║
║  ⚡ Optimized number pad layout                             ║
║                                                              ║
║  Build: ${SUPERSUDOKU_VERSION.build}                                    ║
║  Released: ${SUPERSUDOKU_VERSION.releaseDate}                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
}

// Auto-display version on load
if (typeof window !== 'undefined') {
    displayVersionInfo();
    
    // Add version to window object for global access
    window.SUPERSUDOKU_VERSION = SUPERSUDOKU_VERSION;
    window.getVersionString = getVersionString;
    window.getFullVersionInfo = getFullVersionInfo;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPERSUDOKU_VERSION,
        getVersionString,
        getFullVersionInfo,
        displayVersionInfo
    };
}