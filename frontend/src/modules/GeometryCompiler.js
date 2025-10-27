// Geometry compiler - converts 2D annotations to 3D geometry data
export class GeometryCompiler {
    constructor() {
        this.panels = [];
        this.hinges = [];
        this.embossMaps = [];
    }

    compile(annotations, canvasWidth, canvasHeight) {
        console.log('Compiling geometry from annotations...');
        console.log('Input annotations:', annotations);
        console.log('Canvas dimensions:', canvasWidth, 'x', canvasHeight);
        
        this.panels = [];
        this.hinges = [];
        this.embossMaps = [];

        // Extract cut lines to define a single merged panel
        const cutLines = annotations.cut || [];
        console.log('Cut lines:', cutLines.length);
        
        // Merge all cutlines into a single boundary
        const mergedBoundary = this.mergeCutlines(cutLines, canvasWidth, canvasHeight);
        this.panels = [this.createSinglePanel(mergedBoundary, canvasWidth, canvasHeight)];

        // Extract crease lines to define hinges
        const creaseLines = annotations.crease || [];
        console.log('Crease lines:', creaseLines.length);
        this.hinges = this.extractHinges(creaseLines, this.panels);

        // Extract emboss regions
        const embossLines = annotations.emboss || [];
        console.log('Emboss lines:', embossLines.length);
        this.embossMaps = this.extractEmbossMaps(embossLines);

        console.log('Compiled: 1 merged panel,', this.hinges.length, 'hinges');
        
        return {
            panels: this.panels,
            hinges: this.hinges,
            embossMaps: this.embossMaps
        };
    }

    mergeCutlines(cutLines, width, height) {
        // Merge multiple cutlines using boolean union operations
        // For now, we'll use a simplified approach: find the outer boundary
        
        if (cutLines.length === 0) {
            // Return default boundary (entire canvas)
            return {
                points: [0, 0, width, 0, width, height, 0, height],
                holes: []
            };
        }

        if (cutLines.length === 1) {
            // Single cutline - use it as the boundary
            return {
                points: cutLines[0].points,
                holes: []
            };
        }

        // Multiple cutlines - merge them
        // This is a simplified implementation
        // In production, you'd use a proper computational geometry library like clipper-lib
        
        // Find the outermost boundary
        let allPoints = [];
        cutLines.forEach(line => {
            allPoints = allPoints.concat(line.points);
        });

        // Calculate bounding polygon (convex hull would be better)
        const outerBoundary = this.calculateBoundingPolygon(allPoints);
        
        // Identify inner cutlines as holes
        const holes = cutLines.slice(1).map(line => line.points);

        return {
            points: outerBoundary,
            holes: holes
        };
    }

    calculateBounds(points) {
        // Calculate bounding box for points
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (let i = 0; i < points.length; i += 2) {
            minX = Math.min(minX, points[i]);
            maxX = Math.max(maxX, points[i]);
            minY = Math.min(minY, points[i + 1]);
            maxY = Math.max(maxY, points[i + 1]);
        }

        return { minX, minY, maxX, maxY };
    }

    calculateBoundingPolygon(points) {
        // Find min/max to create bounding rectangle
        // In production, use convex hull algorithm
        const bounds = this.calculateBounds(points);

        return [
            bounds.minX, bounds.minY,
            bounds.maxX, bounds.minY,
            bounds.maxX, bounds.maxY,
            bounds.minX, bounds.maxY
        ];
    }

    createSinglePanel(boundary, width, height) {
        // Create a single merged panel from the boundary
        const vertices = this.pointsToVertices(boundary.points);
        const center = this.calculateCenter(boundary.points);
        const bounds = this.calculateBounds(boundary.points);

        return {
            id: 'panel_merged',
            vertices: vertices,
            center: center,
            holes: boundary.holes || [],
            isMerged: true,
            bounds: bounds,
            canvasWidth: width,
            canvasHeight: height
        };
    }

    extractPanels(cutLines, width, height) {
        const panels = [];
        
        console.log('Extracting panels from', cutLines.length, 'cut lines');
        
        // Simple approach: if no cut lines, create one main panel
        if (cutLines.length === 0) {
            console.log('No cut lines found, creating default panel');
            panels.push({
                id: 'panel_0',
                vertices: [
                    [0, 0],
                    [width, 0],
                    [width, height],
                    [0, height]
                ],
                center: [width / 2, height / 2]
            });
            return panels;
        }

        // Create a single merged panel
        const mergedBoundary = this.mergeCutlines(cutLines, width, height);
        panels.push(this.createSinglePanel(mergedBoundary, width, height));

        console.log('Extracted 1 merged panel');
        return panels;
    }

    extractHinges(creaseLines, panels) {
        const hinges = [];
        
        creaseLines.forEach((line, index) => {
            const points = line.points;
            if (points.length >= 4) {
                hinges.push({
                    id: `hinge_${index}`,
                    start: [points[0], points[1]],
                    end: [points[points.length - 2], points[points.length - 1]],
                    foldAngle: 90, // Default fold angle in degrees
                    axis: this.calculateAxis(points)
                });
            }
        });

        return hinges;
    }

    extractEmbossMaps(embossLines) {
        const embossMaps = [];
        
        embossLines.forEach((line, index) => {
            const points = line.points;
            embossMaps.push({
                id: `emboss_${index}`,
                path: points,
                depth: 2.0, // Default emboss depth
                type: 'raised'
            });
        });

        return embossMaps;
    }

    pointsToVertices(points) {
        const vertices = [];
        for (let i = 0; i < points.length; i += 2) {
            vertices.push([points[i], points[i + 1]]);
        }
        return vertices;
    }

    calculateCenter(points) {
        let sumX = 0, sumY = 0;
        const count = points.length / 2;
        
        for (let i = 0; i < points.length; i += 2) {
            sumX += points[i];
            sumY += points[i + 1];
        }
        
        return [sumX / count, sumY / count];
    }

    calculateAxis(points) {
        const x1 = points[0];
        const y1 = points[1];
        const x2 = points[points.length - 2];
        const y2 = points[points.length - 1];
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        return [dx / length, dy / length, 0];
    }

    getCompiledData() {
        return {
            panels: this.panels,
            hinges: this.hinges,
            embossMaps: this.embossMaps
        };
    }
}
