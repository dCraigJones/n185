/**
 * n185 Canvas Graph Renderer
 * Renders n^1.85 logarithmic fire flow graphs matching NFPA 291 style
 */

class N185Graph {
    constructor(canvasId, maxFlow = 5000, maxPressure = 100) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Graph parameters
        this.maxFlow = maxFlow;
        this.maxPressure = maxPressure;

        // Margins and dimensions
        this.margin = { top: 60, right: 30, bottom: 60, left: 60 };

        // Title and metadata
        this.title = '';
        this.showDate = false;

        // Fireflow objects to plot
        this.fireflows = [];

        // Mouse tracking
        this.mousePos = null;

        // Initialize canvas size
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * Set canvas size and pixel ratio for crisp rendering
     */
    resize() {
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;

        // Set display size
        const displayWidth = container.clientWidth - 20;
        const displayHeight = Math.max(500, container.clientHeight - 120);

        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';

        // Set actual canvas size for high DPI displays
        this.canvas.width = displayWidth * dpr;
        this.canvas.height = displayHeight * dpr;

        // Scale context for high DPI
        this.ctx.scale(dpr, dpr);

        // Update plot dimensions
        this.width = displayWidth;
        this.height = displayHeight;
        this.plotWidth = this.width - this.margin.left - this.margin.right;
        this.plotHeight = this.height - this.margin.top - this.margin.bottom;

        // Redraw
        this.render();
    }

    /**
     * Transform flow (GPM) to canvas x-coordinate
     * Uses Q^1.85 transformation
     */
    flowToX(Q) {
        const Q185 = Math.pow(Q, 1.85);
        const max185 = Math.pow(this.maxFlow, 1.85);
        return this.margin.left + (Q185 / max185) * this.plotWidth;
    }

    /**
     * Transform pressure (PSI) to canvas y-coordinate
     */
    pressureToY(P) {
        return this.margin.top + this.plotHeight - (P / this.maxPressure) * this.plotHeight;
    }

    /**
     * Transform canvas x-coordinate to flow (GPM)
     */
    xToFlow(x) {
        const ratio = (x - this.margin.left) / this.plotWidth;
        const Q185 = ratio * Math.pow(this.maxFlow, 1.85);
        return Math.pow(Q185, 1 / 1.85);
    }

    /**
     * Transform canvas y-coordinate to pressure (PSI)
     */
    yToPressure(y) {
        const ratio = (this.margin.top + this.plotHeight - y) / this.plotHeight;
        return ratio * this.maxPressure;
    }

