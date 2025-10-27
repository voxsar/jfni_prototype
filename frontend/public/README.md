# Public Assets

## PDF.js Worker

The `pdf.worker.js` file is required for PDF rendering functionality. This file is copied from the `pdfjs-dist` package during setup.

### Setup
If the worker file is missing, copy it from node_modules:
```bash
cp node_modules/pdfjs-dist/build/pdf.worker.js public/pdf.worker.js
```

### Why is this needed?
PDF.js requires a web worker to process PDF files. The worker runs in a separate thread to avoid blocking the main UI thread during PDF parsing and rendering.

## OpenCV.js

The `opencv.js` file provides computer vision capabilities for automatic line detection in PDF dielines.
