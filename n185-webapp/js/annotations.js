/**
 * Annotations System
 * Manages graph annotations (points, labels, reference lines)
 */

class Annotation {
    constructor(type, data) {
        this.uuid = this.generateUUID();
        this.type = type;  // 'point', 'label', 'line'
        this.visible = true;

        // Common properties
        this.text = data.text || '';
        this.color = data.color || '#000000';

        // Position (Q, P coordinates)
        this.Q = data.Q || 0;
        this.P = data.P || 0;

        // Type-specific properties
        if (type === 'point') {
            this.size = data.size || 'medium';  // small, medium, large
        } else if (type === 'label') {
            this.fontSize = data.fontSize || 'medium';  // small, medium, large
        } else if (type === 'line') {
            this.lineType = data.lineType || 'horizontal';  // horizontal, vertical
            this.lineStyle = data.lineStyle || 'solid';  // solid, dashed
            this.value = data.value || 0;  // P value for horizontal, Q value for vertical
        }
    }

    generateUUID() {
        return 'ann-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    toJSON() {
        return {
            uuid: this.uuid,
            type: this.type,
            visible: this.visible,
            text: this.text,
            color: this.color,
            Q: this.Q,
            P: this.P,
            size: this.size,
            fontSize: this.fontSize,
            lineType: this.lineType,
            lineStyle: this.lineStyle,
            value: this.value
        };
    }

    static fromJSON(data) {
        const ann = new Annotation(data.type, {
            text: data.text,
            color: data.color,
            Q: data.Q,
            P: data.P,
            size: data.size,
            fontSize: data.fontSize,
            lineType: data.lineType,
            lineStyle: data.lineStyle,
            value: data.value
        });
        ann.uuid = data.uuid;
        ann.visible = data.visible;
        return ann;
    }
}

class AnnotationManager {
    constructor() {
        this.annotations = [];
        this.onAnnotationsChanged = null;
        this.onEditAnnotation = null;  // Callback when edit button clicked
    }

    addAnnotation(annotation) {
        this.annotations.push(annotation);
        this.notifyChange();
        return annotation;
    }

    removeAnnotation(uuid) {
        const index = this.annotations.findIndex(a => a.uuid === uuid);
        if (index !== -1) {
            this.annotations.splice(index, 1);
            this.notifyChange();
        }
    }

    getAnnotation(uuid) {
        return this.annotations.find(a => a.uuid === uuid);
    }

    updateAnnotation(uuid, properties) {
        const annotation = this.getAnnotation(uuid);
        if (annotation) {
            Object.assign(annotation, properties);
            this.notifyChange();
        }
    }

    toggleVisibility(uuid) {
        const annotation = this.getAnnotation(uuid);
        if (annotation) {
            annotation.visible = !annotation.visible;
            this.notifyChange();
        }
    }

    getVisibleAnnotations() {
        return this.annotations.filter(a => a.visible);
    }

    clearAll() {
        this.annotations = [];
        this.notifyChange();
    }

    exportToJSON() {
        return this.annotations.map(a => a.toJSON());
    }

    importFromJSON(data) {
        this.annotations = data.map(item => Annotation.fromJSON(item));
        this.notifyChange();
    }

    notifyChange() {
        if (this.onAnnotationsChanged) {
            this.onAnnotationsChanged(this.annotations);
        }
    }
}

/**
 * Annotations Panel UI
 */
class AnnotationsPanel {
    constructor(containerId, annotationManager, graph) {
        this.container = document.getElementById(containerId);
        this.annotationManager = annotationManager;
        this.graph = graph;
        this.render();
    }

