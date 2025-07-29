/**
 * Sudoku Hint Engine
 * Progressive hint system with technique-based suggestions and educational explanations
 * Implements various Sudoku solving techniques from basic to advanced
 */

class SudokuHints {
    constructor() {
        this.gridConfigs = {
            4: { size: 4, boxWidth: 2, boxHeight: 2, maxValue: 4 },
            6: { size: 6, boxWidth: 3, boxHeight: 2, maxValue: 6 },
            9: { size: 9, boxWidth: 3, boxHeight: 3, maxValue: 9 },
            16: { size: 16, boxWidth: 4, boxHeight: 4, maxValue: 16 }
        };

        this.hintLevels = {
            highlight: 1,    // Just highlight related cells
            suggestion: 2,   // Show possible values
            technique: 3,    // Explain the technique
            solution: 4      // Show the answer
        };

        this.techniques = [
            'nakedSingle',
            'hiddenSingle', 
            'nakedPair',
            'hiddenPair',
            'pointingPair',
            'boxLineReduction',
            'nakedTriple',
            'hiddenTriple',
            'xWing',
            'swordfish',
            'yWing',
            'simpleColoring',
            'multipleColoring'
        ];

        this.hintHistory = [];
        this.currentHintLevel = this.hintLevels.highlight;
    }

    /**
     * Get progressive hint for current puzzle state
     * @param {number[][]} grid - Current puzzle grid
     * @param {number} size - Grid size
     * @param {number} level - Hint level (1-4)
     * @returns {Object} Hint information
     */
    getHint(grid, size = 9, level = null) {
        try {
            const config = this.gridConfigs[size];
            if (!config) {
                throw new Error(`Unsupported grid size: ${size}`);
            }

            const hintLevel = level || this.currentHintLevel;
            const possibleMoves = this.analyzePossibleMoves(grid, config);

            if (possibleMoves.length === 0) {
                return {
                    type: 'no_moves',
                    message: 'No obvious moves available. The puzzle may require advanced techniques.',
                    level: hintLevel,
                    techniques: []
                };
            }

            // Find best hint based on level and available techniques
            const hint = this.findBestHint(grid, config, possibleMoves, hintLevel);
            
            // Track hint history
            this.hintHistory.push({
                timestamp: Date.now(),
                hint: hint,
                level: hintLevel,
                gridState: this.hashGrid(grid)
            });

            return hint;

        } catch (error) {
            return {
                type: 'error',
                message: `Hint generation failed: ${error.message}`,
                level: 1,
                techniques: []
            };
        }
    }

    /**
     * Get hint for specific cell
     * @param {number[][]} grid - Current grid
     * @param {number} row - Target row
     * @param {number} col - Target column  
     * @param {number} size - Grid size
     * @returns {Object} Cell-specific hint
     */
    getCellHint(grid, row, col, size = 9) {
        try {
            const config = this.gridConfigs[size];
            
            if (grid[row][col] !== 0) {
                return {
                    type: 'cell_filled',
                    message: 'This cell is already filled',
                    position: [row, col],
                    value: grid[row][col]
                };
            }

            const possibleValues = this.getPossibleValues(grid, row, col, config);
            
            if (possibleValues.length === 0) {
                return {
                    type: 'no_valid_values',
                    message: 'No valid values for this cell. Check for conflicts.',
                    position: [row, col],
                    conflicts: this.findCellConflicts(grid, row, col, config)
                };
            }

            if (possibleValues.length === 1) {
                return {
                    type: 'naked_single',
                    message: `This cell can only be ${possibleValues[0]} (Naked Single)`,
                    position: [row, col],
                    value: possibleValues[0],
                    technique: 'nakedSingle',
                    explanation: 'Only one value is possible for this cell based on row, column, and box constraints.'
                };
            }

            // Check for hidden singles
            const hiddenSingle = this.checkHiddenSingle(grid, row, col, config);
            if (hiddenSingle) {
                return hiddenSingle;
            }

            return {
                type: 'multiple_candidates',
                message: `This cell has ${possibleValues.length} possible values: ${possibleValues.join(', ')}`,
                position: [row, col],
                candidates: possibleValues,
                techniques: this.suggestTechniques(grid, row, col, config)
            };

        } catch (error) {
            return {
                type: 'error',
                message: error.message,
                position: [row, col]
            };
        }
    }

