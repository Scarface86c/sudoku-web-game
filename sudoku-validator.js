/**
 * Sudoku Validation System
 * Real-time constraint checking, solution validation, and conflict detection
 * Performance-optimized with position tracking and incremental validation
 */

class SudokuValidator {
    constructor() {
        this.gridConfigs = {
            4: { size: 4, boxWidth: 2, boxHeight: 2, maxValue: 4 },
            6: { size: 6, boxWidth: 3, boxHeight: 2, maxValue: 6 },
            9: { size: 9, boxWidth: 3, boxHeight: 3, maxValue: 9 },
            16: { size: 16, boxWidth: 4, boxHeight: 4, maxValue: 16 }
        };
        
        // Cache for performance optimization
        this.validationCache = new Map();
        this.conflictCache = new Map();
        this.lastValidationHash = null;
    }

    /**
     * Validate a complete Sudoku solution
     * @param {number[][]} grid - The grid to validate
     * @param {number} size - Grid size
     * @returns {Object} Validation result with details
     */
    validateSolution(grid, size = 9) {
        try {
            if (!this.gridConfigs[size]) {
                throw new Error(`Unsupported grid size: ${size}`);
            }

            const config = this.gridConfigs[size];
            const result = {
                isValid: true,
                errors: [],
                conflicts: [],
                completeness: this.calculateCompleteness(grid),
                validationTime: 0
            };

            const startTime = performance.now();

            // Check grid structure
            if (!this.validateGridStructure(grid, config)) {
                result.isValid = false;
                result.errors.push('Invalid grid structure');
                return result;
            }

            // Check if puzzle is complete
            if (result.completeness < 1.0) {
                result.isValid = false;
                result.errors.push('Puzzle is incomplete');
                return result;
            }

            // Validate all constraints
            const constraintResults = this.validateAllConstraints(grid, config);
            result.isValid = constraintResults.isValid;
            result.conflicts = constraintResults.conflicts;
            result.errors = [...result.errors, ...constraintResults.errors];

            result.validationTime = performance.now() - startTime;
            return result;

        } catch (error) {
            return {
                isValid: false,
                errors: [`Validation error: ${error.message}`],
                conflicts: [],
                completeness: 0,
                validationTime: 0
            };
        }
    }

    /**
     * Real-time validation for interactive gameplay
     * @param {number[][]} grid - Current grid state
     * @param {number} row - Row of the last change
     * @param {number} col - Column of the last change
     * @param {number} value - New value
     * @param {number} size - Grid size
     * @returns {Object} Incremental validation result
     */
    validateMove(grid, row, col, value, size = 9) {
        try {
            const config = this.gridConfigs[size];
            if (!config) {
                throw new Error(`Unsupported grid size: ${size}`);
            }

            const result = {
                isValid: true,
                conflicts: [],
                affectedCells: [],
                suggestions: []
            };

            // Validate the specific move
            if (value !== 0 && (value < 1 || value > config.maxValue)) {
                result.isValid = false;
                result.conflicts.push({
                    type: 'invalid_value',
                    position: [row, col],
                    value: value,
                    message: `Value must be between 1 and ${config.maxValue}`
                });
                return result;
            }

            // Check constraints for this specific cell
            const cellConflicts = this.validateCellConstraints(grid, row, col, value, config);
            if (cellConflicts.length > 0) {
                result.isValid = false;
                result.conflicts = cellConflicts;
            }

            // Find affected cells for highlighting
            result.affectedCells = this.getAffectedCells(row, col, config);

            // Generate suggestions if move is invalid
            if (!result.isValid) {
                result.suggestions = this.generateMoveSuggestions(grid, row, col, config);
            }

            return result;

        } catch (error) {
            return {
                isValid: false,
                conflicts: [{
                    type: 'validation_error',
                    position: [row, col],
                    message: error.message
                }],
                affectedCells: [],
                suggestions: []
            };
        }
    }

