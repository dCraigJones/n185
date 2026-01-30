/**
 * n185 Fire Flow Analysis - Core Mathematical Engine
 * JavaScript port of R functions from n185 package
 */

class FireFlow {
    /**
     * Creates a fire flow supply curve based on a single hydrant test
     * per NFPA 291 Recommended Practice for Fire Flow Testing
     *
     * @param {number} Ps - Static Pressure (PSI)
     * @param {number} Qt - Test Flow (GPM)
     * @param {number} Pt - Test Residual (PSI)
     * @param {string} ID - Unique identifier for the test
     * @param {object} options - Additional options (color, lineType, category)
     */
    constructor(Ps, Qt, Pt, ID = "", options = {}) {
        // Input validation
        this.validateInputs(Ps, Qt, Pt);

        // Core properties
        this.static = parseFloat(Ps);
        this.testFlow = parseFloat(Qt);
        this.testResidual = parseFloat(Pt);
        this.id = ID;

        // Calculate friction coefficient k = (Ps - Pt) / Qt^1.85
        this.k = (this.static - this.testResidual) / Math.pow(this.testFlow, 1.85);

        // Visual properties
        this.color = options.color || '#142B6C';
        this.lineType = options.lineType || 'solid';
        this.category = options.category || 'field';
        this.visible = options.visible !== undefined ? options.visible : true;

        // UUID for tracking
        this.uuid = this.generateUUID();

        // Track if this is a derived fireflow (modified with tilt/shift)
        this.isModified = false;
        this.parentUUID = null;
    }

    /**
     * Validate fireflow inputs
     */
    validateInputs(Ps, Qt, Pt) {
        // Convert to numbers
        Ps = parseFloat(Ps);
        Qt = parseFloat(Qt);
        Pt = parseFloat(Pt);

        // Check for non-numeric
        if (isNaN(Ps) || isNaN(Qt) || isNaN(Pt)) {
            throw new Error('Numerical inputs required for Static, Test Flow, and Test Residual');
        }

        // Check for negative values
        if (Ps <= 0) throw new Error('Static must be greater than 0');
        if (Qt <= 0) throw new Error('Test Flow must be greater than 0');
        if (Pt <= 0) throw new Error('Test Residual must be greater than 0');

        // Check for unreasonable values
        if (Ps > 100) console.warn('Static is greater than 100 PSI. This may be unreasonable.');
        if (Pt < 20) console.warn('Test Residual is less than 20 PSI. This may be unreasonable.');
        if (Ps <= Pt) throw new Error('Static pressure must be greater than residual pressure');
    }

    /**
     * Calculate pressure at a given flow rate
     * P = Ps - k * Q^1.85
     */
    pressureAtFlow(Q) {
        return this.static - this.k * Math.pow(Q, 1.85);
    }

    /**
     * Calculate flow at a given pressure
     * Q = ((Ps - P) / k)^(1/1.85)
     */
    flowAtPressure(P) {
        if (P >= this.static) return 0;
        return Math.pow((this.static - P) / this.k, 1 / 1.85);
    }

    /**
     * Available Fire Flow at minimum allowable pressure
     * Default minimum pressure is 20 PSI
     */
    aff(minPressure = 20) {
        return this.flowAtPressure(minPressure);
    }

    /**
     * Needed Fire Flow - pressure at required flow
     */
    nff(requiredFlow) {
        return this.pressureAtFlow(requiredFlow);
    }

    /**
     * Generate a series of points for plotting the supply curve
     */
    generateCurve(maxFlow = 10000, numPoints = 100) {
        const points = [];
        for (let i = 0; i <= numPoints; i++) {
            const Q = (maxFlow * i) / numPoints;
            const P = this.pressureAtFlow(Q);
            points.push({ Q, P });
        }
        return points;
    }

    /**
     * Create a tilted (friction-adjusted) fireflow
     * Adds or removes friction loss
     */
    tilt(frictionSlope) {
        const tilted = new FireFlow(
            this.static,
            this.testFlow,
            this.testResidual,
            this.id + '*',
            {
                color: this.color,
                lineType: this.lineType,
                category: this.category
            }
        );

        tilted.k = this.k + frictionSlope;
        tilted.testFlow = null;  // No longer represents actual test
        tilted.testResidual = null;
        tilted.isModified = true;
        tilted.parentUUID = this.uuid;

        return tilted;
    }

    /**
     * Create a shifted (static pressure adjusted) fireflow
     * Changes the static pressure
     */
    shift(newStatic) {
        const shifted = new FireFlow(
            newStatic,
            this.testFlow,
            this.testResidual,
            this.id + '*',
            {
                color: this.color,
                lineType: this.lineType,
                category: this.category
            }
        );

        shifted.k = this.k;  // Keep same friction coefficient
        shifted.testFlow = null;  // No longer represents actual test
        shifted.testResidual = null;
        shifted.isModified = true;
        shifted.parentUUID = this.uuid;

        return shifted;
    }

    /**
     * Export to JSON
     */
    toJSON() {
        return {
            uuid: this.uuid,
            static: this.static,
            testFlow: this.testFlow,
            testResidual: this.testResidual,
            id: this.id,
            k: this.k,
            color: this.color,
            lineType: this.lineType,
            category: this.category,
            visible: this.visible,
            isModified: this.isModified,
            parentUUID: this.parentUUID
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(data) {
        const ff = new FireFlow(
            data.static,
            data.testFlow || 1000,  // Dummy value if null
            data.testResidual || data.static - 1,  // Dummy value if null
            data.id,
            {
                color: data.color,
                lineType: data.lineType,
                category: data.category,
                visible: data.visible
            }
        );

        // Override k if it was modified
        ff.k = data.k;
        ff.uuid = data.uuid;
        ff.testFlow = data.testFlow;
        ff.testResidual = data.testResidual;
        ff.isModified = data.isModified || false;
        ff.parentUUID = data.parentUUID || null;

        return ff;
    }

    /**
     * Generate a unique ID
     */
    generateUUID() {
        return 'ff-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
}

/**
 * Unit Friction Slope for pipeline (Hazen-Williams)
 * Returns k' per linear foot of pipe
 *
 * @param {number} D - Pipe diameter (inches)
 * @param {number} C - Hazen-Williams friction factor (default 130)
 * @returns {number} Unit friction slope (PSI per LF for Q^1.85)
 */
function kp(D, C = 130) {
    return 10.44 / Math.pow(C, 1.85) / Math.pow(D, 4.87) / 2.31;
}

/**
 * Calculate headloss for a pipe segment
 *
 * @param {number} length - Pipe length (feet)
 * @param {number} diameter - Pipe diameter (inches)
 * @param {number} flow - Flow rate (GPM)
 * @param {number} C - Hazen-Williams C value (default 130)
 * @returns {number} Headloss (PSI)
 */
function pipeHeadloss(length, diameter, flow, C = 130) {
    const k = length * kp(diameter, C);
    return k * Math.pow(flow, 1.85);
}

/**
 * Format number with commas for display
 */
function formatNumber(num, decimals = 0) {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Elevation adjustment (PSI per foot of elevation)
 */
const PSI_PER_FOOT = 0.433;

function elevationToPressure(elevationFeet) {
    return elevationFeet * PSI_PER_FOOT;
}

function pressureToElevation(psi) {
    return psi / PSI_PER_FOOT;
}
