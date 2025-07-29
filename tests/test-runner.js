/**
 * SuperSudoku Comprehensive Test Runner
 * Orchestrates all test suites and generates comprehensive reports
 * 
 * Runs tests for:
 * - Issue #8: Database/Highscore System
 * - Issue #7: Horizontal Layout
 * - Issue #6: Kids Mode Functionality
 * - Cross-browser compatibility
 * - Regression testing
 */

class SuperSudokuTestRunner {
    constructor() {
        this.testSuites = [];
        this.allResults = [];
        this.startTime = null;
        this.endTime = null;
    }

    /**
     * Initialize all test suites
     */
    initializeTestSuites() {
        this.testSuites = [
            {
                name: 'Database Tests (Issue #8)',
                suite: new DatabaseTestSuite(),
                priority: 'high',
                issueNumber: 8
            },
            {
                name: 'Layout Tests (Issue #7)',
                suite: new LayoutTestSuite(),
                priority: 'high',
                issueNumber: 7
            },
            {
                name: 'Kids Mode Tests (Issue #6)',
                suite: new KidsModeTestSuite(),
                priority: 'high',
                issueNumber: 6
            },
            {
                name: 'Cross-Browser Tests',
                suite: new CrossBrowserTestSuite(),
                priority: 'medium',
                issueNumber: null
            }
        ];
    }

    /**
     * Run all test suites
     */
    async runAllTests() {
        console.log('🚀 Starting SuperSudoku Comprehensive Test Suite...');
        console.log('=================================================');
        
        this.startTime = new Date();
        this.initializeTestSuites();

        const results = {
            overview: {
                totalSuites: this.testSuites.length,
                startTime: this.startTime.toISOString(),
                browser: this.getBrowserInfo(),
                device: this.getDeviceInfo()
            },
            suiteResults: [],
            summary: {},
            recommendations: []
        };

        // Run each test suite
        for (const testSuite of this.testSuites) {
            console.log(`\n🧪 Running ${testSuite.name}...`);
            console.log('-'.repeat(40));
            
            try {
                const suiteResult = await testSuite.suite.runAllTests();
                suiteResult.suiteName = testSuite.name;
                suiteResult.priority = testSuite.priority;
                suiteResult.issueNumber = testSuite.issueNumber;
                
                results.suiteResults.push(suiteResult);
                this.allResults.push(...(suiteResult.results || []));
                
            } catch (error) {
                console.error(`❌ Error running ${testSuite.name}:`, error);
                results.suiteResults.push({
                    suiteName: testSuite.name,
                    priority: testSuite.priority,
                    issueNumber: testSuite.issueNumber,
                    error: error.message,
                    summary: { total: 0, passed: 0, failed: 1, successRate: 0 }
                });
            }
        }

        this.endTime = new Date();
        results.overview.endTime = this.endTime.toISOString();
        results.overview.duration = this.endTime - this.startTime;

        // Generate summary
        results.summary = this.generateOverallSummary(results.suiteResults);
        
        // Generate recommendations
        results.recommendations = this.generateRecommendations(results.suiteResults);

        // Display final results
        this.displayFinalResults(results);
        
        return results;
    }

    /**
     * Generate overall summary
     */
    generateOverallSummary(suiteResults) {
        const summary = {
            totalTests: 0,
            totalPassed: 0,
            totalFailed: 0,
            totalPartial: 0,
            overallSuccessRate: 0,
            criticalIssues: 0,
            warningsCount: 0,
            byIssue: {},
            byPriority: {
                high: { passed: 0, failed: 0, total: 0 },
                medium: { passed: 0, failed: 0, total: 0 },
                low: { passed: 0, failed: 0, total: 0 }
            }
        };

        suiteResults.forEach(suite => {
            if (suite.summary) {
                summary.totalTests += suite.summary.total || 0;
                summary.totalPassed += suite.summary.passed || 0;
                summary.totalFailed += suite.summary.failed || 0;
                summary.totalPartial += suite.summary.partial || 0;

                // Track by issue
                if (suite.issueNumber) {
                    summary.byIssue[suite.issueNumber] = {
                        name: suite.suiteName,
                        ...suite.summary
                    };
                }

                // Track by priority
                if (suite.priority && summary.byPriority[suite.priority]) {
                    summary.byPriority[suite.priority].total += suite.summary.total || 0;
                    summary.byPriority[suite.priority].passed += suite.summary.passed || 0;
                    summary.byPriority[suite.priority].failed += suite.summary.failed || 0;
                }

                // Count critical issues
                if (suite.priority === 'high' && suite.summary.failed > 0) {
                    summary.criticalIssues++;
                }
            }
        });

        summary.overallSuccessRate = summary.totalTests > 0 ? 
            (summary.totalPassed / summary.totalTests * 100).toFixed(2) : 0;

        return summary;
    }