    /**
     * Find all conflicts in the current grid state
     * @param {number[][]} grid - Grid to analyze
     * @param {number} size - Grid size
     * @returns {Object} Comprehensive conflict analysis
     */
    findAllConflicts(grid, size = 9) {
        try {
            const config = this.gridConfigs[size];
            const gridHash = this.hashGrid(grid);
            
            // Use cache if grid hasn't changed
            if (this.conflictCache.has(gridHash)) {
                return this.conflictCache.get(gridHash);
            }

            const conflicts = {
                rowConflicts: [],
                columnConflicts: [],
                boxConflicts: [],
                totalConflicts: 0,
                conflictPositions: new Set()
            };

            // Check row conflicts
            for (let row = 0; row < config.size; row++) {
                const rowConflicts = this.findRowConflicts(grid, row, config);
                conflicts.rowConflicts.push(...rowConflicts);
            }

            // Check column conflicts
            for (let col = 0; col < config.size; col++) {
                const colConflicts = this.findColumnConflicts(grid, col, config);
                conflicts.columnConflicts.push(...colConflicts);
            }

            // Check box conflicts
            for (let boxRow = 0; boxRow < config.size; boxRow += config.boxHeight) {
                for (let boxCol = 0; boxCol < config.size; boxCol += config.boxWidth) {
                    const boxConflicts = this.findBoxConflicts(grid, boxRow, boxCol, config);
                    conflicts.boxConflicts.push(...boxConflicts);
                }
            }

            // Aggregate conflict positions
            [...conflicts.rowConflicts, ...conflicts.columnConflicts, ...conflicts.boxConflicts]
                .forEach(conflict => {
                    conflict.positions.forEach(pos => {
                        conflicts.conflictPositions.add(`${pos[0]},${pos[1]}`);
                    });
                });

            conflicts.totalConflicts = conflicts.conflictPositions.size;

            // Cache result
            this.conflictCache.set(gridHash, conflicts);
            return conflicts;

        } catch (error) {
            throw new Error(`Conflict detection failed: ${error.message}`);
        }
    }

    /**
     * Get valid values for a specific cell
     * @param {number[][]} grid - Current grid
     * @param {number} row - Cell row
     * @param {number} col - Cell column
     * @param {number} size - Grid size
     * @returns {number[]} Array of valid values
     */
    getValidValues(grid, row, col, size = 9) {
        try {
            const config = this.gridConfigs[size];
            const validValues = [];

            for (let value = 1; value <= config.maxValue; value++) {
                const conflicts = this.validateCellConstraints(grid, row, col, value, config);
                if (conflicts.length === 0) {
                    validValues.push(value);
                }
            }

            return validValues;

        } catch (error) {
            throw new Error(`Failed to get valid values: ${error.message}`);
        }
    }

    /**
     * Check if puzzle has unique solution
     * @param {number[][]} grid - Puzzle grid
     * @param {number} size - Grid size
     * @returns {Object} Uniqueness analysis
     */
    checkUniqueness(grid, size = 9) {
        try {
            const config = this.gridConfigs[size];
            const solutions = [];
            const maxSolutions = 2; // We only need to know if there's more than one

            this.countSolutions(
                grid.map(row => [...row]), 
                config, 
                solutions, 
                maxSolutions
            );

            return {
                hasUniqueSolution: solutions.length === 1,
                solutionCount: solutions.length,
                isValid: solutions.length > 0,
                analysis: solutions.length === 0 ? 'No solutions exist' :
                         solutions.length === 1 ? 'Unique solution exists' :
                         'Multiple solutions exist'
            };

        } catch (error) {
            return {
                hasUniqueSolution: false,
                solutionCount: 0,
                isValid: false,
                analysis: `Error: ${error.message}`
            };
        }
    }

    /**
     * Performance-optimized constraint validation
     */
    validateAllConstraints(grid, config) {
        const result = {
            isValid: true,
            conflicts: [],
            errors: []
        };

        try {
            // Validate rows
            for (let row = 0; row < config.size; row++) {
                if (!this.isValidGroup(this.getRow(grid, row), config.maxValue)) {
                    result.isValid = false;
                    result.conflicts.push({
                        type: 'row_duplicate',
                        row: row,
                        positions: this.findDuplicatePositions(this.getRow(grid, row), row, 'row')
                    });
                }
            }

            // Validate columns
            for (let col = 0; col < config.size; col++) {
                if (!this.isValidGroup(this.getColumn(grid, col), config.maxValue)) {
                    result.isValid = false;
                    result.conflicts.push({
                        type: 'column_duplicate',
                        column: col,
                        positions: this.findDuplicatePositions(this.getColumn(grid, col), col, 'column')
                    });
                }
            }

            // Validate boxes
            for (let boxRow = 0; boxRow < config.size; boxRow += config.boxHeight) {
                for (let boxCol = 0; boxCol < config.size; boxCol += config.boxWidth) {
                    const box = this.getBox(grid, boxRow, boxCol, config);
                    if (!this.isValidGroup(box.values, config.maxValue)) {
                        result.isValid = false;
                        result.conflicts.push({
                            type: 'box_duplicate',
                            boxRow: boxRow,
                            boxCol: boxCol,
                            positions: box.positions.filter((pos, idx) => 
                                box.values.indexOf(box.values[idx]) !== idx && box.values[idx] !== 0
                            )
                        });
                    }
                }
            }

        } catch (error) {
            result.errors.push(`Constraint validation error: ${error.message}`);
            result.isValid = false;
        }

        return result;
    }

