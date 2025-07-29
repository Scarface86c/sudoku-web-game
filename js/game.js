/**
 * Sudoku Game - Main Game Logic
 * Modern, accessible, and responsive Sudoku implementation
 */

class SudokuGame {
    constructor() {
        this.gridSize = 9;
        this.difficulty = 'medium';
        this.gameBoard = [];
        this.solutionBoard = [];
        this.selectedCell = null;
        this.isNotesMode = false;
        this.isPaused = false;
        this.isGameComplete = false;
        this.startTime = null;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.hintsRemaining = 3;
        this.errorCount = 0;
        
        // DOM elements
        this.elements = {};
        
        // Game configuration
        this.config = {
            difficulties: {
                easy: { cellsToRemove: { 4: 6, 6: 12, 9: 35, 16: 100 } },
                medium: { cellsToRemove: { 4: 8, 6: 16, 9: 45, 16: 140 } },
                hard: { cellsToRemove: { 4: 10, 6: 20, 9: 55, 16: 180 } },
                hardcore: { cellsToRemove: { 4: 12, 6: 24, 9: 65, 16: 220 } }
            }
        };
        
        this.init();
    }
    
    /**
     * Initialize the game
     */
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupKeyboardControls();
        this.setupTouchControls();
        this.updateGridSize();
        this.generateNewGame();
        
        // Initialize theme
        this.initializeTheme();
        
