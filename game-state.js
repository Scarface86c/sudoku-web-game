/**
 * Sudoku Game State Manager
 * Immutable state updates, undo/redo functionality, save/load progress, timer integration
 * Manages complete game lifecycle with performance optimization
 */

class GameStateManager {
    constructor() {
        this.state = this.createInitialState();
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 100;
        
        // Performance optimization
        this.stateCache = new Map();
        this.saveThrottle = null;
        this.saveDebounceTime = 1000; // 1 second
        
        // Event listeners
        this.listeners = new Map();
        
        // Storage keys
        this.storageKeys = {
            gameState: 'sudoku_game_state',
            gameHistory: 'sudoku_game_history',
            preferences: 'sudoku_preferences',
            statistics: 'sudoku_statistics'
        };

        // Timer management
        this.timer = {
            startTime: null,
            pausedTime: 0,
            totalPaused: 0,
            isRunning: false,
            interval: null
        };

        // Auto-save configuration
        this.autoSave = {
            enabled: true,
            interval: 30000, // 30 seconds
            lastSave: Date.now(),
            intervalId: null
        };

        this.initializeAutoSave();
    }

    /**
     * Create initial game state
     */
    createInitialState() {
        return {
            puzzle: null,
            solution: null,
            currentGrid: null,
            size: 9,
            difficulty: 'medium',
            
            // Game status
            isComplete: false,
            isPaused: false,
            isStarted: false,
            
            // Timing
            startTime: null,
            endTime: null,
            elapsedTime: 0,
            pausedDuration: 0,
            
            // User input tracking
            userMoves: [],
            mistakes: [],
            hintsUsed: 0,
            
            // Visual state
            selectedCell: null,
            highlightedCells: [],
            conflictCells: [],
            
            // Game metadata
            gameId: this.generateGameId(),
            createdAt: Date.now(),
            lastModified: Date.now(),
            version: '1.0.0',
            
            // Statistics
            stats: {
                totalMoves: 0,
                correctMoves: 0,
                incorrectMoves: 0,
                averageTimePerMove: 0,
                fastestMove: null,
                slowestMove: null
            },
            
            // Settings
            settings: {
                showTimer: true,
                showMistakes: true,
                autoCheckConflicts: true,
                highlightRelated: true,
                showCandidates: false,
                soundEnabled: true,
                animationsEnabled: true
            }
        };
    }

    /**
     * Start a new game
     * @param {number[][]} puzzle - The puzzle grid
     * @param {number[][]} solution - The solution grid
     * @param {number} size - Grid size
     * @param {string} difficulty - Difficulty level
     * @returns {Object} New game state
     */
    startNewGame(puzzle, solution, size = 9, difficulty = 'medium') {
        try {
            const newState = {
                ...this.createInitialState(),
                puzzle: this.deepClone(puzzle),
                solution: this.deepClone(solution),
                currentGrid: this.deepClone(puzzle),
                size: size,
                difficulty: difficulty,
                isStarted: true,
                startTime: Date.now(),
                gameId: this.generateGameId()
            };

            this.setState(newState, 'start_new_game');
            this.startTimer();
            this.resetHistory();
            
            this.emit('gameStarted', {
                gameId: newState.gameId,
                size: size,
                difficulty: difficulty
            });

            return this.state;

        } catch (error) {
            throw new Error(`Failed to start new game: ${error.message}`);
        }
    }