    /**
     * Validate constraints for a specific cell
     */
    validateCellConstraints(grid, row, col, value, config) {
        const conflicts = [];

        if (value === 0) return conflicts; // Empty cell is always valid

        try {
            // Check row constraint
            for (let c = 0; c < config.size; c++) {
                if (c !== col && grid[row][c] === value) {
                    conflicts.push({
                        type: 'row_conflict',
                        position: [row, col],
                        conflictPosition: [row, c],
                        value: value,
                        message: `Value ${value} already exists in row ${row + 1}`
                    });
                }
            }

            // Check column constraint
            for (let r = 0; r < config.size; r++) {
                if (r !== row && grid[r][col] === value) {
                    conflicts.push({
                        type: 'column_conflict',
                        position: [row, col],
                        conflictPosition: [r, col],
                        value: value,
                        message: `Value ${value} already exists in column ${col + 1}`
                    });
                }
            }

            // Check box constraint
            const boxRow = Math.floor(row / config.boxHeight) * config.boxHeight;
            const boxCol = Math.floor(col / config.boxWidth) * config.boxWidth;

            for (let r = boxRow; r < boxRow + config.boxHeight; r++) {
                for (let c = boxCol; c < boxCol + config.boxWidth; c++) {
                    if ((r !== row || c !== col) && grid[r][c] === value) {
                        conflicts.push({
                            type: 'box_conflict',
                            position: [row, col],
                            conflictPosition: [r, c],
                            value: value,
                            message: `Value ${value} already exists in the box`
                        });
                    }
                }
            }

        } catch (error) {
            conflicts.push({
                type: 'validation_error',
                position: [row, col],
                message: error.message
            });
        }

        return conflicts;
    }

    /**
     * Helper methods for conflict detection
     */
    findRowConflicts(grid, row, config) {
        const conflicts = [];
        const seen = new Map();

        for (let col = 0; col < config.size; col++) {
            const value = grid[row][col];
            if (value !== 0) {
                if (seen.has(value)) {
                    const existingPositions = seen.get(value);
                    conflicts.push({
                        type: 'row_duplicate',
                        value: value,
                        positions: [...existingPositions, [row, col]]
                    });
                } else {
                    seen.set(value, [[row, col]]);
                }
            }
        }

        return conflicts;
    }

    findColumnConflicts(grid, col, config) {
        const conflicts = [];
        const seen = new Map();

        for (let row = 0; row < config.size; row++) {
            const value = grid[row][col];
            if (value !== 0) {
                if (seen.has(value)) {
                    const existingPositions = seen.get(value);
                    conflicts.push({
                        type: 'column_duplicate',
                        value: value,
                        positions: [...existingPositions, [row, col]]
                    });
                } else {
                    seen.set(value, [[row, col]]);
                }
            }
        }

        return conflicts;
    }

    findBoxConflicts(grid, startRow, startCol, config) {
        const conflicts = [];
        const seen = new Map();

        for (let r = startRow; r < startRow + config.boxHeight; r++) {
            for (let c = startCol; c < startCol + config.boxWidth; c++) {
                const value = grid[r][c];
                if (value !== 0) {
                    if (seen.has(value)) {
                        const existingPositions = seen.get(value);
                        conflicts.push({
                            type: 'box_duplicate',
                            value: value,
                            positions: [...existingPositions, [r, c]]
                        });
                    } else {
                        seen.set(value, [[r, c]]);
                    }
                }
            }
        }

        return conflicts;
    }

    /**
     * Get cells affected by a move (same row, column, and box)
     */
    getAffectedCells(row, col, config) {
        const affected = new Set();

        // Add row cells
        for (let c = 0; c < config.size; c++) {
            if (c !== col) {
                affected.add(`${row},${c}`);
            }
        }

        // Add column cells
        for (let r = 0; r < config.size; r++) {
            if (r !== row) {
                affected.add(`${r},${col}`);
            }
        }

        // Add box cells
        const boxRow = Math.floor(row / config.boxHeight) * config.boxHeight;
        const boxCol = Math.floor(col / config.boxWidth) * config.boxWidth;

        for (let r = boxRow; r < boxRow + config.boxHeight; r++) {
            for (let c = boxCol; c < boxCol + config.boxWidth; c++) {
                if (r !== row || c !== col) {
                    affected.add(`${r},${c}`);
                }
            }
        }

        return Array.from(affected).map(pos => {
            const [r, c] = pos.split(',').map(Number);
            return [r, c];
        });
    }

