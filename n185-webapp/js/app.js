/**
 * Main Application
 * Initializes and coordinates all components
 */

// Global app state
let testManager;
let graph;
let testListUI;
let calculationsPanel;
let modelingPanel;
let annotationManager;
let annotationsPanel;
let projectIO;
let editingTestUuid = null;  // Track which test is being edited
let editingAnnotationUuid = null;  // Track which annotation is being edited

/**
 * Initialize application
 */
function initApp() {
    // Create core components
    testManager = new TestManager();
    graph = new N185Graph('fireflow-canvas', 5000, 100);
    testListUI = new TestListUI('test-list', testManager);
    calculationsPanel = new CalculationsPanel('calc-display');
    modelingPanel = new ModelingPanel('modeling-tools', testManager);
    annotationManager = new AnnotationManager();
    annotationsPanel = new AnnotationsPanel('annotations-panel', annotationManager, graph);
    projectIO = new ProjectIO(testManager, graph, annotationManager);

    // Set up event listeners
    setupEventListeners();

    // Initial render
    graph.render();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Test Manager callbacks
    testManager.onTestsChanged = (tests) => {
        testListUI.render();
        graph.setFireflows(tests);
    };

    testManager.onTestSelected = (test) => {
        testListUI.render();
        calculationsPanel.updateTest(test);
        modelingPanel.updateTest(test);

        // Expand calculations panel when a test is selected
        const calculationsHeader = document.getElementById('calculations-header');
        const calculationsContent = document.getElementById('calculations-content');
        if (calculationsHeader && calculationsContent) {
            calculationsHeader.classList.remove('collapsed');
            calculationsContent.classList.remove('collapsed');
        }

        // Expand modeling panel when a test is selected
        const modelingHeader = document.getElementById('modeling-header');
        const modelingContent = document.getElementById('modeling-content');
        if (modelingHeader && modelingContent) {
            modelingHeader.classList.remove('collapsed');
            modelingContent.classList.remove('collapsed');
        }
    };

    testManager.onEditTest = (uuid) => {
        editTest(uuid);
    };

    annotationManager.onAnnotationsChanged = (annotations) => {
        annotationsPanel.renderAnnotationsList();
        graph.setAnnotations(annotations);
    };

    annotationManager.onEditAnnotation = (uuid) => {
        editAnnotation(uuid);
    };

    // Test form submission
    document.getElementById('test-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addTest();
    });

    // Cancel edit button
    document.getElementById('test-form-cancel').addEventListener('click', () => {
        clearTestForm();
    });

    // Collapsible "Add New Test" section
    const addTestHeader = document.getElementById('add-test-header');
    const addTestContent = document.getElementById('add-test-content');

    addTestHeader.addEventListener('click', () => {
        addTestHeader.classList.toggle('collapsed');
        addTestContent.classList.toggle('collapsed');
    });

    // Collapsible Annotations section
    const annotationsHeader = document.getElementById('annotations-header');
    const annotationsContent = document.getElementById('annotations-content');

    if (annotationsHeader && annotationsContent) {
        annotationsHeader.addEventListener('click', () => {
            annotationsHeader.classList.toggle('collapsed');
            annotationsContent.classList.toggle('collapsed');
        });
    }

    // Collapsible Calculations section
    const calculationsHeader = document.getElementById('calculations-header');
    const calculationsContent = document.getElementById('calculations-content');

    if (calculationsHeader && calculationsContent) {
        calculationsHeader.addEventListener('click', () => {
            calculationsHeader.classList.toggle('collapsed');
            calculationsContent.classList.toggle('collapsed');
        });
    }

    // Collapsible Modeling Tools section
    const modelingHeader = document.getElementById('modeling-header');
    const modelingContent = document.getElementById('modeling-content');

    if (modelingHeader && modelingContent) {
        modelingHeader.addEventListener('click', () => {
            modelingHeader.classList.toggle('collapsed');
            modelingContent.classList.toggle('collapsed');
        });
    }

    // Graph settings modal
    const settingsModal = document.getElementById('settings-modal');

    document.getElementById('btn-graph-settings').addEventListener('click', () => {
        settingsModal.classList.add('active');
    });

    document.getElementById('btn-close-settings').addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    document.getElementById('btn-cancel-settings').addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    document.getElementById('btn-apply-settings').addEventListener('click', () => {
        updateGraph();
        settingsModal.classList.remove('active');
    });

    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsModal.classList.contains('active')) {
            settingsModal.classList.remove('active');
        }
    });

    // Export buttons
    document.getElementById('btn-export-png').addEventListener('click', () => {
        projectIO.exportPNG();
    });

    document.getElementById('btn-export-jpg').addEventListener('click', () => {
        projectIO.exportJPG();
    });

    // Project buttons
    document.getElementById('btn-new-project').addEventListener('click', () => {
        projectIO.newProject();
    });

    document.getElementById('btn-save-project').addEventListener('click', () => {
        projectIO.saveProject();
    });

    document.getElementById('btn-load-project').addEventListener('click', () => {
        document.getElementById('file-input-project').click();
    });

    document.getElementById('file-input-project').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            projectIO.loadProject(file);
        }
        e.target.value = '';  // Reset input
    });

    // Canvas hover for tooltip
    const canvas = document.getElementById('fireflow-canvas');
    const tooltip = document.getElementById('graph-tooltip');

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const data = graph.getFireflowAtMouse(x, y);

        if (data) {
            tooltip.innerHTML = `
                Flow: ${formatNumber(data.Q, 0)} GPM<br>
                Pressure: ${formatNumber(data.P, 1)} PSI
            `;
            tooltip.style.left = (e.clientX + 10) + 'px';
            tooltip.style.top = (e.clientY + 10) + 'px';
            tooltip.classList.add('visible');
        } else {
            tooltip.classList.remove('visible');
        }
    });

    canvas.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
    });
}

