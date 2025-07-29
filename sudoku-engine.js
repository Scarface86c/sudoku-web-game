/**
 * Sudoku Puzzle Generation Engine
 * Implements hybrid CSP + Backtracking algorithm with Web Worker support
 * Supports 4x4, 6x6, 9x9, and 16x16 grids with difficulty scaling
 */

class SudokuEngine {
    constructor() {
        this.gridConfigs = {
            4: { size: 4, boxWidth: 2, boxHeight: 2, maxValue: 4 },
            6: { size: 6, boxWidth: 3, boxHeight: 2, maxValue: 6 },
            9: { size: 9, boxWidth: 3, boxHeight: 3, maxValue: 9 },
            16: { size: 16, boxWidth: 4, boxHeight: 4, maxValue: 16 }
        };
        
        this.difficulties = {
            easy: { fillPercentage: 0.6, symmetry: true },
            medium: { fillPercentage: 0.45, symmetry: true },
            hard: { fillPercentage: 0.35, symmetry: false },
            hardcore: { fillPercentage: 0.25, symmetry: false }
        };
        
        this.worker = null;
        this.initializeWorker();
    }

    /**
     * Initialize Web Worker for non-blocking generation
     */
    initializeWorker() {
        try {
            const workerCode = `
                ${this.getWorkerCode()}
            `;
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            this.worker = new Worker(URL.createObjectURL(blob));
        } catch (error) {
            console.warn('Web Worker initialization failed, falling back to main thread:', error);
            this.worker = null;
        }
    }

    /**
     * Generate a complete Sudoku puzzle
     * @param {number} size - Grid size (4, 6, 9, or 16)
     * @param {string} difficulty - Difficulty level
     * @param {boolean} useWorker - Whether to use Web Worker
     * @returns {Promise<Object>} Generated puzzle and solution
     */
    async generatePuzzle(size = 9, difficulty = 'medium', useWorker = true) {
        try {
            if (!this.gridConfigs[size]) {
                throw new Error(`Unsupported grid size: ${size}`);
            }

            if (!this.difficulties[difficulty]) {
                throw new Error(`Unsupported difficulty: ${difficulty}`);
            }

            const config = this.gridConfigs[size];
            const difficultyConfig = this.difficulties[difficulty];

            if (useWorker && this.worker) {
                return await this.generateWithWorker(config, difficultyConfig);
            } else {
                return await this.generateOnMainThread(config, difficultyConfig);
            }
        } catch (error) {
            throw new Error(`Puzzle generation failed: ${error.message}`);
        }
    }