    /**
     * Analyze all possible moves in current state
     */
    analyzePossibleMoves(grid, config) {
        const moves = [];

        for (let row = 0; row < config.size; row++) {
            for (let col = 0; col < config.size; col++) {
                if (grid[row][col] === 0) {
                    const possibleValues = this.getPossibleValues(grid, row, col, config);
                    
                    for (const value of possibleValues) {
                        const move = {
                            position: [row, col],
                            value: value,
                            candidates: possibleValues.length,
                            techniques: this.identifyTechniques(grid, row, col, value, config)
                        };
                        moves.push(move);
                    }
                }
            }
        }

        return moves.sort((a, b) => {
            // Priority: fewer candidates first, then by technique complexity
            if (a.candidates !== b.candidates) {
                return a.candidates - b.candidates;
            }
            return a.techniques.length - b.techniques.length;
        });
    }

    /**
     * Find best hint based on level and available moves
     */
    findBestHint(grid, config, moves, level) {
        const easiestMove = moves[0];
        
        switch (level) {
            case this.hintLevels.highlight:
                return this.createHighlightHint(grid, easiestMove, config);
                
            case this.hintLevels.suggestion:
                return this.createSuggestionHint(grid, easiestMove, config);
                
            case this.hintLevels.technique:
                return this.createTechniqueHint(grid, easiestMove, config);
                
            case this.hintLevels.solution:
                return this.createSolutionHint(grid, easiestMove, config);
                
            default:
                return this.createHighlightHint(grid, easiestMove, config);
        }
    }

    /**
     * Create highlight-level hint (level 1)
     */
    createHighlightHint(grid, move, config) {
        const [row, col] = move.position;
        const relatedCells = this.getRelatedCells(row, col, config);
        
        return {
            type: 'highlight',
            message: 'Pay attention to the highlighted cells and their relationships.',
            level: this.hintLevels.highlight,
            targetCell: [row, col],
            highlightCells: relatedCells,
            techniques: ['observation']
        };
    }

    /**
     * Create suggestion-level hint (level 2)
     */
    createSuggestionHint(grid, move, config) {
        const [row, col] = move.position;
        const possibleValues = this.getPossibleValues(grid, row, col, config);
        
        return {
            type: 'suggestion',
            message: `Cell (${row + 1}, ${col + 1}) has ${possibleValues.length} possible values: ${possibleValues.join(', ')}`,
            level: this.hintLevels.suggestion,
            targetCell: [row, col],
            candidates: possibleValues,
            highlightCells: this.getRelatedCells(row, col, config),
            techniques: move.techniques
        };
    }

    /**
     * Create technique-level hint (level 3)
     */
    createTechniqueHint(grid, move, config) {
        const [row, col] = move.position;
        const technique = move.techniques[0] || 'nakedSingle';
        
        const explanations = {
            nakedSingle: `Cell (${row + 1}, ${col + 1}) can only be ${move.value} because all other values are eliminated by row, column, or box constraints.`,
            hiddenSingle: `Cell (${row + 1}, ${col + 1}) must be ${move.value} because it's the only cell in its row/column/box that can contain this value.`,
            nakedPair: `Cells form a naked pair, eliminating candidates from other cells.`,
            hiddenPair: `A hidden pair exists, allowing elimination of other candidates.`,
            pointingPair: `Values point in one direction, eliminating candidates from related cells.`
        };

        return {
            type: 'technique',
            message: explanations[technique] || 'Apply the identified solving technique.',
            level: this.hintLevels.technique,
            targetCell: [row, col],
            technique: technique,
            explanation: explanations[technique],
            value: move.value,
            highlightCells: this.getRelatedCells(row, col, config),
            eliminatedCandidates: this.findEliminatedCandidates(grid, row, col, move.value, config)
        };
    }

