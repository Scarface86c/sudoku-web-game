/**
 * SuperSudoku Database Testing Suite
 * Tests for Issue #8 - Database/Highscore System
 * 
 * Test Coverage:
 * - Automatic database initialization
 * - localStorage availability testing
 * - Fallback storage mechanisms
 * - Data persistence across sessions
 * - Error handling and recovery
 */

class DatabaseTestSuite {
    constructor() {
        this.testResults = [];
        this.originalLocalStorage = window.localStorage;
        this.originalConsole = console;
    }

    /**
     * Initialize test environment
     */
    setup() {
        // Create test console to capture logs
        this.testConsole = {
            log: (...args) => this.captureLog('log', ...args),
            warn: (...args) => this.captureLog('warn', ...args),
            error: (...args) => this.captureLog('error', ...args)
        };
        
        this.logs = [];
        console = this.testConsole;
    }

    /**
     * Cleanup test environment
     */
    teardown() {
        console = this.originalConsole;
        window.localStorage = this.originalLocalStorage;
        
        // Clear any test data
        if (window.SuperSudokuDB) {
            window.SuperSudokuDB.clearAllData();
        }
    }

    /**
     * Capture console logs for analysis
     */
    captureLog(level, ...args) {
        this.logs.push({ level, message: args.join(' '), timestamp: Date.now() });
        this.originalConsole[level](...args);
    }

    /**
     * Test automatic database initialization on first load
     */
    async testDatabaseInitialization() {
        console.log('🧪 Testing Database Initialization...');
        
        try {
            // Clear existing data to simulate first load
            localStorage.removeItem('SuperSudokuDB_initialized');
            localStorage.removeItem('SuperSudokuDB_version');
            
            // Create new database instance
            const db = new SuperSudokuDatabase();
            
            // Check initialization
            const isInitialized = db.getItem('SuperSudokuDB_initialized');
            const version = db.getItem('SuperSudokuDB_version');
            const status = db.getDatabaseStatus();
            
            this.assert(isInitialized === 'true', 'Database should be initialized');
            this.assert(version === '2.0.0', 'Version should be set correctly');
            this.assert(status.initialized === true, 'Status should show initialized');
            this.assert(status.totalRecords >= 0, 'Should have record count');
            
            // Verify all tables exist
            const requiredTables = ['players', 'scores', 'sessions', 'settings', 'statistics'];
            for (const table of requiredTables) {
                this.assert(status.tables[table].exists === true, `Table ${table} should exist`);
            }
            
            this.addTestResult('Database Initialization', 'PASS', 'Database initialized successfully with all tables');
            
        } catch (error) {
            this.addTestResult('Database Initialization', 'FAIL', error.message);
        }
    }

    /**
     * Test localStorage availability and fallback
     */
    async testLocalStorageFallback() {
        console.log('🧪 Testing localStorage Fallback...');
        
        try {
            // Test 1: Normal localStorage functionality
            const db1 = new SuperSudokuDatabase();
            this.assert(db1.isLocalStorageAvailable === true, 'localStorage should be available normally');
            
            // Test 2: Simulate localStorage unavailable
            delete window.localStorage;
            const db2 = new SuperSudokuDatabase();
            this.assert(db2.isLocalStorageAvailable === false, 'Should detect localStorage unavailable');
            
            // Test 3: Simulate localStorage quota exceeded
            window.localStorage = this.originalLocalStorage;
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = () => {
                throw new Error('QuotaExceededError');
            };
            
            const db3 = new SuperSudokuDatabase();
            this.assert(db3.isLocalStorageAvailable === false, 'Should handle quota exceeded error');
            
            // Restore localStorage
            localStorage.setItem = originalSetItem;
            
            // Test fallback storage operations
            db3.setItem('test_key', 'test_value');
            const retrievedValue = db3.getItem('test_key');
            this.assert(retrievedValue === 'test_value', 'Fallback storage should work');
            
            this.addTestResult('localStorage Fallback', 'PASS', 'Fallback mechanisms work correctly');
            
        } catch (error) {
            this.addTestResult('localStorage Fallback', 'FAIL', error.message);
        }
    }

    /**
     * Test highscore save and retrieve functionality
     */
    async testHighscoreManagement() {
        console.log('🧪 Testing Highscore Management...');
        
        try {
            const db = new SuperSudokuDatabase();
            
            // Create test player
            const playerId = db.createPlayer('TestPlayer', 'test@example.com');
            this.assert(playerId !== null, 'Should create player successfully');
            
            // Test score saving
            const scoreData = {
                playerId: playerId,
                playerName: 'TestPlayer',
                gameMode: 'classic',
                gridSize: 9,
                difficulty: 'medium',
                time: 300,
                hints: 2,
                errors: 1,
                completed: true
            };
            
            const scoreId = db.saveScore(scoreData);
            this.assert(scoreId !== null, 'Should save score successfully');
            
            // Test score retrieval
            const highScores = db.getHighScores('classic', 9, 'medium', 10);
            this.assert(highScores.length > 0, 'Should retrieve high scores');
            this.assert(highScores[0].playerName === 'TestPlayer', 'Score should contain correct player name');
            
            // Test player scores
            const playerScores = db.getPlayerScores(playerId, 10);
            this.assert(playerScores.length > 0, 'Should retrieve player scores');
            
            // Test statistics update
            db.updateStatistics(playerId, scoreData);
            const stats = db.select('statistics', stat => stat.playerId === playerId);
            this.assert(stats.length > 0, 'Statistics should be created');
            this.assert(stats[0].gamesPlayed === 1, 'Games played should be 1');
            this.assert(stats[0].gamesCompleted === 1, 'Games completed should be 1');
            
            this.addTestResult('Highscore Management', 'PASS', 'All highscore operations work correctly');
            
        } catch (error) {
            this.addTestResult('Highscore Management', 'FAIL', error.message);
        }
    }

