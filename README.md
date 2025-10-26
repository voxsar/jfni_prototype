# Dieline Folding Application

A comprehensive 3D dieline folding application with PDF rendering, 2D annotations, automatic line detection, geometry compilation, and 3D visualization with fold animations.

## Features

### Frontend (Port 3002)
- **PDF Rendering**: Uses pdf.js to render PDF dielines onto canvas
- **2D Annotation Layer**: Konva/SVG overlay for drawing and annotating:
  - Cut lines (solid red)
  - Crease lines (dashed blue)
  - Perforation lines (dashed green)
  - Emboss regions (solid yellow)
- **Auto Line Detection**: OpenCV.js Hough Transform for automatic line detection
- **Geometry Compiler**: Converts 2D annotations into 3D geometry data:
  - Panels with vertices and centers
  - Hinges with fold angles and rotation axes
  - Emboss maps with depth information
- **3D Visualization**: Three.js scene with:
  - Real-time 3D preview
  - UV mapping for textures
  - GSAP-powered fold animations
  - GLB/GLTF export functionality

### Backend (Port 3003)
- **Laravel API**: RESTful API for project management
- **FilamentPHP**: Admin panel for resource management (to be configured)
- **PDF Storage**: Upload and manage PDF files
- **Project Persistence**: Save and load projects with geometry data
- **CORS Enabled**: Full cross-origin support for frontend integration

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Vite + Three.js)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PDF Renderer │  │  Annotation  │  │ Line Detector│     │
│  │   (pdf.js)   │→ │    Layer     │→ │  (OpenCV)    │     │
│  └──────────────┘  │   (Konva)    │  └──────────────┘     │
│                    └──────────────┘                         │
│                          ↓                                   │
│                  ┌──────────────┐                           │
│                  │  Geometry    │                           │
│                  │  Compiler    │                           │
│                  └──────────────┘                           │
│                          ↓                                   │
│                  ┌──────────────┐                           │
│                  │  Three.js    │                           │
│                  │  3D Scene    │                           │
│                  │  + GSAP      │                           │
│                  └──────────────┘                           │
└─────────────────────────────────────────────────────────────┘
                             ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                Backend (Laravel + FilamentPHP)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     API      │  │   Projects   │  │   Storage    │     │
│  │  Controllers │→ │    Models    │→ │   (PDFs)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐                                           │
│  │  FilamentPHP │  Admin panel for resource management     │
│  │    Admin     │                                           │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Vite**: Build tool and dev server
- **Three.js**: 3D rendering and scene management
- **pdf.js**: PDF rendering to canvas
- **Konva**: 2D canvas library for annotations
- **OpenCV.js**: Computer vision for line detection
- **GSAP**: Animation library for fold sequences
- **GLTFExporter**: Export 3D models to GLB format

### Backend
- **PHP 8.2**: Server-side language
- **Laravel 10**: PHP framework
- **FilamentPHP 3**: Admin panel builder
- **MySQL 8**: Database

### Infrastructure
- **Docker Compose**: Container orchestration
- **Nginx**: Web server (optional)
- **CORS**: Enabled for all origins in development

## Prerequisites

- Docker Desktop or Docker Engine with Docker Compose
- Node.js 18+ (for local development)
- PHP 8.2+ (for local development)
- Composer (for local development)

