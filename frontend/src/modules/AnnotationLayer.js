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

        this.setupEventHandlers();
    }

    resize(width, height) {
        this.stage.width(width);
        this.stage.height(height);
    }

    setTool(tool) {
        this.currentTool = tool;
        console.log('Tool set to:', tool);
    }

    setupEventHandlers() {
        this.stage.on('mousedown touchstart', (e) => {
            if (!this.currentTool) return;

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
                annotationType: this.currentTool
            });

            this.layer.add(this.currentLine);
        });

        this.stage.on('mousemove touchmove', (e) => {
            if (!this.isDrawing || !this.currentLine) return;

            const pos = this.stage.getPointerPosition();
            const points = this.currentLine.points();
            points[points.length - 2] = pos.x;
            points[points.length - 1] = pos.y;
            this.currentLine.points(points);
            this.layer.batchDraw();
        });

        this.stage.on('mouseup touchend', () => {
            if (!this.isDrawing) return;

            if (this.currentLine && this.currentTool) {
                this.annotations[this.currentTool].push({
                    points: this.currentLine.points(),
                    type: this.currentTool
                });
            }

            this.isDrawing = false;
            this.currentLine = null;
        });
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
            annotationType: type
        });

        this.layer.add(line);
        this.annotations[type].push({ points, type });
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
        return this.annotations;
    }

    exportSVG() {
        return this.stage.toDataURL();
    }
}