    /**
     * Test data persistence across sessions
     */
    async testDataPersistence() {
        console.log('🧪 Testing Data Persistence...');
        
        try {
            // Create and populate database
            const db1 = new SuperSudokuDatabase();
            const playerId = db1.createPlayer('PersistentPlayer', 'persist@example.com');
            
            const scoreData = {
                playerId: playerId,
                playerName: 'PersistentPlayer',
                gameMode: 'kids',
                gridSize: 6,
                difficulty: 'easy',
                time: 180,
                hints: 0,
                errors: 0,
                completed: true
            };
            
            db1.saveScore(scoreData);
            
            // Simulate new session by creating new database instance
            const db2 = new SuperSudokuDatabase();
            
            // Verify data persists
            const player = db2.getPlayer(playerId);
            this.assert(player !== null, 'Player should persist across sessions');
            this.assert(player.name === 'PersistentPlayer', 'Player data should be intact');
            
            const highScores = db2.getHighScores('kids', 6, 'easy', 10);
            this.assert(highScores.length > 0, 'Scores should persist across sessions');
            
            const status = db2.getDatabaseStatus();
            this.assert(status.totalRecords > 0, 'Database should contain persisted data');
            
            this.addTestResult('Data Persistence', 'PASS', 'Data persists correctly across sessions');
            
        } catch (error) {
            this.addTestResult('Data Persistence', 'FAIL', error.message);
        }
    }

    /**
     * Test database recovery mechanisms
     */
    async testDatabaseRecovery() {
        console.log('🧪 Testing Database Recovery...');
        
        try {
            const db = new SuperSudokuDatabase();
            
            // Simulate corrupted table data
            localStorage.setItem('SuperSudokuDB_players', 'invalid_json');
            
            // Verify recovery
            db.verifyTables();
            
            // Check if table was recreated
            const playersData = db.getItem('SuperSudokuDB_players');
            this.assert(playersData !== 'invalid_json', 'Corrupted table should be recreated');
            
            const parsedData = JSON.parse(playersData);
            this.assert(Array.isArray(parsedData.data), 'Recreated table should have proper structure');
            
            // Test database status after recovery
            const status = db.getDatabaseStatus();
            this.assert(status.tables.players.exists === true, 'Recovered table should exist');
            
            this.addTestResult('Database Recovery', 'PASS', 'Database recovery mechanisms work correctly');
            
        } catch (error) {
            this.addTestResult('Database Recovery', 'FAIL', error.message);
        }
    }

    /**
     * Test score calculation accuracy
     */
    async testScoreCalculation() {
        console.log('🧪 Testing Score Calculation...');
        
        try {
            const db = new SuperSudokuDatabase();
            
            // Test various score scenarios
            const testCases = [
                {
                    gameData: { completed: true, time: 120, hints: 0, errors: 0, gridSize: 9, difficulty: 'easy' },
                    expectedMinScore: 800 // Base score + time bonus - penalties
                },
                {
                    gameData: { completed: true, time: 300, hints: 2, errors: 1, gridSize: 9, difficulty: 'hard' },
                    expectedMinScore: 600 // Higher difficulty multiplier but with penalties
                },
                {
                    gameData: { completed: false, time: 600, hints: 5, errors: 3, gridSize: 9, difficulty: 'medium' },
                    expectedScore: 0 // Incomplete game should score 0
                }
            ];
            
            for (const testCase of testCases) {
                const score = db.calculateScore(testCase.gameData);
                
                if (testCase.expectedScore !== undefined) {
                    this.assert(score === testCase.expectedScore, 
                        `Score should be exactly ${testCase.expectedScore}, got ${score}`);
                } else {
                    this.assert(score >= testCase.expectedMinScore, 
                        `Score should be at least ${testCase.expectedMinScore}, got ${score}`);
                }
            }
            
            this.addTestResult('Score Calculation', 'PASS', 'Score calculation works correctly');
            
        } catch (error) {
            this.addTestResult('Score Calculation', 'FAIL', error.message);
        }
    }

    /**
     * Helper method to add test results
     */
    addTestResult(testName, status, message) {
        this.testResults.push({
            test: testName,
            status: status,
            message: message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Assert helper method
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    /**
     * Run all database tests
     */
    async runAllTests() {
        console.log('🧪 Starting SuperSudoku Database Test Suite...');
        this.setup();
        
        try {
            await this.testDatabaseInitialization();
            await this.testLocalStorageFallback();
            await this.testHighscoreManagement();
            await this.testDataPersistence();
            await this.testDatabaseRecovery();
            await this.testScoreCalculation();
            
        } catch (error) {
            console.error('Test suite error:', error);
        } finally {
            this.teardown();
        }
        
        return this.generateTestReport();
    }

    /**
     * Generate comprehensive test report
     */
    generateTestReport() {
        const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
        const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
        const totalTests = this.testResults.length;
        
        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) : 0
            },
            results: this.testResults,
            logs: this.logs,
            timestamp: new Date().toISOString()
        };
        
        console.log('📊 Database Test Results:', report);
        return report;
    }
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseTestSuite;
} else {
    window.DatabaseTestSuite = DatabaseTestSuite;
}