## Quick Start with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd jfni_prototype
```

2. Start the application:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:3002
- Backend API: http://localhost:3003/api/health
- Database: localhost:3306

## Local Development Setup

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:3002

### Backend Setup

```bash
cd backend
php -S localhost:3003 -t public
```

The backend API will be available at http://localhost:3003

## Usage Guide

### 1. Load a PDF
- Click "Load PDF" button in the toolbar
- Select a PDF file containing your dieline
- The PDF will render on the left panel

### 2. Annotate the Dieline
- Select an annotation tool (Cut Line, Crease, Perforation, or Emboss)
- Draw directly on the PDF canvas
- Different line types are color-coded:
  - Red: Cut lines
  - Blue: Crease lines
  - Green: Perforation lines
  - Yellow: Emboss regions

### 3. Auto-Detect Lines (Optional)
- Click "Auto-Detect Lines" to use OpenCV Hough Transform
- Detected lines will be automatically classified and added to the annotation layer

### 4. Compile Geometry
- Click "Compile Geometry" to convert 2D annotations into 3D data
- The system extracts:
  - Panel definitions from cut lines
  - Hinge definitions from crease lines
  - Emboss maps from emboss annotations

### 5. Build 3D Scene
- Click "Build 3D" to generate the 3D model
- View the model in the right panel
- Camera rotates automatically around the scene

### 6. Animate Fold
- Click "Animate Fold" to see the GSAP-powered fold sequence
- Panels fold along defined hinges with smooth animations

### 7. Export GLB
- Click "Export GLB" to download the 3D model
- File will be saved as `dieline_model.glb`
- Compatible with Blender, Three.js, Unity, etc.

## API Endpoints

### Health Check
```
GET /api/health
```

### Upload PDF
```
POST /api/upload-pdf
Content-Type: multipart/form-data
Body: pdf=<file>
```

### Create Project
```
POST /api/projects
Content-Type: application/json
Body: { "name": "Project Name", "data": {...} }
```

### Get Project
```
GET /api/projects/{id}
```

### Update Project
```
PUT /api/projects/{id}
Content-Type: application/json
Body: { "data": {...} }
```

### Delete Project
```
DELETE /api/projects/{id}
```

### Export Model
```
POST /api/export-model
Content-Type: application/json
Body: { "modelData": {...} }
```

## Project Structure

```
jfni_prototype/
├── docker-compose.yml          # Docker orchestration
├── frontend/                   # Frontend application
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.js            # Main application
│       └── modules/
│           ├── PDFRenderer.js        # PDF rendering
│           ├── AnnotationLayer.js    # 2D annotations
│           ├── LineDetector.js       # OpenCV line detection
│           ├── GeometryCompiler.js   # 2D to 3D conversion
│           ├── ThreeScene.js         # 3D visualization
│           └── APIService.js         # Backend communication
├── backend/                    # Backend API
│   ├── Dockerfile
│   ├── composer.json
│   ├── routes/
│   │   └── api.php
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── HealthController.php
│   │   │   ├── PDFController.php
│   │   │   └── ProjectController.php
│   │   └── Models/
│   │       └── Project.php
│   ├── database/
│   │   └── migrations/
│   │       └── create_projects_table.php
│   ├── config/
│   │   └── cors.php
│   └── public/
│       └── index.php           # API entry point
└── README.md
```

## Configuration

### CORS Configuration
CORS is enabled for all origins in development mode. For production:

Edit `backend/config/cors.php`:
```php
'allowed_origins' => ['https://your-frontend-domain.com'],
```

### Environment Variables

Frontend (`frontend/.env`):
```
VITE_API_URL=http://localhost:3003
```

Backend (`backend/.env`):
```
APP_URL=http://localhost:3003
DB_HOST=db
DB_DATABASE=dieline_app
DB_USERNAME=root
DB_PASSWORD=secret
```

## Development Notes

### OpenCV.js Setup
OpenCV.js is loaded from CDN. For offline use, download opencv.js and include it locally:
```html
<script src="/path/to/opencv.js"></script>
```

### FilamentPHP Admin Panel
To set up FilamentPHP admin panel:
```bash
cd backend
composer require filament/filament
php artisan filament:install --panels
php artisan make:filament-resource Project
```

### UV Mapping
UV coordinates are automatically generated for box geometries. For custom geometries, implement custom UV mapping in `ThreeScene.js`.

### Fold Animation Customization
Modify fold angles and timing in `ThreeScene.animateFold()`:
```javascript
timeline.to(mesh.rotation, {
    x: Math.PI / 2,  // 90 degree fold
    duration: 2,      // 2 seconds
    ease: "power2.inOut"
});
```

## Troubleshooting

### Frontend doesn't connect to backend
- Check that both containers are running: `docker-compose ps`
- Verify CORS settings in `backend/config/cors.php`
- Check browser console for CORS errors

### PDF not rendering
- Ensure pdf.js worker is loaded correctly
- Check browser console for errors
- Verify PDF file is valid

### OpenCV line detection not working
- OpenCV.js may take time to load
- Check console for "OpenCV.js ready" message
- Ensure canvas has content before detection

### 3D scene not visible
- Check canvas dimensions in browser inspector
- Verify Three.js renderer is initialized
- Check camera position and scene lighting

## Performance Optimization

- Large PDFs: Reduce scale in PDFRenderer
- Complex annotations: Limit number of points
- 3D performance: Reduce polygon count in geometries
- Animation smoothness: Adjust GSAP duration and ease

## Future Enhancements

- [ ] Machine learning for better line classification
- [ ] Advanced panel detection algorithms
- [ ] Texture mapping from PDF
- [ ] Real-time collaboration
- [ ] Cloud storage integration
- [ ] Mobile responsive design
- [ ] Undo/redo functionality
- [ ] Export to other 3D formats (OBJ, FBX)
- [ ] Physics simulation for fold validation

## License

MIT License

## Contributing

Contributions are welcome! Please follow the standard fork, branch, and pull request workflow.

## Support

For issues and questions, please open an issue on GitHub.