    /**
     * Create solution-level hint (level 4)
     */
    createSolutionHint(grid, move, config) {
        const [row, col] = move.position;
        
        return {
            type: 'solution',
            message: `Place ${move.value} in cell (${row + 1}, ${col + 1})`,
            level: this.hintLevels.solution,
            targetCell: [row, col],
            value: move.value,
            technique: move.techniques[0] || 'nakedSingle',
            confidence: this.calculateConfidence(grid, row, col, move.value, config)
        };
    }

    /**
     * Advanced solving techniques implementation
     */

    // Naked Single: Cell with only one possible value
    findNakedSingles(grid, config) {
        const nakedSingles = [];
        
        for (let row = 0; row < config.size; row++) {
            for (let col = 0; col < config.size; col++) {
                if (grid[row][col] === 0) {
                    const candidates = this.getPossibleValues(grid, row, col, config);
                    if (candidates.length === 1) {
                        nakedSingles.push({
                            position: [row, col],
                            value: candidates[0],
                            technique: 'nakedSingle'
                        });
                    }
                }
            }
        }
        
        return nakedSingles;
    }

    // Hidden Single: Value that can only go in one cell within a group
    findHiddenSingles(grid, config) {
        const hiddenSingles = [];
        
        // Check rows
        for (let row = 0; row < config.size; row++) {
            hiddenSingles.push(...this.findHiddenSinglesInGroup(grid, config, 'row', row));
        }
        
        // Check columns
        for (let col = 0; col < config.size; col++) {
            hiddenSingles.push(...this.findHiddenSinglesInGroup(grid, config, 'column', col));
        }
        
        // Check boxes
        for (let boxRow = 0; boxRow < config.size; boxRow += config.boxHeight) {
            for (let boxCol = 0; boxCol < config.size; boxCol += config.boxWidth) {
                hiddenSingles.push(...this.findHiddenSinglesInGroup(grid, config, 'box', [boxRow, boxCol]));
            }
        }
        
        return hiddenSingles;
    }

    findHiddenSinglesInGroup(grid, config, groupType, groupIndex) {
        const hiddenSingles = [];
        const cells = this.getGroupCells(config, groupType, groupIndex);
        
        for (let value = 1; value <= config.maxValue; value++) {
            const possibleCells = cells.filter(([row, col]) => {
                return grid[row][col] === 0 && 
                       this.getPossibleValues(grid, row, col, config).includes(value);
            });
            
            if (possibleCells.length === 1) {
                const [row, col] = possibleCells[0];
                hiddenSingles.push({
                    position: [row, col],
                    value: value,
                    technique: 'hiddenSingle',
                    groupType: groupType,
                    groupIndex: groupIndex
                });
            }
        }
        
        return hiddenSingles;
    }

    // Naked Pairs: Two cells with identical candidate pairs
    findNakedPairs(grid, config) {
        const nakedPairs = [];
        
        // Check rows
        for (let row = 0; row < config.size; row++) {
            nakedPairs.push(...this.findNakedPairsInGroup(grid, config, 'row', row));
        }
        
        // Check columns
        for (let col = 0; col < config.size; col++) {
            nakedPairs.push(...this.findNakedPairsInGroup(grid, config, 'column', col));
        }
        
        // Check boxes
        for (let boxRow = 0; boxRow < config.size; boxRow += config.boxHeight) {
            for (let boxCol = 0; boxCol < config.size; boxCol += config.boxWidth) {
                nakedPairs.push(...this.findNakedPairsInGroup(grid, config, 'box', [boxRow, boxCol]));
            }
        }
        
        return nakedPairs;
    }

