import Konva from 'konva';

export class AnnotationLayer {
    constructor(containerId, width, height) {
        this.stage = new Konva.Stage({
            container: containerId,
            width: width,
            height: height
        });

        this.layer = new Konva.Layer();
        this.stage.add(this.layer);

        this.currentTool = null;
        this.annotations = {
            cut: [],
            crease: [],
            perf: [],
            emboss: []
        };

        this.isDrawing = false;
        this.currentLine = null;
        this.selectedLine = null;
        this.isDragging = false;
        this.dragStartPos = null;
        this.polygonPoints = [];  // For polygon drawing mode
        this.isPolygonMode = false;
        this.polygonPreviewLine = null;
        this.units = 'inches';  // Default unit system
        this.pixelsPerUnit = 96;  // 96 pixels per inch (standard DPI)
        this.cutoffAreas = [];  // Track cut-off areas
        this.keyboardHandler = null;  // Store reference for cleanup

        this.setupEventHandlers();
        this.setupContextMenu();
    }

    destroy() {
        // Cleanup keyboard event listener
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }
        // Cleanup stage
        if (this.stage) {
            this.stage.destroy();
        }
    }

    resize(width, height) {
        this.stage.width(width);
        this.stage.height(height);
    }

    setZoom(zoomLevel, width, height) {
        // Update stage dimensions to match the new PDF canvas size
        this.stage.width(width);
        this.stage.height(height);
        this.layer.batchDraw();
    }

    setTool(tool) {
        this.currentTool = tool;
        // Enable polygon mode for cut lines
        this.isPolygonMode = (tool === 'cut');
        this.finishPolygon(); // Finish any existing polygon
        console.log('Annotation tool set to:', tool, 'Polygon mode:', this.isPolygonMode);
    }

    setUnits(units) {
        this.units = units;
        this.pixelsPerUnit = units === 'inches' ? 96 : 37.8; // 96 DPI for inches, ~37.8 for cm
        console.log('Units set to:', units);
    }

    pixelsToUnits(pixels) {
        return pixels / this.pixelsPerUnit;
    }

    unitsToPixels(units) {
        return units * this.pixelsPerUnit;
    }

    setupEventHandlers() {
        // Drawing mode
        this.stage.on('mousedown touchstart', (e) => {
            // Right click should not start drawing
            if (e.evt.button === 2) {
                return;
            }

            const target = e.target;
            
            // In polygon mode, allow clicking through lines and markers
            if (this.isPolygonMode && this.currentTool) {
                // Allow clicking on polygon markers and preview lines
                if (target.hasName('polygon-marker') || target.hasName('polygon-preview')) {
                    // Continue to polygon logic below
                } else if (target instanceof Konva.Line && target.hasName('annotation-line')) {
                    // Don't start dragging in polygon mode, treat as stage click
                } else if (target !== this.stage) {
                    // Clicking on other elements - ignore
                    return;
                }
            } else {
                // Normal mode: If clicking on a line, select it for dragging
                if (target instanceof Konva.Line && target.hasName('annotation-line')) {
                    this.selectedLine = target;
                    this.isDragging = true;
                    this.dragStartPos = this.stage.getPointerPosition();
                    this.stage.container().style.cursor = 'move';
                    return;
                }

                // If clicking on stage and a tool is selected
                if (!this.currentTool || target !== this.stage) return;
            }

            const pos = this.stage.getPointerPosition();

            // Polygon mode (for cut lines)
            if (this.isPolygonMode) {
                // Check if clicking near the first point to close polygon
                if (this.polygonPoints.length >= 6) {
                    const dist = Math.sqrt(
                        Math.pow(pos.x - this.polygonPoints[0], 2) + 
                        Math.pow(pos.y - this.polygonPoints[1], 2)
                    );
                    if (dist < 15) {
                        this.finishPolygon();
                        return;
                    }
                }

                // Add point to polygon
                this.polygonPoints.push(pos.x, pos.y);
                this.updatePolygonPreview();
                return;
            }

            // Regular drawing mode (for crease, perf, emboss)
            this.isDrawing = true;

            // For crease lines, snap to nearest cut line point
            let snapPos = pos;
            if (this.currentTool === 'crease') {
                snapPos = this.snapToNearestCutLine(pos, 10);
            }

            const lineConfig = this.getLineConfig(this.currentTool);
            
            this.currentLine = new Konva.Line({
                stroke: lineConfig.color,
                strokeWidth: lineConfig.width,
                dash: lineConfig.dash,
                lineCap: 'round',
                lineJoin: 'round',
                points: [snapPos.x, snapPos.y, snapPos.x, snapPos.y],
                annotationType: this.currentTool,
                name: 'annotation-line',
                hitStrokeWidth: 15 // Make it easier to click
            });

            this.addLineInteractivity(this.currentLine);
            this.layer.add(this.currentLine);
        });

        this.stage.on('mousemove touchmove', (e) => {
            const pos = this.stage.getPointerPosition();

            // Handle polygon preview
            if (this.isPolygonMode && this.polygonPoints.length > 0) {
                this.updatePolygonPreview(pos);
                return;
            }

            // Handle dragging existing line
            if (this.isDragging && this.selectedLine) {
                if (this.dragStartPos) {
                    const deltaX = pos.x - this.dragStartPos.x;
                    const deltaY = pos.y - this.dragStartPos.y;
                    
                    const points = this.selectedLine.points();
                    const newPoints = [];
                    for (let i = 0; i < points.length; i += 2) {
                        newPoints.push(points[i] + deltaX);
                        newPoints.push(points[i + 1] + deltaY);
                    }
                    this.selectedLine.points(newPoints);
                    this.dragStartPos = pos;
                    this.layer.batchDraw();
                }
                return;
            }

            // Handle drawing new line
            if (!this.isDrawing || !this.currentLine) return;

            const points = this.currentLine.points();
            points[points.length - 2] = pos.x;
            points[points.length - 1] = pos.y;
            this.currentLine.points(points);
            this.layer.batchDraw();
        });

        this.stage.on('mouseup touchend', () => {
            // Handle end of dragging
            if (this.isDragging && this.selectedLine) {
                this.isDragging = false;
                this.dragStartPos = null;
                this.stage.container().style.cursor = 'default';
                
                // Update annotation data
                this.updateAnnotationData(this.selectedLine);
                this.selectedLine = null;
                return;
            }

            // Handle end of drawing
            if (!this.isDrawing) return;

            if (this.currentLine && this.currentTool) {
                // For crease lines, snap the end point to nearest cut line
                if (this.currentTool === 'crease') {
                    const points = this.currentLine.points();
                    const endPos = { x: points[points.length - 2], y: points[points.length - 1] };
                    const snapPos = this.snapToNearestCutLine(endPos, 10);
                    points[points.length - 2] = snapPos.x;
                    points[points.length - 1] = snapPos.y;
                    this.currentLine.points(points);
                }

                this.annotations[this.currentTool].push({
                    points: this.currentLine.points(),
                    type: this.currentTool,
                    line: this.currentLine
                });
                console.log(`Added ${this.currentTool} annotation with ${this.currentLine.points().length / 2} points`);
            }

            this.isDrawing = false;
            this.currentLine = null;
        });

        // Context menu handling (right click)
        this.stage.on('contextmenu', (e) => {
            e.evt.preventDefault();
            
            const target = e.target;
            if (target instanceof Konva.Line && target.hasName('annotation-line')) {
                this.showContextMenu(e.evt.clientX, e.evt.clientY, target);
            } else {
                this.hideContextMenu();
            }
        });

        // Keyboard shortcuts for polygon mode
        this.keyboardHandler = (e) => {
            if (this.isPolygonMode) {
                if (e.key === 'Escape') {
                    // Cancel polygon
                    this.polygonPoints = [];
                    if (this.polygonPreviewLine) {
                        this.polygonPreviewLine.destroy();
                        this.polygonPreviewLine = null;
                    }
                    const markers = this.layer.find('.polygon-marker');
                    markers.forEach(marker => marker.destroy());
                    this.layer.batchDraw();
                    console.log('Polygon cancelled');
                } else if (e.key === 'Enter') {
                    // Complete polygon
                    this.finishPolygon();
                }
            }
        };
        document.addEventListener('keydown', this.keyboardHandler);
    }

    addLineInteractivity(line) {
        // Hover effects
        line.on('mouseenter', () => {
            this.stage.container().style.cursor = 'pointer';
            // Add glow effect
            line.shadowColor = '#ffffff';
            line.shadowBlur = 10;
            line.shadowOpacity = 0.8;
            this.layer.batchDraw();
        });

        line.on('mouseleave', () => {
            if (!this.isDragging) {
                this.stage.container().style.cursor = 'default';
            }
            // Remove glow effect
            line.shadowColor = null;
            line.shadowBlur = 0;
            this.layer.batchDraw();
        });
    }

    updatePolygonPreview(currentPos) {
        // Remove old preview
        if (this.polygonPreviewLine) {
            this.polygonPreviewLine.destroy();
        }

        // Remove old polygon markers
        const oldMarkers = this.layer.find('.polygon-marker');
        oldMarkers.forEach(marker => marker.destroy());

        if (this.polygonPoints.length === 0) {
            return;
        }

        // Add visual markers for each polygon point
        for (let i = 0; i < this.polygonPoints.length; i += 2) {
            const circle = new Konva.Circle({
                x: this.polygonPoints[i],
                y: this.polygonPoints[i + 1],
                radius: 5,
                fill: '#00ff00',
                stroke: '#ffffff',
                strokeWidth: 2,
                name: 'polygon-marker'
            });
            
            // Make the first point larger to indicate where to close
            if (i === 0) {
                circle.radius(8);
                circle.fill('#ffff00');
            }
            
            this.layer.add(circle);
        }

        const previewPoints = [...this.polygonPoints];
        if (currentPos) {
            previewPoints.push(currentPos.x, currentPos.y);
        }

        const lineConfig = this.getLineConfig(this.currentTool);
        this.polygonPreviewLine = new Konva.Line({
            stroke: lineConfig.color,
            strokeWidth: lineConfig.width,
            dash: lineConfig.dash,
            lineCap: 'round',
            lineJoin: 'round',
            points: previewPoints,
            opacity: 0.6,
            name: 'polygon-preview'
        });

        this.layer.add(this.polygonPreviewLine);
        this.layer.batchDraw();
    }

    finishPolygon() {
        if (this.polygonPoints.length < 6) {
            // Need at least 3 points (6 coordinates)
            this.polygonPoints = [];
            if (this.polygonPreviewLine) {
                this.polygonPreviewLine.destroy();
                this.polygonPreviewLine = null;
            }
            // Remove polygon markers
            const markers = this.layer.find('.polygon-marker');
            markers.forEach(marker => marker.destroy());
            this.layer.batchDraw();
            return;
        }

        // Close the polygon
        const closedPoints = [...this.polygonPoints, this.polygonPoints[0], this.polygonPoints[1]];

        const lineConfig = this.getLineConfig(this.currentTool);
        const line = new Konva.Line({
            stroke: lineConfig.color,
            strokeWidth: lineConfig.width,
            dash: lineConfig.dash,
            lineCap: 'round',
            lineJoin: 'round',
            points: closedPoints,
            annotationType: this.currentTool,
            name: 'annotation-line',
            closed: true,
            hitStrokeWidth: 15
        });

        this.addLineInteractivity(line);
        this.layer.add(line);
        
        this.annotations[this.currentTool].push({
            points: closedPoints,
            type: this.currentTool,
            line: line,
            closed: true
        });

        // Clear polygon state
        this.polygonPoints = [];
        if (this.polygonPreviewLine) {
            this.polygonPreviewLine.destroy();
            this.polygonPreviewLine = null;
        }
        
        // Remove polygon markers
        const markers = this.layer.find('.polygon-marker');
        markers.forEach(marker => marker.destroy());

        this.layer.batchDraw();
        console.log(`Finished closed polygon with ${closedPoints.length / 2} points`);
    }

    setupContextMenu() {
        // Create context menu element
        const menu = document.createElement('div');
        menu.id = 'line-context-menu';
        menu.style.cssText = `
            position: fixed;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 5px;
            padding: 5px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.5);
            z-index: 10000;
            display: none;
            min-width: 150px;
        `;
        document.body.appendChild(menu);

        // Hide menu when clicking elsewhere
        document.addEventListener('click', () => this.hideContextMenu());
    }

    showContextMenu(x, y, line) {
        const menu = document.getElementById('line-context-menu');
        if (!menu) return;

        const currentType = line.attrs.annotationType;
        
        // Build menu items
        const menuItems = [
            { label: 'Change to Cut Line', type: 'cut', disabled: currentType === 'cut' },
            { label: 'Change to Crease', type: 'crease', disabled: currentType === 'crease' },
            { label: 'Change to Perforation', type: 'perf', disabled: currentType === 'perf' },
            { label: 'Change to Emboss', type: 'emboss', disabled: currentType === 'emboss' },
            { label: '---', type: 'separator' },
            { label: 'Convert to Curve', type: 'curve', disabled: false },
            { label: 'Expand Cutline...', type: 'expand', disabled: currentType !== 'cut' },
            { label: '---', type: 'separator' },
            { label: 'Delete Line', type: 'delete', color: '#ff4444' }
        ];

        menu.innerHTML = menuItems.map(item => {
            if (item.type === 'separator') {
                return '<div style="height: 1px; background: #444; margin: 5px 0;"></div>';
            }
            
            const style = `
                padding: 8px 15px;
                cursor: ${item.disabled ? 'not-allowed' : 'pointer'};
                color: ${item.disabled ? '#666' : (item.color || '#fff')};
                opacity: ${item.disabled ? '0.5' : '1'};
                transition: background 0.2s;
            `;
            
            return `<div class="menu-item" data-action="${item.type}" data-disabled="${item.disabled || false}" style="${style}">${item.label}</div>`;
        }).join('');

        // Position menu, ensuring it stays within viewport
        menu.style.display = 'block'; // Show first to get dimensions
        
        const menuRect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate position, adjusting if it would go off-screen
        let menuX = x;
        let menuY = y;
        
        // Adjust horizontal position if menu would overflow right edge
        if (menuX + menuRect.width > viewportWidth) {
            menuX = viewportWidth - menuRect.width - 10;
        }
        
        // Adjust vertical position if menu would overflow bottom edge
        if (menuY + menuRect.height > viewportHeight) {
            menuY = viewportHeight - menuRect.height - 10;
        }
        
        // Ensure menu doesn't go off-screen to the left or top
        menuX = Math.max(10, menuX);
        menuY = Math.max(10, menuY);
        
        menu.style.left = menuX + 'px';
        menu.style.top = menuY + 'px';

        // Add event listeners to menu items
        menu.querySelectorAll('.menu-item').forEach(item => {
            const action = item.getAttribute('data-action');
            const disabled = item.getAttribute('data-disabled') === 'true';
            if (!action) return;

            item.addEventListener('mouseenter', (e) => {
                if (!disabled) {
                    e.target.style.background = '#3a3a3a';
                }
            });
            
            item.addEventListener('mouseleave', (e) => {
                e.target.style.background = 'transparent';
            });

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                if (disabled) return;

                if (action === 'delete') {
                    this.deleteLine(line);
                } else if (action === 'expand') {
                    this.expandCutline(line);
                } else if (action === 'curve') {
                    this.convertToCurve(line);
                } else {
                    this.changeLineType(line, action);
                }
                this.hideContextMenu();
            });
        });
    }

    hideContextMenu() {
        const menu = document.getElementById('line-context-menu');
        if (menu) {
            menu.style.display = 'none';
        }
    }

    changeLineType(line, newType) {
        const oldType = line.attrs.annotationType;
        
        // Remove from old type annotations
        const oldAnnotations = this.annotations[oldType];
        const index = oldAnnotations.findIndex(ann => ann.line === line);
        if (index !== -1) {
            oldAnnotations.splice(index, 1);
        }

        // Update line appearance
        const lineConfig = this.getLineConfig(newType);
        line.stroke(lineConfig.color);
        line.strokeWidth(lineConfig.width);
        line.dash(lineConfig.dash);
        line.setAttr('annotationType', newType);

        // Add to new type annotations
        this.annotations[newType].push({
            points: line.points(),
            type: newType,
            line: line
        });

        this.layer.batchDraw();
        console.log(`Changed line from ${oldType} to ${newType}`);
    }

    deleteLine(line) {
        const type = line.attrs.annotationType;
        
        // Remove from annotations
        const annotations = this.annotations[type];
        const index = annotations.findIndex(ann => ann.line === line);
        if (index !== -1) {
            annotations.splice(index, 1);
        }

        // Remove from layer
        line.destroy();
        this.layer.batchDraw();
        
        console.log(`Deleted ${type} line`);
    }

    convertToCurve(line) {
        // Convert a straight line to a smooth curve
        const POINTS_PER_SEGMENT = 10;
        const CURVE_TENSION = 0.5;
        
        const points = line.points();
        
        if (points.length < 4) {
            alert('Line must have at least 2 points to convert to curve');
            return;
        }

        // Create a smooth curve through the points using Catmull-Rom interpolation
        const curvedPoints = this.createSmoothCurve(points, POINTS_PER_SEGMENT);
        
        // Update the line with curved points
        line.points(curvedPoints);
        line.tension(CURVE_TENSION); // Add Konva tension for smoother rendering
        this.updateAnnotationData(line);
        this.layer.batchDraw();
        
        console.log(`Converted line to curve with ${curvedPoints.length / 2} points`);
    }

    createSmoothCurve(points, pointsPerSegment = 10) {
        // Use Catmull-Rom spline interpolation for smooth curves
        if (points.length < 4) return points;
        
        const curvedPoints = [];
        const numPoints = points.length / 2;
        
        for (let i = 0; i < numPoints - 1; i++) {
            const p0 = i > 0 ? { x: points[(i - 1) * 2], y: points[(i - 1) * 2 + 1] } : { x: points[0], y: points[1] };
            const p1 = { x: points[i * 2], y: points[i * 2 + 1] };
            const p2 = { x: points[(i + 1) * 2], y: points[(i + 1) * 2 + 1] };
            const p3 = i < numPoints - 2 ? { x: points[(i + 2) * 2], y: points[(i + 2) * 2 + 1] } : p2;
            
            for (let t = 0; t < 1; t += 1 / pointsPerSegment) {
                const point = this.catmullRomPoint(p0, p1, p2, p3, t);
                curvedPoints.push(point.x, point.y);
            }
        }
        
        // Add the last point
        curvedPoints.push(points[points.length - 2], points[points.length - 1]);
        
        return curvedPoints;
    }

    catmullRomPoint(p0, p1, p2, p3, t) {
        // Catmull-Rom spline calculation
        const t2 = t * t;
        const t3 = t2 * t;
        
        const x = 0.5 * (
            (2 * p1.x) +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        );
        
        const y = 0.5 * (
            (2 * p1.y) +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        );
        
        return { x, y };
    }

    expandCutline(line) {
        const expandValue = prompt(`Enter expansion value in ${this.units}:`, '0.5');
        if (!expandValue || isNaN(parseFloat(expandValue))) {
            return;
        }

        const expansion = parseFloat(expandValue);
        const pixels = this.unitsToPixels(expansion);

        // Get the points of the line
        const points = line.points();
        const expandedPoints = this.expandPolygon(points, pixels);

        if (expandedPoints) {
            line.points(expandedPoints);
            this.updateAnnotationData(line);
            this.layer.batchDraw();
            console.log(`Expanded cutline by ${expansion} ${this.units}`);
        }
    }

    expandPolygon(points, offset) {
        // Simple polygon offset algorithm
        // This is a basic implementation; production code would use a proper library
        const expandedPoints = [];
        const numPoints = points.length / 2;

        for (let i = 0; i < numPoints; i++) {
            const prevIdx = (i - 1 + numPoints) % numPoints;
            const nextIdx = (i + 1) % numPoints;

            const px = points[prevIdx * 2];
            const py = points[prevIdx * 2 + 1];
            const cx = points[i * 2];
            const cy = points[i * 2 + 1];
            const nx = points[nextIdx * 2];
            const ny = points[nextIdx * 2 + 1];

            // Calculate normal vectors for the two edges
            const dx1 = cx - px;
            const dy1 = cy - py;
            const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            const nx1 = -dy1 / len1;
            const ny1 = dx1 / len1;

            const dx2 = nx - cx;
            const dy2 = ny - cy;
            const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            const nx2 = -dy2 / len2;
            const ny2 = dx2 / len2;

            // Average the normals for this vertex
            const avgNx = (nx1 + nx2) / 2;
            const avgNy = (ny1 + ny2) / 2;
            const avgLen = Math.sqrt(avgNx * avgNx + avgNy * avgNy);

            // Offset the point
            expandedPoints.push(cx + (avgNx / avgLen) * offset);
            expandedPoints.push(cy + (avgNy / avgLen) * offset);
        }

        return expandedPoints;
    }

    toggleCutoffHighlight() {
        // Toggle highlighting of cut-off areas
        const cutLines = this.annotations.cut;
        
        // Find areas not included in cut lines (areas that will be cut off)
        // For simplicity, we'll highlight the entire canvas except cut areas
        if (this.cutoffHighlight) {
            this.cutoffHighlight.destroy();
            this.cutoffHighlight = null;
        } else {
            // Create a faint red overlay for cut-off areas
            const rect = new Konva.Rect({
                x: 0,
                y: 0,
                width: this.stage.width(),
                height: this.stage.height(),
                fill: 'rgba(255, 0, 0, 0.1)',
                name: 'cutoff-highlight',
                listening: false
            });
            this.layer.add(rect);
            rect.moveToBottom();
            this.cutoffHighlight = rect;
        }
        
        this.layer.batchDraw();
        return this.cutoffHighlight !== null;
    }

    validateCreaseLine(creaseLine) {
        // Crease lines must connect to cut lines at both ends
        const cutLines = this.annotations.cut;
        if (cutLines.length === 0) {
            return { valid: false, message: 'No cut lines to connect to' };
        }

        const creasePoints = creaseLine.points;
        const startPoint = { x: creasePoints[0], y: creasePoints[1] };
        const endPoint = { x: creasePoints[creasePoints.length - 2], y: creasePoints[creasePoints.length - 1] };

        const tolerance = 10; // pixels
        let startConnected = false;
        let endConnected = false;

        // Check if both ends connect to a cut line (vertices or segments)
        for (const cutLine of cutLines) {
            const cutPoints = cutLine.points;
            
            // Check vertices
            for (let i = 0; i < cutPoints.length; i += 2) {
                // Make sure we have both x and y coordinates
                if (i + 1 >= cutPoints.length) break;
                
                const cutPoint = { x: cutPoints[i], y: cutPoints[i + 1] };
                
                if (!startConnected && this.pointDistance(startPoint, cutPoint) < tolerance) {
                    startConnected = true;
                }
                if (!endConnected && this.pointDistance(endPoint, cutPoint) < tolerance) {
                    endConnected = true;
                }
                
                if (startConnected && endConnected) {
                    return { valid: true, message: 'Crease connects to cut lines' };
                }
            }

            // Also check line segments (not just vertices)
            for (let i = 0; i < cutPoints.length - 2; i += 2) {
                if (i + 3 >= cutPoints.length) break;
                
                const p1 = { x: cutPoints[i], y: cutPoints[i + 1] };
                const p2 = { x: cutPoints[i + 2], y: cutPoints[i + 3] };
                
                if (!startConnected) {
                    const nearestOnSegment = this.nearestPointOnLineSegment(startPoint, p1, p2);
                    if (this.pointDistance(startPoint, nearestOnSegment) < tolerance) {
                        startConnected = true;
                    }
                }
                
                if (!endConnected) {
                    const nearestOnSegment = this.nearestPointOnLineSegment(endPoint, p1, p2);
                    if (this.pointDistance(endPoint, nearestOnSegment) < tolerance) {
                        endConnected = true;
                    }
                }
                
                if (startConnected && endConnected) {
                    return { valid: true, message: 'Crease connects to cut lines' };
                }
            }
        }

        return { 
            valid: false, 
            message: `Crease must connect to cut lines at both ends (start: ${startConnected}, end: ${endConnected})`
        };
    }

    pointDistance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    snapToNearestCutLine(pos, radius) {
        // Find the nearest point on any cut line within the given radius
        const cutLines = this.annotations.cut;
        let nearestPoint = pos;
        let minDistance = radius;

        for (const cutLine of cutLines) {
            const cutPoints = cutLine.points;
            for (let i = 0; i < cutPoints.length; i += 2) {
                if (i + 1 >= cutPoints.length) break;
                
                const cutPoint = { x: cutPoints[i], y: cutPoints[i + 1] };
                const distance = this.pointDistance(pos, cutPoint);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestPoint = cutPoint;
                }
            }

            // Also check for nearest point on line segments, not just vertices
            for (let i = 0; i < cutPoints.length - 2; i += 2) {
                if (i + 3 >= cutPoints.length) break;
                
                const p1 = { x: cutPoints[i], y: cutPoints[i + 1] };
                const p2 = { x: cutPoints[i + 2], y: cutPoints[i + 3] };
                const nearestOnSegment = this.nearestPointOnLineSegment(pos, p1, p2);
                const distance = this.pointDistance(pos, nearestOnSegment);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestPoint = nearestOnSegment;
                }
            }
        }

        return nearestPoint;
    }

    nearestPointOnLineSegment(point, lineStart, lineEnd) {
        // Calculate the nearest point on a line segment to the given point
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const lengthSquared = dx * dx + dy * dy;
        
        if (lengthSquared === 0) {
            return lineStart;
        }
        
        let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));
        
        return {
            x: lineStart.x + t * dx,
            y: lineStart.y + t * dy
        };
    }

    updateAnnotationData(line) {
        const type = line.attrs.annotationType;
        const annotations = this.annotations[type];
        const annotation = annotations.find(ann => ann.line === line);
        
        if (annotation) {
            annotation.points = line.points();
        }
    }

    swapAllLineTypes(fromType, toType) {
        // Swap all lines of fromType to toType
        const fromAnnotations = [...this.annotations[fromType]];
        let count = 0;

        fromAnnotations.forEach(annotation => {
            if (annotation.line) {
                this.changeLineType(annotation.line, toType);
                count++;
            }
        });

        console.log(`Swapped ${count} lines from ${fromType} to ${toType}`);
        return count;
    }

    getLineConfig(tool) {
        const configs = {
            cut: { color: '#ff0000', width: 3, dash: [] },
            crease: { color: '#0000ff', width: 2, dash: [10, 5] },
            perf: { color: '#00ff00', width: 2, dash: [5, 10] },
            emboss: { color: '#ffff00', width: 4, dash: [] }
        };
        return configs[tool] || configs.cut;
    }

    addLine(points, type) {
        const lineConfig = this.getLineConfig(type);
        const line = new Konva.Line({
            stroke: lineConfig.color,
            strokeWidth: lineConfig.width,
            dash: lineConfig.dash,
            lineCap: 'round',
            lineJoin: 'round',
            points: points,
            annotationType: type,
            name: 'annotation-line',
            hitStrokeWidth: 15 // Make it easier to click
        });

        this.addLineInteractivity(line);
        this.layer.add(line);
        this.annotations[type].push({ points, type, line });
        this.layer.batchDraw();
        
        // Validate crease lines
        if (type === 'crease') {
            const validation = this.validateCreaseLine(line);
            if (!validation.valid) {
                console.warn('Crease validation:', validation.message);
                // Add visual warning indicator
                this.addValidationWarning(line, validation.message);
            }
        }
    }

    addValidationWarning(line, message) {
        // Add a warning icon or color change to indicate invalid crease
        const points = line.points();
        const midX = (points[0] + points[points.length - 2]) / 2;
        const midY = (points[1] + points[points.length - 1]) / 2;
        
        const warningIcon = new Konva.Text({
            x: midX - 10,
            y: midY - 10,
            text: '⚠️',
            fontSize: 20,
            fill: '#ffaa00',
            name: 'validation-warning',
            listening: true
        });
        
        // Add title attribute for tooltip
        warningIcon.setAttr('title', message);
        
        warningIcon.on('mouseenter', () => {
            // Show tooltip with warning message
            warningIcon.fontSize(24);
            this.layer.batchDraw();
        });
        
        warningIcon.on('mouseleave', () => {
            warningIcon.fontSize(20);
            this.layer.batchDraw();
        });
        
        this.layer.add(warningIcon);
        
        // Store reference to remove later
        line.setAttr('validationWarning', warningIcon);
    }

    validateAllCreases() {
        const creaseLines = this.annotations.crease;
        const results = {
            total: creaseLines.length,
            valid: 0,
            invalid: 0,
            warnings: []
        };
        
        creaseLines.forEach((annotation, index) => {
            const validation = this.validateCreaseLine(annotation.line);
            if (validation.valid) {
                results.valid++;
                // Remove any existing warning
                const warning = annotation.line.attrs.validationWarning;
                if (warning) {
                    warning.destroy();
                    annotation.line.setAttr('validationWarning', null);
                }
            } else {
                results.invalid++;
                results.warnings.push(`Crease ${index + 1}: ${validation.message}`);
                this.addValidationWarning(annotation.line, validation.message);
            }
        });
        
        this.layer.batchDraw();
        return results;
    }

    clear() {
        this.layer.destroyChildren();
        this.annotations = {
            cut: [],
            crease: [],
            perf: [],
            emboss: []
        };
        this.layer.batchDraw();
    }

    getAllAnnotations() {
        console.log('Getting all annotations:', this.annotations);
        return this.annotations;
    }

    exportSVG() {
        return this.stage.toDataURL();
    }
}
