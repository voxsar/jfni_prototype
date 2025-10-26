import { PDFRenderer } from './modules/PDFRenderer.js';
import { AnnotationLayer } from './modules/AnnotationLayer.js';
import { LineDetector } from './modules/LineDetector.js';
import { GeometryCompiler } from './modules/GeometryCompiler.js';
import { ThreeScene } from './modules/ThreeScene.js';
import { APIService } from './modules/APIService.js';

class DielineApp {
    constructor() {
        this.pdfRenderer = new PDFRenderer('pdf-canvas');
        this.annotationLayer = null;
        this.lineDetector = new LineDetector();
        this.geometryCompiler = new GeometryCompiler();
        this.threeScene = new ThreeScene('three-canvas');
        this.apiService = new APIService();

        this.currentTool = null;
        this.geometryData = null;

        this.initializeUI();
        this.checkBackendConnection();
    }

    initializeUI() {
        // PDF upload
        const pdfUpload = document.getElementById('pdf-upload');
        pdfUpload.addEventListener('change', (e) => this.handlePDFUpload(e));

        // Annotation tools
        document.getElementById('cut-tool').addEventListener('click', () => this.setTool('cut'));
        document.getElementById('crease-tool').addEventListener('click', () => this.setTool('crease'));
        document.getElementById('perf-tool').addEventListener('click', () => this.setTool('perf'));
        document.getElementById('emboss-tool').addEventListener('click', () => this.setTool('emboss'));

        // Actions
        document.getElementById('detect-lines').addEventListener('click', () => this.detectLines());
        document.getElementById('compile-geometry').addEventListener('click', () => this.compileGeometry());
        document.getElementById('build-3d').addEventListener('click', () => this.build3D());
        document.getElementById('animate-fold').addEventListener('click', () => this.animateFold());
        document.getElementById('export-glb').addEventListener('click', () => this.exportGLB());

        this.updateStatus('Ready - Load a PDF to begin');
    }

    async handlePDFUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.updateStatus('Loading PDF...');

        const result = await this.pdfRenderer.loadPDF(file);
        
        if (result.success) {
            this.updateStatus(`PDF loaded: ${result.pages} page(s)`);
            
            // Initialize annotation layer with canvas dimensions
            const dims = this.pdfRenderer.getCanvasDimensions();
            this.annotationLayer = new AnnotationLayer('konva-container', dims.width, dims.height);
            
            // Upload to backend
            await this.apiService.uploadPDF(file);
        } else {
            this.updateStatus(`Error: ${result.error}`);
        }
    }

    setTool(tool) {
        this.currentTool = tool;
        
        // Update UI
        document.querySelectorAll('.annotation-tools button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${tool}-tool`).classList.add('active');
        
        if (this.annotationLayer) {
            this.annotationLayer.setTool(tool);
        }
        
        this.updateStatus(`Tool: ${tool}`);
    }

    async detectLines() {
        if (!this.pdfRenderer.canvas) {
            this.updateStatus('Error: Load a PDF first');
            return;
        }

        this.updateStatus('Detecting lines...');

        const canvas = document.getElementById('pdf-canvas');
        const lines = await this.lineDetector.detectLines(canvas);
        
        if (lines.length > 0) {
            const classified = this.lineDetector.classifyLines(lines);
            
            // Add detected lines to annotation layer
            Object.keys(classified).forEach(type => {
                classified[type].forEach(line => {
                    if (this.annotationLayer) {
                        this.annotationLayer.addLine(line.points, type);
                    }
                });
            });
            
            this.updateStatus(`Detected ${lines.length} lines`);
        } else {
            this.updateStatus('No lines detected');
        }
    }

    compileGeometry() {
        if (!this.annotationLayer) {
            this.updateStatus('Error: No annotations to compile');
            return;
        }

        this.updateStatus('Compiling geometry...');

        const annotations = this.annotationLayer.getAllAnnotations();
        const dims = this.pdfRenderer.getCanvasDimensions();
        
        this.geometryData = this.geometryCompiler.compile(
            annotations,
            dims.width,
            dims.height
        );

        this.updateStatus(
            `Compiled: ${this.geometryData.panels.length} panels, ` +
            `${this.geometryData.hinges.length} hinges`
        );
    }

    build3D() {
        if (!this.geometryData) {
            this.updateStatus('Error: Compile geometry first');
            return;
        }

        this.updateStatus('Building 3D scene...');
        this.threeScene.build3DFromGeometry(this.geometryData);
        this.updateStatus('3D scene ready');
    }

    animateFold() {
        this.updateStatus('Animating fold sequence...');
        this.threeScene.animateFold();
        this.updateStatus('Animation playing');
    }

    async exportGLB() {
        this.updateStatus('Exporting GLB...');
        
        try {
            await this.threeScene.exportGLB();
            this.updateStatus('GLB exported successfully');
        } catch (error) {
            this.updateStatus(`Export error: ${error.message}`);
        }
    }

    async checkBackendConnection() {
        const health = await this.apiService.checkHealth();
        const statusRight = document.getElementById('status-right');
        
        if (health.status === 'ok' || health.status === 'healthy') {
            statusRight.textContent = 'Backend: Connected';
            statusRight.style.color = '#00ff00';
        } else {
            statusRight.textContent = 'Backend: Offline';
            statusRight.style.color = '#ff0000';
        }
    }

    updateStatus(message) {
        const statusLeft = document.getElementById('status-left');
        statusLeft.textContent = message;
        console.log('Status:', message);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DielineApp();
});