        console.log('🎮 Sudoku Game initialized');
    }
    
    /**
     * Cache DOM elements for performance
     */
    cacheElements() {
        this.elements = {
            gameBoard: document.getElementById('game-board'),
            difficultySelect: document.getElementById('difficulty-select'),
            gridSizeSelect: document.getElementById('grid-size-select'),
            newGameBtn: document.getElementById('new-game-btn'),
            hintBtn: document.getElementById('hint-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            clearBtn: document.getElementById('clear-btn'),
            notesBtn: document.getElementById('notes-btn'),
            eraseBtn: document.getElementById('erase-btn'),
            timer: document.getElementById('timer'),
            progressFill: document.getElementById('progress-fill'),
            progressText: document.getElementById('progress-text'),
            errorCount: document.getElementById('error-count'),
            hintCount: document.getElementById('hint-count'),
            numberButtons: document.querySelector('.number-buttons'),
            successMessage: document.getElementById('success-message'),
            errorMessage: document.getElementById('error-message'),
            infoMessage: document.getElementById('info-message'),
            completeModal: document.getElementById('complete-modal'),
            loadingOverlay: document.getElementById('loading-overlay'),
            themeToggle: document.querySelector('.theme-toggle'),
            playAgainBtn: document.getElementById('play-again-btn'),
            shareBtn: document.getElementById('share-btn'),
            modalClose: document.querySelector('.modal-close')
        };
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Game controls
        this.elements.newGameBtn.addEventListener('click', () => this.generateNewGame());
        this.elements.hintBtn.addEventListener('click', () => this.giveHint());
        this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
        this.elements.clearBtn.addEventListener('click', () => this.clearBoard());
        this.elements.notesBtn.addEventListener('click', () => this.toggleNotesMode());
        this.elements.eraseBtn.addEventListener('click', () => this.eraseSelectedCell());
        
        // Settings
        this.elements.difficultySelect.addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.generateNewGame();
        });
        
        this.elements.gridSizeSelect.addEventListener('change', (e) => {
            this.gridSize = parseInt(e.target.value);
            this.updateGridSize();
            this.generateNewGame();
        });
        
        // Theme toggle
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Modal controls
        this.elements.playAgainBtn.addEventListener('click', () => {
            this.hideModal();
            this.generateNewGame();
        });
        
        this.elements.shareBtn.addEventListener('click', () => this.shareResult());
        this.elements.modalClose.addEventListener('click', () => this.hideModal());
        
        // Click outside modal to close
        this.elements.completeModal.addEventListener('click', (e) => {
            if (e.target === this.elements.completeModal) {
                this.hideModal();
            }
        });
        
        // Prevent context menu on game board
        this.elements.gameBoard.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    /**
     * Set up keyboard controls
     */
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (this.isPaused || this.isGameComplete) return;
            
            const key = e.key;
            
            // Number input (1-9, A-G for 16x16)
            if (/^[1-9]$/.test(key)) {
                const num = parseInt(key);
                if (num <= this.gridSize) {
                    this.inputNumber(num);
                }
            } else if (this.gridSize === 16 && /^[A-Ga-g]$/.test(key)) {
                const num = key.toUpperCase().charCodeAt(0) - 55; // A=10, B=11, etc.
                if (num <= 16) {
                    this.inputNumber(num);
                }
            }
            
            // Special keys
            switch (key) {
                case 'Backspace':
                case 'Delete':
                    e.preventDefault();
                    this.eraseSelectedCell();
                    break;
                case 'n':
                case 'N':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.generateNewGame();
                    } else {
                        this.toggleNotesMode();
                    }
                    break;
                case 'h':
                case 'H':
                    this.giveHint();
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePause();
                    break;
                case 'Escape':
                    if (this.elements.completeModal.classList.contains('show')) {
                        this.hideModal();
                    } else {
                        this.selectedCell = null;
                        this.updateCellHighlighting();
                    }
                    break;
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    e.preventDefault();
                    this.navigateGrid(key);
                    break;
            }
        });
    }
    
    /**
     * Set up touch controls for mobile
     */
    setupTouchControls() {
        let touchStartTime = 0;
        
        this.elements.gameBoard.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
        });
        
        this.elements.gameBoard.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            
            // Long press for notes mode (500ms)
            if (touchDuration > 500) {
                this.toggleNotesMode();
                this.showMessage('Notes mode ' + (this.isNotesMode ? 'enabled' : 'disabled'), 'info');
            }
        });
    }
    
    /**
     * Initialize theme based on system preference
     */
    initializeTheme() {
        const savedTheme = localStorage.getItem('sudoku-theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        document.body.className = `theme-${theme}`;
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('sudoku-theme')) {
                document.body.className = `theme-${e.matches ? 'dark' : 'light'}`;
            }
        });
    }
    
    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const currentTheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.body.className = `theme-${newTheme}`;
        localStorage.setItem('sudoku-theme', newTheme);
        
        this.showMessage(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme enabled`, 'info');
    }
    
    /**
     * Update grid size and regenerate DOM elements
     */
    updateGridSize() {
        this.elements.gameBoard.setAttribute('data-grid-size', this.gridSize);
        this.createGameBoard();
        this.createNumberButtons();
        this.updateHintCount();
    }
    
    /**
     * Create the game board DOM structure
     */
    createGameBoard() {
        this.elements.gameBoard.innerHTML = '';
        
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'game-cell';
            cell.setAttribute('data-index', i);
            cell.setAttribute('role', 'gridcell');
            cell.setAttribute('tabindex', '-1');
            cell.addEventListener('click', () => this.selectCell(i));
            cell.addEventListener('focus', () => this.selectCell(i));
            
            this.elements.gameBoard.appendChild(cell);
        }
    }
    
    /**
     * Create number input buttons
     */
    createNumberButtons() {
        this.elements.numberButtons.innerHTML = '';
        
        for (let i = 1; i <= this.gridSize; i++) {
            const button = document.createElement('button');
            button.className = 'number-btn';
            button.type = 'button';
            button.setAttribute('data-number', i);
            
            // Display format for 16x16 (1-9, A-G)
            if (i <= 9) {
                button.textContent = i;
                button.setAttribute('aria-label', `Number ${i}`);
            } else {
                const letter = String.fromCharCode(55 + i); // A=10, B=11, etc.
                button.textContent = letter;
                button.setAttribute('aria-label', `Number ${i} (${letter})`);
            }
            
            button.addEventListener('click', () => this.inputNumber(i));
            this.elements.numberButtons.appendChild(button);
        }
    }
    
    /**
     * Generate a new game puzzle
     */
    async generateNewGame() {
        try {
            this.showLoading(true);
            this.stopTimer();
            this.resetGameState();
            
            // Generate solution and puzzle
            await this.generatePuzzle();
            
            // Update display
            this.renderBoard();
            this.startTimer();
            this.updateProgress();
            
            this.showMessage('New game started!', 'success');
        } catch (error) {
            console.error('Error generating new game:', error);
            this.showMessage('Error generating puzzle. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * Reset game state
     */
    resetGameState() {
        this.selectedCell = null;
        this.isNotesMode = false;
        this.isPaused = false;
        this.isGameComplete = false;
        this.startTime = null;
        this.elapsedTime = 0;
        this.errorCount = 0;
        this.hintsRemaining = 3;
        
        this.updateNotesMode();
        this.updatePauseButton();
        this.updateHintCount();
        this.updateErrorCount();
        this.updateTimer();
    }
    
    /**
     * Generate puzzle using backtracking algorithm
     */
    async generatePuzzle() {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Initialize empty boards
                this.solutionBoard = Array(this.gridSize * this.gridSize).fill(0);
                this.gameBoard = Array(this.gridSize * this.gridSize).fill(0);
                
                // Generate complete solution
                this.generateSolution(0);
                
                // Copy solution to game board
                this.gameBoard = [...this.solutionBoard];
                
                // Remove cells based on difficulty
                this.removeCells();
                
                resolve();
            }, 100); // Small delay for loading animation
        });
    }
    
    /**
     * Generate complete solution using backtracking
     */
    generateSolution(index) {
        if (index >= this.gridSize * this.gridSize) {
            return true; // Puzzle complete
        }
        
        const numbers = this.shuffleArray([...Array(this.gridSize)].map((_, i) => i + 1));
        
        for (const num of numbers) {
            if (this.isValidMove(index, num, this.solutionBoard)) {
                this.solutionBoard[index] = num;
                
                if (this.generateSolution(index + 1)) {
                    return true;
                }
                
                this.solutionBoard[index] = 0;
            }
        }
        
        return false;
    }
    
    /**
     * Remove cells from complete puzzle based on difficulty
     */
    removeCells() {
        const cellsToRemove = this.config.difficulties[this.difficulty].cellsToRemove[this.gridSize];
        const totalCells = this.gridSize * this.gridSize;
        
        // Create array of all indices and shuffle
        const indices = this.shuffleArray([...Array(totalCells)].map((_, i) => i));
        
        // Remove cells
        for (let i = 0; i < Math.min(cellsToRemove, indices.length); i++) {
            this.gameBoard[indices[i]] = 0;
        }
    }
    
    /**
     * Check if a move is valid
     */
    isValidMove(index, number, board = this.gameBoard) {
        const row = Math.floor(index / this.gridSize);
        const col = index % this.gridSize;
        
        // Check row
        for (let c = 0; c < this.gridSize; c++) {
            if (c !== col && board[row * this.gridSize + c] === number) {
                return false;
            }
        }
        
        // Check column
        for (let r = 0; r < this.gridSize; r++) {
            if (r !== row && board[r * this.gridSize + col] === number) {
                return false;
            }
        }
        
        // Check subgrid
        const subgridSize = Math.sqrt(this.gridSize);
        const subgridRow = Math.floor(row / subgridSize) * subgridSize;
        const subgridCol = Math.floor(col / subgridSize) * subgridSize;
        
        for (let r = subgridRow; r < subgridRow + subgridSize; r++) {
            for (let c = subgridCol; c < subgridCol + subgridSize; c++) {
                if ((r !== row || c !== col) && board[r * this.gridSize + c] === number) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    /**
     * Render the game board
     */
    renderBoard() {
        const cells = this.elements.gameBoard.querySelectorAll('.game-cell');
        
        cells.forEach((cell, index) => {
            const value = this.gameBoard[index];
            const isOriginal = this.solutionBoard[index] !== 0 && this.gameBoard[index] !== 0;
            
            // Reset classes
            cell.className = 'game-cell';
            cell.innerHTML = '';
            
            if (value !== 0) {
                // Display number
                const displayValue = this.formatCellValue(value);
                cell.textContent = displayValue;
                
                if (isOriginal) {
                    cell.classList.add('prefilled');
                    cell.setAttribute('aria-label', `Prefilled ${displayValue}`);
                } else {
                    cell.setAttribute('aria-label', `User input ${displayValue}`);
                }
            } else {
                cell.setAttribute('aria-label', 'Empty cell');
            }
            
            // Add notes container
            if (!isOriginal) {
                const notesContainer = document.createElement('div');
                notesContainer.className = 'notes';
                cell.appendChild(notesContainer);
            }
        });
        
        this.updateCellHighlighting();
    }
    
    /**
     * Format cell value for display (numbers/letters)
     */
    formatCellValue(value) {
        if (value <= 9) {
            return value.toString();
        } else {
            return String.fromCharCode(55 + value); // A=10, B=11, etc.
        }
    }
    
    /**
     * Select a cell
     */
    selectCell(index) {
        if (this.isPaused || this.isGameComplete) return;
        
        const cells = this.elements.gameBoard.querySelectorAll('.game-cell');
        const cell = cells[index];
        
        // Don't select prefilled cells
        if (cell.classList.contains('prefilled')) return;
        
        this.selectedCell = index;
        this.updateCellHighlighting();
        
        // Focus for accessibility
        cell.focus();
    }
    
    /**
     * Update cell highlighting
     */
    updateCellHighlighting() {
        const cells = this.elements.gameBoard.querySelectorAll('.game-cell');
        
        cells.forEach((cell, index) => {
            cell.classList.remove('selected', 'highlighted');
            
            if (this.selectedCell === index) {
                cell.classList.add('selected');
            } else if (this.selectedCell !== null) {
                // Highlight same row, column, and subgrid
                const selectedRow = Math.floor(this.selectedCell / this.gridSize);
                const selectedCol = this.selectedCell % this.gridSize;
                const currentRow = Math.floor(index / this.gridSize);
                const currentCol = index % this.gridSize;
                
                const subgridSize = Math.sqrt(this.gridSize);
                const selectedSubgridRow = Math.floor(selectedRow / subgridSize);
                const selectedSubgridCol = Math.floor(selectedCol / subgridSize);
                const currentSubgridRow = Math.floor(currentRow / subgridSize);
                const currentSubgridCol = Math.floor(currentCol / subgridSize);
                
                if (currentRow === selectedRow || 
                    currentCol === selectedCol || 
                    (currentSubgridRow === selectedSubgridRow && currentSubgridCol === selectedSubgridCol)) {
                    cell.classList.add('highlighted');
                }
            }
        });
    }
    
    /**
     * Input a number into the selected cell
     */
    inputNumber(number) {
        if (this.selectedCell === null || this.isPaused || this.isGameComplete) return;
        
        const cells = this.elements.gameBoard.querySelectorAll('.game-cell');
        const cell = cells[this.selectedCell];
        
        if (cell.classList.contains('prefilled')) return;
        
        if (this.isNotesMode) {
            this.toggleNote(this.selectedCell, number);
        } else {
            this.setCellValue(this.selectedCell, number);
        }
    }
    
    /**
     * Set cell value
     */
    setCellValue(index, number) {
        const cells = this.elements.gameBoard.querySelectorAll('.game-cell');
        const cell = cells[index];
        
        // Clear notes when setting value
        const notesContainer = cell.querySelector('.notes');
        if (notesContainer) {
            notesContainer.innerHTML = '';
        }
        
        // Check if move is valid
        const isValid = this.isValidMove(index, number);
        const isCorrect = this.solutionBoard[index] === number;
        
        this.gameBoard[index] = number;
        
        // Update display
        const displayValue = this.formatCellValue(number);
        cell.textContent = displayValue;
        cell.setAttribute('aria-label', `User input ${displayValue}`);
        
        // Handle validation
        if (!isValid || !isCorrect) {
            cell.classList.add('error');
            this.errorCount++;
            this.updateErrorCount();
            this.showMessage('Invalid move!', 'error');
            
            // Remove error styling after animation
            setTimeout(() => {
                cell.classList.remove('error');
            }, 600);
        } else {
            // Success feedback
            this.showMessage('Good move!', 'success');
        }
        
        // Update progress and check completion
        this.updateProgress();
        this.checkCompletion();
    }
    
    /**
     * Toggle note in cell
     */
    toggleNote(index, number) {
        const cells = this.elements.gameBoard.querySelectorAll('.game-cell');
        const cell = cells[index];
        const notesContainer = cell.querySelector('.notes');
        
        if (!notesContainer || this.gameBoard[index] !== 0) return;
        
        const noteSelector = `.note:nth-child(${number})`;
        let noteElement = notesContainer.querySelector(noteSelector);
        
        if (!noteElement) {
            // Create note structure if not exists
            for (let i = notesContainer.children.length; i < this.gridSize; i++) {
                const note = document.createElement('div');
                note.className = 'note';
                notesContainer.appendChild(note);
            }
            noteElement = notesContainer.children[number - 1];
        }
        
        if (noteElement.textContent === this.formatCellValue(number)) {
            noteElement.textContent = '';
        } else {
            noteElement.textContent = this.formatCellValue(number);
        }
    }
    
    /**
     * Navigate grid with arrow keys
     */
    navigateGrid(direction) {
        if (this.selectedCell === null) {
            this.selectCell(0);
            return;
        }
        
        const row = Math.floor(this.selectedCell / this.gridSize);
        const col = this.selectedCell % this.gridSize;
        let newRow = row;
        let newCol = col;
        
        switch (direction) {
            case 'ArrowUp':
                newRow = Math.max(0, row - 1);
                break;
            case 'ArrowDown':
                newRow = Math.min(this.gridSize - 1, row + 1);
                break;
            case 'ArrowLeft':
                newCol = Math.max(0, col - 1);
                break;
            case 'ArrowRight':
                newCol = Math.min(this.gridSize - 1, col + 1);
                break;
        }
        
        const newIndex = newRow * this.gridSize + newCol;
        this.selectCell(newIndex);
    }
    
    /**
     * Toggle notes mode
     */
    toggleNotesMode() {
        this.isNotesMode = !this.isNotesMode;
        this.updateNotesMode();
        this.showMessage(`Notes mode ${this.isNotesMode ? 'enabled' : 'disabled'}`, 'info');
    }
    
    /**
     * Update notes mode UI
     */
    updateNotesMode() {
        this.elements.notesBtn.setAttribute('aria-pressed', this.isNotesMode);
        this.elements.notesBtn.classList.toggle('selected', this.isNotesMode);
        document.body.classList.toggle('notes-mode', this.isNotesMode);
    }
    
    /**
     * Erase selected cell
     */
    eraseSelectedCell() {
        if (this.selectedCell === null || this.isPaused || this.isGameComplete) return;
        
        const cells = this.elements.gameBoard.querySelectorAll('.game-cell');
        const cell = cells[this.selectedCell];
        
        if (cell.classList.contains('prefilled')) return;
        
        // Clear value and notes
        this.gameBoard[this.selectedCell] = 0;
        cell.textContent = '';
        cell.setAttribute('aria-label', 'Empty cell');
        
        const notesContainer = cell.querySelector('.notes');
        if (notesContainer) {
            notesContainer.innerHTML = '';
        }
        
        this.updateProgress();
    }
    
    /**
     * Give hint
     */
    giveHint() {
        if (this.hintsRemaining <= 0 || this.isPaused || this.isGameComplete) return;
        
        // Find empty cells
        const emptyCells = [];
        for (let i = 0; i < this.gameBoard.length; i++) {
            if (this.gameBoard[i] === 0) {
                emptyCells.push(i);
            }
        }
        
        if (emptyCells.length === 0) return;
        
        // Pick random empty cell
        const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const correctValue = this.solutionBoard[randomIndex];
        
        // Fill the cell
        this.gameBoard[randomIndex] = correctValue;
        
        // Update display
        const cells = this.elements.gameBoard.querySelectorAll('.game-cell');
        const cell = cells[randomIndex];
        const displayValue = this.formatCellValue(correctValue);
        
        cell.textContent = displayValue;
        cell.classList.add('hint');
        cell.setAttribute('aria-label', `Hint: ${displayValue}`);
        
        // Remove hint styling after animation
        setTimeout(() => {
            cell.classList.remove('hint');
        }, 1000);
        
        this.hintsRemaining--;
        this.updateHintCount();
        this.updateProgress();
        this.checkCompletion();
        
        this.showMessage(`Hint used! ${this.hintsRemaining} remaining`, 'info');
    }
    
    /**
     * Clear user-entered values
     */
    clearBoard() {
        if (this.isPaused || this.isGameComplete) return;
        
        const cells = this.elements.gameBoard.querySelectorAll('.game-cell');
        
        cells.forEach((cell, index) => {
            if (!cell.classList.contains('prefilled')) {
                this.gameBoard[index] = 0;
                cell.textContent = '';
                cell.setAttribute('aria-label', 'Empty cell');
                
                const notesContainer = cell.querySelector('.notes');
                if (notesContainer) {
                    notesContainer.innerHTML = '';
                }
            }
        });
        
        this.updateProgress();
        this.showMessage('Board cleared!', 'info');
    }
    
    /**
     * Toggle pause state
     */
    togglePause() {
        if (this.isGameComplete) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.stopTimer();
            this.elements.gameBoard.style.filter = 'blur(4px)';
            this.elements.gameBoard.style.pointerEvents = 'none';
        } else {
            this.startTimer();
            this.elements.gameBoard.style.filter = 'none';
            this.elements.gameBoard.style.pointerEvents = 'auto';
        }
        
        this.updatePauseButton();
        this.showMessage(this.isPaused ? 'Game paused' : 'Game resumed', 'info');
    }
    
    /**
     * Update pause button
     */
    updatePauseButton() {
        this.elements.pauseBtn.classList.toggle('paused', this.isPaused);
        this.elements.pauseBtn.querySelector('.btn-text').textContent = this.isPaused ? 'Resume' : 'Pause';
        this.elements.pauseBtn.setAttribute('aria-label', this.isPaused ? 'Resume game' : 'Pause game');
    }
    
    /**
     * Start game timer
     */
    startTimer() {
        if (this.startTime === null) {
            this.startTime = Date.now() - this.elapsedTime;
        }
        
        this.timerInterval = setInterval(() => {
            if (!this.isPaused && !this.isGameComplete) {
                this.elapsedTime = Date.now() - this.startTime;
                this.updateTimer();
            }
        }, 1000);
    }
    
    /**
     * Stop game timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    /**
     * Update timer display
     */
    updateTimer() {
        const minutes = Math.floor(this.elapsedTime / 60000);
        const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.elements.timer.textContent = timeString;
    }
    
    /**
     * Update progress display
     */
    updateProgress() {
        const totalCells = this.gridSize * this.gridSize;
        const filledCells = this.gameBoard.filter(cell => cell !== 0).length;
        const progress = Math.round((filledCells / totalCells) * 100);
        
        this.elements.progressFill.style.width = `${progress}%`;
        this.elements.progressText.textContent = `${progress}%`;
        this.elements.progressFill.parentElement.setAttribute('aria-valuenow', progress);
    }
    
    /**
     * Update hint count display
     */
    updateHintCount() {
        this.elements.hintCount.textContent = this.hintsRemaining;
        this.elements.hintBtn.disabled = this.hintsRemaining <= 0;
    }
    
    /**
     * Update error count display
     */
    updateErrorCount() {
        this.elements.errorCount.textContent = this.errorCount;
    }
    
    /**
     * Check if puzzle is complete
     */
    checkCompletion() {
        const isComplete = this.gameBoard.every((cell, index) => 
            cell !== 0 && cell === this.solutionBoard[index]
        );
        
        if (isComplete) {
            this.completeGame();
        }
    }
    
    /**
     * Handle game completion
     */
    completeGame() {
        this.isGameComplete = true;
        this.stopTimer();
        
        // Update completion modal
        document.getElementById('final-time').textContent = this.elements.timer.textContent;
        document.getElementById('final-difficulty').textContent = 
            this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
        document.getElementById('final-grid-size').textContent = `${this.gridSize}×${this.gridSize}`;
        
        // Celebration animation
        this.celebrateCompletion();
        
        // Show completion modal after animation
        setTimeout(() => {
            this.showModal();
        }, 1000);
        
        this.showMessage('🎉 Puzzle completed!', 'success');
    }
    
    /**
     * Celebration animation
     */
    celebrateCompletion() {
        const cells = this.elements.gameBoard.querySelectorAll('.game-cell');
        
        cells.forEach((cell, index) => {
            setTimeout(() => {
                cell.style.animation = 'fadeInUp 0.3s ease-out forwards';
            }, index * 10);
        });
    }
    
    /**
     * Show completion modal
     */
    showModal() {
        this.elements.completeModal.classList.add('show');
        this.elements.completeModal.setAttribute('aria-hidden', 'false');
        this.elements.playAgainBtn.focus();
    }
    
    /**
     * Hide completion modal
     */
    hideModal() {
        this.elements.completeModal.classList.remove('show');
        this.elements.completeModal.setAttribute('aria-hidden', 'true');
    }
    
    /**
     * Share game result
     */
    async shareResult() {
        const result = {
            gridSize: `${this.gridSize}×${this.gridSize}`,
            difficulty: this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1),
            time: this.elements.timer.textContent,
            errors: this.errorCount
        };
        
        const shareText = `🎯 Just completed a ${result.gridSize} ${result.difficulty} Sudoku in ${result.time}! Play at ${window.location.href}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Sudoku Game Result',
                    text: shareText,
                    url: window.location.href
                });
            } catch (error) {
                this.copyToClipboard(shareText);
            }
        } else {
            this.copyToClipboard(shareText);
        }
    }
    
    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showMessage('Result copied to clipboard!', 'success');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showMessage('Failed to copy result', 'error');
        }
    }
    
    /**
     * Show loading overlay
     */
    showLoading(show) {
        if (show) {
            this.elements.loadingOverlay.classList.add('show');
            this.elements.loadingOverlay.setAttribute('aria-hidden', 'false');
        } else {
            this.elements.loadingOverlay.classList.remove('show');
            this.elements.loadingOverlay.setAttribute('aria-hidden', 'true');
        }
    }
    
    /**
     * Show status message
     */
    showMessage(text, type = 'info') {
        const messageElement = this.elements[`${type}Message`];
        if (!messageElement) return;
        
        messageElement.textContent = text;
        messageElement.classList.add('show');
        
        setTimeout(() => {
            messageElement.classList.remove('show');
        }, 3000);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});