    /**
     * Generate recommendations based on test results
     */
    generateRecommendations(suiteResults) {
        const recommendations = [];

        suiteResults.forEach(suite => {
            if (suite.summary && suite.summary.failed > 0) {
                if (suite.priority === 'high') {
                    recommendations.push({
                        type: 'critical',
                        issue: suite.issueNumber,
                        suite: suite.suiteName,
                        message: `Critical: ${suite.summary.failed} tests failed in ${suite.suiteName}. Immediate attention required.`,
                        failedTests: suite.results ? suite.results.filter(r => r.status === 'FAIL') : []
                    });
                } else {
                    recommendations.push({
                        type: 'warning',
                        issue: suite.issueNumber,
                        suite: suite.suiteName,
                        message: `Warning: ${suite.summary.failed} tests failed in ${suite.suiteName}. Review recommended.`,
                        failedTests: suite.results ? suite.results.filter(r => r.status === 'FAIL') : []
                    });
                }
            }

            // Check for partial passes
            if (suite.summary && suite.summary.partial > 0) {
                recommendations.push({
                    type: 'info',
                    issue: suite.issueNumber,
                    suite: suite.suiteName,
                    message: `Info: ${suite.summary.partial} tests passed partially in ${suite.suiteName}. Feature may have limited support.`
                });
            }
        });

        // Add specific recommendations based on common issues
        this.addSpecificRecommendations(recommendations, suiteResults);

        return recommendations;
    }

    /**
     * Add specific recommendations based on test patterns
     */
    addSpecificRecommendations(recommendations, suiteResults) {
        // Database recommendations
        const dbSuite = suiteResults.find(s => s.issueNumber === 8);
        if (dbSuite && dbSuite.summary.failed > 0) {
            recommendations.push({
                type: 'action',
                message: 'Database issues detected. Check localStorage availability and implement proper fallback mechanisms.'
            });
        }

        // Layout recommendations
        const layoutSuite = suiteResults.find(s => s.issueNumber === 7);
        if (layoutSuite && layoutSuite.summary.failed > 0) {
            recommendations.push({
                type: 'action',
                message: 'Layout issues detected. Verify CSS Grid and Flexbox implementation for horizontal arrangements.'
            });
        }

        // Kids mode recommendations
        const kidsSuite = suiteResults.find(s => s.issueNumber === 6);
        if (kidsSuite && kidsSuite.summary.failed > 0) {
            recommendations.push({
                type: 'action',
                message: 'Kids mode accessibility issues detected. Review color contrast ratios and alternative visual indicators.'
            });
        }

        // Cross-browser recommendations
        const browserSuite = suiteResults.find(s => s.suiteName.includes('Cross-Browser'));
        if (browserSuite && browserSuite.summary.failed > 0) {
            recommendations.push({
                type: 'action',
                message: 'Browser compatibility issues detected. Consider polyfills or progressive enhancement strategies.'
            });
        }
    }

    /**
     * Display final results in console
     */
    displayFinalResults(results) {
        console.log('\n🎯 SUPERSUDOKU TEST RESULTS SUMMARY');
        console.log('=====================================');
        
        console.log(`\n📊 Overall Statistics:`);
        console.log(`   Total Tests: ${results.summary.totalTests}`);
        console.log(`   Passed: ${results.summary.totalPassed} (${results.summary.overallSuccessRate}%)`);
        console.log(`   Failed: ${results.summary.totalFailed}`);
        console.log(`   Partial: ${results.summary.totalPartial}`);
        console.log(`   Duration: ${(results.overview.duration / 1000).toFixed(2)}s`);

        console.log(`\n🔍 By GitHub Issue:`);
        Object.entries(results.summary.byIssue).forEach(([issueNum, data]) => {
            const status = data.failed === 0 ? '✅' : '❌';
            console.log(`   ${status} Issue #${issueNum}: ${data.passed}/${data.total} passed (${data.successRate}%)`);
        });

        console.log(`\n⚠️ Critical Issues: ${results.summary.criticalIssues}`);
        
        if (results.recommendations.length > 0) {
            console.log(`\n💡 Recommendations:`);
            results.recommendations.forEach((rec, index) => {
                const icon = rec.type === 'critical' ? '🚨' : rec.type === 'warning' ? '⚠️' : 'ℹ️';
                console.log(`   ${icon} ${rec.message}`);
            });
        }

        // Browser and device info
        console.log(`\n🌐 Test Environment:`);
        console.log(`   Browser: ${results.overview.browser.name} ${results.overview.browser.version}`);
        console.log(`   Device: ${results.overview.device.type} (${results.overview.device.screenSize.width}x${results.overview.device.screenSize.height})`);
        
        console.log('\n' + '='.repeat(50));
    }

