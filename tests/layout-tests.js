/**
 * SuperSudoku Layout Testing Suite
 * Tests for Issue #7 - Horizontal Layout in Kids and Symbol Modes
 * 
 * Test Coverage:
 * - Horizontal arrangement of number buttons in Kids mode
 * - Horizontal arrangement of number buttons in Symbol mode
 * - Responsive design across different screen sizes
 * - CSS layout integrity
 * - Grid layout preservation in Classic mode
 */

class LayoutTestSuite {
    constructor() {
        this.testResults = [];
        this.originalDocument = document;
        this.mockElements = new Map();
    }

    /**
     * Setup test environment with DOM mocking
     */
    setup() {
        // Create mock DOM elements for testing
        this.createMockElements();
    }

    /**
     * Create mock DOM elements
     */
    createMockElements() {
        // Mock game mode select
        const gameModeSelect = document.createElement('select');
        gameModeSelect.id = 'game-mode-select';
        gameModeSelect.innerHTML = `
            <option value="classic">Classic Numbers</option>
            <option value="kids">Kids Mode (Colors)</option>
            <option value="symbols">Symbol Mode</option>
        `;
        
        // Mock grid size select
        const gridSizeSelect = document.createElement('select');
        gridSizeSelect.id = 'grid-size-select';
        gridSizeSelect.innerHTML = `
            <option value="4">4×4</option>
            <option value="6">6×6</option>
            <option value="9" selected>9×9</option>
            <option value="16">16×16</option>
        `;
        
        // Mock number buttons container
        const numberButtons = document.createElement('div');
        numberButtons.className = 'number-buttons';
        
        // Mock game board
        const gameBoard = document.createElement('div');
        gameBoard.className = 'game-board';
        gameBoard.setAttribute('data-grid-size', '9');
        
        // Add elements to DOM
        document.body.appendChild(gameModeSelect);
        document.body.appendChild(gridSizeSelect);
        document.body.appendChild(numberButtons);
        document.body.appendChild(gameBoard);
        
        this.mockElements.set('gameModeSelect', gameModeSelect);
        this.mockElements.set('gridSizeSelect', gridSizeSelect);
        this.mockElements.set('numberButtons', numberButtons);
        this.mockElements.set('gameBoard', gameBoard);
    }

    /**
     * Test horizontal layout in Kids mode
     */
    async testKidsModeHorizontalLayout() {
        console.log('🧪 Testing Kids Mode Horizontal Layout...');
        
        try {
            // Initialize Kids Mode
            const kidsMode = new SuperSudokuKidsMode();
            
            // Set to kids mode
            kidsMode.setGameMode('kids');
            
            // Test different grid sizes
            const gridSizes = [4, 6, 9];
            
            for (const gridSize of gridSizes) {
                this.mockElements.get('gridSizeSelect').value = gridSize;
                kidsMode.updateNumberButtons();
                
                const numberButtons = this.mockElements.get('numberButtons');
                const colorRows = numberButtons.querySelectorAll('.color-row');
                
                // Verify horizontal layout
                this.assert(colorRows.length === 1, `Kids mode ${gridSize}x${gridSize} should have one horizontal row`);
                
                const colorButtons = colorRows[0].querySelectorAll('.color-btn');
                this.assert(colorButtons.length === gridSize, `Should have ${gridSize} color buttons`);
                
                // Verify CSS layout properties
                const computedStyle = window.getComputedStyle(colorRows[0]);
                this.assert(computedStyle.display === 'flex' || computedStyle.display === 'grid', 
                    'Color row should use flex or grid display');
                
                // Test button functionality
                colorButtons.forEach((button, index) => {
                    this.assert(button.dataset.value == (index + 1), 
                        `Color button ${index} should have correct value`);
                    this.assert(button.style.backgroundColor, 
                        `Color button ${index} should have background color`);
                });
            }
            
            this.addTestResult('Kids Mode Horizontal Layout', 'PASS', 
                'Kids mode displays color buttons in horizontal layout correctly');
            
        } catch (error) {
            this.addTestResult('Kids Mode Horizontal Layout', 'FAIL', error.message);
        }
    }