    render() {
        const html = `
            <!-- Add Annotation Form -->
            <div class="annotation-section">
                <h4>Add Annotation</h4>
                <div class="form-group">
                    <label>Type:</label>
                    <select id="ann-type">
                        <option value="point">Point Marker</option>
                        <option value="label">Text Label</option>
                        <option value="line">Reference Line</option>
                    </select>
                </div>

                <!-- Point Marker Fields -->
                <div id="ann-point-fields" class="ann-type-fields">
                    <div class="form-group">
                        <label>Label:</label>
                        <input type="text" id="ann-point-text" placeholder="Design Point">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Flow (GPM):</label>
                            <input type="number" id="ann-point-q" value="2000" step="100">
                        </div>
                        <div class="form-group">
                            <label>Pressure (PSI):</label>
                            <input type="number" id="ann-point-p" value="35" step="1">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Color:</label>
                            <input type="color" id="ann-point-color" value="#ff0000">
                        </div>
                        <div class="form-group">
                            <label>Size:</label>
                            <select id="ann-point-size">
                                <option value="small">Small</option>
                                <option value="medium" selected>Medium</option>
                                <option value="large">Large</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Text Label Fields -->
                <div id="ann-label-fields" class="ann-type-fields" style="display: none;">
                    <div class="form-group">
                        <label>Text:</label>
                        <input type="text" id="ann-label-text" placeholder="Minimum allowable pressure">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Flow (GPM):</label>
                            <input type="number" id="ann-label-q" value="1500" step="100">
                        </div>
                        <div class="form-group">
                            <label>Pressure (PSI):</label>
                            <input type="number" id="ann-label-p" value="20" step="1">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Color:</label>
                            <input type="color" id="ann-label-color" value="#000000">
                        </div>
                        <div class="form-group">
                            <label>Font Size:</label>
                            <select id="ann-label-fontsize">
                                <option value="small">Small</option>
                                <option value="medium" selected>Medium</option>
                                <option value="large">Large</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Reference Line Fields -->
                <div id="ann-line-fields" class="ann-type-fields" style="display: none;">
                    <div class="form-group">
                        <label>Line Type:</label>
                        <select id="ann-line-type">
                            <option value="horizontal">Horizontal (Pressure)</option>
                            <option value="vertical">Vertical (Flow)</option>
                        </select>
                    </div>
                    <div class="form-group" id="ann-line-value-group">
                        <label id="ann-line-value-label">Pressure (PSI):</label>
                        <input type="number" id="ann-line-value" value="20" step="1">
                    </div>
                    <div class="form-group">
                        <label>Label:</label>
                        <input type="text" id="ann-line-text" placeholder="Min Pressure">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Color:</label>
                            <input type="color" id="ann-line-color" value="#ff0000">
                        </div>
                        <div class="form-group">
                            <label>Line Style:</label>
                            <select id="ann-line-style">
                                <option value="solid">Solid</option>
                                <option value="dashed">Dashed</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button id="btn-add-annotation" class="btn btn-primary btn-block">Add Annotation</button>
                <button id="btn-cancel-annotation" class="btn btn-secondary btn-block" style="display: none; margin-top: 8px;">Cancel Edit</button>
            </div>

            <!-- Annotations List -->
            <div class="annotation-section">
                <h4>Annotations List</h4>
                <div id="annotations-list" class="annotations-list">
                    <p class="empty-state">No annotations added</p>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        this.attachEventListeners();
        this.renderAnnotationsList();
    }

    attachEventListeners() {
        // Type selector
        document.getElementById('ann-type').addEventListener('change', (e) => {
            this.showTypeFields(e.target.value);
        });

        // Line type selector
        document.getElementById('ann-line-type').addEventListener('change', (e) => {
            this.updateLineValueLabel(e.target.value);
        });

        // Add annotation button
        document.getElementById('btn-add-annotation').addEventListener('click', () => {
            // Check if we're in edit mode (editingAnnotationUuid is defined in app.js)
            const editingUuid = window.editingAnnotationUuid || null;
            this.addAnnotation(editingUuid);

            // Clear form after adding/updating
            if (window.clearAnnotationForm) {
                window.clearAnnotationForm();
            }
        });

        // Cancel annotation edit button
        document.getElementById('btn-cancel-annotation').addEventListener('click', () => {
            clearAnnotationForm();
        });
    }

    showTypeFields(type) {
        document.getElementById('ann-point-fields').style.display = type === 'point' ? 'block' : 'none';
        document.getElementById('ann-label-fields').style.display = type === 'label' ? 'block' : 'none';
        document.getElementById('ann-line-fields').style.display = type === 'line' ? 'block' : 'none';
    }

    updateLineValueLabel(lineType) {
        const label = document.getElementById('ann-line-value-label');
        label.textContent = lineType === 'horizontal' ? 'Pressure (PSI):' : 'Flow (GPM):';
    }

    addAnnotation(editingUuid = null) {
        const type = document.getElementById('ann-type').value;

        try {
            if (editingUuid) {
                // Update existing annotation
                const ann = this.annotationManager.getAnnotation(editingUuid);
                if (!ann) return;

                if (type === 'point') {
                    ann.text = document.getElementById('ann-point-text').value;
                    ann.Q = parseFloat(document.getElementById('ann-point-q').value);
                    ann.P = parseFloat(document.getElementById('ann-point-p').value);
                    ann.color = document.getElementById('ann-point-color').value;
                    ann.size = document.getElementById('ann-point-size').value;
                } else if (type === 'label') {
                    ann.text = document.getElementById('ann-label-text').value;
                    ann.Q = parseFloat(document.getElementById('ann-label-q').value);
                    ann.P = parseFloat(document.getElementById('ann-label-p').value);
                    ann.color = document.getElementById('ann-label-color').value;
                    ann.fontSize = document.getElementById('ann-label-fontsize').value;
                } else if (type === 'line') {
                    const lineType = document.getElementById('ann-line-type').value;
                    const value = parseFloat(document.getElementById('ann-line-value').value);

                    ann.text = document.getElementById('ann-line-text').value;
                    ann.lineType = lineType;
                    ann.value = value;
                    ann.Q = lineType === 'vertical' ? value : 0;
                    ann.P = lineType === 'horizontal' ? value : 0;
                    ann.color = document.getElementById('ann-line-color').value;
                    ann.lineStyle = document.getElementById('ann-line-style').value;
                }

                // Notify changes
                this.annotationManager.notifyChange();
            } else {
                // Create new annotation
                let annotation;

                if (type === 'point') {
                    annotation = new Annotation('point', {
                        text: document.getElementById('ann-point-text').value,
                        Q: parseFloat(document.getElementById('ann-point-q').value),
                        P: parseFloat(document.getElementById('ann-point-p').value),
                        color: document.getElementById('ann-point-color').value,
                        size: document.getElementById('ann-point-size').value
                    });
                } else if (type === 'label') {
                    annotation = new Annotation('label', {
                        text: document.getElementById('ann-label-text').value,
                        Q: parseFloat(document.getElementById('ann-label-q').value),
                        P: parseFloat(document.getElementById('ann-label-p').value),
                        color: document.getElementById('ann-label-color').value,
                        fontSize: document.getElementById('ann-label-fontsize').value
                    });
                } else if (type === 'line') {
                    const lineType = document.getElementById('ann-line-type').value;
                    const value = parseFloat(document.getElementById('ann-line-value').value);

                    annotation = new Annotation('line', {
                        text: document.getElementById('ann-line-text').value,
                        lineType: lineType,
                        value: value,
                        Q: lineType === 'vertical' ? value : 0,
                        P: lineType === 'horizontal' ? value : 0,
                        color: document.getElementById('ann-line-color').value,
                        lineStyle: document.getElementById('ann-line-style').value
                    });
                }

                this.annotationManager.addAnnotation(annotation);
            }
        } catch (error) {
            alert('Error saving annotation: ' + error.message);
        }
    }

    renderAnnotationsList() {
        const container = document.getElementById('annotations-list');
        const annotations = this.annotationManager.annotations;

        if (annotations.length === 0) {
            container.innerHTML = '<p class="empty-state">No annotations added</p>';
            return;
        }

        let html = '';
        annotations.forEach(ann => {
            const icon = ann.type === 'point' ? '📍' : ann.type === 'label' ? '📝' : '─';
            const hiddenClass = ann.visible ? '' : 'hidden';

            html += `
                <div class="annotation-item ${hiddenClass}" data-uuid="${ann.uuid}">
                    <div class="annotation-header">
                        <div class="annotation-name">
                            <span style="color: ${ann.color}">${icon}</span>
                            <span>${ann.text || 'Untitled'}</span>
                        </div>
                        <div class="annotation-actions">
                            <button class="btn-ann-visibility" title="Toggle visibility">
                                ${ann.visible ? '👁️' : '👁️‍🗨️'}
                            </button>
                            <button class="btn-ann-edit" title="Edit">✏️</button>
                            <button class="btn-ann-delete" title="Delete">🗑️</button>
                        </div>
                    </div>
                    <div class="annotation-info">
                        ${this.getAnnotationInfo(ann)}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        this.attachAnnotationListeners();
    }