    /**
     * Get browser information
     */
    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        let name = 'Unknown', version = 'Unknown';

        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            name = 'Chrome';
            const match = userAgent.match(/Chrome\/([0-9.]+)/);
            if (match) version = match[1];
        } else if (userAgent.includes('Firefox')) {
            name = 'Firefox';
            const match = userAgent.match(/Firefox\/([0-9.]+)/);
            if (match) version = match[1];
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            name = 'Safari';
            const match = userAgent.match(/Safari\/([0-9.]+)/);
            if (match) version = match[1];
        } else if (userAgent.includes('Edg')) {
            name = 'Edge';
            const match = userAgent.match(/Edg\/([0-9.]+)/);
            if (match) version = match[1];
        }

        return { name, version };
    }

    /**
     * Get device information
     */
    getDeviceInfo() {
        return {
            type: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            touchSupport: 'ontouchstart' in window,
            screenSize: {
                width: window.screen.width,
                height: window.screen.height
            }
        };
    }

    /**
     * Export test results to file
     */
    exportResults(results) {
        const exportData = {
            ...results,
            exportedAt: new Date().toISOString(),
            version: '2.0.0'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SuperSudoku_TestResults_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('📁 Test results exported successfully');
    }

    /**
     * Generate HTML report
     */
    generateHTMLReport(results) {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SuperSudoku Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #8b5cf6; }
        .stat-value { font-size: 2em; font-weight: bold; color: #8b5cf6; }
        .stat-label { color: #64748b; margin-top: 5px; }
        .suite-results { margin-bottom: 30px; }
        .suite { background: #f9fafb; padding: 20px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid #10b981; }
        .suite.failed { border-left-color: #ef4444; }
        .suite.partial { border-left-color: #f59e0b; }
        .test-result { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .test-result.pass { background: #dcfce7; color: #166534; }
        .test-result.fail { background: #fecaca; color: #991b1b; }
        .test-result.partial { background: #fef3c7; color: #92400e; }
        .recommendations { background: #fff7ed; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; }
        .recommendation { margin: 10px 0; padding: 10px; border-radius: 4px; }
        .recommendation.critical { background: #fecaca; }
        .recommendation.warning { background: #fef3c7; }
        .recommendation.info { background: #dbeafe; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 SuperSudoku Test Report</h1>
            <p>Generated on ${new Date(results.overview.endTime).toLocaleDateString()}</p>
            <p>Browser: ${results.overview.browser.name} ${results.overview.browser.version} | Device: ${results.overview.device.type}</p>
        </div>

        <div class="summary">
            <div class="stat-card">
                <div class="stat-value">${results.summary.totalTests}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${results.summary.totalPassed}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${results.summary.totalFailed}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${results.summary.overallSuccessRate}%</div>
                <div class="stat-label">Success Rate</div>
            </div>
        </div>

        <div class="suite-results">
            <h2>Test Suite Results</h2>
            ${results.suiteResults.map(suite => `
                <div class="suite ${suite.summary.failed > 0 ? 'failed' : suite.summary.partial > 0 ? 'partial' : ''}">
                    <h3>${suite.suiteName} ${suite.issueNumber ? `(Issue #${suite.issueNumber})` : ''}</h3>
                    <p>Passed: ${suite.summary.passed} | Failed: ${suite.summary.failed} | Success Rate: ${suite.summary.successRate}%</p>
                    ${suite.results ? suite.results.map(test => `
                        <div class="test-result ${test.status.toLowerCase()}">
                            <strong>${test.test}:</strong> ${test.message}
                        </div>
                    `).join('') : ''}
                </div>
            `).join('')}
        </div>

        ${results.recommendations.length > 0 ? `
            <div class="recommendations">
                <h2>💡 Recommendations</h2>
                ${results.recommendations.map(rec => `
                    <div class="recommendation ${rec.type}">
                        ${rec.message}
                    </div>
                `).join('')}
            </div>
        ` : ''}

        <div class="footer">
            <p>SuperSudoku Test Suite v2.0.0 | Duration: ${(results.overview.duration / 1000).toFixed(2)}s</p>
        </div>
    </div>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SuperSudoku_TestReport_${new Date().toISOString().split('T')[0]}.html`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('📄 HTML test report generated successfully');
    }
}

// Auto-run tests if this script is loaded directly
if (typeof window !== 'undefined' && window.location) {
    window.SuperSudokuTestRunner = SuperSudokuTestRunner;
    
    // Add test runner UI
    const addTestRunnerUI = () => {
        const testButton = document.createElement('button');
        testButton.textContent = '🧪 Run All Tests';
        testButton.style.cssText = `
            position: fixed; top: 10px; right: 10px; z-index: 10000;
            background: #8b5cf6; color: white; border: none; padding: 10px 15px;
            border-radius: 5px; cursor: pointer; font-weight: bold;
        `;
        
        testButton.onclick = async () => {
            testButton.textContent = '🔄 Running Tests...';
            testButton.disabled = true;
            
            const runner = new SuperSudokuTestRunner();
            const results = await runner.runAllTests();
            
            // Export results
            runner.exportResults(results);
            runner.generateHTMLReport(results);
            
            testButton.textContent = '✅ Tests Complete';
            setTimeout(() => {
                testButton.textContent = '🧪 Run All Tests';
                testButton.disabled = false;
            }, 3000);
        };
        
        document.body.appendChild(testButton);
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addTestRunnerUI);
    } else {
        addTestRunnerUI();
    }
}

// Export for Node.js if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SuperSudokuTestRunner;
}