    /**
     * Test horizontal layout in Symbol mode
     */
    async testSymbolModeHorizontalLayout() {
        console.log('🧪 Testing Symbol Mode Horizontal Layout...');
        
        try {
            const kidsMode = new SuperSudokuKidsMode();
            
            // Set to symbols mode
            kidsMode.setGameMode('symbols');
            
            // Test different grid sizes
            const gridSizes = [4, 6, 9, 16];
            
            for (const gridSize of gridSizes) {
                this.mockElements.get('gridSizeSelect').value = gridSize;
                kidsMode.updateNumberButtons();
                
                const numberButtons = this.mockElements.get('numberButtons');
                const symbolRows = numberButtons.querySelectorAll('.symbol-row');
                
                // Verify horizontal layout
                this.assert(symbolRows.length === 1, `Symbol mode ${gridSize}x${gridSize} should have one horizontal row`);
                
                const symbolButtons = symbolRows[0].querySelectorAll('.symbol-btn');
                this.assert(symbolButtons.length === gridSize, `Should have ${gridSize} symbol buttons`);
                
                // Verify symbols are displayed
                symbolButtons.forEach((button, index) => {
                    this.assert(button.textContent.length > 0, 
                        `Symbol button ${index} should display a symbol`);
                    this.assert(button.dataset.value == (index + 1), 
                        `Symbol button ${index} should have correct value`);
                });
            }
            
            this.addTestResult('Symbol Mode Horizontal Layout', 'PASS', 
                'Symbol mode displays buttons in horizontal layout correctly');
            
        } catch (error) {
            this.addTestResult('Symbol Mode Horizontal Layout', 'FAIL', error.message);
        }
    }

    /**
     * Test Classic mode layout remains unchanged
     */
    async testClassicModeLayout() {
        console.log('🧪 Testing Classic Mode Layout Preservation...');
        
        try {
            const kidsMode = new SuperSudokuKidsMode();
            
            // Set to classic mode
            kidsMode.setGameMode('classic');
            
            // Test 9x9 grid (single row)
            this.mockElements.get('gridSizeSelect').value = 9;
            kidsMode.updateNumberButtons();
            
            let numberButtons = this.mockElements.get('numberButtons');
            let numberRows = numberButtons.querySelectorAll('.number-row');
            
            this.assert(numberRows.length === 1, 'Classic 9x9 should have one row');
            
            const buttons9x9 = numberRows[0].querySelectorAll('.number-btn');
            this.assert(buttons9x9.length === 9, 'Should have 9 number buttons');
            
            // Test 16x16 grid (two rows)
            this.mockElements.get('gridSizeSelect').value = 16;
            kidsMode.updateNumberButtons();
            
            numberButtons = this.mockElements.get('numberButtons');
            numberRows = numberButtons.querySelectorAll('.number-row');
            
            this.assert(numberRows.length === 2, 'Classic 16x16 should have two rows');
            
            // Verify first row has numbers 1-9
            const firstRowButtons = numberRows[0].querySelectorAll('.number-btn');
            this.assert(firstRowButtons.length === 9, 'First row should have 9 buttons');
            
            // Verify second row has letters A-G
            const secondRowButtons = numberRows[1].querySelectorAll('.number-btn');
            this.assert(secondRowButtons.length === 7, 'Second row should have 7 buttons');
            
            this.addTestResult('Classic Mode Layout', 'PASS', 
                'Classic mode layout remains unchanged');
            
        } catch (error) {
            this.addTestResult('Classic Mode Layout', 'FAIL', error.message);
        }
    }

    /**
     * Test responsive design behavior
     */
    async testResponsiveLayout() {
        console.log('🧪 Testing Responsive Layout...');
        
        try {
            // Simulate different viewport sizes
            const viewportSizes = [
                { width: 1200, height: 800, name: 'Desktop' },
                { width: 768, height: 1024, name: 'Tablet' },
                { width: 480, height: 800, name: 'Mobile' },
                { width: 320, height: 568, name: 'Small Mobile' }
            ];
            
            for (const viewport of viewportSizes) {
                // Mock viewport size change
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: viewport.width,
                });
                Object.defineProperty(window, 'innerHeight', {
                    writable: true,
                    configurable: true,
                    value: viewport.height,
                });
                
                // Trigger resize event
                window.dispatchEvent(new Event('resize'));
                
                // Test layout adjustments
                const numberButtons = this.mockElements.get('numberButtons');
                const computedStyle = window.getComputedStyle(numberButtons);
                
                // Verify responsive grid columns
                if (viewport.width <= 768) {
                    // Mobile layout should adjust grid columns
                    this.assert(computedStyle.gridTemplateColumns.includes('1fr'), 
                        `${viewport.name} should have responsive grid columns`);
                }
                
                // Test button sizes remain accessible
                const buttons = numberButtons.querySelectorAll('.number-btn, .color-btn, .symbol-btn');
                buttons.forEach(button => {
                    const buttonStyle = window.getComputedStyle(button);
                    const minHeight = parseInt(buttonStyle.minHeight) || 44;
                    this.assert(minHeight >= 44, 
                        `Button should maintain minimum touch target size on ${viewport.name}`);
                });
            }
            
