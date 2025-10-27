import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export class PDFRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.pdfDoc = null;
        this.currentPage = 1;
        this.scale = 1.5;
        this.baseScale = 1.5; // Store the initial scale
        this.zoomLevel = 1.0; // Current zoom multiplier
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.setupPanHandlers();
    }

    async loadPDF(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            console.log('PDF loaded:', this.pdfDoc.numPages, 'pages');
            await this.renderPage(this.currentPage);
            return { success: true, pages: this.pdfDoc.numPages };
        } catch (error) {
            console.error('Error loading PDF:', error);
            return { success: false, error: error.message };
        }
    }

    async renderPage(pageNum) {
        if (!this.pdfDoc) return;

        const page = await this.pdfDoc.getPage(pageNum);
        const effectiveScale = this.baseScale * this.zoomLevel;
        const viewport = page.getViewport({ scale: effectiveScale });

        this.canvas.width = viewport.width;
        this.canvas.height = viewport.height;

        const renderContext = {
            canvasContext: this.ctx,
            viewport: viewport
        };

        await page.render(renderContext).promise;
        console.log('Page rendered:', pageNum, 'at zoom:', this.zoomLevel);
    }

    getCanvasDimensions() {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }

    nextPage() {
        if (this.pdfDoc && this.currentPage < this.pdfDoc.numPages) {
            this.currentPage++;
            this.renderPage(this.currentPage);
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderPage(this.currentPage);
        }
    }

    setupPanHandlers() {
        const container = this.canvas.parentElement;
        
        // Middle mouse button pan (button 1)
        container.addEventListener('mousedown', (e) => {
            // Middle click (button 1) or left click when zoomed
            if (e.button === 1 || (e.button === 0 && this.zoomLevel > 1.0)) {
                e.preventDefault(); // Prevent default middle-click behavior
                this.isDragging = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                container.style.cursor = 'grabbing';
            }
        });

        container.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                this.panX += deltaX;
                this.panY += deltaY;
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                
                this.updateTransform();
            }
        });

        container.addEventListener('mouseup', (e) => {
            if (e.button === 1 || e.button === 0) {
                this.isDragging = false;
                if (this.zoomLevel > 1.0) {
                    container.style.cursor = 'grab';
                } else {
                    container.style.cursor = 'default';
                }
            }
        });

        container.addEventListener('mouseleave', () => {
            this.isDragging = false;
            if (this.zoomLevel > 1.0) {
                container.style.cursor = 'grab';
            } else {
                container.style.cursor = 'default';
            }
        });

        // Mouse wheel zoom
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1; // Zoom out or in
            const oldZoom = this.zoomLevel;
            this.zoomLevel = Math.max(0.5, Math.min(5.0, this.zoomLevel * zoomDelta));
            
            if (oldZoom !== this.zoomLevel) {
                // Get mouse position relative to container
                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                // Adjust pan to zoom towards mouse position
                const zoomRatio = this.zoomLevel / oldZoom;
                this.panX = mouseX - (mouseX - this.panX) * zoomRatio;
                this.panY = mouseY - (mouseY - this.panY) * zoomRatio;
                
                this.renderPage(this.currentPage).then(() => {
                    this.updateTransform();
                    container.style.cursor = this.zoomLevel > 1.0 ? 'grab' : 'default';
                    
                    // Dispatch custom event for main app to update annotation layer
                    const event = new CustomEvent('pdfzoom', {
                        detail: { 
                            zoomLevel: this.zoomLevel,
                            width: this.canvas.width,
                            height: this.canvas.height
                        }
                    });
                    window.dispatchEvent(event);
                });
            }
        }, { passive: false });

        // Prevent context menu on middle click
        container.addEventListener('contextmenu', (e) => {
            if (e.button === 1) {
                e.preventDefault();
            }
        });
    }

    updateTransform() {
        const container = this.canvas.parentElement;
        const konvaContainer = document.getElementById('konva-container');
        
        const transform = `translate(${this.panX}px, ${this.panY}px)`;
        this.canvas.style.transform = transform;
        if (konvaContainer) {
            konvaContainer.style.transform = transform;
        }
    }

    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel * 1.2, 5.0);
        this.renderPage(this.currentPage);
        this.updateTransform();
        const container = this.canvas.parentElement;
        container.style.cursor = 'grab';
        return this.zoomLevel;
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.5);
        this.renderPage(this.currentPage);
        this.updateTransform();
        const container = this.canvas.parentElement;
        if (this.zoomLevel <= 1.0) {
            container.style.cursor = 'default';
        }
        return this.zoomLevel;
    }

    resetZoom() {
        this.zoomLevel = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.renderPage(this.currentPage);
        this.updateTransform();
        const container = this.canvas.parentElement;
        container.style.cursor = 'default';
        return this.zoomLevel;
    }

    getZoomLevel() {
        return this.zoomLevel;
    }
}