    /**
     * Generate puzzle using Web Worker
     */
    generateWithWorker(config, difficultyConfig) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Puzzle generation timeout'));
            }, 30000);

            this.worker.onmessage = (event) => {
                clearTimeout(timeout);
                if (event.data.error) {
                    reject(new Error(event.data.error));
                } else {
                    resolve(event.data);
                }
            };

            this.worker.onerror = (error) => {
                clearTimeout(timeout);
                reject(error);
            };

            this.worker.postMessage({ config, difficultyConfig });
        });
    }

    /**
     * Generate puzzle on main thread
     */
    async generateOnMainThread(config, difficultyConfig) {
        const solution = await this.generateCompleteSolution(config);
        const puzzle = this.createPuzzleFromSolution(solution, config, difficultyConfig);
        
        return {
            puzzle,
            solution,
            difficulty: difficultyConfig,
            metadata: {
                size: config.size,
                generatedAt: Date.now(),
                fillPercentage: this.calculateFillPercentage(puzzle)
            }
        };
    }

    /**
     * Generate a complete valid Sudoku solution using CSP + Backtracking
     */
    async generateCompleteSolution(config) {
        const grid = this.createEmptyGrid(config.size);
        const domains = this.initializeDomains(config);
        
        // Use CSP preprocessing for initial constraint propagation
        this.applyConstraintPropagation(grid, domains, config);
        
        // Fill grid using backtracking with heuristics
        if (await this.backtrackFill(grid, domains, config, 0)) {
            return grid;
        } else {
            throw new Error('Failed to generate complete solution');
        }
    }

    /**
     * Create empty grid
     */
    createEmptyGrid(size) {
        return Array(size).fill().map(() => Array(size).fill(0));
    }

    /**
     * Initialize domain constraints for CSP
     */
    initializeDomains(config) {
        const domains = {};
        for (let row = 0; row < config.size; row++) {
            for (let col = 0; col < config.size; col++) {
                domains[`${row},${col}`] = new Set(
                    Array.from({ length: config.maxValue }, (_, i) => i + 1)
                );
            }
        }
        return domains;
    }

    /**
     * Apply constraint propagation (AC-3 algorithm simplified)
     */
    applyConstraintPropagation(grid, domains, config) {
        let changed = true;
        while (changed) {
            changed = false;
            
            for (let row = 0; row < config.size; row++) {
                for (let col = 0; col < config.size; col++) {
                    if (grid[row][col] === 0) {
                        const cellKey = `${row},${col}`;
                        const originalSize = domains[cellKey].size;
                        
                        // Remove values that conflict with constraints
                        this.updateDomainConstraints(row, col, grid, domains, config);
                        
                        if (domains[cellKey].size !== originalSize) {
                            changed = true;
                        }
                        
                        // If domain is empty, this configuration is invalid
                        if (domains[cellKey].size === 0) {
                            return false;
                        }
                        
                        // If domain has only one value, assign it
                        if (domains[cellKey].size === 1) {
                            grid[row][col] = [...domains[cellKey]][0];
                            domains[cellKey].clear();
                            changed = true;
                        }
                    }
                }
            }
        }
        return true;
    }

    /**
     * Update domain constraints for a cell
     */
    updateDomainConstraints(row, col, grid, domains, config) {
        const cellKey = `${row},${col}`;
        const domain = domains[cellKey];
        
        // Check row constraints
        for (let c = 0; c < config.size; c++) {
            if (c !== col && grid[row][c] !== 0) {
                domain.delete(grid[row][c]);
            }
        }
        
        // Check column constraints
        for (let r = 0; r < config.size; r++) {
            if (r !== row && grid[r][col] !== 0) {
                domain.delete(grid[r][col]);
            }
        }
        
        // Check box constraints
        const boxRow = Math.floor(row / config.boxHeight) * config.boxHeight;
        const boxCol = Math.floor(col / config.boxWidth) * config.boxWidth;
        
        for (let r = boxRow; r < boxRow + config.boxHeight; r++) {
            for (let c = boxCol; c < boxCol + config.boxWidth; c++) {
                if ((r !== row || c !== col) && grid[r][c] !== 0) {
                    domain.delete(grid[r][c]);
                }
            }
        }
    }

    /**
     * Backtracking algorithm with MRV and LCV heuristics
     */
    async backtrackFill(grid, domains, config, depth) {
        // Yield control periodically to prevent blocking
        if (depth % 50 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        const cell = this.selectUnassignedVariable(grid, domains, config);
        if (!cell) {
            return true; // All cells filled
        }

        const [row, col] = cell;
        const cellKey = `${row},${col}`;
        const values = this.orderDomainValues(row, col, domains, config);

        for (const value of values) {
            if (this.isValidPlacement(grid, row, col, value, config)) {
                // Make assignment
                grid[row][col] = value;
                const savedDomains = this.saveDomains(domains);
                
                // Update domains with new assignment
                this.propagateAssignment(row, col, value, domains, config);
                
                // Recurse
                if (await this.backtrackFill(grid, domains, config, depth + 1)) {
                    return true;
                }
                
                // Backtrack
                grid[row][col] = 0;
                this.restoreDomains(domains, savedDomains);
            }
        }
        
        return false;
    }

    /**
     * Select unassigned variable using MRV (Minimum Remaining Values) heuristic
     */
    selectUnassignedVariable(grid, domains, config) {
        let bestCell = null;
        let minRemainingValues = Infinity;
        
        for (let row = 0; row < config.size; row++) {
            for (let col = 0; col < config.size; col++) {
                if (grid[row][col] === 0) {
                    const cellKey = `${row},${col}`;
                    const remainingValues = domains[cellKey].size;
                    
                    if (remainingValues < minRemainingValues) {
                        minRemainingValues = remainingValues;
                        bestCell = [row, col];
                    }
                }
            }
        }
        
        return bestCell;
    }

    /**
     * Order domain values using LCV (Least Constraining Value) heuristic
     */
    orderDomainValues(row, col, domains, config) {
        const cellKey = `${row},${col}`;
        const values = [...domains[cellKey]];
        
        // Simple ordering - can be enhanced with LCV
        return this.shuffleArray(values);
    }

    /**
     * Check if placement is valid according to Sudoku rules
     */
    isValidPlacement(grid, row, col, value, config) {
        // Check row
        for (let c = 0; c < config.size; c++) {
            if (c !== col && grid[row][c] === value) {
                return false;
            }
        }
        
        // Check column
        for (let r = 0; r < config.size; r++) {
            if (r !== row && grid[r][col] === value) {
                return false;
            }
        }
        
        // Check box
        const boxRow = Math.floor(row / config.boxHeight) * config.boxHeight;
        const boxCol = Math.floor(col / config.boxWidth) * config.boxWidth;
        
        for (let r = boxRow; r < boxRow + config.boxHeight; r++) {
            for (let c = boxCol; c < boxCol + config.boxWidth; c++) {
                if ((r !== row || c !== col) && grid[r][c] === value) {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * Propagate assignment to update domains
     */
    propagateAssignment(row, col, value, domains, config) {
        // Remove value from related cells' domains
        for (let c = 0; c < config.size; c++) {
            if (c !== col) {
                domains[`${row},${c}`].delete(value);
            }
        }
        
        for (let r = 0; r < config.size; r++) {
            if (r !== row) {
                domains[`${r},${col}`].delete(value);
            }
        }
        
        const boxRow = Math.floor(row / config.boxHeight) * config.boxHeight;
        const boxCol = Math.floor(col / config.boxWidth) * config.boxWidth;
        
        for (let r = boxRow; r < boxRow + config.boxHeight; r++) {
            for (let c = boxCol; c < boxCol + config.boxWidth; c++) {
                if (r !== row || c !== col) {
                    domains[`${r},${c}`].delete(value);
                }
            }
        }
    }

    /**
     * Create puzzle by removing cells from complete solution
     */
    createPuzzleFromSolution(solution, config, difficultyConfig) {
        const puzzle = solution.map(row => [...row]);
        const totalCells = config.size * config.size;
        const cellsToRemove = Math.floor(totalCells * (1 - difficultyConfig.fillPercentage));
        
        const cellPositions = [];
        for (let row = 0; row < config.size; row++) {
            for (let col = 0; col < config.size; col++) {
                cellPositions.push([row, col]);
            }
        }
        
        this.shuffleArray(cellPositions);
        
        let removedCells = 0;
        for (const [row, col] of cellPositions) {
            if (removedCells >= cellsToRemove) break;
            
            const originalValue = puzzle[row][col];
            puzzle[row][col] = 0;
            
            // Ensure puzzle still has unique solution
            if (this.hasUniqueSolution(puzzle, config)) {
                removedCells++;
                
                // Apply symmetry if required
                if (difficultyConfig.symmetry) {
                    const symRow = config.size - 1 - row;
                    const symCol = config.size - 1 - col;
                    if (puzzle[symRow][symCol] !== 0) {
                        puzzle[symRow][symCol] = 0;
                        removedCells++;
                    }
                }
            } else {
                // Restore if removing this cell creates multiple solutions
                puzzle[row][col] = originalValue;
            }
        }
        
        return puzzle;
    }

    /**
     * Check if puzzle has unique solution (simplified check)
     */
    hasUniqueSolution(puzzle, config) {
        // This is a simplified check - in production, you'd want a more thorough verification
        const solutions = [];
        this.countSolutions(puzzle.map(row => [...row]), config, solutions, 2);
        return solutions.length === 1;
    }

    /**
     * Count number of solutions (up to maxSolutions)
     */
    countSolutions(grid, config, solutions, maxSolutions) {
        if (solutions.length >= maxSolutions) return;
        
        const emptyCell = this.findEmptyCell(grid, config);
        if (!emptyCell) {
            solutions.push(grid.map(row => [...row]));
            return;
        }
        
        const [row, col] = emptyCell;
        for (let value = 1; value <= config.maxValue; value++) {
            if (this.isValidPlacement(grid, row, col, value, config)) {
                grid[row][col] = value;
                this.countSolutions(grid, config, solutions, maxSolutions);
                grid[row][col] = 0;
            }
        }
    }

    /**
     * Find first empty cell
     */
    findEmptyCell(grid, config) {
        for (let row = 0; row < config.size; row++) {
            for (let col = 0; col < config.size; col++) {
                if (grid[row][col] === 0) {
                    return [row, col];
                }
            }
        }
        return null;
    }

    /**
     * Calculate fill percentage of puzzle
     */
    calculateFillPercentage(puzzle) {
        const totalCells = puzzle.length * puzzle[0].length;
        const filledCells = puzzle.flat().filter(cell => cell !== 0).length;
        return filledCells / totalCells;
    }

    /**
     * Utility functions
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    saveDomains(domains) {
        const saved = {};
        for (const [key, domain] of Object.entries(domains)) {
            saved[key] = new Set(domain);
        }
        return saved;
    }

    restoreDomains(domains, savedDomains) {
        for (const [key, domain] of Object.entries(savedDomains)) {
            domains[key] = new Set(domain);
        }
    }

    /**
     * Get Web Worker code as string
     */
    getWorkerCode() {
        return `
            // Web Worker code for puzzle generation
            self.onmessage = function(event) {
                const { config, difficultyConfig } = event.data;
                
                try {
                    // Implement simplified generation in worker
                    const solution = generateSimpleSolution(config);
                    const puzzle = createPuzzleFromSolution(solution, config, difficultyConfig);
                    
                    self.postMessage({
                        puzzle,
                        solution,
                        difficulty: difficultyConfig,
                        metadata: {
                            size: config.size,
                            generatedAt: Date.now(),
                            fillPercentage: calculateFillPercentage(puzzle)
                        }
                    });
                } catch (error) {
                    self.postMessage({ error: error.message });
                }
            };
            
            function generateSimpleSolution(config) {
                // Simplified solution generation for worker
                const grid = Array(config.size).fill().map(() => Array(config.size).fill(0));
                
                // Fill diagonal boxes first
                fillDiagonalBoxes(grid, config);
                
                // Fill remaining cells
                if (fillRemaining(grid, config, 0, config.boxWidth)) {
                    return grid;
                } else {
                    throw new Error('Failed to generate solution in worker');
                }
            }
            
            function fillDiagonalBoxes(grid, config) {
                for (let i = 0; i < config.size; i += config.boxWidth) {
                    fillBox(grid, i, i, config);
                }
            }
            
            function fillBox(grid, row, col, config) {
                const numbers = Array.from({ length: config.maxValue }, (_, i) => i + 1);
                shuffleArray(numbers);
                
                let idx = 0;
                for (let i = 0; i < config.boxHeight; i++) {
                    for (let j = 0; j < config.boxWidth; j++) {
                        grid[row + i][col + j] = numbers[idx++];
                    }
                }
            }
            
            function fillRemaining(grid, config, row, col) {
                if (col >= config.size && row < config.size - 1) {
                    row++;
                    col = 0;
                }
                
                if (row >= config.size && col >= config.size) {
                    return true;
                }
                
                if (row < config.boxHeight || row >= config.size - config.boxHeight) {
                    if (col < config.boxWidth || col >= config.size - config.boxWidth) {
                        return fillRemaining(grid, config, row, col + 1);
                    }
                }
                
                for (let num = 1; num <= config.maxValue; num++) {
                    if (isValidPlacement(grid, row, col, num, config)) {
                        grid[row][col] = num;
                        if (fillRemaining(grid, config, row, col + 1)) {
                            return true;
                        }
                        grid[row][col] = 0;
                    }
                }
                
                return false;
            }
            
            function isValidPlacement(grid, row, col, value, config) {
                // Check row
                for (let c = 0; c < config.size; c++) {
                    if (c !== col && grid[row][c] === value) {
                        return false;
                    }
                }
                
                // Check column
                for (let r = 0; r < config.size; r++) {
                    if (r !== row && grid[r][col] === value) {
                        return false;
                    }
                }
                
                // Check box
                const boxRow = Math.floor(row / config.boxHeight) * config.boxHeight;
                const boxCol = Math.floor(col / config.boxWidth) * config.boxWidth;
                
                for (let r = boxRow; r < boxRow + config.boxHeight; r++) {
                    for (let c = boxCol; c < boxCol + config.boxWidth; c++) {
                        if ((r !== row || c !== col) && grid[r][c] === value) {
                            return false;
                        }
                    }
                }
                
                return true;
            }
            
            function createPuzzleFromSolution(solution, config, difficultyConfig) {
                const puzzle = solution.map(row => [...row]);
                const totalCells = config.size * config.size;
                const cellsToRemove = Math.floor(totalCells * (1 - difficultyConfig.fillPercentage));
                
                const cellPositions = [];
                for (let row = 0; row < config.size; row++) {
                    for (let col = 0; col < config.size; col++) {
                        cellPositions.push([row, col]);
                    }
                }
                
                shuffleArray(cellPositions);
                
                for (let i = 0; i < cellsToRemove && i < cellPositions.length; i++) {
                    const [row, col] = cellPositions[i];
                    puzzle[row][col] = 0;
                }
                
                return puzzle;
            }
            
            function calculateFillPercentage(puzzle) {
                const totalCells = puzzle.length * puzzle[0].length;
                const filledCells = puzzle.flat().filter(cell => cell !== 0).length;
                return filledCells / totalCells;
            }
            
            function shuffleArray(array) {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
            }
        `;
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}

export default SudokuEngine;