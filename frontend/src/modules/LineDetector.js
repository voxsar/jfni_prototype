// OpenCV line detection using Hough Transform
export class LineDetector {
    constructor() {
        this.cvReady = false;
        this.initOpenCV();
    }

    initOpenCV() {
        // OpenCV.js needs to be loaded from CDN
        if (typeof cv !== 'undefined') {
            this.cvReady = true;
            console.log('OpenCV.js ready');
        } else {
            console.log('Loading OpenCV.js...');
            // Will be loaded via script tag in HTML or dynamically
            setTimeout(() => this.initOpenCV(), 100);
        }
    }

    async detectLines(canvas) {
        if (!this.cvReady) {
            console.warn('OpenCV not ready yet');
            return [];
        }

        try {
            // Convert canvas to OpenCV Mat
            const src = cv.imread(canvas);
            const dst = new cv.Mat();
            const gray = new cv.Mat();
            const edges = new cv.Mat();
            const lines = new cv.Mat();

            // Convert to grayscale
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

            // Apply Gaussian blur
            cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

            // Canny edge detection
            cv.Canny(gray, edges, 50, 150);

            // Hough Line Transform
            cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 100, 50, 10);

            const detectedLines = [];
            for (let i = 0; i < lines.rows; i++) {
                const x1 = lines.data32S[i * 4];
                const y1 = lines.data32S[i * 4 + 1];
                const x2 = lines.data32S[i * 4 + 2];
                const y2 = lines.data32S[i * 4 + 3];
                
                detectedLines.push({
                    points: [x1, y1, x2, y2],
                    length: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
                });
            }

            // Cleanup
            src.delete();
            dst.delete();
            gray.delete();
            edges.delete();
            lines.delete();

            console.log('Detected', detectedLines.length, 'lines');
            return detectedLines;

        } catch (error) {
            console.error('Error detecting lines:', error);
            return [];
        }
    }

    // Classify lines based on orientation and position
    classifyLines(lines) {
        const classified = {
            cut: [],
            crease: [],
            perf: [],
            emboss: []
        };

        lines.forEach(line => {
            const [x1, y1, x2, y2] = line.points;
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
            
            // Simple classification based on angle
            // In a real app, this would use more sophisticated ML or heuristics
            if (Math.abs(angle) < 15 || Math.abs(angle - 180) < 15) {
                classified.cut.push(line);
            } else if (Math.abs(angle - 90) < 15) {
                classified.crease.push(line);
            } else {
                classified.perf.push(line);
            }
        });

        return classified;
    }
}
