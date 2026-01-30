/**
 * Project I/O
 * Handles saving/loading projects and exporting images
 */

class ProjectIO {
    constructor(testManager, graph) {
        this.testManager = testManager;
        this.graph = graph;
        this.currentProject = {
            name: 'Untitled Project',
            tests: [],
            graphSettings: {
                maxFlow: 5000,
                maxPressure: 100,
                title: '',
                showDate: false
            }
        };
    }

    /**
     * Save current project to JSON file
     */
    saveProject() {
        // Get current state
        this.currentProject.tests = this.testManager.exportToJSON();
        this.currentProject.graphSettings = {
            maxFlow: this.graph.maxFlow,
            maxPressure: this.graph.maxPressure,
            title: this.graph.title,
            showDate: this.graph.showDate
        };
        this.currentProject.savedDate = new Date().toISOString();

        // Create JSON blob
        const json = JSON.stringify(this.currentProject, null, 2);
        const blob = new Blob([json], { type: 'application/json' });

        // Generate filename
        const filename = this.currentProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.n185';

        // Download
        this.downloadBlob(blob, filename);
    }

    /**
     * Load project from JSON file
     */
    loadProject(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const project = JSON.parse(e.target.result);

                // Validate project structure
                if (!project.tests || !project.graphSettings) {
                    throw new Error('Invalid project file format');
                }

                // Load project
                this.currentProject = project;

                // Clear existing tests
                this.testManager.clearAll();

                // Import tests
                this.testManager.importFromJSON(project.tests);

                // Apply graph settings
                const gs = project.graphSettings;
                this.graph.update(gs.maxFlow, gs.maxPressure, gs.title, gs.showDate);

                // Update UI
                document.getElementById('graph-max-flow').value = gs.maxFlow;
                document.getElementById('graph-max-pressure').value = gs.maxPressure;
                document.getElementById('graph-title').value = gs.title;
                document.getElementById('graph-show-date').checked = gs.showDate;

                alert(`Project "${project.name}" loaded successfully`);
            } catch (error) {
                alert('Error loading project: ' + error.message);
            }
        };

        reader.readAsText(file);
    }

    /**
     * Create new project
     */
    newProject() {
        if (this.testManager.tests.length > 0) {
            if (!confirm('Create new project? Current work will be lost if not saved.')) {
                return;
            }
        }

        // Reset everything
        this.testManager.clearAll();
        this.currentProject = {
            name: 'Untitled Project',
            tests: [],
            graphSettings: {
                maxFlow: 5000,
                maxPressure: 100,
                title: '',
                showDate: false
            }
        };

        // Reset graph settings
        this.graph.update(5000, 100, '', false);
        document.getElementById('graph-max-flow').value = 5000;
        document.getElementById('graph-max-pressure').value = 100;
        document.getElementById('graph-title').value = '';
        document.getElementById('graph-show-date').checked = false;
    }

    /**
     * Export graph as PNG
     */
    exportPNG() {
        const dataURL = this.graph.exportImage('png');
        const filename = (this.graph.title || 'fireflow_graph') + '.png';
        this.downloadDataURL(dataURL, filename);
    }

    /**
     * Export graph as JPG
     */
    exportJPG() {
        const dataURL = this.graph.exportImage('jpeg');
        const filename = (this.graph.title || 'fireflow_graph') + '.jpg';
        this.downloadDataURL(dataURL, filename);
    }

    /**
     * Download data URL as file
     */
    downloadDataURL(dataURL, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Download blob as file
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Set project name
     */
    setProjectName(name) {
        this.currentProject.name = name;
    }
}
