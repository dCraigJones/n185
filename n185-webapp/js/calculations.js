/**
 * Calculations Panel
 * Displays live calculations for selected fireflow test
 */

class CalculationsPanel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentTest = null;
    }

    /**
     * Update display for selected test
     */
    updateTest(test) {
        this.currentTest = test;
        this.render();
    }

    /**
     * Render calculations
     */
    render() {
        if (!this.currentTest) {
            this.container.innerHTML = '<p class="empty-state">Select a test to view calculations</p>';
            return;
        }

        const test = this.currentTest;

        let html = `
            <div class="calc-item">
                <span class="calc-label">Test ID:</span>
                <span class="calc-value">${test.id || 'Unnamed'}</span>
            </div>
            <div class="calc-item">
                <span class="calc-label">Static Pressure:</span>
                <span class="calc-value">${formatNumber(test.static, 1)} PSI</span>
            </div>
        `;

        // Show test data if available
        if (test.testFlow !== null && test.testResidual !== null) {
            html += `
                <div class="calc-item">
                    <span class="calc-label">Test Flow:</span>
                    <span class="calc-value">${formatNumber(test.testFlow, 0)} GPM</span>
                </div>
                <div class="calc-item">
                    <span class="calc-label">Test Residual:</span>
                    <span class="calc-value">${formatNumber(test.testResidual, 1)} PSI</span>
                </div>
            `;
        } else {
            html += `
                <div class="calc-item">
                    <span class="calc-label">Test Data:</span>
                    <span class="calc-value">Modified (No original test)</span>
                </div>
            `;
        }

        // Friction coefficient
        html += `
            <div class="calc-item">
                <span class="calc-label">Friction Coefficient (k):</span>
                <span class="calc-value">${test.k.toExponential(4)}</span>
            </div>
        `;

        // Available Fire Flow at different pressures
        html += `
            <hr style="margin: 12px 0; border: none; border-top: 1px solid #e0e0e0;">
            <div class="calc-item">
                <span class="calc-label">Available Fire Flow:</span>
                <span class="calc-value"></span>
            </div>
            <div class="calc-item" style="padding-left: 16px;">
                <span class="calc-label">At 20 PSI:</span>
                <span class="calc-value">${formatNumber(test.aff(20), 0)} GPM</span>
            </div>
            <div class="calc-item" style="padding-left: 16px;">
                <span class="calc-label">At 30 PSI:</span>
                <span class="calc-value">${formatNumber(test.aff(30), 0)} GPM</span>
            </div>
            <div class="calc-item" style="padding-left: 16px;">
                <span class="calc-label">At 40 PSI:</span>
                <span class="calc-value">${formatNumber(test.aff(40), 0)} GPM</span>
            </div>
        `;

        // Needed Fire Flow at common flow rates
        html += `
            <hr style="margin: 12px 0; border: none; border-top: 1px solid #e0e0e0;">
            <div class="calc-item">
                <span class="calc-label">Pressure at Flow:</span>
                <span class="calc-value"></span>
            </div>
            <div class="calc-item" style="padding-left: 16px;">
                <span class="calc-label">At 1,000 GPM:</span>
                <span class="calc-value">${formatNumber(test.nff(1000), 1)} PSI</span>
            </div>
            <div class="calc-item" style="padding-left: 16px;">
                <span class="calc-label">At 1,500 GPM:</span>
                <span class="calc-value">${formatNumber(test.nff(1500), 1)} PSI</span>
            </div>
            <div class="calc-item" style="padding-left: 16px;">
                <span class="calc-label">At 2,000 GPM:</span>
                <span class="calc-value">${formatNumber(test.nff(2000), 1)} PSI</span>
            </div>
            <div class="calc-item" style="padding-left: 16px;">
                <span class="calc-label">At 2,500 GPM:</span>
                <span class="calc-value">${formatNumber(test.nff(2500), 1)} PSI</span>
            </div>
        `;

        // Show if modified
        if (test.isModified) {
            html += `
                <hr style="margin: 12px 0; border: none; border-top: 1px solid #e0e0e0;">
                <div class="calc-item">
                    <span class="calc-label" style="color: #f57c00;">Status:</span>
                    <span class="calc-value" style="color: #f57c00;">Modified Test</span>
                </div>
            `;
        }

        this.container.innerHTML = html;
    }

    /**
     * Clear display
     */
    clear() {
        this.currentTest = null;
        this.render();
    }
}

/**
 * Custom calculation tool
 * Allows user to calculate AFF or NFF with custom values
 */
class CustomCalculator {
    constructor(containerId, testManager) {
        this.container = document.getElementById(containerId);
        this.testManager = testManager;
    }

    /**
     * Render calculator interface
     */
    render() {
        const html = `
            <div class="custom-calc">
                <h4>Custom Calculation</h4>
                <div class="form-group">
                    <label>Calculate:</label>
                    <select id="calc-type">
                        <option value="aff">Available Fire Flow (AFF)</option>
                        <option value="nff">Needed Fire Flow (NFF)</option>
                    </select>
                </div>
                <div class="form-group" id="calc-input-aff">
                    <label>Minimum Pressure (PSI):</label>
                    <input type="number" id="calc-min-pressure" value="20" step="1">
                </div>
                <div class="form-group" id="calc-input-nff" style="display:none;">
                    <label>Required Flow (GPM):</label>
                    <input type="number" id="calc-required-flow" value="2000" step="100">
                </div>
                <button id="btn-calculate" class="btn btn-primary btn-block">Calculate</button>
                <div id="calc-result" class="calc-result"></div>
            </div>
        `;

        this.container.innerHTML = html;
        this.attachEventListeners();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const calcType = document.getElementById('calc-type');
        const affInput = document.getElementById('calc-input-aff');
        const nffInput = document.getElementById('calc-input-nff');
        const calcBtn = document.getElementById('btn-calculate');

        calcType.addEventListener('change', () => {
            if (calcType.value === 'aff') {
                affInput.style.display = 'block';
                nffInput.style.display = 'none';
            } else {
                affInput.style.display = 'none';
                nffInput.style.display = 'block';
            }
        });

        calcBtn.addEventListener('click', () => this.calculate());
    }

    /**
     * Perform calculation
     */
    calculate() {
        const test = this.testManager.selectedTest;
        if (!test) {
            alert('Please select a test first');
            return;
        }

        const calcType = document.getElementById('calc-type').value;
        const resultDiv = document.getElementById('calc-result');

        if (calcType === 'aff') {
            const minPressure = parseFloat(document.getElementById('calc-min-pressure').value);
            const aff = test.aff(minPressure);
            resultDiv.innerHTML = `
                <div class="calc-item">
                    <span class="calc-label">Available Flow at ${minPressure} PSI:</span>
                    <span class="calc-value">${formatNumber(aff, 0)} GPM</span>
                </div>
            `;
        } else {
            const requiredFlow = parseFloat(document.getElementById('calc-required-flow').value);
            const nff = test.nff(requiredFlow);
            resultDiv.innerHTML = `
                <div class="calc-item">
                    <span class="calc-label">Pressure at ${formatNumber(requiredFlow, 0)} GPM:</span>
                    <span class="calc-value">${formatNumber(nff, 1)} PSI</span>
                </div>
            `;
        }
    }
}
