// Geometry compiler - converts 2D annotations to 3D geometry data
export class GeometryCompiler {
    constructor() {
        this.panels = [];
        this.hinges = [];
        this.embossMaps = [];
    }

    compile(annotations, canvasWidth, canvasHeight) {
        console.log('Compiling geometry from annotations...');
        
        this.panels = [];
        this.hinges = [];
        this.embossMaps = [];

        // Extract cut lines to define panels
        const cutLines = annotations.cut || [];
        this.panels = this.extractPanels(cutLines, canvasWidth, canvasHeight);

        // Extract crease lines to define hinges
        const creaseLines = annotations.crease || [];
        this.hinges = this.extractHinges(creaseLines, this.panels);

        // Extract emboss regions
        const embossLines = annotations.emboss || [];
        this.embossMaps = this.extractEmbossMaps(embossLines);

        console.log('Compiled:', this.panels.length, 'panels,', this.hinges.length, 'hinges');
        
        return {
            panels: this.panels,
            hinges: this.hinges,
            embossMaps: this.embossMaps
        };
    }

    extractPanels(cutLines, width, height) {
        const panels = [];
        
        // Simple approach: if no cut lines, create one main panel
        if (cutLines.length === 0) {
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

        // More sophisticated panel extraction would go here
        // For now, create example panels based on cut lines
        cutLines.forEach((line, index) => {
            const points = line.points;
            if (points.length >= 4) {
                panels.push({
                    id: `panel_${index}`,
                    vertices: this.pointsToVertices(points),
                    center: this.calculateCenter(points)
                });
            }
        });

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
