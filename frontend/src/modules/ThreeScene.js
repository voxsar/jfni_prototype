import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { gsap } from 'gsap';

export class ThreeScene {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.canvas.clientWidth / this.canvas.clientHeight,
            0.1,
            1000
        );
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true 
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        this.meshes = [];
        this.foldAnimations = [];
        this.pdfTexture = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.wireframeMode = false; // Track wireframe state
        
        this.setupScene();
        this.setupLights();
        this.setupClickHandler();
        this.animate();
        
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupScene() {
        this.scene.background = new THREE.Color(0x1a1a1a);
        this.camera.position.set(0, 0, 100);
        this.camera.lookAt(0, 0, 0);
        
        // Add grid helper
        const gridHelper = new THREE.GridHelper(100, 10, 0x444444, 0x222222);
        gridHelper.rotation.x = Math.PI / 2;
        this.scene.add(gridHelper);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLight2.position.set(-10, -10, -10);
        this.scene.add(directionalLight2);
    }

    setupClickHandler() {
        // Left-click handler: fold in positive direction
        this.canvas.addEventListener('click', (event) => {
            // Calculate mouse position in normalized device coordinates (-1 to +1)
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            // Update the picking ray with the camera and mouse position
            this.raycaster.setFromCamera(this.mouse, this.camera);

            // Calculate objects intersecting the picking ray
            const clickableMeshes = this.meshes.map(m => m.mesh);
            const intersects = this.raycaster.intersectObjects(clickableMeshes);

            if (intersects.length > 0) {
                const clickedMesh = intersects[0].object;
                this.foldPlaneByIncrement(clickedMesh, 1); // Positive direction
            }
        });

        // Right-click handler: fold in negative direction
        this.canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault(); // Prevent default context menu
            
            // Calculate mouse position in normalized device coordinates (-1 to +1)
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            // Update the picking ray with the camera and mouse position
            this.raycaster.setFromCamera(this.mouse, this.camera);

            // Calculate objects intersecting the picking ray
            const clickableMeshes = this.meshes.map(m => m.mesh);
            const intersects = this.raycaster.intersectObjects(clickableMeshes);

            if (intersects.length > 0) {
                const clickedMesh = intersects[0].object;
                this.foldPlaneByIncrement(clickedMesh, -1); // Negative direction
            }
        });
    }

    foldPlaneByIncrement(mesh, direction = 1) {
        // Get current rotation or initialize
        if (!mesh.userData.currentFoldAngle) {
            mesh.userData.currentFoldAngle = 0;
        }

        // Determine fold axis from hinge data if available
        // Default to x-axis for basic folding
        let rotationAxis = 'x';
        if (mesh.userData.hingeAxis) {
            // Use hinge axis if defined (can be 'x', 'y', or 'z')
            rotationAxis = mesh.userData.hingeAxis;
        }

        // Increment by 45 degrees in the specified direction
        const increment = (Math.PI / 4) * direction; // 45 degrees in radians, multiplied by direction
        mesh.userData.currentFoldAngle += increment;

        // Animate to new rotation on the appropriate axis
        const rotationUpdate = {};
        rotationUpdate[rotationAxis] = mesh.userData.currentFoldAngle;
        
        gsap.to(mesh.rotation, {
            ...rotationUpdate,
            duration: 0.5,
            ease: "power2.inOut"
        });

        const directionText = direction > 0 ? 'positive' : 'negative';
        console.log(`Folded panel ${mesh.userData.panelId} around ${rotationAxis}-axis in ${directionText} direction to ${(mesh.userData.currentFoldAngle * 180 / Math.PI).toFixed(0)} degrees`);
    }

    loadPDFAsTexture(pdfCanvas) {
        console.log('Loading PDF as texture...');
        
        // Validate input
        if (!pdfCanvas) {
            console.error('No PDF canvas provided');
            return { success: false, error: 'No PDF canvas provided' };
        }

        // Check if there are meshes to apply texture to
        if (this.meshes.length === 0) {
            console.error('No 3D meshes available to apply texture');
            return { success: false, error: 'Build 3D model first' };
        }
        
        // Create texture from PDF canvas
        this.pdfTexture = new THREE.CanvasTexture(pdfCanvas);
        this.pdfTexture.needsUpdate = true;
        
        // Initialize texture transformation properties if not exists
        if (!this.pdfTexture.userData) {
            this.pdfTexture.userData = {};
        }
        this.pdfTexture.userData.rotation = 0;
        this.pdfTexture.userData.flipH = false;
        this.pdfTexture.userData.flipV = false;
        
        // Apply texture to all meshes and count successful applications
        let texturedCount = 0;
        this.meshes.forEach(({ mesh }) => {
            if (mesh.material) {
                mesh.material.map = this.pdfTexture;
                mesh.material.needsUpdate = true;
                texturedCount++;
            }
        });
        
        if (texturedCount > 0) {
            console.log(`PDF texture applied to ${texturedCount} panel(s)`);
            return { success: true, count: texturedCount };
        } else {
            console.error('Failed to apply texture to any panels');
            return { success: false, error: 'No valid materials found' };
        }
    }

    flipTextureHorizontal() {
        if (!this.pdfTexture) return;
        
        // Toggle horizontal flip
        this.pdfTexture.repeat.x *= -1;
        this.pdfTexture.offset.x = this.pdfTexture.repeat.x < 0 ? 1 : 0;
        this.pdfTexture.needsUpdate = true;
        
        // Update materials
        this.meshes.forEach(({ mesh }) => {
            if (mesh.material) {
                mesh.material.needsUpdate = true;
            }
        });
        
        console.log('Texture flipped horizontally');
    }

    flipTextureVertical() {
        if (!this.pdfTexture) return;
        
        // Toggle vertical flip
        this.pdfTexture.repeat.y *= -1;
        this.pdfTexture.offset.y = this.pdfTexture.repeat.y < 0 ? 1 : 0;
        this.pdfTexture.needsUpdate = true;
        
        // Update materials
        this.meshes.forEach(({ mesh }) => {
            if (mesh.material) {
                mesh.material.needsUpdate = true;
            }
        });
        
        console.log('Texture flipped vertically');
    }

    rotateTexture(degrees) {
        if (!this.pdfTexture) return;
        
        // Convert degrees to radians and add to current rotation
        const radians = (degrees * Math.PI) / 180;
        this.pdfTexture.rotation += radians;
        
        // Set the center point for rotation to be the middle of the texture
        this.pdfTexture.center.set(0.5, 0.5);
        this.pdfTexture.needsUpdate = true;
        
        // Update materials
        this.meshes.forEach(({ mesh }) => {
            if (mesh.material) {
                mesh.material.needsUpdate = true;
            }
        });
        
        console.log(`Texture rotated ${degrees} degrees`);
    }

    build3DFromGeometry(geometryData) {
        console.log('Building 3D scene from geometry data...');
        console.log('Geometry data:', geometryData);
        
        // Clear existing meshes
        this.clearScene();
        
        const { panels, hinges, embossMaps } = geometryData;
        
        console.log(`Creating ${panels.length} panel(s) with ${hinges.length} hinge(s)...`);
        
        if (panels.length === 1) {
            // Single panel without subdivision - create as before
            const mesh = this.createPanelMesh(panels[0], 0, 1);
            this.scene.add(mesh);
            this.meshes.push({ mesh, panel: panels[0], hinges: [] });
            console.log('Single panel created (no crease subdivision)');
        } else {
            // Multiple panels - position them connected at hinges
            this.createConnectedPanels(panels, hinges);
        }
        
        // Store hinge data for animations
        this.hinges = hinges;
        this.embossMaps = embossMaps;
        
        console.log('3D scene built with', this.meshes.length, 'panel(s)');
    }
    
    createConnectedPanels(panels, hinges) {
        // Create panels and position them so they're connected at hinge lines
        // For simplicity with 2 panels: place them flat initially at the hinge line
        
        if (panels.length === 2 && hinges.length >= 1) {
            // Two panels connected by a hinge
            const hinge = hinges[0];
            const panel1 = panels[0];
            const panel2 = panels[1];
            
            // Create first panel at origin
            const mesh1 = this.createPanelMesh(panel1, 0, 2);
            this.scene.add(mesh1);
            this.meshes.push({ mesh: mesh1, panel: panel1, hinges: [hinge], connectedPanel: 1 });
            
            // Create second panel positioned relative to first
            const mesh2 = this.createPanelMesh(panel2, 1, 2);
            
            // Position mesh2 adjacent to mesh1 along the hinge line
            // For now, keep them coplanar (can be folded later)
            // The hinge axis determines the connection
            this.scene.add(mesh2);
            this.meshes.push({ mesh: mesh2, panel: panel2, hinges: [hinge], connectedPanel: 0 });
            
            // Store hinge axis for rotation
            mesh2.userData.hingeAxis = hinge.axis;
            mesh2.userData.hingeCenter = hinge.start; // Rotation center
            
            console.log('Created 2 connected panels with hinge');
        } else {
            // Multiple panels - place side by side for now
            panels.forEach((panel, index) => {
                const mesh = this.createPanelMesh(panel, index, panels.length);
                
                // Find hinges connected to this panel
                const connectedHinges = hinges.filter(h => 
                    h.panel1 === panel.id || h.panel2 === panel.id
                );
                
                this.scene.add(mesh);
                this.meshes.push({ mesh, panel, hinges: connectedHinges });
            });
            
            console.log(`Created ${panels.length} panels with hinge connections`);
        }
    }

    createPanelMesh(panel, index, totalPanels) {
        const vertices = panel.vertices;
        
        console.log(`Creating mesh for panel ${index} with ${vertices.length} vertices`);
        
        // Create geometry from actual vertices if available
        if (vertices && vertices.length >= 3) {
            return this.createPolygonMesh(panel, index);
        }
        
        // Fallback: Create simple rectangular geometry for regular panels
        const width = 20;
        const height = 30;
        const geometry = new THREE.BoxGeometry(width, height, 0.5);
        
        const material = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.1,
            roughness: 0.8,
            side: THREE.DoubleSide,
            wireframe: this.wireframeMode
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = (index - totalPanels / 2) * 25;
        mesh.userData.panelId = panel.id;
        
        // Add UV mapping
        this.setupUVMapping(geometry);
        
        return mesh;
    }

    createPolygonMesh(panel, index) {
        // Create a flat polygon mesh from vertices
        const vertices = panel.vertices;
        const shape = new THREE.Shape();
        
        // Start at first vertex
        shape.moveTo(vertices[0][0] - panel.center[0], vertices[0][1] - panel.center[1]);
        
        // Add remaining vertices
        for (let i = 1; i < vertices.length; i++) {
            shape.lineTo(vertices[i][0] - panel.center[0], vertices[i][1] - panel.center[1]);
        }
        
        // Close the shape
        shape.closePath();
        
        // Add holes if present
        if (panel.holes && panel.holes.length > 0) {
            panel.holes.forEach(holePoints => {
                const holePath = new THREE.Path();
                for (let i = 0; i < holePoints.length; i += 2) {
                    if (i === 0) {
                        holePath.moveTo(holePoints[i] - panel.center[0], holePoints[i + 1] - panel.center[1]);
                    } else {
                        holePath.lineTo(holePoints[i] - panel.center[0], holePoints[i + 1] - panel.center[1]);
                    }
                }
                shape.holes.push(holePath);
            });
        }
        
        // Create extruded geometry
        const extrudeSettings = {
            depth: 0.5,
            bevelEnabled: false
        };
        
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        
        // Generate proper UV mapping for texture based on panel bounds
        this.setupPolygonUVMapping(geometry, panel);
        
        const material = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.1,
            roughness: 0.8,
            side: THREE.DoubleSide,
            wireframe: this.wireframeMode
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, 0);
        mesh.userData.panelId = panel.id;
        mesh.userData.panelBounds = panel.bounds; // Store bounds for UV mapping
        
        // Scale down to fit in view
        const scale = 0.1;
        mesh.scale.set(scale, scale, scale);
        
        return mesh;
    }
    
    toggleWireframe() {
        this.wireframeMode = !this.wireframeMode;
        
        // Update all mesh materials
        this.meshes.forEach(({ mesh }) => {
            if (mesh.material) {
                mesh.material.wireframe = this.wireframeMode;
                mesh.material.needsUpdate = true;
            }
        });
        
        console.log('Wireframe mode:', this.wireframeMode ? 'ON' : 'OFF');
        return this.wireframeMode;
    }

    setupPolygonUVMapping(geometry, panel) {
        // Generate UV coordinates based on the panel's position in the original PDF canvas
        // This ensures the texture maps correctly to the cut line area
        
        const positions = geometry.attributes.position;
        const uvs = [];
        
        // Get panel bounds in canvas coordinates
        const bounds = panel.bounds || { minX: 0, minY: 0, maxX: 800, maxY: 600 };
        const canvasWidth = panel.canvasWidth || 800;
        const canvasHeight = panel.canvasHeight || 600;
        
        // For each vertex, calculate UV coordinates based on its position
        for (let i = 0; i < positions.count; i++) {
            // Get vertex position in local coordinates (relative to panel center)
            const localX = positions.getX(i);
            const localY = positions.getY(i);
            
            // Convert to canvas coordinates by adding panel center
            const canvasX = localX + panel.center[0];
            const canvasY = localY + panel.center[1];
            
            // Map canvas position to UV coordinates (0-1 range)
            // Normalize by canvas dimensions
            const u = canvasX / canvasWidth;
            const v = 1.0 - (canvasY / canvasHeight); // Flip Y coordinate for correct texture orientation
            
            uvs.push(u, v);
        }
        
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    }

    setupUVMapping(geometry) {
        const uvAttribute = geometry.attributes.uv;
        // UV mapping is already set by BoxGeometry
        // Custom UV mapping would be implemented here for custom geometries
    }

    clearScene() {
        this.meshes.forEach(({ mesh }) => {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });
        this.meshes = [];
    }

    animateFold() {
        console.log('Animating fold sequence...');
        
        if (this.meshes.length === 0 || !this.hinges) {
            console.warn('No geometry to animate');
            return;
        }

        // Kill existing animations
        this.foldAnimations.forEach(anim => anim.kill());
        this.foldAnimations = [];

        // Animate each panel based on hinge data
        this.meshes.forEach(({ mesh }, index) => {
            if (index === 0) return; // Keep first panel stationary

            const timeline = gsap.timeline();
            
            // Fold animation
            timeline.to(mesh.rotation, {
                x: Math.PI / 2,
                duration: 2,
                ease: "power2.inOut",
                delay: index * 0.3
            });

            this.foldAnimations.push(timeline);
        });

        console.log('Fold animation started');
    }

    async exportGLB() {
        console.log('Exporting to GLB...');
        
        return new Promise((resolve, reject) => {
            const exporter = new GLTFExporter();
            
            exporter.parse(
                this.scene,
                (gltf) => {
                    const blob = new Blob([gltf], { type: 'application/octet-stream' });
                    const url = URL.createObjectURL(blob);
                    
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'dieline_model.glb';
                    link.click();
                    
                    console.log('GLB exported successfully');
                    resolve({ success: true });
                },
                (error) => {
                    console.error('Error exporting GLB:', error);
                    reject(error);
                },
                { binary: true }
            );
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Rotate camera around scene
        const time = Date.now() * 0.0001;
        this.camera.position.x = Math.cos(time) * 100;
        this.camera.position.z = Math.sin(time) * 100;
        this.camera.lookAt(0, 0, 0);
        
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
}