            this.addTestResult('Responsive Layout', 'PASS', 
                'Layout responds correctly to different viewport sizes');
            
        } catch (error) {
            this.addTestResult('Responsive Layout', 'FAIL', error.message);
        }
    }

    /**
     * Test CSS Grid and Flex properties
     */
    async testCSSLayoutProperties() {
        console.log('🧪 Testing CSS Layout Properties...');
        
        try {
            const kidsMode = new SuperSudokuKidsMode();
            
            // Test Kids mode CSS
            kidsMode.setGameMode('kids');
            kidsMode.updateNumberButtons();
            
            const numberButtons = this.mockElements.get('numberButtons');
            const colorRow = numberButtons.querySelector('.color-row');
            
            if (colorRow) {
                const colorRowStyle = window.getComputedStyle(colorRow);
                
                // Verify layout properties
                this.assert(
                    colorRowStyle.display === 'flex' || 
                    colorRowStyle.display === 'grid' || 
                    colorRowStyle.display === 'inline-flex',
                    'Color row should use appropriate display property'
                );
                
                // Test color button styling
                const colorButtons = colorRow.querySelectorAll('.color-btn');
                colorButtons.forEach(button => {
                    const buttonStyle = window.getComputedStyle(button);
                    this.assert(buttonStyle.backgroundColor !== 'rgba(0, 0, 0, 0)', 
                        'Color buttons should have background colors');
                });
            }
            
            // Test Symbol mode CSS
            kidsMode.setGameMode('symbols');
            kidsMode.updateNumberButtons();
            
            const symbolRow = numberButtons.querySelector('.symbol-row');
            if (symbolRow) {
                const symbolRowStyle = window.getComputedStyle(symbolRow);
                this.assert(
                    symbolRowStyle.display === 'flex' || 
                    symbolRowStyle.display === 'grid' || 
                    symbolRowStyle.display === 'inline-flex',
                    'Symbol row should use appropriate display property'
                );
            }
            
            this.addTestResult('CSS Layout Properties', 'PASS', 
                'CSS layout properties are correctly applied');
            
        } catch (error) {
            this.addTestResult('CSS Layout Properties', 'FAIL', error.message);
        }
    }

    /**
     * Test accessibility of horizontal layouts
     */
    async testLayoutAccessibility() {
        console.log('🧪 Testing Layout Accessibility...');
        
        try {
            const kidsMode = new SuperSudokuKidsMode();
            
            // Test Kids mode accessibility
            kidsMode.setGameMode('kids');
            kidsMode.updateNumberButtons();
            
            const numberButtons = this.mockElements.get('numberButtons');
            const colorButtons = numberButtons.querySelectorAll('.color-btn');
            
            colorButtons.forEach((button, index) => {
                // Check ARIA labels
                const ariaLabel = button.getAttribute('aria-label');
                this.assert(ariaLabel && ariaLabel.includes('Color'), 
                    `Color button ${index} should have descriptive aria-label`);
                
                // Check keyboard accessibility
                this.assert(button.tabIndex >= 0 || button.tabIndex === undefined, 
                    `Color button ${index} should be keyboard accessible`);
            });
            
            // Test Symbol mode accessibility
            kidsMode.setGameMode('symbols');
            kidsMode.updateNumberButtons();
            
            const symbolButtons = numberButtons.querySelectorAll('.symbol-btn');
            symbolButtons.forEach((button, index) => {
                const ariaLabel = button.getAttribute('aria-label');
                this.assert(ariaLabel && ariaLabel.includes('Symbol'), 
                    `Symbol button ${index} should have descriptive aria-label`);
            });
            
            this.addTestResult('Layout Accessibility', 'PASS', 
                'Horizontal layouts maintain proper accessibility');
            
        } catch (error) {
            this.addTestResult('Layout Accessibility', 'FAIL', error.message);
        }
    }

    /**
     * Cleanup test environment
     */
    teardown() {
        // Remove mock elements
        this.mockElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.mockElements.clear();
    }

    /**
     * Helper method to add test results
     */
    addTestResult(testName, status, message) {
        this.testResults.push({
            test: testName,
            status: status,
            message: message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Assert helper method
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    /**
     * Run all layout tests
     */
    async runAllTests() {
        console.log('🧪 Starting SuperSudoku Layout Test Suite...');
        this.setup();
        
        try {
            await this.testKidsModeHorizontalLayout();
            await this.testSymbolModeHorizontalLayout();
            await this.testClassicModeLayout();
            await this.testResponsiveLayout();
            await this.testCSSLayoutProperties();
            await this.testLayoutAccessibility();
            
        } catch (error) {
            console.error('Layout test suite error:', error);
        } finally {
            this.teardown();
        }
        
        return this.generateTestReport();
    }

    /**
     * Generate comprehensive test report
     */
    generateTestReport() {
        const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
        const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
        const totalTests = this.testResults.length;
        
        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) : 0
            },
            results: this.testResults,
            timestamp: new Date().toISOString()
        };
        
        console.log('📊 Layout Test Results:', report);
        return report;
    }
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayoutTestSuite;
} else {
    window.LayoutTestSuite = LayoutTestSuite;
}