/**
 * Add or update a test from the form
 */
function addTest() {
    try {
        const id = document.getElementById('test-id').value;
        const static_ = document.getElementById('test-static').value;
        const flow = document.getElementById('test-flow').value;
        const residual = document.getElementById('test-residual').value;
        const color = document.getElementById('test-color').value;
        const lineType = document.getElementById('test-linetype').value;
        const category = document.getElementById('test-category').value;

        if (editingTestUuid) {
            // Update existing test
            const test = testManager.getTest(editingTestUuid);
            if (test) {
                // Update properties
                test.static = parseFloat(static_);
                test.testFlow = parseFloat(flow);
                test.testResidual = parseFloat(residual);
                test.id = id;
                test.color = color;
                test.lineType = lineType;
                test.category = category;

                // Recalculate friction coefficient
                test.k = (test.static - test.testResidual) / Math.pow(test.testFlow, 1.85);

                // Notify changes
                testManager.notifyChange();
            }
        } else {
            // Create new fireflow object
            const fireflow = new FireFlow(static_, flow, residual, id, {
                color: color,
                lineType: lineType,
                category: category
            });

            // Add to manager
            testManager.addTest(fireflow);
        }

        // Clear form
        clearTestForm();
    } catch (error) {
        alert('Error saving test: ' + error.message);
    }
}

/**
 * Edit an existing test - populate form with test data
 */
