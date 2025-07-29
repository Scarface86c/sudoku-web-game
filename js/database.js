// SuperSudoku Database System
// Local storage-based database for scores and player data

class SuperSudokuDatabase {
    constructor() {
        this.dbName = 'SuperSudokuDB';
        this.version = '2.0.0';
        this.isLocalStorageAvailable = this.checkLocalStorageSupport();
        this.fallbackStorage = new Map(); // In-memory fallback
        this.initDatabase();
    }

    /**
     * Check if localStorage is available and functional
     * @returns {boolean} true if localStorage is supported
     */
    checkLocalStorageSupport() {
        try {
            if (typeof Storage === 'undefined' || !window.localStorage) {
                console.warn('SuperSudoku: localStorage not available, using memory fallback');
                return false;
            }
            
            // Test localStorage functionality
            const testKey = '__supersudoku_test__';
            localStorage.setItem(testKey, 'test');
            const testValue = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            if (testValue !== 'test') {
                console.warn('SuperSudoku: localStorage test failed, using memory fallback');
                return false;
            }
            
            return true;
        } catch (error) {
            console.warn('SuperSudoku: localStorage error, using memory fallback:', error);
            return false;
        }
    }

    /**
     * Initialize database structure automatically on first load
     */
    initDatabase() {
        try {
            const isInitialized = this.getItem(`${this.dbName}_initialized`);
            const currentVersion = this.getItem(`${this.dbName}_version`);
            
            if (!isInitialized || currentVersion !== this.version) {
                console.log('SuperSudoku: Initializing database...');
                this.createTables();
                this.setItem(`${this.dbName}_initialized`, 'true');
                this.setItem(`${this.dbName}_version`, this.version);
                console.log('SuperSudoku: Database initialized successfully');
            } else {
                console.log('SuperSudoku: Database already initialized, version:', currentVersion);
                // Verify all tables exist, recreate missing ones
                this.verifyTables();
            }
        } catch (error) {
            console.error('SuperSudoku: Database initialization failed:', error);
            // Try to recover by recreating tables
            this.recoverDatabase();
        }
    }

    /**
     * Verify all required tables exist and recreate missing ones
     */
    verifyTables() {
        const requiredTables = ['players', 'scores', 'sessions', 'settings', 'statistics'];
        const missingTables = [];
        
        for (const table of requiredTables) {
            const tableData = this.getItem(`${this.dbName}_${table}`);
            if (!tableData) {
                missingTables.push(table);
            } else {
                try {
                    JSON.parse(tableData);
                } catch (error) {
                    console.warn(`SuperSudoku: Table ${table} is corrupted, will recreate`);
                    missingTables.push(table);
                }
            }
        }
        
        if (missingTables.length > 0) {
            console.log('SuperSudoku: Recreating missing tables:', missingTables);
            this.createMissingTables(missingTables);
        }
    }

    /**
     * Attempt to recover from database errors
     */
    recoverDatabase() {
        console.warn('SuperSudoku: Attempting database recovery...');
        try {
            this.createTables();
            this.setItem(`${this.dbName}_initialized`, 'true');
            this.setItem(`${this.dbName}_version`, this.version);
            console.log('SuperSudoku: Database recovery successful');
        } catch (error) {
            console.error('SuperSudoku: Database recovery failed:', error);
            if (!this.isLocalStorageAvailable) {
                console.log('SuperSudoku: Continuing with memory-only storage');
            }
        }
    }

    /**
     * Create missing tables without affecting existing data
     */
    createMissingTables(missingTables) {
        const tableStructures = this.getTableStructures();
        
        for (const tableName of missingTables) {
            if (tableStructures[tableName]) {
                this.setItem(`${this.dbName}_${tableName}`, JSON.stringify(tableStructures[tableName]));
                console.log(`SuperSudoku: Recreated table: ${tableName}`);
            }
        }
    }