    /**
     * Make a move on the board
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} value - Value to place (0 for empty)
     * @returns {Object} Updated state with move result
     */
    makeMove(row, col, value) {
        try {
            if (!this.state.isStarted || this.state.isComplete) {
                throw new Error('Game is not in progress');
            }

            const moveStartTime = Date.now();
            const newGrid = this.deepClone(this.state.currentGrid);
            const previousValue = newGrid[row][col];
            
            // Validate move bounds
            if (row < 0 || row >= this.state.size || col < 0 || col >= this.state.size) {
                throw new Error('Invalid cell position');
            }

            // Check if cell is pre-filled (from original puzzle)
            if (this.state.puzzle[row][col] !== 0) {
                throw new Error('Cannot modify pre-filled cell');
            }

            // Make the move
            newGrid[row][col] = value;
            
            // Create move record
            const move = {
                id: this.generateMoveId(),
                timestamp: moveStartTime,
                position: [row, col],
                value: value,
                previousValue: previousValue,
                isCorrect: value === 0 || value === this.state.solution[row][col],
                timeFromStart: moveStartTime - this.state.startTime,
                timeFromLastMove: this.state.userMoves.length > 0 ? 
                    moveStartTime - this.state.userMoves[this.state.userMoves.length - 1].timestamp : 0
            };

            // Update statistics
            const newStats = this.updateStatistics(this.state.stats, move);
            
            // Check for mistakes
            const newMistakes = [...this.state.mistakes];
            if (!move.isCorrect && value !== 0) {
                newMistakes.push({
                    id: this.generateMoveId(),
                    timestamp: moveStartTime,
                    position: [row, col],
                    value: value,
                    correctValue: this.state.solution[row][col]
                });
            }

            // Check if game is complete
            const isComplete = this.checkGameCompletion(newGrid);
            
            const newState = {
                ...this.state,
                currentGrid: newGrid,
                userMoves: [...this.state.userMoves, move],
                mistakes: newMistakes,
                stats: newStats,
                isComplete: isComplete,
                endTime: isComplete ? Date.now() : null,
                elapsedTime: this.getElapsedTime(),
                lastModified: Date.now()
            };

            this.setState(newState, 'make_move', { move });

            // Handle game completion
            if (isComplete) {
                this.handleGameCompletion();
            }

            this.emit('moveMade', { move, state: newState });
            
            return {
                success: true,
                move: move,
                isComplete: isComplete,
                state: newState
            };

        } catch (error) {
            this.emit('moveError', { error: error.message, position: [row, col], value });
            return {
                success: false,
                error: error.message,
                state: this.state
            };
        }
    }

    /**
     * Undo last move
     * @returns {Object} Previous state or error
     */
    undo() {
        try {
            if (this.historyIndex <= 0) {
                return {
                    success: false,
                    error: 'No moves to undo',
                    state: this.state
                };
            }

            this.historyIndex--;
            const previousState = this.deepClone(this.history[this.historyIndex].state);
            
            // Update timing to account for undo
            previousState.elapsedTime = this.getElapsedTime();
            previousState.lastModified = Date.now();
            
            this.state = previousState;
            
            this.emit('undoPerformed', { state: this.state });
            
            return {
                success: true,
                state: this.state
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                state: this.state
            };
        }
    }

    /**
     * Redo last undone move
     * @returns {Object} Next state or error
     */
    redo() {
        try {
            if (this.historyIndex >= this.history.length - 1) {
                return {
                    success: false,
                    error: 'No moves to redo',
                    state: this.state
                };
            }

            this.historyIndex++;
            const nextState = this.deepClone(this.history[this.historyIndex].state);
            
            // Update timing to account for redo
            nextState.elapsedTime = this.getElapsedTime();
            nextState.lastModified = Date.now();
            
            this.state = nextState;
            
            this.emit('redoPerformed', { state: this.state });
            
            return {
                success: true,
                state: this.state
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                state: this.state
            };
        }
    }

    /**
     * Use a hint
     * @param {Object} hint - Hint information
     * @returns {Object} Updated state
     */
    useHint(hint) {
        try {
            const newState = {
                ...this.state,
                hintsUsed: this.state.hintsUsed + 1,
                lastModified: Date.now()
            };

            // If hint provides a specific move, apply it
            if (hint.type === 'solution' && hint.targetCell && hint.value) {
                const [row, col] = hint.targetCell;
                const moveResult = this.makeMove(row, col, hint.value);
                
                if (moveResult.success) {
                    // Mark this move as hint-assisted
                    const lastMove = newState.userMoves[newState.userMoves.length - 1];
                    lastMove.isHintAssisted = true;
                    lastMove.hintType = hint.technique || 'unknown';
                }
            } else {
                this.setState(newState, 'use_hint', { hint });
            }

            this.emit('hintUsed', { hint, state: newState });
            
            return {
                success: true,
                hint: hint,
                state: newState
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                state: this.state
            };
        }
    }

    /**
     * Pause/Resume game
     */
    pauseGame() {
        if (!this.state.isStarted || this.state.isComplete) {
            return { success: false, error: 'Game is not in progress' };
        }

        const newState = {
            ...this.state,
            isPaused: true,
            lastModified: Date.now()
        };

        this.pauseTimer();
        this.setState(newState, 'pause_game');
        this.emit('gamePaused', { state: newState });

        return { success: true, state: newState };
    }

    resumeGame() {
        if (!this.state.isPaused) {
            return { success: false, error: 'Game is not paused' };
        }

        const newState = {
            ...this.state,
            isPaused: false,
            lastModified: Date.now()
        };

        this.resumeTimer();
        this.setState(newState, 'resume_game');
        this.emit('gameResumed', { state: newState });

        return { success: true, state: newState };
    }

