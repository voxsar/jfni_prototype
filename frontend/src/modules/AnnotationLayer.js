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

        this.setupEventHandlers();
        this.setupContextMenu();
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
        console.log('Annotation tool set to:', tool);
    }

    setupEventHandlers() {
        // Drawing mode
        this.stage.on('mousedown touchstart', (e) => {
            // Right click should not start drawing
            if (e.evt.button === 2) {
                return;
            }

            const target = e.target;
            
            // If clicking on a line, select it for dragging
            if (target instanceof Konva.Line && target.hasName('annotation-line')) {
                this.selectedLine = target;
                this.isDragging = true;
                this.dragStartPos = this.stage.getPointerPosition();
                this.stage.container().style.cursor = 'move';
                return;
            }

            // If clicking on stage and a tool is selected, start drawing
            if (!this.currentTool || target !== this.stage) return;

            this.isDrawing = true;
            const pos = this.stage.getPointerPosition();

            const lineConfig = this.getLineConfig(this.currentTool);
            
            this.currentLine = new Konva.Line({
                stroke: lineConfig.color,
                strokeWidth: lineConfig.width,
                dash: lineConfig.dash,
                lineCap: 'round',
                lineJoin: 'round',
                points: [pos.x, pos.y, pos.x, pos.y],
                annotationType: this.currentTool,
                name: 'annotation-line',
                hitStrokeWidth: 15 // Make it easier to click
            });

            this.addLineInteractivity(this.currentLine);
            this.layer.add(this.currentLine);
        });

        this.stage.on('mousemove touchmove', (e) => {
            const pos = this.stage.getPointerPosition();

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
            
            return `<div class="menu-item" data-action="${item.type}" style="${style}">${item.label}</div>`;
        }).join('');

        // Position menu
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.display = 'block';

        // Add event listeners to menu items
        menu.querySelectorAll('.menu-item').forEach(item => {
            const action = item.getAttribute('data-action');
            if (!action) return;

            item.addEventListener('mouseenter', (e) => {
                if (!item.style.cursor.includes('not-allowed')) {
                    e.target.style.background = '#3a3a3a';
                }
            });
            
            item.addEventListener('mouseleave', (e) => {
                e.target.style.background = 'transparent';
            });

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                if (item.style.cursor.includes('not-allowed')) return;

                if (action === 'delete') {
                    this.deleteLine(line);
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

    updateAnnotationData(line) {
        const type = line.attrs.annotationType;
        const annotations = this.annotations[type];
        const annotation = annotations.find(ann => ann.line === line);
        
        if (annotation) {
            annotation.points = line.points();
        }
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
