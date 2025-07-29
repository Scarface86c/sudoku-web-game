/**
 * SuperSudoku Cross-Browser Testing Suite
 * Tests for compatibility across different browsers and devices
 * 
 * Test Coverage:
 * - Chrome, Firefox, Safari, Edge compatibility
 * - Mobile browsers (iOS Safari, Android Chrome)
 * - Feature detection and polyfills
 * - PWA functionality across browsers
 * - LocalStorage and fallback behavior
 * - CSS Grid and Flexbox support
 */

class CrossBrowserTestSuite {
    constructor() {
        this.testResults = [];
        this.browserInfo = this.detectBrowser();
        this.deviceInfo = this.detectDevice();
    }

    /**
     * Detect current browser and version
     */
    detectBrowser() {
        const userAgent = navigator.userAgent;
        const browser = {
            name: 'Unknown',
            version: 'Unknown',
            engine: 'Unknown'
        };

        // Chrome
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            browser.name = 'Chrome';
            browser.engine = 'Blink';
            const match = userAgent.match(/Chrome\/([0-9.]+)/);
            if (match) browser.version = match[1];
        }
        // Firefox
        else if (userAgent.includes('Firefox')) {
            browser.name = 'Firefox';
            browser.engine = 'Gecko';
            const match = userAgent.match(/Firefox\/([0-9.]+)/);
            if (match) browser.version = match[1];
        }
        // Safari
        else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browser.name = 'Safari';
            browser.engine = 'WebKit';
            const match = userAgent.match(/Safari\/([0-9.]+)/);
            if (match) browser.version = match[1];
        }
        // Edge
        else if (userAgent.includes('Edg')) {
            browser.name = 'Edge';
            browser.engine = 'Blink';
            const match = userAgent.match(/Edg\/([0-9.]+)/);
            if (match) browser.version = match[1];
        }

        return browser;
    }

    /**
     * Detect device type and capabilities
     */
    detectDevice() {
        const device = {
            type: 'desktop',
            touchSupport: 'ontouchstart' in window,
            screenSize: {
                width: window.screen.width,
                height: window.screen.height
            },
            viewportSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            pixelRatio: window.devicePixelRatio || 1
        };

        // Mobile detection
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            device.type = 'mobile';
        } else if (/iPad|tablet/i.test(navigator.userAgent)) {
            device.type = 'tablet';
        }

        return device;
    }

    /**
     * Test essential JavaScript features
     */
    async testJavaScriptFeatures() {
        console.log('🧪 Testing JavaScript Features...');
        
        try {
            const features = {
                // ES6+ Features
                arrowFunctions: () => true,
                constLet: typeof const !== 'undefined',
                templateLiterals: `template ${true}` === 'template true',
                destructuring: (() => { try { const [a] = [1]; return true; } catch { return false; } })(),
                classes: typeof class {} === 'function',
                
                // DOM APIs
                querySelector: typeof document.querySelector === 'function',
                addEventListener: typeof document.addEventListener === 'function',
                localStorage: typeof Storage !== 'undefined',
                
                // Modern APIs
                fetch: typeof fetch === 'function',
                promise: typeof Promise === 'function',
                asyncAwait: (async () => true) instanceof Promise,
                
                // CSS Features
                cssGrid: CSS.supports('display', 'grid'),
                cssFlexbox: CSS.supports('display', 'flex'),
                cssCustomProperties: CSS.supports('--test', 'value'),
                
                // Browser APIs
                serviceWorker: 'serviceWorker' in navigator,
                webManifest: 'onbeforeinstallprompt' in window,
                notification: 'Notification' in window
            };

            // Check critical features
            const criticalFeatures = [
                'querySelector', 'addEventListener', 'promise', 'cssFlexbox', 'localStorage'
            ];

            criticalFeatures.forEach(feature => {
                this.assert(features[feature], `Critical feature ${feature} must be supported`);
            });

            // Log feature support
            console.log('Browser Feature Support:', features);

            this.addTestResult('JavaScript Features', 'PASS', 
                `All critical features supported in ${this.browserInfo.name} ${this.browserInfo.version}`);
            
        } catch (error) {
            this.addTestResult('JavaScript Features', 'FAIL', error.message);
        }
    }

    /**
     * Test localStorage functionality across browsers
     */
    async testLocalStorageCompatibility() {
        console.log('🧪 Testing localStorage Compatibility...');
        
        try {
            // Test basic localStorage
            if (typeof Storage === 'undefined' || !window.localStorage) {
                throw new Error('localStorage not available');
            }

            // Test write/read
            const testKey = 'browser_test_' + Date.now();
            const testValue = JSON.stringify({ test: true, timestamp: Date.now() });
            
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            
            this.assert(retrieved === testValue, 'localStorage read/write should work');
            
            // Test JSON parsing
            const parsed = JSON.parse(retrieved);
            this.assert(parsed.test === true, 'JSON parsing should work');
            
            // Test quota handling
            try {
                // Attempt to store large data
                const largeData = 'x'.repeat(1024 * 1024); // 1MB string
                localStorage.setItem('large_test_key', largeData);
                localStorage.removeItem('large_test_key');
            } catch (quotaError) {
                console.warn('LocalStorage quota exceeded (expected on some browsers)');
            }
            
            // Cleanup
            localStorage.removeItem(testKey);

            this.addTestResult('localStorage Compatibility', 'PASS', 
                'localStorage works correctly across browsers');
            
        } catch (error) {
            this.addTestResult('localStorage Compatibility', 'FAIL', error.message);
        }
    }

    /**
     * Test CSS Grid and Flexbox support
     */
    async testCSSLayoutSupport() {
        console.log('🧪 Testing CSS Layout Support...');
        
        try {
            // Test CSS Grid
            const gridSupport = CSS.supports('display', 'grid');
            this.assert(gridSupport, 'CSS Grid should be supported');
            
            // Test Flexbox
            const flexSupport = CSS.supports('display', 'flex');
            this.assert(flexSupport, 'CSS Flexbox should be supported');
            
            // Test CSS Custom Properties
            const customPropsSupport = CSS.supports('--test', 'value');
            this.assert(customPropsSupport, 'CSS Custom Properties should be supported');
            
            // Test modern CSS features
            const modernFeatures = {
                cssGrid: CSS.supports('display', 'grid'),
                gap: CSS.supports('gap', '10px'),
                transform: CSS.supports('transform', 'translateX(10px)'),
                transition: CSS.supports('transition', 'all 0.3s'),
                borderRadius: CSS.supports('border-radius', '5px'),
                boxShadow: CSS.supports('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
            };

            Object.entries(modernFeatures).forEach(([feature, supported]) => {
                if (!supported) {
                    console.warn(`CSS feature ${feature} not supported`);
                }
            });

            this.addTestResult('CSS Layout Support', 'PASS', 
                'Essential CSS layout features are supported');
            
        } catch (error) {
            this.addTestResult('CSS Layout Support', 'FAIL', error.message);
        }
    }

    /**
     * Test PWA functionality
     */
    async testPWACompatibility() {
        console.log('🧪 Testing PWA Compatibility...');
        
        try {
            // Test Service Worker support
            const swSupport = 'serviceWorker' in navigator;
            console.log('Service Worker support:', swSupport);
            
            // Test Web App Manifest
            const manifestSupport = 'onbeforeinstallprompt' in window;
            console.log('Web App Manifest support:', manifestSupport);
            
            // Test if manifest is accessible
            let manifestLoaded = false;
            try {
                const response = await fetch('/manifest.json');
                if (response.ok) {
                    const manifest = await response.json();
                    manifestLoaded = manifest.name && manifest.short_name;
                }
            } catch (manifestError) {
                console.warn('Manifest fetch failed:', manifestError);
            }

            // Test notification support (optional for PWA)
            const notificationSupport = 'Notification' in window;
            console.log('Notification support:', notificationSupport);
            
            // Test cache API
            const cacheSupport = 'caches' in window;
            console.log('Cache API support:', cacheSupport);

            // PWA is functional if service worker is supported
            const pwaFunctional = swSupport && manifestLoaded;

            this.addTestResult('PWA Compatibility', pwaFunctional ? 'PASS' : 'PARTIAL', 
                `PWA features: SW=${swSupport}, Manifest=${manifestLoaded}, Cache=${cacheSupport}`);
            
        } catch (error) {
            this.addTestResult('PWA Compatibility', 'FAIL', error.message);
        }
    }

    /**
     * Test touch and mobile compatibility
     */
    async testMobileCompatibility() {
        console.log('🧪 Testing Mobile Compatibility...');
        
        try {
            const mobileFeatures = {
                touchEvents: 'ontouchstart' in window,
                pointerEvents: 'onpointerdown' in window,
                orientationChange: 'onorientationchange' in window,
                devicePixelRatio: window.devicePixelRatio > 1,
                viewport: document.querySelector('meta[name="viewport"]') !== null
            };

            console.log('Mobile features:', mobileFeatures);

            // Test touch target sizes (minimum 44px for accessibility)
            const testElement = document.createElement('button');
            testElement.className = 'number-btn';
            testElement.style.cssText = 'position: absolute; visibility: hidden;';
            document.body.appendChild(testElement);

            const computedStyle = window.getComputedStyle(testElement);
            const minHeight = parseInt(computedStyle.minHeight) || parseInt(computedStyle.height);
            
            this.assert(minHeight >= 44, 'Touch targets should be at least 44px');
            
            document.body.removeChild(testElement);

            // Test zoom behavior
            const viewportMeta = document.querySelector('meta[name="viewport"]');
            if (viewportMeta) {
                const content = viewportMeta.getAttribute('content');
                const hasUserScalable = content.includes('user-scalable=no');
                console.log('User scaling disabled:', hasUserScalable);
            }

            this.addTestResult('Mobile Compatibility', 'PASS', 
                `Mobile features functional on ${this.deviceInfo.type} device`);
            
        } catch (error) {
            this.addTestResult('Mobile Compatibility', 'FAIL', error.message);
        }
    }

    /**
     * Test event handling compatibility
     */
    async testEventHandling() {
        console.log('🧪 Testing Event Handling...');
        
        try {
            const eventTypes = ['click', 'touchstart', 'keydown', 'resize', 'load'];
            
            eventTypes.forEach(eventType => {
                // Test event creation
                const event = new Event(eventType);
                this.assert(event.type === eventType, `${eventType} event should be creatable`);
                
                // Test addEventListener
                const testElement = document.createElement('div');
                let eventFired = false;
                
                const handler = () => { eventFired = true; };
                testElement.addEventListener(eventType, handler);
                testElement.dispatchEvent(event);
                
                this.assert(eventFired, `${eventType} event should fire`);
                
                // Cleanup
                testElement.removeEventListener(eventType, handler);
            });

            // Test custom events
            const customEvent = new CustomEvent('test', { detail: { value: 42 } });
            this.assert(customEvent.detail.value === 42, 'Custom events should work');

            this.addTestResult('Event Handling', 'PASS', 
                'Event handling works correctly');
            
        } catch (error) {
            this.addTestResult('Event Handling', 'FAIL', error.message);
        }
    }

    /**
     * Test database functionality across browsers
     */
    async testDatabaseBrowserCompatibility() {
        console.log('🧪 Testing Database Browser Compatibility...');
        
        try {
            // Initialize database
            const db = new SuperSudokuDatabase();
            
            // Test basic operations
            const playerId = db.createPlayer('BrowserTestPlayer', 'test@browser.com');
            this.assert(playerId !== null, 'Player creation should work');
            
            const player = db.getPlayer(playerId);
            this.assert(player.name === 'BrowserTestPlayer', 'Player retrieval should work');
            
            // Test score operations
            const scoreData = {
                playerId: playerId,
                playerName: 'BrowserTestPlayer',
                gameMode: 'classic',
                gridSize: 9,
                difficulty: 'medium',
                time: 240,
                hints: 1,
                errors: 0,
                completed: true
            };
            
            const scoreId = db.saveScore(scoreData);
            this.assert(scoreId !== null, 'Score saving should work');
            
            const highScores = db.getHighScores('classic', 9, 'medium', 1);
            this.assert(highScores.length > 0, 'Score retrieval should work');
            
            // Test fallback behavior
            const status = db.getDatabaseStatus();
            this.assert(status.initialized, 'Database should be initialized');
            
            // Cleanup
            db.clearAllData();

            this.addTestResult('Database Browser Compatibility', 'PASS', 
                `Database operations work in ${this.browserInfo.name}`);
            
        } catch (error) {
            this.addTestResult('Database Browser Compatibility', 'FAIL', error.message);
        }
    }

    /**
     * Test performance across browsers
     */
    async testPerformance() {
        console.log('🧪 Testing Performance...');
        
        try {
            const startTime = performance.now();
            
            // Test DOM manipulation performance
            const container = document.createElement('div');
            document.body.appendChild(container);
            
            // Create multiple elements
            for (let i = 0; i < 100; i++) {
                const cell = document.createElement('div');
                cell.className = 'game-cell test-cell';
                cell.textContent = i.toString();
                container.appendChild(cell);
            }
            
            const domTime = performance.now() - startTime;
            
            // Test CSS operations
            const cssStartTime = performance.now();
            const cells = container.querySelectorAll('.test-cell');
            cells.forEach(cell => {
                cell.style.backgroundColor = '#ff0000';
                cell.style.color = '#ffffff';
                cell.style.borderRadius = '4px';
            });
            
            const cssTime = performance.now() - cssStartTime;
            
            // Cleanup
            document.body.removeChild(container);
            
            const totalTime = performance.now() - startTime;
            
            // Performance thresholds
            this.assert(domTime < 100, `DOM operations should be fast (${domTime.toFixed(2)}ms)`);
            this.assert(cssTime < 50, `CSS operations should be fast (${cssTime.toFixed(2)}ms)`);
            this.assert(totalTime < 200, `Total operations should be fast (${totalTime.toFixed(2)}ms)`);

            this.addTestResult('Performance', 'PASS', 
                `Performance acceptable: DOM=${domTime.toFixed(2)}ms, CSS=${cssTime.toFixed(2)}ms`);
            
        } catch (error) {
            this.addTestResult('Performance', 'FAIL', error.message);
        }
    }

    /**
     * Helper method to add test results
     */
    addTestResult(testName, status, message) {
        this.testResults.push({
            test: testName,
            status: status,
            message: message,
            browser: this.browserInfo,
            device: this.deviceInfo,
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
     * Run all cross-browser tests
     */
    async runAllTests() {
        console.log(`🧪 Starting Cross-Browser Test Suite on ${this.browserInfo.name} ${this.browserInfo.version}...`);
        
        try {
            await this.testJavaScriptFeatures();
            await this.testLocalStorageCompatibility();
            await this.testCSSLayoutSupport();
            await this.testPWACompatibility();
            await this.testMobileCompatibility();
            await this.testEventHandling();
            await this.testDatabaseBrowserCompatibility();
            await this.testPerformance();
            
        } catch (error) {
            console.error('Cross-browser test suite error:', error);
        }
        
        return this.generateTestReport();
    }

    /**
     * Generate comprehensive test report
     */
    generateTestReport() {
        const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
        const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
        const partialTests = this.testResults.filter(r => r.status === 'PARTIAL').length;
        const totalTests = this.testResults.length;
        
        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                partial: partialTests,
                successRate: totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) : 0
            },
            environment: {
                browser: this.browserInfo,
                device: this.deviceInfo,
                userAgent: navigator.userAgent
            },
            results: this.testResults,
            timestamp: new Date().toISOString()
        };
        
        console.log('📊 Cross-Browser Test Results:', report);
        return report;
    }
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrossBrowserTestSuite;
} else {
    window.CrossBrowserTestSuite = CrossBrowserTestSuite;
}