    findNakedPairsInGroup(grid, config, groupType, groupIndex) {
        const nakedPairs = [];
        const cells = this.getGroupCells(config, groupType, groupIndex);
        const emptyCells = cells.filter(([row, col]) => grid[row][col] === 0);
        
        for (let i = 0; i < emptyCells.length - 1; i++) {
            for (let j = i + 1; j < emptyCells.length; j++) {
                const [row1, col1] = emptyCells[i];
                const [row2, col2] = emptyCells[j];
                
                const candidates1 = this.getPossibleValues(grid, row1, col1, config);
                const candidates2 = this.getPossibleValues(grid, row2, col2, config);
                
                if (candidates1.length === 2 && candidates2.length === 2 &&
                    this.arraysEqual(candidates1, candidates2)) {
                    
                    nakedPairs.push({
                        positions: [[row1, col1], [row2, col2]],
                        values: candidates1,
                        technique: 'nakedPair',
                        groupType: groupType,
                        groupIndex: groupIndex,
                        eliminationTargets: this.findEliminationTargets(
                            cells, [[row1, col1], [row2, col2]], candidates1, grid, config
                        )
                    });
                }
            }
        }
        
        return nakedPairs;
    }

    /**
     * Utility methods
     */
    getPossibleValues(grid, row, col, config) {
        if (grid[row][col] !== 0) return [];
        
        const possible = [];
        
        for (let value = 1; value <= config.maxValue; value++) {
            if (this.isValidPlacement(grid, row, col, value, config)) {
                possible.push(value);
            }
        }
        
        return possible;
    }

    isValidPlacement(grid, row, col, value, config) {
        // Check row
        for (let c = 0; c < config.size; c++) {
            if (c !== col && grid[row][c] === value) return false;
        }
        
        // Check column
        for (let r = 0; r < config.size; r++) {
            if (r !== row && grid[r][col] === value) return false;
        }
        
        // Check box
        const boxRow = Math.floor(row / config.boxHeight) * config.boxHeight;
        const boxCol = Math.floor(col / config.boxWidth) * config.boxWidth;
        
        for (let r = boxRow; r < boxRow + config.boxHeight; r++) {
            for (let c = boxCol; c < boxCol + config.boxWidth; c++) {
                if ((r !== row || c !== col) && grid[r][c] === value) return false;
            }
        }
        
        return true;
    }

    getRelatedCells(row, col, config) {
        const related = new Set();
        
        // Add row cells
        for (let c = 0; c < config.size; c++) {
            if (c !== col) related.add(`${row},${c}`);
        }
        
        // Add column cells
        for (let r = 0; r < config.size; r++) {
            if (r !== row) related.add(`${r},${col}`);
        }
        
        // Add box cells
        const boxRow = Math.floor(row / config.boxHeight) * config.boxHeight;
        const boxCol = Math.floor(col / config.boxWidth) * config.boxWidth;
        
        for (let r = boxRow; r < boxRow + config.boxHeight; r++) {
            for (let c = boxCol; c < boxCol + config.boxWidth; c++) {
                if (r !== row || c !== col) {
                    related.add(`${r},${c}`);
                }
            }
        }
        
        return Array.from(related).map(pos => {
            const [r, c] = pos.split(',').map(Number);
            return [r, c];
        });
    }

    getGroupCells(config, groupType, groupIndex) {
        const cells = [];
        
        switch (groupType) {
            case 'row':
                for (let col = 0; col < config.size; col++) {
                    cells.push([groupIndex, col]);
                }
                break;
                
            case 'column':
                for (let row = 0; row < config.size; row++) {
                    cells.push([row, groupIndex]);
                }
                break;
                
            case 'box':
                const [boxRow, boxCol] = groupIndex;
                for (let r = boxRow; r < boxRow + config.boxHeight; r++) {
                    for (let c = boxCol; c < boxCol + config.boxWidth; c++) {
                        cells.push([r, c]);
                    }
                }
                break;
        }
        
        return cells;
    }

