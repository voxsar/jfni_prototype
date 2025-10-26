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
        const viewport = page.getViewport({ scale: this.scale });

        this.canvas.width = viewport.width;
        this.canvas.height = viewport.height;

        const renderContext = {
            canvasContext: this.ctx,
            viewport: viewport
        };

        await page.render(renderContext).promise;
        console.log('Page rendered:', pageNum);
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
}
