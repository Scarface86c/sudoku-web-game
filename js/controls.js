/**
 * Sudoku Game - Control Panel Management
 * Handles game settings, statistics, and user interactions
 */

class SudokuControls {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.statsHistory = this.loadStatsHistory();
        this.preferences = this.loadPreferences();
        
        this.init();
    }
    
    /**
     * Initialize controls
     */
    init() {
        this.setupStatsTracking();
        this.setupPreferences();
        this.setupAdvancedFeatures();
        this.setupAccessibilityFeatures();
        
        console.log('🎮 Sudoku Controls initialized');
    }
    
    /**
     * Load statistics from localStorage
     */
    loadStatsHistory() {
        try {
            const saved = localStorage.getItem('sudoku-stats');
            return saved ? JSON.parse(saved) : {
                gamesPlayed: 0,
                gamesCompleted: 0,
                totalTime: 0,
                bestTimes: {},
                streaks: { current: 0, best: 0 },
                hintsUsed: 0,
                totalErrors: 0
            };
        } catch (error) {
            console.error('Error loading stats:', error);
            return {};
        }
    }
    
    /**
     * Save statistics to localStorage
     */
    saveStatsHistory() {
        try {
            localStorage.setItem('sudoku-stats', JSON.stringify(this.statsHistory));
        } catch (error) {
            console.error('Error saving stats:', error);
        }
    }
    
    /**
     * Load user preferences
     */
    loadPreferences() {
        try {
            const saved = localStorage.getItem('sudoku-preferences');
            return saved ? JSON.parse(saved) : {
                showTimer: true,
                autoCheckErrors: true,
                highlightConflicts: true,
                soundEnabled: true,
                hapticFeedback: true,
                autoSave: true,
                keyboardShortcuts: true
            };
        } catch (error) {
            console.error('Error loading preferences:', error);
            return {};
        }
    }
    
    /**
     * Save user preferences
     */
    savePreferences() {
        try {
            localStorage.setItem('sudoku-preferences', JSON.stringify(this.preferences));
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }
    
    /**
     * Setup statistics tracking
     */
    setupStatsTracking() {
        // Track game start
        this.onGameStart = () => {
            this.statsHistory.gamesPlayed++;
            this.gameStartTime = Date.now();
            this.saveStatsHistory();
        };
        
        // Track game completion
        this.onGameComplete = (gameData) => {
            this.statsHistory.gamesCompleted++;
            this.statsHistory.totalTime += gameData.elapsedTime;
            this.statsHistory.hintsUsed += (3 - gameData.hintsRemaining);
            this.statsHistory.totalErrors += gameData.errorCount;
            
            // Update best times
            const key = `${gameData.gridSize}x${gameData.gridSize}-${gameData.difficulty}`;
            if (!this.statsHistory.bestTimes[key] || gameData.elapsedTime < this.statsHistory.bestTimes[key]) {
                this.statsHistory.bestTimes[key] = gameData.elapsedTime;
                this.showAchievement('New Best Time!', `${this.formatTime(gameData.elapsedTime)} for ${key}`);
            }
            
            // Update streaks
            this.statsHistory.streaks.current++;
            if (this.statsHistory.streaks.current > this.statsHistory.streaks.best) {
                this.statsHistory.streaks.best = this.statsHistory.streaks.current;
                this.showAchievement('New Best Streak!', `${this.statsHistory.streaks.best} games in a row`);
            }
            
            this.saveStatsHistory();
            this.updateStatsDisplay();
        };
        
        // Track game abandon
        this.onGameAbandon = () => {
            this.statsHistory.streaks.current = 0;
            this.saveStatsHistory();
        };
    }
    
    /**
     * Setup user preferences
     */
    setupPreferences() {
        this.createPreferencesPanel();
        this.applyPreferences();
    }
    
    /**
     * Create preferences panel
     */
    createPreferencesPanel() {
        const controlPanel = document.querySelector('.control-panel');
        
        // Add preferences section
        const prefsSection = document.createElement('div');
        prefsSection.className = 'preferences-section';
        prefsSection.innerHTML = `
            <h3 class="section-title">Preferences</h3>
            <div class="preferences-grid">
                <label class="preference-item">
                    <input type="checkbox" id="pref-timer" ${this.preferences.showTimer ? 'checked' : ''}>
                    <span class="preference-label">Show Timer</span>
                </label>
                
                <label class="preference-item">
                    <input type="checkbox" id="pref-auto-check" ${this.preferences.autoCheckErrors ? 'checked' : ''}>
                    <span class="preference-label">Auto Check Errors</span>
                </label>
                
                <label class="preference-item">
                    <input type="checkbox" id="pref-highlight" ${this.preferences.highlightConflicts ? 'checked' : ''}>
                    <span class="preference-label">Highlight Conflicts</span>
                </label>
                
                <label class="preference-item">
                    <input type="checkbox" id="pref-sound" ${this.preferences.soundEnabled ? 'checked' : ''}>
                    <span class="preference-label">Sound Effects</span>
                </label>
                
                <label class="preference-item">
                    <input type="checkbox" id="pref-haptic" ${this.preferences.hapticFeedback ? 'checked' : ''}>
                    <span class="preference-label">Haptic Feedback</span>
                </label>
                
                <label class="preference-item">
                    <input type="checkbox" id="pref-auto-save" ${this.preferences.autoSave ? 'checked' : ''}>
                    <span class="preference-label">Auto Save</span>
                </label>
            </div>
        `;
        
        controlPanel.appendChild(prefsSection);
        
        // Add event listeners
        prefsSection.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const prefKey = e.target.id.replace('pref-', '').replace('-', '_');
                const prefMap = {
                    'timer': 'showTimer',
                    'auto_check': 'autoCheckErrors',
                    'highlight': 'highlightConflicts',
                    'sound': 'soundEnabled',
                    'haptic': 'hapticFeedback',
                    'auto_save': 'autoSave'
                };
                
                this.preferences[prefMap[prefKey]] = e.target.checked;
                this.savePreferences();
                this.applyPreferences();
            }
        });
    }
    
    /**
     * Apply user preferences
     */
    applyPreferences() {
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.parentElement.style.display = this.preferences.showTimer ? 'flex' : 'none';
        }
        
        // Apply other preferences as needed
        document.body.setAttribute('data-auto-check', this.preferences.autoCheckErrors);
        document.body.setAttribute('data-highlight-conflicts', this.preferences.highlightConflicts);
        document.body.setAttribute('data-sound-enabled', this.preferences.soundEnabled);
        document.body.setAttribute('data-haptic-enabled', this.preferences.hapticFeedback);
    }
    
    /**
     * Setup advanced features
     */
    setupAdvancedFeatures() {
        this.setupAutoSave();
        this.setupSoundEffects();
        this.setupHapticFeedback();
        this.setupKeyboardShortcuts();
    }
    
    /**
     * Setup auto-save functionality
     */
    setupAutoSave() {
        if (!this.preferences.autoSave) return;
        
        // Save game state periodically
        setInterval(() => {
            if (this.game && !this.game.isGameComplete && !this.game.isPaused) {
                this.saveGameState();
            }
        }, 30000); // Save every 30 seconds
        
        // Load saved game on startup
        this.loadGameState();
    }
    
    /**
     * Save current game state
     */
    saveGameState() {
        if (!this.game) return;
        
        const gameState = {
            gridSize: this.game.gridSize,
            difficulty: this.game.difficulty,
            gameBoard: this.game.gameBoard,
            solutionBoard: this.game.solutionBoard,
            elapsedTime: this.game.elapsedTime,
            errorCount: this.game.errorCount,
            hintsRemaining: this.game.hintsRemaining,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('sudoku-save', JSON.stringify(gameState));
        } catch (error) {
            console.error('Error saving game state:', error);
        }
    }
    
    /**
     * Load saved game state
     */
    loadGameState() {
        try {
            const saved = localStorage.getItem('sudoku-save');
            if (!saved) return;
            
            const gameState = JSON.parse(saved);
            
            // Check if save is recent (within 24 hours)
            if (Date.now() - gameState.timestamp > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('sudoku-save');
                return;
            }
            
            // Ask user if they want to resume
            if (confirm('Resume your previous game?')) {
                this.restoreGameState(gameState);
            } else {
                localStorage.removeItem('sudoku-save');
            }
        } catch (error) {
            console.error('Error loading game state:', error);
            localStorage.removeItem('sudoku-save');
        }
    }
    
    /**
     * Restore saved game state
     */
    restoreGameState(gameState) {
        if (!this.game) return;
        
        // Set game properties
        this.game.gridSize = gameState.gridSize;
        this.game.difficulty = gameState.difficulty;
        this.game.gameBoard = gameState.gameBoard;
        this.game.solutionBoard = gameState.solutionBoard;
        this.game.elapsedTime = gameState.elapsedTime;
        this.game.errorCount = gameState.errorCount;
        this.game.hintsRemaining = gameState.hintsRemaining;
        
        // Update UI
        document.getElementById('difficulty-select').value = gameState.difficulty;
        document.getElementById('grid-size-select').value = gameState.gridSize;
        
        this.game.updateGridSize();
        this.game.renderBoard();
        this.game.updateProgress();
        this.game.updateHintCount();
        this.game.updateErrorCount();
        this.game.startTimer();
        
        this.game.showMessage('Game resumed!', 'success');
    }
    
    /**
     * Setup sound effects
     */
    setupSoundEffects() {
        if (!this.preferences.soundEnabled) return;
        
        // Create audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Sound effect functions
        this.playSound = (frequency, duration, type = 'sine') => {
            if (!this.preferences.soundEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
        
        // Define sound effects
        this.sounds = {
            success: () => this.playSound(523.25, 0.2), // C5
            error: () => this.playSound(207.65, 0.3, 'square'), // G#3
            hint: () => this.playSound(659.25, 0.15), // E5
            complete: () => {
                // Victory fanfare
                setTimeout(() => this.playSound(523.25, 0.2), 0);
                setTimeout(() => this.playSound(659.25, 0.2), 200);
                setTimeout(() => this.playSound(783.99, 0.3), 400);
            }
        };
    }
    
    /**
     * Setup haptic feedback
     */
    setupHapticFeedback() {
        if (!this.preferences.hapticFeedback || !navigator.vibrate) return;
        
        this.haptic = {
            light: () => navigator.vibrate(50),
            medium: () => navigator.vibrate(100),
            heavy: () => navigator.vibrate(200),
            success: () => navigator.vibrate([50, 50, 100]),
            error: () => navigator.vibrate([100, 50, 100, 50, 100])
        };
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        if (!this.preferences.keyboardShortcuts) return;
        
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveGameState();
                        this.game.showMessage('Game saved!', 'success');
                        break;
                    case 'z':
                        e.preventDefault();
                        this.undoLastMove();
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redoLastMove();
                        break;
                }
            }
        });
    }
    
    /**
     * Setup accessibility features
     */
    setupAccessibilityFeatures() {
        this.setupScreenReaderSupport();
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
    }
    
    /**
     * Setup screen reader support
     */
    setupScreenReaderSupport() {
        // Add aria-live regions for game status
        const statusRegion = document.createElement('div');
        statusRegion.id = 'game-status-live';
        statusRegion.setAttribute('aria-live', 'polite');
        statusRegion.setAttribute('aria-atomic', 'true');
        statusRegion.className = 'sr-only';
        document.body.appendChild(statusRegion);
        
        // Update screen reader on game events
        this.announceToScreenReader = (message) => {
            statusRegion.textContent = message;
        };
    }
    
    /**
     * Setup keyboard navigation enhancements
     */
    setupKeyboardNavigation() {
        // Enhanced keyboard navigation for better accessibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                // Manage focus order
                this.manageFocusOrder(e);
            }
        });
    }
    
    /**
     * Setup focus management
     */
    setupFocusManagement() {
        // Focus management for modal dialogs
        const modal = document.getElementById('complete-modal');
        const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const focusable = modal.querySelectorAll(focusableElements);
                const firstFocusable = focusable[0];
                const lastFocusable = focusable[focusable.length - 1];
                
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }
    
    /**
     * Show achievement notification
     */
    showAchievement(title, description) {
        const achievement = document.createElement('div');
        achievement.className = 'achievement-notification';
        achievement.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <div class="achievement-content">
                <div class="achievement-title">${title}</div>
                <div class="achievement-description">${description}</div>
            </div>
        `;
        
        document.body.appendChild(achievement);
        
        // Animate in
        setTimeout(() => achievement.classList.add('show'), 100);
        
        // Remove after delay
        setTimeout(() => {
            achievement.classList.remove('show');
            setTimeout(() => achievement.remove(), 300);
        }, 4000);
        
        // Play sound and haptic feedback
        if (this.sounds && this.sounds.complete) {
            this.sounds.complete();
        }
        if (this.haptic && this.haptic.success) {
            this.haptic.success();
        }
    }
    
    /**
     * Format time for display
     */
    formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Update statistics display
     */
    updateStatsDisplay() {
        // This would update a statistics panel if implemented
        console.log('Statistics updated:', this.statsHistory);
    }
    
    /**
     * Provide feedback based on user action
     */
    provideFeedback(action, data = {}) {
        switch (action) {
            case 'correct-move':
                if (this.sounds) this.sounds.success();
                if (this.haptic) this.haptic.light();
                break;
                
            case 'incorrect-move':
                if (this.sounds) this.sounds.error();
                if (this.haptic) this.haptic.error();
                break;
                
            case 'hint-used':
                if (this.sounds) this.sounds.hint();
                if (this.haptic) this.haptic.medium();
                break;
                
            case 'game-complete':
                if (this.sounds) this.sounds.complete();
                if (this.haptic) this.haptic.success();
                this.onGameComplete(data);
                break;
                
            case 'game-start':
                this.onGameStart();
                break;
        }
    }
    
    /**
     * Get user statistics
     */
    getStatistics() {
        return {
            ...this.statsHistory,
            winRate: this.statsHistory.gamesPlayed > 0 ? 
                (this.statsHistory.gamesCompleted / this.statsHistory.gamesPlayed * 100).toFixed(1) : 0,
            averageTime: this.statsHistory.gamesCompleted > 0 ? 
                Math.round(this.statsHistory.totalTime / this.statsHistory.gamesCompleted) : 0
        };
    }
    
    /**
     * Reset statistics
     */
    resetStatistics() {
        if (confirm('Are you sure you want to reset all statistics?')) {
            this.statsHistory = {
                gamesPlayed: 0,
                gamesCompleted: 0,
                totalTime: 0,
                bestTimes: {},
                streaks: { current: 0, best: 0 },
                hintsUsed: 0,
                totalErrors: 0
            };
            this.saveStatsHistory();
            this.updateStatsDisplay();
            this.game.showMessage('Statistics reset!', 'info');
        }
    }
}

// Export for use with main game
window.SudokuControls = SudokuControls;