    /**
     * Get all table structures
     */
    getTableStructures() {
        return {
            players: {
                structure: {
                    id: 'string',
                    name: 'string', 
                    email: 'string',
                    avatar: 'string',
                    created: 'timestamp',
                    lastPlayed: 'timestamp',
                    totalGames: 'number',
                    totalWins: 'number',
                    favoriteMode: 'string',
                    favoriteGridSize: 'number'
                },
                data: []
            },
            scores: {
                structure: {
                    id: 'string',
                    playerId: 'string',
                    playerName: 'string',
                    gameMode: 'string',
                    gridSize: 'number',
                    difficulty: 'string',
                    time: 'number',
                    hints: 'number',
                    errors: 'number',
                    score: 'number',
                    completed: 'boolean',
                    date: 'timestamp'
                },
                data: []
            },
            sessions: {
                structure: {
                    id: 'string',
                    playerId: 'string',
                    startTime: 'timestamp',
                    endTime: 'timestamp',
                    gameMode: 'string',
                    gridSize: 'number',
                    difficulty: 'string',
                    gameState: 'object',
                    completed: 'boolean'
                },
                data: []
            },
            settings: {
                structure: {
                    playerId: 'string',
                    theme: 'string',
                    soundEnabled: 'boolean',
                    animationsEnabled: 'boolean',
                    autoSave: 'boolean',
                    showTimer: 'boolean',
                    showHints: 'boolean',
                    defaultMode: 'string',
                    defaultGridSize: 'number',
                    defaultDifficulty: 'string'
                },
                data: []
            },
            statistics: {
                structure: {
                    playerId: 'string',
                    gameMode: 'string',
                    gridSize: 'number',
                    difficulty: 'string',
                    gamesPlayed: 'number',
                    gamesCompleted: 'number',
                    bestTime: 'number',
                    averageTime: 'number',
                    totalTime: 'number',
                    bestScore: 'number',
                    averageScore: 'number',
                    totalHints: 'number',
                    totalErrors: 'number',
                    streakCurrent: 'number',
                    streakBest: 'number',
                    lastPlayed: 'timestamp'
                },
                data: []
            }
        };
    }

    /**
     * Storage abstraction - works with localStorage or fallback
     */
    setItem(key, value) {
        try {
            if (this.isLocalStorageAvailable) {
                localStorage.setItem(key, value);
            } else {
                this.fallbackStorage.set(key, value);
            }
        } catch (error) {
            console.warn('SuperSudoku: Storage setItem failed:', error);
            // Try fallback even if localStorage was initially available
            this.fallbackStorage.set(key, value);
        }
    }

    /**
     * Storage abstraction - works with localStorage or fallback
     */
    getItem(key) {
        try {
            if (this.isLocalStorageAvailable) {
                return localStorage.getItem(key);
            } else {
                return this.fallbackStorage.get(key) || null;
            }
        } catch (error) {
            console.warn('SuperSudoku: Storage getItem failed:', error);
            return this.fallbackStorage.get(key) || null;
        }
    }

    /**
     * Storage abstraction - works with localStorage or fallback
     */
    removeItem(key) {
        try {
            if (this.isLocalStorageAvailable) {
                localStorage.removeItem(key);
            } else {
                this.fallbackStorage.delete(key);
            }
        } catch (error) {
            console.warn('SuperSudoku: Storage removeItem failed:', error);
            this.fallbackStorage.delete(key);
        }
    }