    /**
     * Timer management
     */
    startTimer() {
        if (this.timer.interval) {
            clearInterval(this.timer.interval);
        }

        this.timer.startTime = Date.now();
        this.timer.totalPaused = 0;
        this.timer.isRunning = true;

        this.timer.interval = setInterval(() => {
            if (!this.state.isPaused && this.state.isStarted && !this.state.isComplete) {
                this.emit('timerTick', {
                    elapsedTime: this.getElapsedTime(),
                    formattedTime: this.formatTime(this.getElapsedTime())
                });
            }
        }, 1000);
    }

    pauseTimer() {
        if (this.timer.isRunning) {
            this.timer.pausedTime = Date.now();
            this.timer.isRunning = false;
        }
    }

    resumeTimer() {
        if (!this.timer.isRunning && this.timer.pausedTime) {
            this.timer.totalPaused += Date.now() - this.timer.pausedTime;
            this.timer.pausedTime = 0;
            this.timer.isRunning = true;
        }
    }

    stopTimer() {
        if (this.timer.interval) {
            clearInterval(this.timer.interval);
            this.timer.interval = null;
        }
        this.timer.isRunning = false;
    }

    getElapsedTime() {
        if (!this.timer.startTime) return 0;
        
        const now = Date.now();
        const pausedTime = this.timer.isRunning ? 
            this.timer.totalPaused : 
            this.timer.totalPaused + (now - (this.timer.pausedTime || now));
            
        return now - this.timer.startTime - pausedTime;
    }

    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        const formatNumber = (num) => num.toString().padStart(2, '0');