    /**
     * Generate move suggestions when a move is invalid
     */
    generateMoveSuggestions(grid, row, col, config) {
        const suggestions = [];
        const validValues = this.getValidValues(grid, row, col, config.size);

        if (validValues.length > 0) {
            suggestions.push({
                type: 'valid_values',
                message: `Valid values for this cell: ${validValues.join(', ')}`,
                values: validValues
            });
        }

        // Check if this cell affects any other empty cells
        const affectedCells = this.getAffectedCells(row, col, config);
        const affectedEmpty = affectedCells.filter(([r, c]) => grid[r][c] === 0);

        if (affectedEmpty.length > 0) {
            suggestions.push({
                type: 'affected_cells',
                message: `This move affects ${affectedEmpty.length} other empty cells`,
                positions: affectedEmpty
            });
        }

        return suggestions;
    }

    /**
     * Utility methods
     */
    validateGridStructure(grid, config) {
        if (!Array.isArray(grid)) return false;
        if (grid.length !== config.size) return false;
        
        for (let row = 0; row < config.size; row++) {
            if (!Array.isArray(grid[row])) return false;
            if (grid[row].length !== config.size) return false;
            
            for (let col = 0; col < config.size; col++) {
                const value = grid[row][col];
                if (!Number.isInteger(value) || value < 0 || value > config.maxValue) {
                    return false;
                }
            }
        }
        
        return true;
    }

    calculateCompleteness(grid) {
        const totalCells = grid.length * grid[0].length;
        const filledCells = grid.flat().filter(cell => cell !== 0).length;
        return filledCells / totalCells;
    }

    isValidGroup(values, maxValue) {
        const nonZeroValues = values.filter(v => v !== 0);
        const uniqueValues = new Set(nonZeroValues);
        return uniqueValues.size === nonZeroValues.length;
    }

    getRow(grid, row) {
        return grid[row];
    }

    getColumn(grid, col) {
        return grid.map(row => row[col]);
    }

    getBox(grid, startRow, startCol, config) {
        const values = [];
        const positions = [];
        
        for (let r = startRow; r < startRow + config.boxHeight; r++) {
            for (let c = startCol; c < startCol + config.boxWidth; c++) {
                values.push(grid[r][c]);
                positions.push([r, c]);
            }
        }
        
        return { values, positions };
    }

    findDuplicatePositions(values, index, type) {
        const positions = [];
        const seen = new Map();
        
        values.forEach((value, idx) => {
            if (value !== 0) {
                if (seen.has(value)) {
                    seen.get(value).push(idx);
                } else {
                    seen.set(value, [idx]);
                }
            }
        });
        
        for (const [value, indices] of seen.entries()) {
            if (indices.length > 1) {
                indices.forEach(idx => {
                    if (type === 'row') {
                        positions.push([index, idx]);
                    } else if (type === 'column') {
                        positions.push([idx, index]);
                    }
                });
            }
        }
        
        return positions;
    }

    countSolutions(grid, config, solutions, maxSolutions) {
        if (solutions.length >= maxSolutions) return;

        const emptyCell = this.findEmptyCell(grid, config);
        if (!emptyCell) {
            solutions.push(grid.map(row => [...row]));
            return;
        }

        const [row, col] = emptyCell;
        for (let value = 1; value <= config.maxValue; value++) {
            const conflicts = this.validateCellConstraints(grid, row, col, value, config);
            if (conflicts.length === 0) {
                grid[row][col] = value;
                this.countSolutions(grid, config, solutions, maxSolutions);
                grid[row][col] = 0;
                
                if (solutions.length >= maxSolutions) break;
            }
        }
    }

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

    hashGrid(grid) {
        return grid.map(row => row.join(',')).join('|');
    }

    /**
     * Clear validation caches (call when grid changes significantly)
     */
    clearCaches() {
        this.validationCache.clear();
        this.conflictCache.clear();
        this.lastValidationHash = null;
    }

    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        return {
            validationCacheSize: this.validationCache.size,
            conflictCacheSize: this.conflictCache.size,
            lastValidationHash: this.lastValidationHash
        };
    }
}

export default SudokuValidator;