    identifyTechniques(grid, row, col, value, config) {
        const techniques = [];
        
        const candidates = this.getPossibleValues(grid, row, col, config);
        
        if (candidates.length === 1) {
            techniques.push('nakedSingle');
        }
        
        // Check for hidden single
        if (this.isHiddenSingle(grid, row, col, value, config)) {
            techniques.push('hiddenSingle');
        }
        
        return techniques;
    }

    isHiddenSingle(grid, row, col, value, config) {
        // Check if this is the only cell in row that can have this value
        let canPlaceInRow = 0;
        for (let c = 0; c < config.size; c++) {
            if (grid[row][c] === 0 && this.isValidPlacement(grid, row, c, value, config)) {
                canPlaceInRow++;
            }
        }
        if (canPlaceInRow === 1) return true;
        
        // Check column
        let canPlaceInCol = 0;
        for (let r = 0; r < config.size; r++) {
            if (grid[r][col] === 0 && this.isValidPlacement(grid, r, col, value, config)) {
                canPlaceInCol++;
            }
        }
        if (canPlaceInCol === 1) return true;
        
        // Check box
        const boxRow = Math.floor(row / config.boxHeight) * config.boxHeight;
        const boxCol = Math.floor(col / config.boxWidth) * config.boxWidth;
        
        let canPlaceInBox = 0;
        for (let r = boxRow; r < boxRow + config.boxHeight; r++) {
            for (let c = boxCol; c < boxCol + config.boxWidth; c++) {
                if (grid[r][c] === 0 && this.isValidPlacement(grid, r, c, value, config)) {
                    canPlaceInBox++;
                }
            }
        }
        
        return canPlaceInBox === 1;
    }

    checkHiddenSingle(grid, row, col, config) {
        const candidates = this.getPossibleValues(grid, row, col, config);
        
        for (const value of candidates) {
            if (this.isHiddenSingle(grid, row, col, value, config)) {
                return {
                    type: 'hidden_single',
                    message: `Cell (${row + 1}, ${col + 1}) must be ${value} (Hidden Single)`,
                    position: [row, col],
                    value: value,
                    technique: 'hiddenSingle',
                    explanation: 'This is the only cell in its row, column, or box that can contain this value.'
                };
            }
        }
        
        return null;
    }

    findCellConflicts(grid, row, col, config) {
        const conflicts = [];
        const relatedCells = this.getRelatedCells(row, col, config);
        
        for (const [r, c] of relatedCells) {
            const value = grid[r][c];
            if (value !== 0) {
                const relationship = this.getCellRelationship(row, col, r, c, config);
                conflicts.push({
                    position: [r, c],
                    value: value,
                    relationship: relationship
                });
            }
        }
        
        return conflicts;
    }

    getCellRelationship(row1, col1, row2, col2, config) {
        if (row1 === row2) return 'same_row';
        if (col1 === col2) return 'same_column';
        
        const box1Row = Math.floor(row1 / config.boxHeight);
        const box1Col = Math.floor(col1 / config.boxWidth);
        const box2Row = Math.floor(row2 / config.boxHeight);
        const box2Col = Math.floor(col2 / config.boxWidth);
        
        if (box1Row === box2Row && box1Col === box2Col) return 'same_box';
        
        return 'unrelated';
    }

    suggestTechniques(grid, row, col, config) {
        const suggestions = [];
        const candidates = this.getPossibleValues(grid, row, col, config);
        
        if (candidates.length === 1) {
            suggestions.push('Look for naked singles');
        } else if (candidates.length === 2) {
            suggestions.push('Consider naked pairs or hidden pairs');
        } else {
            suggestions.push('Look for elimination techniques');
            suggestions.push('Consider advanced solving methods');
        }
        
        return suggestions;
    }

