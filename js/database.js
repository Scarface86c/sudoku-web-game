// SuperSudoku Database System
// Local storage-based database for scores and player data

class SuperSudokuDatabase {
    constructor() {
        this.dbName = 'SuperSudokuDB';
        this.version = '2.0.0';
        this.initDatabase();
    }

    initDatabase() {
        // Initialize database structure if not exists
        if (!localStorage.getItem(`${this.dbName}_initialized`)) {
            this.createTables();
            localStorage.setItem(`${this.dbName}_initialized`, 'true');
            localStorage.setItem(`${this.dbName}_version`, this.version);
        }
    }

    createTables() {
        // Players table
        const players = {
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
        };

        // Scores table
        const scores = {
            structure: {
                id: 'string',
                playerId: 'string',
                playerName: 'string',
                gameMode: 'string', // classic, kids, symbols
                gridSize: 'number', // 4, 6, 9, 16
                difficulty: 'string', // easy, medium, hard, hardcore
                time: 'number', // seconds
                hints: 'number',
                errors: 'number',
                score: 'number', // calculated score
                completed: 'boolean',
                date: 'timestamp'
            },
            data: []
        };

        // Game sessions table
        const sessions = {
            structure: {
                id: 'string',
                playerId: 'string',
                startTime: 'timestamp',
                endTime: 'timestamp',
                gameMode: 'string',
                gridSize: 'number',
                difficulty: 'string',
                gameState: 'object', // serialized game state
                completed: 'boolean'
            },
            data: []
        };

        // Settings table
        const settings = {
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
        };

        // Statistics table
        const statistics = {
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
        };

        // Save tables to localStorage
        localStorage.setItem(`${this.dbName}_players`, JSON.stringify(players));
        localStorage.setItem(`${this.dbName}_scores`, JSON.stringify(scores));
        localStorage.setItem(`${this.dbName}_sessions`, JSON.stringify(sessions));
        localStorage.setItem(`${this.dbName}_settings`, JSON.stringify(settings));
        localStorage.setItem(`${this.dbName}_statistics`, JSON.stringify(statistics));

        console.log('SuperSudoku Database initialized successfully');
    }

    // Generic CRUD operations
    insert(table, data) {
        try {
            const tableData = JSON.parse(localStorage.getItem(`${this.dbName}_${table}`));
            data.id = data.id || this.generateId();
            tableData.data.push(data);
            localStorage.setItem(`${this.dbName}_${table}`, JSON.stringify(tableData));
            return data.id;
        } catch (error) {
            console.error(`Error inserting into ${table}:`, error);
            return null;
        }
    }

    select(table, filter = null, limit = null) {
        try {
            const tableData = JSON.parse(localStorage.getItem(`${this.dbName}_${table}`));
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
            console.error(`Error selecting from ${table}:`, error);
            return [];
        }
    }

    update(table, id, updates) {
        try {
            const tableData = JSON.parse(localStorage.getItem(`${this.dbName}_${table}`));
            const index = tableData.data.findIndex(item => item.id === id);
            
            if (index !== -1) {
                tableData.data[index] = { ...tableData.data[index], ...updates };
                localStorage.setItem(`${this.dbName}_${table}`, JSON.stringify(tableData));
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error updating ${table}:`, error);
            return false;
        }
    }

    delete(table, id) {
        try {
            const tableData = JSON.parse(localStorage.getItem(`${this.dbName}_${table}`));
            const index = tableData.data.findIndex(item => item.id === id);
            
            if (index !== -1) {
                tableData.data.splice(index, 1);
                localStorage.setItem(`${this.dbName}_${table}`, JSON.stringify(tableData));
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error deleting from ${table}:`, error);
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

    // Clear all data
    clearAllData() {
        const tables = ['players', 'scores', 'sessions', 'settings', 'statistics'];
        tables.forEach(table => {
            localStorage.removeItem(`${this.dbName}_${table}`);
        });
        localStorage.removeItem(`${this.dbName}_initialized`);
        localStorage.removeItem(`${this.dbName}_version`);
        
        this.initDatabase();
    }
}

// Global instance
window.SuperSudokuDB = new SuperSudokuDatabase();

console.log('SuperSudoku Database System loaded successfully');