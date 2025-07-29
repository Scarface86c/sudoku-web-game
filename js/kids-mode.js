// SuperSudoku Kids Mode
// Color and symbol-based Sudoku for children

class SuperSudokuKidsMode {
    constructor() {
        this.colors = {
            4: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
            6: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
            9: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#FFA07A', '#87CEEB'],
            16: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#FFA07A', 
                 '#87CEEB', '#F0E68C', '#FFB6C1', '#98FB98', '#DEB887', '#CD853F', '#DA70D6', '#40E0D0']
        };

        this.symbols = {
            4: ['🐱', '🐶', '🐸', '🦋'],
            6: ['🐱', '🐶', '🐸', '🦋', '🌸', '⭐'],
            9: ['🐱', '🐶', '🐸', '🦋', '🌸', '⭐', '🍎', '🎈', '🌺'],
            16: ['🐱', '🐶', '🐸', '🦋', '🌸', '⭐', '🍎', '🎈', '🌺', '🚗', '🏠', '🎵', '☀️', '🌙', '🎯', '🎨']
        };

        this.shapes = {
            4: ['●', '▲', '■', '♦'],
            6: ['●', '▲', '■', '♦', '★', '♥'],
            9: ['●', '▲', '■', '♦', '★', '♥', '♠', '♣', '◆'],
            16: ['●', '▲', '■', '♦', '★', '♥', '♠', '♣', '◆', '▼', '◀', '▶', '▽', '△', '□', '○']
        };

