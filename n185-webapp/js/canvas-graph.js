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

        // Annotations to draw
        this.annotations = [];

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

        // Reset any existing transforms then scale context for high DPI
        if (this.ctx.resetTransform) {
            this.ctx.resetTransform();
            this.ctx.scale(dpr, dpr);
        } else {
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

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
        this.drawAnnotations();
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

            // Draw curve from 0 to maxFlow (do not extend past right axis)
            for (let Q = 0; Q <= this.maxFlow; Q += this.maxFlow / 100) {
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

            // Draw test point if available and enabled
            if (ff.testFlow !== null && ff.testResidual !== null && ff.showPoint) {
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
     * Draw annotations
     */
    drawAnnotations() {
        this.annotations.forEach(ann => {
            if (!ann.visible) return;

            if (ann.type === 'point') {
                this.drawPointAnnotation(ann);
            } else if (ann.type === 'label') {
                this.drawLabelAnnotation(ann);
            } else if (ann.type === 'line') {
                this.drawLineAnnotation(ann);
            }
        });
    }

    /**
     * Draw point marker annotation
     */
    drawPointAnnotation(ann) {
        const x = this.flowToX(ann.Q);
        const y = this.pressureToY(ann.P);

        // Check if within plot bounds
        if (x < this.margin.left || x > this.margin.left + this.plotWidth ||
            y < this.margin.top || y > this.margin.top + this.plotHeight) {
            return;
        }

        // Determine size
        const sizeMap = { small: 8, medium: 12, large: 16 };
        const radius = sizeMap[ann.size] || 12;

        // Draw point
        this.ctx.fillStyle = ann.color;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Draw label if present
        if (ann.text) {
            this.ctx.fillStyle = ann.color;
            this.ctx.font = 'bold 12px sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(ann.text, x + radius + 4, y);
        }
    }

    /**
     * Draw text label annotation
     */
    drawLabelAnnotation(ann) {
        const x = this.flowToX(ann.Q);
        const y = this.pressureToY(ann.P);

        // Check if within plot bounds
        if (x < this.margin.left || x > this.margin.left + this.plotWidth ||
            y < this.margin.top || y > this.margin.top + this.plotHeight) {
            return;
        }

        // Determine font size
        const fontSizeMap = { small: '11px', medium: '13px', large: '16px' };
        const fontSize = fontSizeMap[ann.fontSize] || '13px';

        // Draw text
        this.ctx.fillStyle = ann.color;
        this.ctx.font = `${fontSize} sans-serif`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText(ann.text, x + 2, y - 2);
    }

    /**
     * Draw reference line annotation
     */
    drawLineAnnotation(ann) {
        this.ctx.strokeStyle = ann.color;
        this.ctx.lineWidth = 2;

        // Set line style
        if (ann.lineStyle === 'dashed') {
            this.ctx.setLineDash([8, 4]);
        } else {
            this.ctx.setLineDash([]);
        }

        if (ann.lineType === 'horizontal') {
            // Horizontal line at specific pressure
            const y = this.pressureToY(ann.P);

            // Check if within plot bounds
            if (y < this.margin.top || y > this.margin.top + this.plotHeight) {
                this.ctx.setLineDash([]);
                return;
            }

            this.ctx.beginPath();
            this.ctx.moveTo(this.margin.left, y);
            this.ctx.lineTo(this.margin.left + this.plotWidth, y);
            this.ctx.stroke();

            // Draw label
            if (ann.text) {
                this.ctx.fillStyle = ann.color;
                this.ctx.font = 'bold 11px sans-serif';
                this.ctx.textAlign = 'right';
                this.ctx.textBaseline = 'bottom';
                this.ctx.fillText(ann.text, this.margin.left + this.plotWidth - 5, y - 3);
            }
        } else if (ann.lineType === 'vertical') {
            // Vertical line at specific flow
            const x = this.flowToX(ann.Q);

            // Check if within plot bounds
            if (x < this.margin.left || x > this.margin.left + this.plotWidth) {
                this.ctx.setLineDash([]);
                return;
            }

            this.ctx.beginPath();
            this.ctx.moveTo(x, this.margin.top);
            this.ctx.lineTo(x, this.margin.top + this.plotHeight);
            this.ctx.stroke();

            // Draw label
            if (ann.text) {
                this.ctx.fillStyle = ann.color;
                this.ctx.font = 'bold 11px sans-serif';
                this.ctx.textAlign = 'left';
                this.ctx.textBaseline = 'top';
                this.ctx.save();
                this.ctx.translate(x + 3, this.margin.top + 5);
                this.ctx.rotate(Math.PI / 2);
                this.ctx.fillText(ann.text, 0, 0);
                this.ctx.restore();
            }
        }

        this.ctx.setLineDash([]);
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
     * Set annotations to draw
     */
    setAnnotations(annotations) {
        this.annotations = annotations;
        this.render();
    }

    /**
     * Export canvas to image
     */
    exportImage(format = 'png') {
        // Create a temporary canvas at the same internal pixel size
        const w = this.canvas.width;
        const h = this.canvas.height;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tctx = tempCanvas.getContext('2d');

        // Fill full background with white so exported image is solid white
        tctx.fillStyle = '#ffffff';
        tctx.fillRect(0, 0, w, h);

        // Draw the source canvas onto the temporary canvas
        tctx.drawImage(this.canvas, 0, 0);

        // Return data URL in requested format (JPEG will have no alpha)
        if (format === 'jpeg' || format === 'jpg') {
            return tempCanvas.toDataURL('image/jpeg');
        }
        return tempCanvas.toDataURL('image/' + format);
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
