// OpenCV line detection using Hough Transform
export class LineDetector {
    constructor() {
        this.cvReady = false;
        this.cvReadyPromise = new Promise((resolve) => {
            this.cvReadyResolve = resolve;
        });
        this.initOpenCV();
    }

    initOpenCV() {
        // OpenCV.js needs to be loaded from CDN
        if (typeof cv !== 'undefined' && cv.Mat) {
            // OpenCV is already loaded and initialized
            this.cvReady = true;
            this.cvReadyResolve();
            console.log('OpenCV.js ready');
        } else if (typeof cv !== 'undefined') {
            // OpenCV script loaded but not initialized yet
            console.log('Waiting for OpenCV.js to initialize...');
            cv['onRuntimeInitialized'] = () => {
                this.cvReady = true;
                this.cvReadyResolve();
                console.log('OpenCV.js ready');
            };
        } else {
            // OpenCV script not loaded yet
            console.log('Loading OpenCV.js...');
            // Will be loaded via script tag in HTML
            setTimeout(() => this.initOpenCV(), 100);
        }
    }

    async detectLines(canvas) {
        // Wait for OpenCV to be ready
        await this.cvReadyPromise;
        
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
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();

            // Convert to grayscale
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

            // Apply Gaussian blur
            cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

            // Canny edge detection
            cv.Canny(gray, edges, 50, 150);

            // Detect straight lines with Hough Transform
            cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 100, 50, 10);

            const detectedLines = [];
            
            // Add straight lines
            for (let i = 0; i < lines.rows; i++) {
                const x1 = lines.data32S[i * 4];
                const y1 = lines.data32S[i * 4 + 1];
                const x2 = lines.data32S[i * 4 + 2];
                const y2 = lines.data32S[i * 4 + 3];
                
                detectedLines.push({
                    points: [x1, y1, x2, y2],
                    length: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
                    type: 'straight'
                });
            }

            // Detect contours for curved lines
            cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

            // Process contours to find curves
            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const arcLength = cv.arcLength(contour, false);
                
                // Only process contours with reasonable length
                if (arcLength > 50 && arcLength < 5000) {
                    // Approximate the contour to reduce points
                    const approx = new cv.Mat();
                    const epsilon = 0.01 * arcLength; // Approximation accuracy
                    cv.approxPolyDP(contour, approx, epsilon, false);
                    
                    // Convert contour points to array
                    const points = [];
                    for (let j = 0; j < approx.rows; j++) {
                        points.push(approx.data32S[j * 2]);
                        points.push(approx.data32S[j * 2 + 1]);
                    }
                    
                    // Only add if it has enough points to be a curve (more than 2 points)
                    if (points.length > 4) {
                        // Calculate if this is actually a curve vs straight line
                        const isCurved = this.isContourCurved(points);
                        
                        if (isCurved) {
                            detectedLines.push({
                                points: points,
                                length: arcLength,
                                type: 'curve'
                            });
                        }
                    }
                    
                    approx.delete();
                }
            }

            // Cleanup
            src.delete();
            dst.delete();
            gray.delete();
            edges.delete();
            lines.delete();
            contours.delete();
            hierarchy.delete();

            console.log('Detected', detectedLines.length, 'lines (straight and curves)');
            return detectedLines;

        } catch (error) {
            console.error('Error detecting lines:', error);
            return [];
        }
    }

    isContourCurved(points) {
        // Check if contour is curved by comparing arc length to straight distance
        if (points.length < 6) return false;
        
        const startX = points[0];
        const startY = points[1];
        const endX = points[points.length - 2];
        const endY = points[points.length - 1];
        
        // Calculate straight line distance
        const straightDist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        
        // Calculate total arc length through all points
        let arcLength = 0;
        for (let i = 0; i < points.length - 2; i += 2) {
            const dx = points[i + 2] - points[i];
            const dy = points[i + 3] - points[i + 1];
            arcLength += Math.sqrt(dx * dx + dy * dy);
        }
        
        // If arc length is significantly longer than straight distance, it's curved
        const ratio = arcLength / straightDist;
        return ratio > 1.1; // More than 10% longer indicates a curve
    }

    // Classify lines based on color and orientation
    classifyLines(lines, canvas = null) {
        const classified = {
            cut: [],
            crease: [],
            perf: [],
            emboss: []
        };

        // If canvas is provided, try to detect colors
        let colorClassification = null;
        if (canvas) {
            colorClassification = this.detectLineColors(lines, canvas);
        }

        lines.forEach((line, index) => {
            // Try color-based classification first
            if (colorClassification && colorClassification[index]) {
                const colorType = colorClassification[index];
                classified[colorType].push(line);
                return;
            }

            // Fallback to angle-based classification
            const points = line.points;
            if (points.length >= 4) {
                const x1 = points[0];
                const y1 = points[1];
                const x2 = points[points.length - 2];
                const y2 = points[points.length - 1];
                const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
                
                // Simple classification based on angle
                if (Math.abs(angle) < 15 || Math.abs(angle - 180) < 15) {
                    classified.cut.push(line);
                } else if (Math.abs(angle - 90) < 15) {
                    classified.crease.push(line);
                } else {
                    classified.perf.push(line);
                }
            } else {
                // Default to cut for very short lines
                classified.cut.push(line);
            }
        });

        return classified;
    }

    detectLineColors(lines, canvas) {
        // Detect the dominant color along each line
        const ctx = canvas.getContext('2d');
        const colorMap = {};
        
        lines.forEach((line, index) => {
            const points = line.points;
            const colors = [];
            
            // Sample colors along the line
            const numSamples = Math.min(10, points.length / 2);
            for (let i = 0; i < numSamples; i++) {
                const idx = Math.floor((i / numSamples) * (points.length / 2)) * 2;
                const x = Math.round(points[idx]);
                const y = Math.round(points[idx + 1]);
                
                if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                    const pixel = ctx.getImageData(x, y, 1, 1).data;
                    colors.push({ r: pixel[0], g: pixel[1], b: pixel[2] });
                }
            }
            
            if (colors.length > 0) {
                // Calculate average color
                const avgColor = {
                    r: colors.reduce((sum, c) => sum + c.r, 0) / colors.length,
                    g: colors.reduce((sum, c) => sum + c.g, 0) / colors.length,
                    b: colors.reduce((sum, c) => sum + c.b, 0) / colors.length
                };
                
                // Classify based on color (simple heuristic)
                colorMap[index] = this.classifyByColor(avgColor);
            }
        });
        
        return colorMap;
    }

    classifyByColor(color) {
        // Simple color-based classification
        // Red-ish -> cut
        // Blue-ish -> crease
        // Green-ish -> perf
        // Yellow-ish -> emboss
        
        const { r, g, b } = color;
        
        if (r > g && r > b && r > 150) {
            return 'cut';
        } else if (b > r && b > g && b > 150) {
            return 'crease';
        } else if (g > r && g > b && g > 150) {
            return 'perf';
        } else if (r > 150 && g > 150 && b < 100) {
            return 'emboss';
        }
        
        // Default to cut if no clear color match
        return 'cut';
    }
}