        if (hours > 0) {
            return `${hours}:${formatNumber(minutes % 60)}:${formatNumber(seconds % 60)}`;
        } else {
            return `${minutes}:${formatNumber(seconds % 60)}`;
        }
    }

    /**
     * Save/Load functionality
     */
    async saveGame() {
        try {
            const saveData = {
                state: this.state,
                history: this.history.slice(Math.max(0, this.history.length - 50)), // Keep last 50 states
                historyIndex: Math.min(this.historyIndex, 49),
                timer: {
                    totalPaused: this.timer.totalPaused,
                    startTime: this.timer.startTime
                },
                savedAt: Date.now()
            };

            // Save to localStorage
            localStorage.setItem(this.storageKeys.gameState, JSON.stringify(saveData));
            
            // Update last save time
            this.autoSave.lastSave = Date.now();
            
            this.emit('gameSaved', { saveData });
            
            return { success: true, savedAt: saveData.savedAt };

        } catch (error) {
            this.emit('saveError', { error: error.message });
            return { success: false, error: error.message };
        }
    }

    async loadGame() {
        try {
            const savedData = localStorage.getItem(this.storageKeys.gameState);
            
            if (!savedData) {
                return { success: false, error: 'No saved game found' };
            }

            const parsedData = JSON.parse(savedData);
            
            // Restore state
            this.state = parsedData.state;
            this.history = parsedData.history || [];
            this.historyIndex = parsedData.historyIndex || -1;
            
            // Restore timer
            if (parsedData.timer) {
                this.timer.startTime = parsedData.timer.startTime;
                this.timer.totalPaused = parsedData.timer.totalPaused || 0;
            }

            // Resume timer if game was in progress
            if (this.state.isStarted && !this.state.isComplete && !this.state.isPaused) {
                this.startTimer();
            }

            this.emit('gameLoaded', { state: this.state, loadedAt: Date.now() });
            
            return { 
                success: true, 
                state: this.state,
                savedAt: parsedData.savedAt
            };

        } catch (error) {
            this.emit('loadError', { error: error.message });
            return { success: false, error: error.message };
        }
    }

    /**
     * State management helpers
     */
    setState(newState, action, metadata = {}) {
        const historyEntry = {
            state: this.deepClone(this.state),
            action: action,
            metadata: metadata,
            timestamp: Date.now()
        };

        // Add to history
        this.addToHistory(historyEntry);
        
        // Update current state
        this.state = newState;
        
        // Throttled auto-save
        this.throttledSave();
        
        this.emit('stateChanged', { 
            newState: this.state, 
            action: action, 
            metadata: metadata 
        });
    }

    addToHistory(entry) {
        // Remove future history if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        // Add new entry
        this.history.push(entry);
        this.historyIndex++;

        // Trim history if too large
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    resetHistory() {
        this.history = [];
        this.historyIndex = -1;
    }

    /**
     * Game completion and statistics
     */
    checkGameCompletion(grid) {
        // Check if all cells are filled
        for (let row = 0; row < this.state.size; row++) {
            for (let col = 0; col < this.state.size; col++) {
                if (grid[row][col] === 0) {
                    return false;
                }
            }
        }

        // Check if solution is correct
        for (let row = 0; row < this.state.size; row++) {
            for (let col = 0; col < this.state.size; col++) {
                if (grid[row][col] !== this.state.solution[row][col]) {
                    return false;
                }
            }
        }

        return true;
    }

    handleGameCompletion() {
        this.stopTimer();
        
        const completionData = {
            gameId: this.state.gameId,
            completedAt: Date.now(),
            elapsedTime: this.getElapsedTime(),
            totalMoves: this.state.userMoves.length,
            mistakes: this.state.mistakes.length,
            hintsUsed: this.state.hintsUsed,
            difficulty: this.state.difficulty,
            size: this.state.size,
            score: this.calculateScore()
        };

        this.saveStatistics(completionData);
        this.emit('gameCompleted', completionData);
    }

    calculateScore() {
        const baseScore = 1000;
        const timeBonus = Math.max(0, 5000 - Math.floor(this.getElapsedTime() / 1000));
        const mistakePenalty = this.state.mistakes.length * 50;
        const hintPenalty = this.state.hintsUsed * 25;
        
        return Math.max(0, baseScore + timeBonus - mistakePenalty - hintPenalty);
    }

    updateStatistics(currentStats, move) {
        const newStats = { ...currentStats };
        
        newStats.totalMoves++;
        
        if (move.isCorrect) {
            newStats.correctMoves++;
        } else {
            newStats.incorrectMoves++;
        }

        // Update timing statistics
        if (move.timeFromLastMove > 0) {
            if (!newStats.fastestMove || move.timeFromLastMove < newStats.fastestMove) {
                newStats.fastestMove = move.timeFromLastMove;
            }
            
            if (!newStats.slowestMove || move.timeFromLastMove > newStats.slowestMove) {
                newStats.slowestMove = move.timeFromLastMove;
            }
            
            newStats.averageTimePerMove = 
                (newStats.averageTimePerMove * (newStats.totalMoves - 1) + move.timeFromLastMove) / 
                newStats.totalMoves;
        }

        return newStats;
    }

    saveStatistics(completionData) {
        try {
            const existingStats = JSON.parse(
                localStorage.getItem(this.storageKeys.statistics) || '[]'
            );
            
            existingStats.push(completionData);
            
            // Keep only last 100 games
            if (existingStats.length > 100) {
                existingStats.splice(0, existingStats.length - 100);
            }
            
            localStorage.setItem(this.storageKeys.statistics, JSON.stringify(existingStats));
            
        } catch (error) {
            console.error('Failed to save statistics:', error);
        }
    }

    /**
     * Auto-save functionality
     */
    initializeAutoSave() {
        if (this.autoSave.enabled) {
            this.autoSave.intervalId = setInterval(() => {
                if (this.state.isStarted && !this.state.isComplete) {
                    this.saveGame();
                }
            }, this.autoSave.interval);
        }
    }

    throttledSave() {
        if (this.saveThrottle) {
            clearTimeout(this.saveThrottle);
        }
        
        this.saveThrottle = setTimeout(() => {
            if (this.autoSave.enabled) {
                this.saveGame();
            }
        }, this.saveDebounceTime);
    }

    /**
     * Event system
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Utility methods
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
        
        return obj;
    }

    generateGameId() {
        return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateMoveId() {
        return `move_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Public API methods
     */
    getState() {
        return this.deepClone(this.state);
    }

    getHistory() {
        return this.history.map(entry => ({
            action: entry.action,
            timestamp: entry.timestamp,
            metadata: entry.metadata
        }));
    }

    canUndo() {
        return this.historyIndex > 0;
    }

    canRedo() {
        return this.historyIndex < this.history.length - 1;
    }

    getPerformanceStats() {
        return {
            historySize: this.history.length,
            cacheSize: this.stateCache.size,
            autoSaveEnabled: this.autoSave.enabled,
            lastSave: this.autoSave.lastSave
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopTimer();
        
        if (this.autoSave.intervalId) {
            clearInterval(this.autoSave.intervalId);
        }
        
        if (this.saveThrottle) {
            clearTimeout(this.saveThrottle);
        }
        
        this.listeners.clear();
        this.stateCache.clear();
        this.history = [];
        this.state = null;
    }
}

export default GameStateManager;