function editTest(uuid) {
    const test = testManager.getTest(uuid);
    if (!test) return;

    // Populate form fields
    document.getElementById('test-id').value = test.id || '';
    document.getElementById('test-static').value = test.static;
    document.getElementById('test-flow').value = test.testFlow || 0;
    document.getElementById('test-residual').value = test.testResidual || 0;
    document.getElementById('test-color').value = test.color;
    document.getElementById('test-linetype').value = test.lineType;
    document.getElementById('test-category').value = test.category;

    // Set edit mode
    editingTestUuid = uuid;

    // Update button text and show cancel button
    const submitBtn = document.getElementById('test-form-submit');
    submitBtn.textContent = 'Update Test';
    submitBtn.classList.remove('btn-primary');
    submitBtn.classList.add('btn-warning');

    const cancelBtn = document.getElementById('test-form-cancel');
    cancelBtn.style.display = 'block';

    // Expand the form if collapsed
    const addTestHeader = document.getElementById('add-test-header');
    const addTestContent = document.getElementById('add-test-content');
    addTestHeader.classList.remove('collapsed');
    addTestContent.classList.remove('collapsed');

    // Update header to show edit mode
    addTestHeader.querySelector('span').textContent = `Edit Test: ${test.id || 'Unnamed'}`;

    // Scroll form into view
    document.getElementById('test-form').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Clear test input form and reset to add mode
 */
function clearTestForm() {
    document.getElementById('test-id').value = '';
    document.getElementById('test-static').value = 0;
    document.getElementById('test-flow').value = 0;
    document.getElementById('test-residual').value = 0;
    // Keep color, linetype, and category as-is

    // Reset edit mode
    editingTestUuid = null;

    // Update button text and hide cancel button
    const submitBtn = document.getElementById('test-form-submit');
    submitBtn.textContent = 'Add Test';
    submitBtn.classList.remove('btn-warning');
    submitBtn.classList.add('btn-primary');

    const cancelBtn = document.getElementById('test-form-cancel');
    cancelBtn.style.display = 'none';

    // Reset header text
    const addTestHeader = document.getElementById('add-test-header');
    addTestHeader.querySelector('span').textContent = 'Add New Test';
}

/**
 * Edit an existing annotation - populate form with annotation data
 */
function editAnnotation(uuid) {
    const ann = annotationManager.getAnnotation(uuid);
    if (!ann) return;

    // Set annotation type selector
    document.getElementById('ann-type').value = ann.type;
    annotationsPanel.showTypeFields(ann.type);

    // Populate fields based on type
    if (ann.type === 'point') {
        document.getElementById('ann-point-text').value = ann.text || '';
        document.getElementById('ann-point-q').value = ann.Q;
        document.getElementById('ann-point-p').value = ann.P;
        document.getElementById('ann-point-color').value = ann.color;
        document.getElementById('ann-point-size').value = ann.size;
    } else if (ann.type === 'label') {
        document.getElementById('ann-label-text').value = ann.text || '';
        document.getElementById('ann-label-q').value = ann.Q;
        document.getElementById('ann-label-p').value = ann.P;
        document.getElementById('ann-label-color').value = ann.color;
        document.getElementById('ann-label-fontsize').value = ann.fontSize;
    } else if (ann.type === 'line') {
        document.getElementById('ann-line-type').value = ann.lineType;
        annotationsPanel.updateLineValueLabel(ann.lineType);
        document.getElementById('ann-line-value').value = ann.value;
        document.getElementById('ann-line-text').value = ann.text || '';
        document.getElementById('ann-line-color').value = ann.color;
        document.getElementById('ann-line-style').value = ann.lineStyle;
    }

    // Set edit mode
    setEditingAnnotationUuid(uuid);

    // Expand annotations panel if collapsed
    const annotationsHeader = document.getElementById('annotations-header');
    const annotationsContent = document.getElementById('annotations-content');
    if (annotationsHeader && annotationsContent) {
        annotationsHeader.classList.remove('collapsed');
        annotationsContent.classList.remove('collapsed');
    }
    // Update button text and show cancel button
    const submitBtn = document.getElementById('btn-add-annotation');
    submitBtn.textContent = 'Update Annotation';
    submitBtn.classList.remove('btn-primary');
    submitBtn.classList.add('btn-warning');

    const cancelBtn = document.getElementById('btn-cancel-annotation');
    cancelBtn.style.display = 'block';

    // Scroll form into view
    document.getElementById('annotations-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Clear annotation input form and reset to add mode
 */
function clearAnnotationForm() {
    // Reset to default values
    document.getElementById('ann-type').value = 'point';
    annotationsPanel.showTypeFields('point');

    document.getElementById('ann-point-text').value = '';
    document.getElementById('ann-point-q').value = 2000;
    document.getElementById('ann-point-p').value = 35;
    document.getElementById('ann-point-color').value = '#ff0000';
    document.getElementById('ann-point-size').value = 'medium';

    // Reset edit mode
    setEditingAnnotationUuid(null);

    // Update button text and hide cancel button
    const submitBtn = document.getElementById('btn-add-annotation');
    submitBtn.textContent = 'Add Annotation';
    submitBtn.classList.remove('btn-warning');
    submitBtn.classList.add('btn-primary');

    const cancelBtn = document.getElementById('btn-cancel-annotation');
    cancelBtn.style.display = 'none';
}

/**
 * Update graph with current settings
 */
function updateGraph() {
    const maxFlow = parseInt(document.getElementById('graph-max-flow').value);
    const maxPressure = parseInt(document.getElementById('graph-max-pressure').value);
    const title = document.getElementById('graph-title').value;
    const showDate = document.getElementById('graph-show-date').checked;

    graph.update(maxFlow, maxPressure, title, showDate);
}

// Expose functions globally for use by other modules
window.clearAnnotationForm = clearAnnotationForm;
window.editingAnnotationUuid = null;

// Update global editing state when editing annotation
function setEditingAnnotationUuid(uuid) {
    editingAnnotationUuid = uuid;
    window.editingAnnotationUuid = uuid;
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
