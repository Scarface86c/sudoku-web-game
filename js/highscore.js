// SuperSudoku Highscore System
// Manages player registration, scoring, and leaderboards

class SuperSudokuHighscore {
    constructor() {
        this.db = window.SuperSudokuDB;
        this.currentPlayer = null;
        this.initializePlayer();
        this.createHighscoreModal();
    }

    initializePlayer() {
        // Try to get stored player
        const storedPlayerId = localStorage.getItem('SuperSudoku_currentPlayer');
        if (storedPlayerId) {
            this.currentPlayer = this.db.getPlayer(storedPlayerId);
        }

        // If no player found, prompt for registration
        if (!this.currentPlayer) {
            this.showPlayerRegistration();
        }
    }

    showPlayerRegistration() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">🎯 Welcome to SuperSudoku!</h2>
                </div>
                <div class="modal-body">
                    <p>Enter your name to start playing and track your progress:</p>
                    <div class="player-registration">
                        <div class="form-group">
                            <label for="player-name">Player Name:</label>
                            <input type="text" id="player-name" placeholder="Enter your name" maxlength="20" required>
                        </div>
                        <div class="form-group">
                            <label for="player-email">Email (optional):</label>
                            <input type="email" id="player-email" placeholder="your@email.com">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" id="register-player">Start Playing</button>
                    <button type="button" class="btn btn-outline" id="play-guest">Play as Guest</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event handlers
        const nameInput = modal.querySelector('#player-name');
        const emailInput = modal.querySelector('#player-email');
        const registerBtn = modal.querySelector('#register-player');
        const guestBtn = modal.querySelector('#play-guest');

        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') registerBtn.click();
        });

        registerBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (name.length < 2) {
                this.showMessage('Please enter a name with at least 2 characters', 'error');
                return;
            }

            // Check if player already exists
            const existingPlayer = this.db.getPlayerByName(name);
            if (existingPlayer) {
                this.currentPlayer = existingPlayer;
                localStorage.setItem('SuperSudoku_currentPlayer', existingPlayer.id);
                this.showMessage(`Welcome back, ${name}!`, 'success');
            } else {
                // Create new player
                const playerId = this.db.createPlayer(name, emailInput.value.trim());
                this.currentPlayer = this.db.getPlayer(playerId);
                localStorage.setItem('SuperSudoku_currentPlayer', playerId);
                this.showMessage(`Welcome to SuperSudoku, ${name}!`, 'success');
            }

            this.updatePlayerDisplay();
            document.body.removeChild(modal);
        });

        guestBtn.addEventListener('click', () => {
            // Create guest player
            const guestName = 'Guest_' + Date.now().toString().slice(-6);
            const playerId = this.db.createPlayer(guestName);
            this.currentPlayer = this.db.getPlayer(playerId);
            localStorage.setItem('SuperSudoku_currentPlayer', playerId);
            this.updatePlayerDisplay();
            document.body.removeChild(modal);
        });

        // Focus on name input
        setTimeout(() => nameInput.focus(), 100);
    }

    createHighscoreModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'highscore-modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2 class="modal-title">🏆 SuperSudoku Highscores</h2>
                    <button type="button" class="modal-close" aria-label="Close dialog">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="highscore-tabs">
                        <button class="tab-btn active" data-tab="overall">Overall</button>
                        <button class="tab-btn" data-tab="classic">Classic</button>
                        <button class="tab-btn" data-tab="kids">Kids Mode</button>
                        <button class="tab-btn" data-tab="symbols">Symbols</button>
                        <button class="tab-btn" data-tab="personal">My Scores</button>
                    </div>
                    
                    <div class="highscore-filters">
                        <select id="score-grid-filter">
                            <option value="">All Grid Sizes</option>
                            <option value="4">4×4</option>
                            <option value="6">6×6</option>
                            <option value="9">9×9</option>
                            <option value="16">16×16</option>
                        </select>
                        <select id="score-difficulty-filter">
                            <option value="">All Difficulties</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                            <option value="hardcore">Hardcore</option>
                        </select>
                    </div>
                    
                    <div class="highscore-content" id="highscore-content">
                        <!-- Content will be populated dynamically -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" id="export-scores">Export Data</button>
                    <button type="button" class="btn btn-outline" id="clear-scores">Clear All Data</button>
                    <button type="button" class="btn btn-secondary" id="change-player">Change Player</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event handlers
        this.setupHighscoreEvents(modal);
    }

    setupHighscoreEvents(modal) {
        const closeBtn = modal.querySelector('.modal-close');
        const tabBtns = modal.querySelectorAll('.tab-btn');
        const gridFilter = modal.querySelector('#score-grid-filter');
        const difficultyFilter = modal.querySelector('#score-difficulty-filter');
        const exportBtn = modal.querySelector('#export-scores');
        const clearBtn = modal.querySelector('#clear-scores');
        const changePlayerBtn = modal.querySelector('#change-player');

        closeBtn.addEventListener('click', () => this.hideHighscores());
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateHighscoreDisplay(btn.dataset.tab);
            });
        });

        gridFilter.addEventListener('change', () => this.updateHighscoreDisplay());
        difficultyFilter.addEventListener('change', () => this.updateHighscoreDisplay());

        exportBtn.addEventListener('click', () => this.exportScores());
        clearBtn.addEventListener('click', () => this.clearAllData());
        changePlayerBtn.addEventListener('click', () => this.changePlayer());

        // Close modal on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideHighscores();
        });
    }

    showHighscores() {
        const modal = document.getElementById('highscore-modal');
        modal.classList.add('active');
        this.updateHighscoreDisplay('overall');
    }

    hideHighscores() {
        const modal = document.getElementById('highscore-modal');
        modal.classList.remove('active');
    }

    updateHighscoreDisplay(tab = null) {
        const activeTab = tab || document.querySelector('.tab-btn.active').dataset.tab;
        const gridFilter = document.getElementById('score-grid-filter').value;
        const difficultyFilter = document.getElementById('score-difficulty-filter').value;
        const content = document.getElementById('highscore-content');

        let scores = [];
        
        switch (activeTab) {
            case 'overall':
                scores = this.db.getHighScores(null, gridFilter || null, difficultyFilter || null, 20);
                break;
            case 'classic':
                scores = this.db.getHighScores('classic', gridFilter || null, difficultyFilter || null, 20);
                break;
            case 'kids':
                scores = this.db.getHighScores('kids', gridFilter || null, difficultyFilter || null, 20);
                break;
            case 'symbols':
                scores = this.db.getHighScores('symbols', gridFilter || null, difficultyFilter || null, 20);
                break;
            case 'personal':
                scores = this.db.getPlayerScores(this.currentPlayer?.id, 20);
                break;
        }

        content.innerHTML = this.renderScoreTable(scores, activeTab === 'personal');
    }

    renderScoreTable(scores, isPersonal = false) {
        if (scores.length === 0) {
            return `
                <div class="no-scores">
                    <div class="no-scores-icon">🎯</div>
                    <h3>No scores yet!</h3>
                    <p>Start playing to see your achievements here.</p>
                </div>
            `;
        }

        const headers = isPersonal ? 
            ['Rank', 'Mode', 'Grid', 'Difficulty', 'Time', 'Score', 'Date'] :
            ['Rank', 'Player', 'Mode', 'Grid', 'Difficulty', 'Time', 'Score'];

        let table = `
            <table class="score-table">
                <thead>
                    <tr>
                        ${headers.map(header => `<th>${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;

        scores.forEach((score, index) => {
            const rank = index + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
            const time = this.formatTime(score.time);
            const date = isPersonal ? this.formatDate(score.date) : '';
            const mode = score.gameMode.charAt(0).toUpperCase() + score.gameMode.slice(1);
            
            table += `
                <tr class="${rankClass}">
                    <td class="rank-cell">${rankIcon}</td>
                    ${!isPersonal ? `<td class="player-cell">${score.playerName}</td>` : ''}
                    <td>${mode}</td>
                    <td>${score.gridSize}×${score.gridSize}</td>
                    <td class="difficulty-${score.difficulty}">${score.difficulty}</td>
                    <td class="time-cell">${time}</td>
                    <td class="score-cell">${score.score.toLocaleString()}</td>
                    ${isPersonal ? `<td class="date-cell">${date}</td>` : ''}
                </tr>
            `;
        });

        table += '</tbody></table>';
        return table;
    }

    saveGameScore(gameData) {
        if (!this.currentPlayer) return;

        const scoreData = {
            playerId: this.currentPlayer.id,
            playerName: this.currentPlayer.name,
            gameMode: gameData.gameMode || 'classic',
            gridSize: gameData.gridSize,
            difficulty: gameData.difficulty,
            time: gameData.time,
            hints: gameData.hints || 0,
            errors: gameData.errors || 0,
            completed: gameData.completed
        };

        // Save score to database
        this.db.saveScore(scoreData);

        // Update player statistics
        this.db.updatePlayerStats(this.currentPlayer.id, scoreData);
        this.db.updateStatistics(this.currentPlayer.id, scoreData);

        // Show achievement if it's a high score
        if (gameData.completed) {
            this.checkAchievements(scoreData);
        }
    }

    checkAchievements(scoreData) {
        const highScores = this.db.getHighScores(scoreData.gameMode, scoreData.gridSize, scoreData.difficulty, 10);
        const playerRank = highScores.findIndex(score => score.playerId === this.currentPlayer.id) + 1;

        if (playerRank > 0 && playerRank <= 3) {
            const medals = ['🥇', '🥈', '🥉'];
            const ordinals = ['1st', '2nd', '3rd'];
            
            this.showAchievement({
                title: `${medals[playerRank - 1]} ${ordinals[playerRank - 1]} Place!`,
                message: `You achieved ${ordinals[playerRank - 1]} place in ${scoreData.gridSize}×${scoreData.gridSize} ${scoreData.difficulty} mode!`,
                icon: medals[playerRank - 1]
            });
        }
    }

    showAchievement(achievement) {
        const achievementEl = document.createElement('div');
        achievementEl.className = 'achievement-popup';
        achievementEl.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-text">
                    <h3>${achievement.title}</h3>
                    <p>${achievement.message}</p>
                </div>
            </div>
        `;

        document.body.appendChild(achievementEl);

        // Animate in
        setTimeout(() => achievementEl.classList.add('show'), 100);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            achievementEl.classList.remove('show');
            setTimeout(() => document.body.removeChild(achievementEl), 300);
        }, 5000);
    }

    updatePlayerDisplay() {
        if (!this.currentPlayer) return;

        // Update header with player info
        const header = document.querySelector('.game-header .header-content');
        let playerInfo = header.querySelector('.player-info');
        
        if (!playerInfo) {
            playerInfo = document.createElement('div');
            playerInfo.className = 'player-info';
            header.appendChild(playerInfo);
        }

        const avatar = this.currentPlayer.avatar;
        playerInfo.innerHTML = `
            <div class="player-avatar" style="background-color: ${avatar.backgroundColor}">
                ${avatar.initials}
            </div>
            <span class="player-name">${this.currentPlayer.name}</span>
        `;
    }

    exportScores() {
        const data = this.db.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `SuperSudoku_Data_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showMessage('Data exported successfully!', 'success');
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear ALL game data? This cannot be undone!')) {
            this.db.clearAllData();
            this.currentPlayer = null;
            localStorage.removeItem('SuperSudoku_currentPlayer');
            this.showMessage('All data cleared successfully!', 'info');
            this.hideHighscores();
            this.showPlayerRegistration();
        }
    }

    changePlayer() {
        if (confirm('Switch to a different player? Your current session will be saved.')) {
            this.currentPlayer = null;
            localStorage.removeItem('SuperSudoku_currentPlayer');
            this.hideHighscores();
            this.showPlayerRegistration();
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString();
    }

    showMessage(message, type = 'info') {
        const messageEl = document.getElementById(`${type}-message`);
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.style.display = 'block';
            setTimeout(() => messageEl.style.display = 'none', 3000);
        }
    }

    getCurrentPlayer() {
        return this.currentPlayer;
    }

    getPlayerStats() {
        if (!this.currentPlayer) return null;

        return this.db.select('statistics', stat => stat.playerId === this.currentPlayer.id);
    }
}

// Global instance
window.SuperSudokuHighscore = new SuperSudokuHighscore();

console.log('SuperSudoku Highscore System loaded successfully');