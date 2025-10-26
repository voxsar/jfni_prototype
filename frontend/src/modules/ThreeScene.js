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
        
        this.setupScene();
        this.setupLights();
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

    build3DFromGeometry(geometryData) {
        console.log('Building 3D scene from geometry data...');
        
        // Clear existing meshes
        this.clearScene();
        
        const { panels, hinges, embossMaps } = geometryData;
        
        // Create 3D panels
        panels.forEach((panel, index) => {
            const mesh = this.createPanelMesh(panel, index);
            this.scene.add(mesh);
            this.meshes.push({ mesh, panel, hinges: [] });
        });
        
        // Store hinge data for animations
        this.hinges = hinges;
        this.embossMaps = embossMaps;
        
        console.log('3D scene built with', this.meshes.length, 'panels');
    }

    createPanelMesh(panel, index) {
        const vertices = panel.vertices;
        
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
        mesh.position.x = (index - panels.length / 2) * 25;
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