    /**
     * Create all database tables with proper error handling
     */
    createTables() {
        try {
            const tableStructures = this.getTableStructures();
            const tableNames = Object.keys(tableStructures);
            
            // Check if any tables already exist to avoid overwriting data
            const existingTables = [];
            for (const tableName of tableNames) {
                const existingData = this.getItem(`${this.dbName}_${tableName}`);
                if (existingData) {
                    try {
                        const parsed = JSON.parse(existingData);
                        if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
                            existingTables.push(tableName);
                        }
                    } catch (e) {
                        // Table exists but is corrupted, will be recreated
                    }
                }
            }
            
            // Create or recreate tables
            let tablesCreated = 0;
            for (const [tableName, tableStructure] of Object.entries(tableStructures)) {
                try {
                    if (!existingTables.includes(tableName)) {
                        this.setItem(`${this.dbName}_${tableName}`, JSON.stringify(tableStructure));
                        tablesCreated++;
                    } else {
                        console.log(`SuperSudoku: Preserving existing data in table: ${tableName}`);
                    }
                } catch (error) {
                    console.error(`SuperSudoku: Failed to create table ${tableName}:`, error);
                }
            }
            
            if (tablesCreated > 0) {
                console.log(`SuperSudoku: Created ${tablesCreated} new database tables`);
            }
            
            if (existingTables.length > 0) {
                console.log(`SuperSudoku: Preserved ${existingTables.length} existing tables with data`);
            }
            
        } catch (error) {
            console.error('SuperSudoku: Failed to create database tables:', error);
            throw error;
        }
    }

    // Generic CRUD operations with enhanced error handling
    insert(table, data) {
        try {
            const tableDataStr = this.getItem(`${this.dbName}_${table}`);
            if (!tableDataStr) {
                console.warn(`SuperSudoku: Table ${table} not found, creating it...`);
                this.createMissingTables([table]);
            }
            
            const tableData = JSON.parse(this.getItem(`${this.dbName}_${table}`));
            if (!tableData || !tableData.data) {
                throw new Error(`Invalid table structure for ${table}`);
            }
            
            data.id = data.id || this.generateId();
            tableData.data.push(data);
            this.setItem(`${this.dbName}_${table}`, JSON.stringify(tableData));
            return data.id;
        } catch (error) {
            console.error(`SuperSudoku: Error inserting into ${table}:`, error);
            return null;
        }
    }

    select(table, filter = null, limit = null) {
        try {
            const tableDataStr = this.getItem(`${this.dbName}_${table}`);
            if (!tableDataStr) {
                console.warn(`SuperSudoku: Table ${table} not found, returning empty results`);
                return [];
            }
            
            const tableData = JSON.parse(tableDataStr);
            if (!tableData || !tableData.data || !Array.isArray(tableData.data)) {
                console.warn(`SuperSudoku: Invalid table structure for ${table}, returning empty results`);
                return [];
            }
            
            let results = tableData.data;

            // Apply filter if provided
            if (filter && typeof filter === 'function') {
                results = results.filter(filter);
            }

            // Apply limit if provided
            if (limit && typeof limit === 'number') {
                results = results.slice(0, limit);
            }

            return results;
        } catch (error) {
            console.error(`SuperSudoku: Error selecting from ${table}:`, error);
            return [];
        }
    }

    update(table, id, updates) {
        try {
            const tableDataStr = this.getItem(`${this.dbName}_${table}`);
            if (!tableDataStr) {
                console.warn(`SuperSudoku: Table ${table} not found for update`);
                return false;
            }
            
            const tableData = JSON.parse(tableDataStr);
            if (!tableData || !tableData.data || !Array.isArray(tableData.data)) {
                console.warn(`SuperSudoku: Invalid table structure for ${table}`);
                return false;
            }
            
            const index = tableData.data.findIndex(item => item.id === id);
            
            if (index !== -1) {
                tableData.data[index] = { ...tableData.data[index], ...updates };
                this.setItem(`${this.dbName}_${table}`, JSON.stringify(tableData));
                return true;
            }
            return false;
        } catch (error) {
            console.error(`SuperSudoku: Error updating ${table}:`, error);
            return false;
        }
    }

    delete(table, id) {
        try {
            const tableDataStr = this.getItem(`${this.dbName}_${table}`);
            if (!tableDataStr) {
                console.warn(`SuperSudoku: Table ${table} not found for delete`);
                return false;
            }
            
            const tableData = JSON.parse(tableDataStr);
            if (!tableData || !tableData.data || !Array.isArray(tableData.data)) {
                console.warn(`SuperSudoku: Invalid table structure for ${table}`);
                return false;
            }
            
            const index = tableData.data.findIndex(item => item.id === id);
            
            if (index !== -1) {
                tableData.data.splice(index, 1);
                this.setItem(`${this.dbName}_${table}`, JSON.stringify(tableData));
                return true;
            }
            return false;
        } catch (error) {
            console.error(`SuperSudoku: Error deleting from ${table}:`, error);
            return false;
        }
    }

    // Player management
    createPlayer(name, email = '') {
        const player = {
            id: this.generateId(),
            name: name,
            email: email,
            avatar: this.generateAvatar(name),
            created: Date.now(),
            lastPlayed: Date.now(),
            totalGames: 0,
            totalWins: 0,
            favoriteMode: 'classic',
            favoriteGridSize: 9
        };

        return this.insert('players', player);
    }

    getPlayer(id) {
        const players = this.select('players', player => player.id === id);
        return players.length > 0 ? players[0] : null;
    }

    getPlayerByName(name) {
        const players = this.select('players', player => player.name.toLowerCase() === name.toLowerCase());
        return players.length > 0 ? players[0] : null;
    }

    updatePlayerStats(playerId, gameData) {
        const player = this.getPlayer(playerId);
        if (player) {
            const updates = {
                lastPlayed: Date.now(),
                totalGames: player.totalGames + 1,
                totalWins: gameData.completed ? player.totalWins + 1 : player.totalWins
            };
            return this.update('players', playerId, updates);
        }
        return false;
    }

    // Score management
    saveScore(scoreData) {
        const score = {
            id: this.generateId(),
            ...scoreData,
            date: Date.now(),
            score: this.calculateScore(scoreData)
        };

        return this.insert('scores', score);
    }

    getHighScores(gameMode = null, gridSize = null, difficulty = null, limit = 10) {
        let filter = null;
        
        if (gameMode || gridSize || difficulty) {
            filter = score => {
                return (!gameMode || score.gameMode === gameMode) &&
                       (!gridSize || score.gridSize === gridSize) &&
                       (!difficulty || score.difficulty === difficulty) &&
                       score.completed === true;
            };
        } else {
            filter = score => score.completed === true;
        }

        const scores = this.select('scores', filter);
        
        // Sort by score (descending) then by time (ascending)
        scores.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.time - b.time;
        });

        return scores.slice(0, limit);
    }

    getPlayerScores(playerId, limit = 10) {
        const scores = this.select('scores', score => score.playerId === playerId && score.completed);
        scores.sort((a, b) => b.date - a.date);
        return scores.slice(0, limit);
    }

    // Statistics
    updateStatistics(playerId, gameData) {
        const key = `${gameData.gameMode}_${gameData.gridSize}_${gameData.difficulty}`;
        const stats = this.select('statistics', stat => 
            stat.playerId === playerId && 
            stat.gameMode === gameData.gameMode &&
            stat.gridSize === gameData.gridSize &&
            stat.difficulty === gameData.difficulty
        );

        if (stats.length === 0) {
            // Create new statistics entry
            const newStats = {
                id: this.generateId(),
                playerId: playerId,
                gameMode: gameData.gameMode,
                gridSize: gameData.gridSize,
                difficulty: gameData.difficulty,
                gamesPlayed: 1,
                gamesCompleted: gameData.completed ? 1 : 0,
                bestTime: gameData.completed ? gameData.time : null,
                averageTime: gameData.completed ? gameData.time : 0,
                totalTime: gameData.time,
                bestScore: gameData.completed ? gameData.score : 0,
                averageScore: gameData.completed ? gameData.score : 0,
                totalHints: gameData.hints,
                totalErrors: gameData.errors,
                streakCurrent: gameData.completed ? 1 : 0,
                streakBest: gameData.completed ? 1 : 0,
                lastPlayed: Date.now()
            };
            
            return this.insert('statistics', newStats);
        } else {
            // Update existing statistics
            const stat = stats[0];
            const updates = {
                gamesPlayed: stat.gamesPlayed + 1,
                gamesCompleted: gameData.completed ? stat.gamesCompleted + 1 : stat.gamesCompleted,
                totalTime: stat.totalTime + gameData.time,
                totalHints: stat.totalHints + gameData.hints,
                totalErrors: stat.totalErrors + gameData.errors,
                lastPlayed: Date.now()
            };

            if (gameData.completed) {
                updates.bestTime = stat.bestTime === null ? gameData.time : Math.min(stat.bestTime, gameData.time);
                updates.averageTime = updates.totalTime / updates.gamesCompleted;
                updates.bestScore = Math.max(stat.bestScore, gameData.score);
                updates.averageScore = (stat.averageScore * stat.gamesCompleted + gameData.score) / updates.gamesCompleted;
                updates.streakCurrent = stat.streakCurrent + 1;
                updates.streakBest = Math.max(stat.streakBest, updates.streakCurrent);
            } else {
                updates.streakCurrent = 0;
            }

            return this.update('statistics', stat.id, updates);
        }
    }

    // Utility functions
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateAvatar(name) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        const colorIndex = name.length % colors.length;
        return {
            backgroundColor: colors[colorIndex],
            initials: name.substring(0, 2).toUpperCase()
        };
    }

    calculateScore(gameData) {
        if (!gameData.completed) return 0;

        const { time, hints, errors, gridSize, difficulty } = gameData;
        
        // Base score based on grid size
        const baseScore = {
            4: 100,
            6: 300,
            9: 500,
            16: 1000
        }[gridSize] || 500;

        // Difficulty multiplier
        const difficultyMultiplier = {
            easy: 1.0,
            medium: 1.5,
            hard: 2.0,
            hardcore: 3.0
        }[difficulty] || 1.0;

        // Time bonus (faster = better)
        const timeBonus = Math.max(0, 1000 - time);

        // Penalties
        const hintPenalty = hints * 50;
        const errorPenalty = errors * 25;

        const finalScore = Math.max(0, Math.round(
            (baseScore * difficultyMultiplier + timeBonus) - hintPenalty - errorPenalty
        ));

        return finalScore;
    }

    // Export/Import functionality
    exportData() {
        const data = {
            version: this.version,
            timestamp: Date.now(),
            players: this.select('players'),
            scores: this.select('scores'),
            statistics: this.select('statistics'),
            settings: this.select('settings')
        };

        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Validate data structure
            if (!data.players || !data.scores) {
                throw new Error('Invalid data format');
            }

            // Clear existing data
            this.createTables();

            // Import data
            data.players.forEach(player => this.insert('players', player));
            data.scores.forEach(score => this.insert('scores', score));
            if (data.statistics) data.statistics.forEach(stat => this.insert('statistics', stat));
            if (data.settings) data.settings.forEach(setting => this.insert('settings', setting));

            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Clear all data with proper error handling
    clearAllData() {
        try {
            const tables = ['players', 'scores', 'sessions', 'settings', 'statistics'];
            tables.forEach(table => {
                this.removeItem(`${this.dbName}_${table}`);
            });
            this.removeItem(`${this.dbName}_initialized`);
            this.removeItem(`${this.dbName}_version`);
            
            // Clear fallback storage as well
            if (!this.isLocalStorageAvailable) {
                this.fallbackStorage.clear();
            }
            
            console.log('SuperSudoku: All data cleared successfully');
            this.initDatabase();
        } catch (error) {
            console.error('SuperSudoku: Error clearing data:', error);
            // Force clear fallback storage
            this.fallbackStorage.clear();
            this.initDatabase();
        }
    }

    /**
     * Get database status and statistics
     */
    getDatabaseStatus() {
        const status = {
            initialized: !!this.getItem(`${this.dbName}_initialized`),
            version: this.getItem(`${this.dbName}_version`),
            storageType: this.isLocalStorageAvailable ? 'localStorage' : 'memory',
            tables: {},
            totalRecords: 0
        };
        
        const tables = ['players', 'scores', 'sessions', 'settings', 'statistics'];
        for (const table of tables) {
            try {
                const data = this.select(table);
                status.tables[table] = {
                    exists: true,
                    records: data.length
                };
                status.totalRecords += data.length;
            } catch (error) {
                status.tables[table] = {
                    exists: false,
                    error: error.message
                };
            }
        }
        
        return status;
    }
}

// Global instance
window.SuperSudokuDB = new SuperSudokuDatabase();

console.log('SuperSudoku Database System loaded successfully');