    /**
     * Main render function
     */
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw components
        this.drawBackground();
        this.drawGrid();
        this.drawAxes();
        this.drawFireflows();
        this.drawTitle();
        this.drawBorder();
    }

    /**
     * Draw white background
     */
    drawBackground() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(
            this.margin.left,
            this.margin.top,
            this.plotWidth,
            this.plotHeight
        );
    }

    /**
     * Draw grid lines
     */
    drawGrid() {
        this.ctx.strokeStyle = '#c0c0c0';
        this.ctx.lineWidth = 0.5;

        // Vertical grid lines (at major flow intervals)
        const flowInterval = this.maxFlow / 10;
        for (let Q = flowInterval; Q <= this.maxFlow; Q += flowInterval) {
            const x = this.flowToX(Q);
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.margin.top);
            this.ctx.lineTo(x, this.margin.top + this.plotHeight);
            this.ctx.stroke();
        }

        // Horizontal grid lines (every 10 PSI)
        for (let P = 10; P <= this.maxPressure; P += 10) {
            const y = this.pressureToY(P);
            this.ctx.beginPath();
            this.ctx.moveTo(this.margin.left, y);
            this.ctx.lineTo(this.margin.left + this.plotWidth, y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw axes with tick marks and labels
     */
    drawAxes() {
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '12px serif';
        this.ctx.textAlign = 'center';

        // X-axis (Flow) - major tick labels
        const flowInterval = this.maxFlow / 10;
        for (let Q = flowInterval; Q <= this.maxFlow; Q += flowInterval) {
            const x = this.flowToX(Q);

            // Label
            this.ctx.fillText(
                formatNumber(Q, 0),
                x,
                this.margin.top + this.plotHeight + 20
            );

            // Major tick mark
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.margin.top + this.plotHeight);
            this.ctx.lineTo(x, this.margin.top + this.plotHeight + 6);
            this.ctx.stroke();

            // Top tick
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.margin.top);
            this.ctx.lineTo(x, this.margin.top - 6);
            this.ctx.stroke();
        }

        // X-axis minor ticks
        const minorInterval = this.maxFlow / 100;
        for (let Q = minorInterval; Q <= this.maxFlow; Q += minorInterval) {
            if (Q % flowInterval !== 0) {
                const x = this.flowToX(Q);
                const tickSize = Q % (flowInterval / 2) === 0 ? 4 : 2;

                this.ctx.beginPath();
                this.ctx.moveTo(x, this.margin.top + this.plotHeight);
                this.ctx.lineTo(x, this.margin.top + this.plotHeight + tickSize);
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.moveTo(x, this.margin.top);
                this.ctx.lineTo(x, this.margin.top - tickSize);
                this.ctx.stroke();
            }
        }

        // Y-axis (Pressure) - major tick labels
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        for (let P = 0; P <= this.maxPressure; P += 10) {
            const y = this.pressureToY(P);

            // Label
            this.ctx.fillText(P.toString(), this.margin.left - 10, y);

            // Major tick mark
            this.ctx.beginPath();
            this.ctx.moveTo(this.margin.left, y);
            this.ctx.lineTo(this.margin.left - 6, y);
            this.ctx.stroke();

            // Right tick
            this.ctx.beginPath();
            this.ctx.moveTo(this.margin.left + this.plotWidth, y);
            this.ctx.lineTo(this.margin.left + this.plotWidth + 6, y);
            this.ctx.stroke();
        }

        // Y-axis minor ticks
        for (let P = 0; P <= this.maxPressure; P += 1) {
            if (P % 10 !== 0) {
                const y = this.pressureToY(P);
                const tickSize = P % 5 === 0 ? 4 : 2;

                this.ctx.beginPath();
                this.ctx.moveTo(this.margin.left, y);
                this.ctx.lineTo(this.margin.left - tickSize, y);
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.moveTo(this.margin.left + this.plotWidth, y);
                this.ctx.lineTo(this.margin.left + this.plotWidth + tickSize, y);
                this.ctx.stroke();
            }
        }

        // Axis labels
        this.ctx.font = '14px serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('Flow (GPM)', this.margin.left + this.plotWidth / 2, this.height - 20);

        this.ctx.save();
        this.ctx.translate(15, this.margin.top + this.plotHeight / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Head (PSI)', 0, 0);
        this.ctx.restore();
    }

    /**
     * Draw fireflow supply curves
     */
    drawFireflows() {
        this.fireflows.forEach(ff => {
            if (!ff.visible) return;

            this.ctx.strokeStyle = ff.color;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash(this.getLineDash(ff.lineType));

            this.ctx.beginPath();
            let firstPoint = true;

            // Draw curve from 0 to maxFlow
            for (let Q = 0; Q <= this.maxFlow * 1.5; Q += this.maxFlow / 100) {
                const P = ff.pressureAtFlow(Q);

                // Only plot if within bounds
                if (P >= 0 && P <= this.maxPressure * 1.2) {
                    const x = this.flowToX(Q);
                    const y = this.pressureToY(P);

                    if (firstPoint) {
                        this.ctx.moveTo(x, y);
                        firstPoint = false;
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
            }

            this.ctx.stroke();
            this.ctx.setLineDash([]);

            // Draw test point if available
            if (ff.testFlow !== null && ff.testResidual !== null) {
                this.drawTestPoint(ff);
            }
        });
    }

    /**
     * Draw test point marker
     */
    drawTestPoint(ff) {
        const x = this.flowToX(ff.testFlow);
        const y = this.pressureToY(ff.testResidual);

        this.ctx.strokeStyle = ff.color;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
    }

    /**
     * Get line dash pattern for line type
     */
    getLineDash(lineType) {
        switch (lineType) {
            case 'dashed':
                return [10, 5];
            case 'dotted':
                return [2, 3];
            case 'dashdot':
                return [10, 5, 2, 5];
            default:
                return [];
        }
    }

    /**
     * Draw title and metadata
     */
    drawTitle() {
        if (this.title) {
            this.ctx.font = 'bold 16px serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.fillStyle = '#000000';
            this.ctx.fillText(this.title, this.width / 2, 10);
        }

        if (this.showDate) {
            this.ctx.font = '11px serif';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(new Date().toLocaleDateString(), this.width - 10, 10);
        }
    }

    /**
     * Draw border around plot area
     */
    drawBorder() {
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            this.margin.left,
            this.margin.top,
            this.plotWidth,
            this.plotHeight
        );
    }

    /**
     * Update graph parameters and redraw
     */
    update(maxFlow, maxPressure, title, showDate) {
        this.maxFlow = maxFlow;
        this.maxPressure = maxPressure;
        this.title = title;
        this.showDate = showDate;
        this.render();
    }

    /**
     * Set fireflow objects to plot
     */
    setFireflows(fireflows) {
        this.fireflows = fireflows;
        this.render();
    }

    /**
     * Export canvas to image
     */
    exportImage(format = 'png') {
        return this.canvas.toDataURL('image/' + format);
    }

    /**
     * Get fireflow at mouse position (for hover tooltip)
     */
    getFireflowAtMouse(x, y) {
        const Q = this.xToFlow(x);
        const P = this.yToPressure(y);

        // Check if within plot bounds
        if (
            x < this.margin.left ||
            x > this.margin.left + this.plotWidth ||
            y < this.margin.top ||
            y > this.margin.top + this.plotHeight
        ) {
            return null;
        }

        return { Q, P };
    }
}
