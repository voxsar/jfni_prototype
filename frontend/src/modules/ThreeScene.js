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
                this.foldPlaneByIncrement(clickedMesh);
            }
        });
    }

    foldPlaneByIncrement(mesh) {
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

        // Increment by 45 degrees
        const increment = Math.PI / 4; // 45 degrees in radians
        mesh.userData.currentFoldAngle += increment;

        // Animate to new rotation on the appropriate axis
        const rotationUpdate = {};
        rotationUpdate[rotationAxis] = mesh.userData.currentFoldAngle;
        
        gsap.to(mesh.rotation, {
            ...rotationUpdate,
            duration: 0.5,
            ease: "power2.inOut"
        });

        console.log(`Folded panel ${mesh.userData.panelId} around ${rotationAxis}-axis to ${(mesh.userData.currentFoldAngle * 180 / Math.PI).toFixed(0)} degrees`);
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

    build3DFromGeometry(geometryData) {
        console.log('Building 3D scene from geometry data...');
        console.log('Geometry data:', geometryData);
        
        // Clear existing meshes
        this.clearScene();
        
        const { panels, hinges, embossMaps } = geometryData;
        
        console.log(`Creating ${panels.length} panels...`);
        
        // Create 3D panels
        panels.forEach((panel, index) => {
            const mesh = this.createPanelMesh(panel, index, panels.length);
            this.scene.add(mesh);
            this.meshes.push({ mesh, panel, hinges: [] });
            console.log(`Panel ${index} created:`, panel.id);
        });
        
        // Store hinge data for animations
        this.hinges = hinges;
        this.embossMaps = embossMaps;
        
        console.log('3D scene built with', this.meshes.length, 'panels');
    }

    createPanelMesh(panel, index, totalPanels) {
        const vertices = panel.vertices;
        
        console.log(`Creating mesh for panel ${index} with ${vertices.length} vertices`);
        
        // Create simple rectangular geometry for now
        // In production, would create proper polygon geometry
        const width = 20;
        const height = 30;
        const geometry = new THREE.BoxGeometry(width, height, 0.5);
        
        const material = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.1,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = (index - totalPanels / 2) * 25;
        mesh.userData.panelId = panel.id;
        
        // Add UV mapping
        this.setupUVMapping(geometry);
        
        return mesh;
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