    findEliminatedCandidates(grid, row, col, value, config) {
        const eliminated = [];
        const relatedCells = this.getRelatedCells(row, col, config);
        
        for (const [r, c] of relatedCells) {
            if (grid[r][c] === 0) {
                const candidates = this.getPossibleValues(grid, r, c, config);
                if (candidates.includes(value)) {
                    eliminated.push({
                        position: [r, c],
                        value: value,
                        reason: this.getCellRelationship(row, col, r, c, config)
                    });
                }
            }
        }
        
        return eliminated;
    }

    findEliminationTargets(cells, pairCells, values, grid, config) {
        const targets = [];
        
        for (const [row, col] of cells) {
            if (!pairCells.some(([r, c]) => r === row && c === col) && grid[row][col] === 0) {
                const candidates = this.getPossibleValues(grid, row, col, config);
                const eliminatableValues = candidates.filter(v => values.includes(v));
                
                if (eliminatableValues.length > 0) {
                    targets.push({
                        position: [row, col],
                        eliminatedValues: eliminatableValues
                    });
                }
            }
        }
        
        return targets;
    }

    calculateConfidence(grid, row, col, value, config) {
        const techniques = this.identifyTechniques(grid, row, col, value, config);
        const candidates = this.getPossibleValues(grid, row, col, config);
        
        if (candidates.length === 1) return 1.0;
        if (techniques.includes('hiddenSingle')) return 0.95;
        if (techniques.length > 0) return 0.8;
        
        return 0.5;
    }

    arraysEqual(arr1, arr2) {
        return arr1.length === arr2.length && 
               arr1.every((val, idx) => val === arr2[idx]);
    }

    hashGrid(grid) {
        return grid.map(row => row.join(',')).join('|');
    }

    /**
     * Progressive hint system methods
     */
    increaseHintLevel() {
        if (this.currentHintLevel < this.hintLevels.solution) {
            this.currentHintLevel++;
        }
        return this.currentHintLevel;
    }

    decreaseHintLevel() {
        if (this.currentHintLevel > this.hintLevels.highlight) {
            this.currentHintLevel--;
        }
        return this.currentHintLevel;
    }

    resetHintLevel() {
        this.currentHintLevel = this.hintLevels.highlight;
        return this.currentHintLevel;
    }

    getHintHistory() {
        return [...this.hintHistory];
    }

    clearHintHistory() {
        this.hintHistory = [];
    }

    getAvailableTechniques() {
        return [...this.techniques];
    }

    /**
     * Educational features
     */
    explainTechnique(technique) {
        const explanations = {
            nakedSingle: {
                name: 'Naked Single',
                description: 'A cell that has only one possible value based on the current state of the puzzle.',
                difficulty: 'Beginner',
                example: 'If a cell can only contain the number 5 because all other numbers (1-4, 6-9) are already present in its row, column, or box.'
            },
            hiddenSingle: {
                name: 'Hidden Single',
                description: 'A value that can only be placed in one specific cell within a row, column, or box.',
                difficulty: 'Beginner',
                example: 'If the number 7 can only go in one cell within a particular box, even though that cell has multiple candidates.'
            },
            nakedPair: {
                name: 'Naked Pair',
                description: 'Two cells in the same group that contain exactly the same two candidates.',
                difficulty: 'Intermediate',
                example: 'Two cells both containing only {2,8} means these numbers can be eliminated from other cells in the same group.'
            },
            hiddenPair: {
                name: 'Hidden Pair',
                description: 'Two numbers that can only appear in two specific cells within a group.',
                difficulty: 'Intermediate',
                example: 'If numbers 3 and 7 can only go in two specific cells of a row, these cells form a hidden pair.'
            }
        };

        return explanations[technique] || {
            name: technique,
            description: 'Advanced solving technique',
            difficulty: 'Advanced',
            example: 'Requires pattern recognition and logical deduction.'
        };
    }
}

export default SudokuHints;