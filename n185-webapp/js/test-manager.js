/**
 * Test Manager
 * Handles CRUD operations and UI for fireflow tests
 */

class TestManager {
    constructor() {
        this.tests = [];
        this.selectedTest = null;
        this.onTestsChanged = null;  // Callback when tests change
        this.onTestSelected = null;  // Callback when selection changes
    }

    /**
     * Add a new fireflow test
     */
    addTest(fireflow) {
        this.tests.push(fireflow);
        this.notifyChange();
        return fireflow;
    }

    /**
     * Remove a test by UUID
     */
    removeTest(uuid) {
        const index = this.tests.findIndex(t => t.uuid === uuid);
        if (index !== -1) {
            this.tests.splice(index, 1);
            if (this.selectedTest && this.selectedTest.uuid === uuid) {
                this.selectedTest = null;
                this.notifySelection();
            }
            this.notifyChange();
        }
    }

    /**
     * Get test by UUID
     */
    getTest(uuid) {
        return this.tests.find(t => t.uuid === uuid);
    }

    /**
     * Update test properties
     */
    updateTest(uuid, properties) {
        const test = this.getTest(uuid);
        if (test) {
            Object.assign(test, properties);
            this.notifyChange();
        }
    }

    /**
     * Toggle test visibility
     */
    toggleVisibility(uuid) {
        const test = this.getTest(uuid);
        if (test) {
            test.visible = !test.visible;
            this.notifyChange();
        }
    }

    /**
     * Select a test
     */
    selectTest(uuid) {
        this.selectedTest = this.getTest(uuid);
        this.notifySelection();
    }

    /**
     * Duplicate a test
     */
    duplicateTest(uuid) {
        const original = this.getTest(uuid);
        if (original) {
            const duplicate = new FireFlow(
                original.static,
                original.testFlow || 1000,
                original.testResidual || original.static - 1,
                original.id + ' (copy)',
                {
                    color: original.color,
                    lineType: original.lineType,
                    category: original.category
                }
            );
            duplicate.k = original.k;
            this.addTest(duplicate);
            return duplicate;
        }
    }

    /**
     * Get tests by category
     */
    getTestsByCategory(category) {
        return this.tests.filter(t => t.category === category);
    }

    /**
     * Get all visible tests
     */
    getVisibleTests() {
        return this.tests.filter(t => t.visible);
    }

    /**
     * Clear all tests
     */
    clearAll() {
        this.tests = [];
        this.selectedTest = null;
        this.notifyChange();
        this.notifySelection();
    }

    /**
     * Export all tests to JSON
     */
    exportToJSON() {
        return this.tests.map(t => t.toJSON());
    }

    /**
     * Import tests from JSON
     */
    importFromJSON(data) {
        this.tests = data.map(item => FireFlow.fromJSON(item));
        this.notifyChange();
    }

    /**
     * Notify listeners that tests changed
     */
    notifyChange() {
        if (this.onTestsChanged) {
            this.onTestsChanged(this.tests);
        }
    }

    /**
     * Notify listeners that selection changed
     */
    notifySelection() {
        if (this.onTestSelected) {
            this.onTestSelected(this.selectedTest);
        }
    }
}

/**
 * Test List UI Component
 */
class TestListUI {
    constructor(containerId, testManager) {
        this.container = document.getElementById(containerId);
        this.testManager = testManager;
        this.render();
    }

    /**
     * Render the test list
     */
    render() {
        const tests = this.testManager.tests;

        if (tests.length === 0) {
            this.container.innerHTML = '<p class="empty-state">No tests added yet</p>';
            return;
        }

        // Group tests by category
        const categories = {
            field: tests.filter(t => t.category === 'field'),
            model: tests.filter(t => t.category === 'model'),
            scenario: tests.filter(t => t.category === 'scenario')
        };

        let html = '';

        // Render each category
        for (const [category, categoryTests] of Object.entries(categories)) {
            if (categoryTests.length > 0) {
                categoryTests.forEach(test => {
                    html += this.renderTestItem(test);
                });
            }
        }

        this.container.innerHTML = html;
        this.attachEventListeners();
    }

    /**
     * Render a single test item
     */
    renderTestItem(test) {
        const isSelected = this.testManager.selectedTest &&
                          this.testManager.selectedTest.uuid === test.uuid;
        const hiddenClass = test.visible ? '' : 'hidden';
        const selectedClass = isSelected ? 'selected' : '';

        return `
            <div class="test-item ${hiddenClass} ${selectedClass}" data-uuid="${test.uuid}">
                <div class="test-header">
                    <div class="test-name">
                        <div class="test-color-indicator" style="background-color: ${test.color}"></div>
                        <span>${test.id || 'Unnamed Test'}</span>
                    </div>
                    <div class="test-actions">
                        <button class="btn-visibility" title="Toggle visibility">
                            ${test.visible ? '👁️' : '👁️‍🗨️'}
                        </button>
                        <button class="btn-duplicate" title="Duplicate">📋</button>
                        <button class="btn-delete" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="test-info">
                    <div>Static: ${formatNumber(test.static, 1)} PSI</div>
                    ${test.testFlow !== null ? `<div>Flow: ${formatNumber(test.testFlow, 0)} GPM</div>` : '<div>Flow: N/A</div>'}
                    ${test.testResidual !== null ? `<div>Residual: ${formatNumber(test.testResidual, 1)} PSI</div>` : '<div>Residual: N/A</div>'}
                    <div>AFF: ${formatNumber(test.aff(), 0)} GPM</div>
                </div>
                <span class="test-category ${test.category}">${this.getCategoryLabel(test.category)}</span>
            </div>
        `;
    }

    /**
     * Get display label for category
     */
    getCategoryLabel(category) {
        const labels = {
            field: 'Field Test',
            model: 'Model Result',
            scenario: 'Scenario'
        };
        return labels[category] || category;
    }

    /**
     * Attach event listeners to test items
     */
    attachEventListeners() {
        // Click to select
        this.container.querySelectorAll('.test-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const uuid = item.dataset.uuid;
                    this.testManager.selectTest(uuid);
                }
            });
        });

        // Visibility toggle
        this.container.querySelectorAll('.btn-visibility').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const uuid = e.target.closest('.test-item').dataset.uuid;
                this.testManager.toggleVisibility(uuid);
            });
        });

        // Duplicate
        this.container.querySelectorAll('.btn-duplicate').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const uuid = e.target.closest('.test-item').dataset.uuid;
                this.testManager.duplicateTest(uuid);
            });
        });

        // Delete
        this.container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const uuid = e.target.closest('.test-item').dataset.uuid;
                if (confirm('Delete this test?')) {
                    this.testManager.removeTest(uuid);
                }
            });
        });
    }
}