    getAnnotationInfo(ann) {
        if (ann.type === 'point') {
            return `Q: ${formatNumber(ann.Q, 0)} GPM, P: ${formatNumber(ann.P, 1)} PSI`;
        } else if (ann.type === 'label') {
            return `Q: ${formatNumber(ann.Q, 0)} GPM, P: ${formatNumber(ann.P, 1)} PSI`;
        } else if (ann.type === 'line') {
            if (ann.lineType === 'horizontal') {
                return `Horizontal at P = ${formatNumber(ann.P, 1)} PSI`;
            } else {
                return `Vertical at Q = ${formatNumber(ann.Q, 0)} GPM`;
            }
        }
        return '';
    }

    attachAnnotationListeners() {
        // Visibility toggle
        document.querySelectorAll('.btn-ann-visibility').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const uuid = e.target.closest('.annotation-item').dataset.uuid;
                this.annotationManager.toggleVisibility(uuid);
            });
        });

        // Edit
        document.querySelectorAll('.btn-ann-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const uuid = e.target.closest('.annotation-item').dataset.uuid;
                if (this.annotationManager.onEditAnnotation) {
                    this.annotationManager.onEditAnnotation(uuid);
                }
            });
        });

        // Delete
        document.querySelectorAll('.btn-ann-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const uuid = e.target.closest('.annotation-item').dataset.uuid;
                if (confirm('Delete this annotation?')) {
                    this.annotationManager.removeAnnotation(uuid);
                }
            });
        });
    }
}
