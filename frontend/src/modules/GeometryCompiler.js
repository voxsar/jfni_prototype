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

        // Extract cut lines to define boundary
        const cutLines = annotations.cut || [];
        console.log('Cut lines:', cutLines.length);
        
        // Extract crease lines
        const creaseLines = annotations.crease || [];
        console.log('Crease lines:', creaseLines.length);
        
        // Merge all cutlines into a single boundary
        const mergedBoundary = this.mergeCutlines(cutLines, canvasWidth, canvasHeight);
        
        if (creaseLines.length > 0) {
            // Split the boundary polygon along crease lines to create separate panels
            console.log('Splitting polygon at crease lines...');
            this.panels = this.splitPolygonAtCreases(mergedBoundary, creaseLines, canvasWidth, canvasHeight);
            console.log('Created', this.panels.length, 'panels from crease subdivision');
            
            // Create hinges at crease lines connecting panels
            this.hinges = this.extractHingesWithPanels(creaseLines, this.panels);
        } else {
            // No creases - create a single panel
            this.panels = [this.createSinglePanel(mergedBoundary, canvasWidth, canvasHeight)];
            this.hinges = [];
        }

        // Extract emboss regions
        const embossLines = annotations.emboss || [];
        console.log('Emboss lines:', embossLines.length);
        this.embossMaps = this.extractEmbossMaps(embossLines);

        console.log('Compiled:', this.panels.length, 'panels,', this.hinges.length, 'hinges');
        
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

    splitPolygonAtCreases(boundary, creaseLines, width, height) {
        // For simplicity, assume each crease line divides the polygon into two parts
        // In a more sophisticated implementation, we would handle multiple intersecting creases
        
        const panels = [];
        
        // If there's only one crease line, split the boundary polygon into two panels
        if (creaseLines.length === 1) {
            const crease = creaseLines[0];
            const creasePoints = crease.points;
            
            // Get crease endpoints
            const creaseStart = [creasePoints[0], creasePoints[1]];
            const creaseEnd = [creasePoints[creasePoints.length - 2], creasePoints[creasePoints.length - 1]];
            
            // Split boundary polygon along crease line
            const splitPanels = this.splitPolygonByLine(boundary.points, creaseStart, creaseEnd);
            
            if (splitPanels.length === 2) {
                // Successfully split into two panels
                panels.push(this.createPanelFromPoints(splitPanels[0], 0, width, height));
                panels.push(this.createPanelFromPoints(splitPanels[1], 1, width, height));
                
                // Store crease line with panels for hinge creation
                panels[0].creaseLine = { start: creaseStart, end: creaseEnd };
                panels[1].creaseLine = { start: creaseStart, end: creaseEnd };
            } else {
                // Fallback: create single panel
                console.warn('Could not split polygon along crease, creating single panel');
                panels.push(this.createSinglePanel(boundary, width, height));
            }
        } else if (creaseLines.length > 1) {
            // Multiple creases - for now, create regions based on crease intersections
            // This is a simplified approach; a full implementation would use proper polygon operations
            console.warn('Multiple creases detected - using simplified panel creation');
            
            // Create a panel for each region between creases
            // For simplicity, just create individual panels around each crease
            const allPanelPoints = this.subdividePolygonByMultipleCreases(boundary.points, creaseLines);
            
            allPanelPoints.forEach((points, index) => {
                panels.push(this.createPanelFromPoints(points, index, width, height));
            });
        } else {
            // No creases
            panels.push(this.createSinglePanel(boundary, width, height));
        }
        
        return panels;
    }
    
    splitPolygonByLine(polygonPoints, lineStart, lineEnd) {
        // Split a polygon by a line passing through it
        // This is a simplified implementation
        
        // Find intersection points between the line and polygon edges
        const intersections = [];
        const numVertices = polygonPoints.length / 2;
        
        for (let i = 0; i < numVertices; i++) {
            const p1 = [polygonPoints[i * 2], polygonPoints[i * 2 + 1]];
            const p2 = [polygonPoints[((i + 1) % numVertices) * 2], polygonPoints[((i + 1) % numVertices) * 2 + 1]];
            
            const intersection = this.lineSegmentIntersection(lineStart, lineEnd, p1, p2);
            if (intersection) {
                intersections.push({ point: intersection, edgeIndex: i });
            }
        }
        
        // Need at least 2 intersections to split
        if (intersections.length < 2) {
            console.warn('Crease line does not properly intersect polygon boundary');
            return [];
        }
        
        // Take first two intersections
        const int1 = intersections[0];
        const int2 = intersections[1];
        
        // Create two new polygons
        const panel1Points = [];
        const panel2Points = [];
        
        // Build first panel: from int1 to int2 going one direction
        panel1Points.push(...int1.point);
        
        let currentIdx = (int1.edgeIndex + 1) % numVertices;
        while (currentIdx !== int2.edgeIndex + 1) {
            panel1Points.push(polygonPoints[currentIdx * 2], polygonPoints[currentIdx * 2 + 1]);
            currentIdx = (currentIdx + 1) % numVertices;
            if (currentIdx === int1.edgeIndex) break; // Prevent infinite loop
        }
        
        panel1Points.push(...int2.point);
        panel1Points.push(...lineEnd);
        panel1Points.push(...lineStart);
        
        // Build second panel: from int2 to int1 going other direction
        panel2Points.push(...int2.point);
        
        currentIdx = (int2.edgeIndex + 1) % numVertices;
        while (currentIdx !== int1.edgeIndex + 1) {
            panel2Points.push(polygonPoints[currentIdx * 2], polygonPoints[currentIdx * 2 + 1]);
            currentIdx = (currentIdx + 1) % numVertices;
            if (currentIdx === int2.edgeIndex) break; // Prevent infinite loop
        }
        
        panel2Points.push(...int1.point);
        panel2Points.push(...lineStart);
        panel2Points.push(...lineEnd);
        
        return [panel1Points, panel2Points];
    }
    
    lineSegmentIntersection(line1Start, line1End, line2Start, line2End) {
        // Calculate intersection point of two line segments
        const x1 = line1Start[0], y1 = line1Start[1];
        const x2 = line1End[0], y2 = line1End[1];
        const x3 = line2Start[0], y3 = line2Start[1];
        const x4 = line2End[0], y4 = line2End[1];
        
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        
        if (Math.abs(denom) < 0.0001) {
            // Lines are parallel
            return null;
        }
        
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            // Intersection exists within both segments
            return [
                x1 + t * (x2 - x1),
                y1 + t * (y2 - y1)
            ];
        }
        
        return null;
    }
    
    subdividePolygonByMultipleCreases(polygonPoints, creaseLines) {
        // Simplified approach: divide polygon into regions
        // For a complete solution, we'd use a proper polygon subdivision algorithm
        
        // For now, just create panels around each crease
        const panels = [];
        
        // Create one panel for the entire polygon
        // In a full implementation, we'd properly subdivide
        panels.push(polygonPoints);
        
        return panels;
    }
    
    createPanelFromPoints(points, index, width, height) {
        const vertices = this.pointsToVertices(points);
        const center = this.calculateCenter(points);
        const bounds = this.calculateBounds(points);
        
        return {
            id: `panel_${index}`,
            vertices: vertices,
            center: center,
            bounds: bounds,
            canvasWidth: width,
            canvasHeight: height
        };
    }
    
    extractHingesWithPanels(creaseLines, panels) {
        const hinges = [];
        
        creaseLines.forEach((line, index) => {
            const points = line.points;
            if (points.length >= 4) {
                const start = [points[0], points[1]];
                const end = [points[points.length - 2], points[points.length - 1]];
                
                // Find which panels this crease connects
                const connectedPanels = this.findPanelsAlongCrease(start, end, panels);
                
                hinges.push({
                    id: `hinge_${index}`,
                    start: start,
                    end: end,
                    foldAngle: 90, // Default fold angle in degrees
                    axis: this.calculateAxis(points),
                    panel1: connectedPanels[0] || null,
                    panel2: connectedPanels[1] || null
                });
            }
        });

        return hinges;
    }
    
    findPanelsAlongCrease(creaseStart, creaseEnd, panels) {
        // Find which panels share this crease line as an edge
        const connected = [];
        
        panels.forEach(panel => {
            // Check if crease line is along any edge of this panel
            const vertices = panel.vertices;
            for (let i = 0; i < vertices.length; i++) {
                const v1 = vertices[i];
                const v2 = vertices[(i + 1) % vertices.length];
                
                // Check if crease line matches this edge (approximately)
                if (this.linesApproximatelyMatch(creaseStart, creaseEnd, v1, v2)) {
                    connected.push(panel.id);
                    break;
                }
            }
        });
        
        return connected;
    }
    
    linesApproximatelyMatch(line1Start, line1End, line2Start, line2End, tolerance = 20) {
        // Check if two lines are approximately the same
        const dist1 = Math.sqrt(
            Math.pow(line1Start[0] - line2Start[0], 2) + 
            Math.pow(line1Start[1] - line2Start[1], 2)
        );
        const dist2 = Math.sqrt(
            Math.pow(line1End[0] - line2End[0], 2) + 
            Math.pow(line1End[1] - line2End[1], 2)
        );
        
        // Also check reverse direction
        const dist3 = Math.sqrt(
            Math.pow(line1Start[0] - line2End[0], 2) + 
            Math.pow(line1Start[1] - line2End[1], 2)
        );
        const dist4 = Math.sqrt(
            Math.pow(line1End[0] - line2Start[0], 2) + 
            Math.pow(line1End[1] - line2Start[1], 2)
        );
        
        return (dist1 < tolerance && dist2 < tolerance) || 
               (dist3 < tolerance && dist4 < tolerance);
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
