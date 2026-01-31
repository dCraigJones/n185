/**
 * Modeling Tools
 * UI for tilt, shift, and what-if scenario analysis
 */

class ModelingPanel {
    constructor(containerId, testManager) {
        this.container = document.getElementById(containerId);
        this.testManager = testManager;
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
     * Render modeling tools
     */
    render() {
        if (!this.currentTest) {
            this.container.innerHTML = '<p class="empty-state">Select a test to apply transformations</p>';
            return;
        }

        const html = `
            <!-- Tilt (Friction Adjustment) -->
            <div class="modeling-section">
                <h4>Tilt (Friction Adjustment)</h4>
                <p style="font-size: 12px; color: #666; margin-bottom: 8px;">
                    Add or remove pipe friction loss
                </p>
                <div class="form-group">
                    <label>Pipe Length (feet):</label>
                    <input type="number" id="tilt-length" value="1000" step="100">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Diameter (inches):</label>
                        <input type="number" id="tilt-diameter" value="12" step="1">
                    </div>
                    <div class="form-group">
                        <label>C-value:</label>
                        <input type="number" id="tilt-c-value" value="130" step="10">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Operation:</label>
                        <select id="tilt-operation">
                            <option value="add">Add friction (downstream)</option>
                            <option value="remove">Remove friction (upstream)</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>New Test ID:</label>
                    <input type="text" id="tilt-new-id" value="${this.currentTest.id}*">
                </div>
                <button id="btn-apply-tilt" class="btn btn-primary btn-block">Apply Tilt</button>
            </div>

            <!-- Shift (Static Adjustment) -->
            <div class="modeling-section">
                <h4>Shift (Static Adjustment)</h4>
                <p style="font-size: 12px; color: #666; margin-bottom: 8px;">
                    Adjust for elevation or static pressure changes
                </p>
                <div class="form-group">
                    <label>Adjustment Type:</label>
                    <select id="shift-type">
                        <option value="static">New Static Pressure</option>
                        <option value="elevation">Elevation Change</option>
                    </select>
                </div>
                <div class="form-group" id="shift-static-input">
                    <label>New Static (PSI):</label>
                    <input type="number" id="shift-static" value="${this.currentTest.static}" step="0.1">
                </div>
                <div class="form-group" id="shift-elevation-input" style="display: none;">
                    <label>Elevation Change (feet):</label>
                    <input type="number" id="shift-elevation" value="0" step="1">
                    <small style="font-size: 11px; color: #666;">
                        Positive = higher elevation (lower pressure)<br>
                        Negative = lower elevation (higher pressure)
                    </small>
                </div>
                <div class="form-group">
                    <label>New Test ID:</label>
                    <input type="text" id="shift-new-id" value="${this.currentTest.id}*">
                </div>
                <button id="btn-apply-shift" class="btn btn-primary btn-block">Apply Shift</button>
            </div>

            <!-- What-If Scenarios -->
            <div class="modeling-section">
                <h4>What-If Analysis</h4>
                <p style="font-size: 12px; color: #666; margin-bottom: 8px;">
                    Compare multiple pipe sizes
                </p>
                <div class="form-group">
                    <label>Pipe Length (feet):</label>
                    <input type="number" id="whatif-length" value="1000" step="100">
                </div>
                <div class="form-group">
                    <label>C-value:</label>
                    <input type="number" id="whatif-c-value" value="130" step="10">
                </div>
                <div class="form-group">
                    <label>Pipe Sizes (inches, comma-separated):</label>
                    <input type="text" id="whatif-sizes" value="12, 16, 20">
                </div>
                <button id="btn-apply-whatif" class="btn btn-primary btn-block">Create Scenarios</button>
            </div>
        `;

        this.container.innerHTML = html;
        this.attachEventListeners();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Tilt
        document.getElementById('btn-apply-tilt').addEventListener('click', () => {
            this.applyTilt();
        });

        // Shift type toggle
        const shiftType = document.getElementById('shift-type');
        const shiftStaticInput = document.getElementById('shift-static-input');
        const shiftElevationInput = document.getElementById('shift-elevation-input');

        shiftType.addEventListener('change', () => {
            if (shiftType.value === 'static') {
                shiftStaticInput.style.display = 'block';
                shiftElevationInput.style.display = 'none';
            } else {
                shiftStaticInput.style.display = 'none';
                shiftElevationInput.style.display = 'block';
            }
        });

        // Shift
        document.getElementById('btn-apply-shift').addEventListener('click', () => {
            this.applyShift();
        });

        // What-if
        document.getElementById('btn-apply-whatif').addEventListener('click', () => {
            this.applyWhatIf();
        });
    }

    /**
     * Apply tilt transformation
     */
    applyTilt() {
        const length = parseFloat(document.getElementById('tilt-length').value);
        const diameter = parseFloat(document.getElementById('tilt-diameter').value);
        const cValue = parseFloat(document.getElementById('tilt-c-value').value);
        const operation = document.getElementById('tilt-operation').value;
        const newId = document.getElementById('tilt-new-id').value;

        // Calculate friction slope
        let frictionSlope = length * kp(diameter, cValue);

        // If removing friction, negate the value
        if (operation === 'remove') {
            frictionSlope = -frictionSlope;
        }

        // Create tilted fireflow
        const tilted = this.currentTest.tilt(frictionSlope);
        tilted.id = newId;
        tilted.category = 'model';

        // Add to test manager
        this.testManager.addTest(tilted);

        // Show notification
        this.showNotification(`Created tilted test: ${newId}`);
    }

    /**
     * Apply shift transformation
     */
    applyShift() {
        const shiftType = document.getElementById('shift-type').value;
        const newId = document.getElementById('shift-new-id').value;

        let newStatic;

        if (shiftType === 'static') {
            newStatic = parseFloat(document.getElementById('shift-static').value);
        } else {
            // Elevation adjustment
            const elevationChange = parseFloat(document.getElementById('shift-elevation').value);
            const pressureChange = elevationToPressure(elevationChange);
            newStatic = this.currentTest.static - pressureChange;
        }

        // Validate
        if (newStatic <= 0) {
            alert('New static pressure must be greater than 0');
            return;
        }

        // Create shifted fireflow
        const shifted = this.currentTest.shift(newStatic);
        shifted.id = newId;
        shifted.category = 'model';

        // Add to test manager
        this.testManager.addTest(shifted);

        // Show notification
        this.showNotification(`Created shifted test: ${newId}`);
    }

    /**
     * Apply what-if analysis
     */
    applyWhatIf() {
        const length = parseFloat(document.getElementById('whatif-length').value);
        const cValue = parseFloat(document.getElementById('whatif-c-value').value);
        const sizesStr = document.getElementById('whatif-sizes').value;

        // Parse pipe sizes
        const sizes = sizesStr.split(',').map(s => parseFloat(s.trim())).filter(s => !isNaN(s));

        if (sizes.length === 0) {
            alert('Please enter valid pipe sizes');
            return;
        }

        // Create a test for each size
        let createdCount = 0;
        sizes.forEach(diameter => {
            const frictionSlope = length * kp(diameter, cValue);
            const tilted = this.currentTest.tilt(frictionSlope);
            tilted.id = `${this.currentTest.id} (${diameter}")`;
            tilted.category = 'scenario';

            // Assign different colors
            const hue = (createdCount * 137.5) % 360;  // Golden angle for color distribution
            tilted.color = `hsl(${hue}, 60%, 45%)`;

            this.testManager.addTest(tilted);
            createdCount++;
        });

        // Show notification
        this.showNotification(`Created ${createdCount} what-if scenarios`);
    }

    /**
     * Show notification message
     */
    showNotification(message) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background-color: #28a745;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    /**
     * Clear display
     */
    clear() {
        this.currentTest = null;
        this.render();
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