        this.currentMode = 'classic';
        this.currentTheme = 'colors';
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Listen for game mode changes
        const gameModeSelect = document.getElementById('game-mode-select');
        if (gameModeSelect) {
            gameModeSelect.addEventListener('change', (e) => {
                this.setGameMode(e.target.value);
            });
        }
    }

    setGameMode(mode) {
        this.currentMode = mode;
        const gameBoard = document.querySelector('.game-board');
        
        // Update CSS classes for different modes
        gameBoard.classList.remove('mode-classic', 'mode-kids', 'mode-symbols');
        gameBoard.classList.add(`mode-${mode}`);

        // Update number buttons based on mode
        this.updateNumberButtons();

        // Trigger game restart with new mode
        const newGameEvent = new CustomEvent('newGameRequested', {
            detail: { gameMode: mode }
        });
        document.dispatchEvent(newGameEvent);
    }

    updateNumberButtons() {
        const numberButtons = document.querySelector('.number-buttons');
        if (!numberButtons) return;

        const gridSize = parseInt(document.getElementById('grid-size-select').value);
        
        // Clear existing buttons
        numberButtons.innerHTML = '';

        if (this.currentMode === 'classic') {
            this.createClassicButtons(numberButtons, gridSize);
        } else if (this.currentMode === 'kids') {
            this.createKidsButtons(numberButtons, gridSize);
        } else if (this.currentMode === 'symbols') {
            this.createSymbolButtons(numberButtons, gridSize);
        }
    }

    createClassicButtons(container, gridSize) {
        // Create rows for better layout (Issue #2 fix)
        const numberRow = document.createElement('div');
        numberRow.className = 'number-row';
        
        if (gridSize <= 9) {
            // Single row for 4x4, 6x6, 9x9
            for (let i = 1; i <= gridSize; i++) {
                const button = this.createNumberButton(i.toString(), i);
                numberRow.appendChild(button);
            }
            container.appendChild(numberRow);
        } else if (gridSize === 16) {
            // Two rows for 16x16: numbers 1-9 and A-G
            for (let i = 1; i <= 9; i++) {
                const button = this.createNumberButton(i.toString(), i);
                numberRow.appendChild(button);
            }
            container.appendChild(numberRow);

            const letterRow = document.createElement('div');
            letterRow.className = 'number-row';
            for (let i = 10; i <= 16; i++) {
                const letter = String.fromCharCode(65 + (i - 10)); // A, B, C, D, E, F, G
                const button = this.createNumberButton(letter, i);
                letterRow.appendChild(button);
            }
            container.appendChild(letterRow);
        }
    }

    createKidsButtons(container, gridSize) {
        const colors = this.colors[gridSize];
        const colorRow = document.createElement('div');
        colorRow.className = 'color-row';

        colors.forEach((color, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'number-btn color-btn';
            button.dataset.value = index + 1;
            button.style.backgroundColor = color;
            button.style.border = `3px solid ${this.darkenColor(color, 20)}`;
            button.setAttribute('aria-label', `Color ${index + 1}`);

            button.addEventListener('click', () => {
                this.selectValue(index + 1, color);
            });

            colorRow.appendChild(button);
        });

        container.appendChild(colorRow);
    }

    createSymbolButtons(container, gridSize) {
        const symbols = this.symbols[gridSize];
        const symbolRow = document.createElement('div');
        symbolRow.className = 'symbol-row';

        symbols.forEach((symbol, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'number-btn symbol-btn';
            button.dataset.value = index + 1;
            button.textContent = symbol;
            button.setAttribute('aria-label', `Symbol ${symbol}`);

            button.addEventListener('click', () => {
                this.selectValue(index + 1, symbol);
            });

            symbolRow.appendChild(button);
        });

        container.appendChild(symbolRow);
    }

    createNumberButton(display, value) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'number-btn';
        button.dataset.value = value;
        button.textContent = display;
        button.setAttribute('aria-label', `Number ${display}`);

        button.addEventListener('click', () => {
            this.selectValue(value, display);
        });

        return button;
    }

    selectValue(value, display) {
        // Trigger value selection event
        const selectEvent = new CustomEvent('numberSelected', {
            detail: { 
                value: value, 
                display: display,
                mode: this.currentMode
            }
        });
        document.dispatchEvent(selectEvent);

        // Update button selection state
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        const selectedBtn = document.querySelector(`[data-value="${value}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }
    }

    getCellDisplay(value, gridSize) {
        if (!value || value === 0) return '';

        switch (this.currentMode) {
            case 'kids':
                return this.getCellColorDisplay(value, gridSize);
            case 'symbols':
                return this.symbols[gridSize][value - 1] || value;
            default:
                return value <= 9 ? value.toString() : String.fromCharCode(65 + (value - 10));
        }
    }

    getCellColorDisplay(value, gridSize) {
        const color = this.colors[gridSize][value - 1];
        return `<div class="color-cell" style="background-color: ${color}; border: 2px solid ${this.darkenColor(color, 30)};">
                </div>`;
    }

    applyCellStyle(cell, value, gridSize) {
        if (this.currentMode === 'kids' && value) {
            const color = this.colors[gridSize][value - 1];
            cell.style.backgroundColor = this.lightenColor(color, 80);
            cell.style.borderColor = color;
            cell.classList.add('color-mode-cell');
        } else {
            cell.style.backgroundColor = '';
            cell.style.borderColor = '';
            cell.classList.remove('color-mode-cell');
        }
    }

    getHintDisplay(possibleValues, gridSize) {
        if (this.currentMode === 'kids') {
            return possibleValues.map(value => {
                const color = this.colors[gridSize][value - 1];
                return `<span class="hint-color" style="background-color: ${color}"></span>`;
            }).join('');
        } else if (this.currentMode === 'symbols') {
            return possibleValues.map(value => 
                `<span class="hint-symbol">${this.symbols[gridSize][value - 1]}</span>`
            ).join('');
        } else {
            return possibleValues.map(value => 
                value <= 9 ? value : String.fromCharCode(65 + (value - 10))
            ).join(' ');
        }
    }

    // Helper functions for color manipulation
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R) * 0x10000 +
            (G > 255 ? 255 : G) * 0x100 +
            (B > 255 ? 255 : B)).toString(16).slice(1);
    }

    // Game mode utilities
    isKidsMode() {
        return this.currentMode === 'kids';
    }

    isSymbolMode() {
        return this.currentMode === 'symbols';
    }

    isClassicMode() {
        return this.currentMode === 'classic';
    }

    getCurrentMode() {
        return this.currentMode;
    }

    // Generate kid-friendly congratulations
    getKidsCompletionMessage() {
        const messages = [
            "🎉 Fantastic job! You're a Sudoku superstar!",
            "🌟 Wow! You solved it perfectly!",
            "🎈 Amazing work! You're getting better and better!",
            "🎯 Excellent! You're a puzzle master!",
            "🏆 Incredible! You should be proud!",
            "⭐ Wonderful! You're so smart!",
            "🎪 Spectacular! That was awesome!",
            "🎨 Beautiful work! You did great!"
        ];
        
        return messages[Math.floor(Math.random() * messages.length)];
    }

    // Difficulty suggestions for kids mode
    getKidsDifficultySettings() {
        return {
            4: {
                easy: { cellsToRemove: 4, name: "Learning" },
                medium: { cellsToRemove: 6, name: "Fun" },
                hard: { cellsToRemove: 8, name: "Challenge" }
            },
            6: {
                easy: { cellsToRemove: 8, name: "Learning" },
                medium: { cellsToRemove: 12, name: "Fun" },
                hard: { cellsToRemove: 16, name: "Challenge" }
            },
            9: {
                easy: { cellsToRemove: 25, name: "Learning" },
                medium: { cellsToRemove: 35, name: "Fun" },
                hard: { cellsToRemove: 45, name: "Challenge" }
            }
        };
    }

    // Update difficulty options based on kids mode
    updateDifficultyOptions() {
        const difficultySelect = document.getElementById('difficulty-select');
        const gridSize = parseInt(document.getElementById('grid-size-select').value);
        
        if (this.currentMode === 'kids') {
            const kidsDifficulties = this.getKidsDifficultySettings()[gridSize];
            if (kidsDifficulties) {
                difficultySelect.innerHTML = '';
                Object.entries(kidsDifficulties).forEach(([key, value]) => {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = value.name;
                    difficultySelect.appendChild(option);
                });
                
                // Remove hardcore option for kids
                difficultySelect.querySelector('[value="hardcore"]')?.remove();
            }
        } else {
            // Restore normal difficulty options
            difficultySelect.innerHTML = `
                <option value="easy">Easy</option>
                <option value="medium" selected>Medium</option>
                <option value="hard">Hard</option>
                <option value="hardcore">Hardcore</option>
            `;
        }
    }
}

// Global instance
window.SuperSudokuKidsMode = new SuperSudokuKidsMode();

console.log('SuperSudoku Kids Mode loaded successfully');