# Dieline Folding Application

> **🔄 IMPORTANT UPDATE:** The backend has been upgraded to a full Laravel 10 + FilamentPHP 3.3 implementation. This application is designed to run inside an external nginx reverse proxy. The internal nginx service has been removed from docker-compose.yml. See [LARAVEL_SETUP.md](LARAVEL_SETUP.md) for detailed setup instructions.

A comprehensive 3D dieline folding application with PDF rendering, 2D annotations, automatic line detection, geometry compilation, and 3D visualization with fold animations.

## Features

### Frontend (Port 3002)
- **PDF Rendering**: Uses pdf.js to render PDF dielines onto canvas
- **Interactive PDF Navigation**:
  - Middle-click pan for easy navigation
  - Mouse wheel zoom with cursor focus
  - Button-based zoom controls
- **2D Annotation Layer**: Konva/SVG overlay for drawing and annotating:
  - Cut lines (solid red)
  - Crease lines (dashed blue)
  - Perforation lines (dashed green)
  - Emboss regions (solid yellow)
- **Line Editing & Interaction**:
  - Hover to highlight lines with glow effect
  - Click and drag to reposition lines
  - Right-click context menu for line operations
  - Change line types dynamically
  - Delete unwanted lines
  - Works for both manual and auto-detected lines
- **Auto Line Detection**: OpenCV.js Hough Transform for automatic line detection
- **Geometry Compiler**: Converts 2D annotations into 3D geometry data:
  - Panels with vertices and centers
  - Hinges with fold angles and rotation axes
  - Emboss maps with depth information
- **3D Visualization**: Three.js scene with:
  - Real-time 3D preview
  - **Interactive plane folding**: Click on any plane to fold it in 45-degree increments
  - **PDF texture mapping**: Load PDF as an image texture on 3D models
  - UV mapping for textures
  - GSAP-powered fold animations
  - GLB/GLTF export functionality

### Backend (Port 3003)
- **Laravel 10 API**: Full-featured Laravel framework with RESTful API
- **FilamentPHP 3.3 Admin Panel**: Modern admin interface at `/admin`
  - User authentication and management
  - Project CRUD operations
  - Database resource management
  - Dashboard widgets and analytics
- **PDF Storage**: Upload and manage PDF files with Laravel storage
- **Project Persistence**: Save and load projects with Eloquent ORM
- **Database**: MySQL 8.0 with migrations and seeders
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
- **Docker Compose**: Container orchestration with 3 services (frontend, backend, database)
- **CORS**: Enabled for all origins in development
- **MySQL 8**: Persistent database with volumes
- **External Nginx**: Designed to work with external nginx reverse proxy

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
# or
docker compose up --build
```

3. Access the application:
- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:3003/api/health
- **Filament Admin**: http://localhost:3003/admin
- **Database**: localhost:3306

> **Note**: This application is designed to run inside an external nginx reverse proxy. If you need to set up custom domains or SSL, configure your external nginx to proxy requests to the frontend (port 3002) and backend (port 3003) services.

4. Create admin user for FilamentPHP:
```bash
docker-compose exec backend php artisan make:filament-user
```

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
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve --host=0.0.0.0 --port=3003
```

The backend API will be available at http://localhost:3003

For FilamentPHP admin panel setup, see [LARAVEL_SETUP.md](LARAVEL_SETUP.md)

## Usage Guide

### 1. Load a PDF
- Click "Load PDF" button in the toolbar
- Select a PDF file containing your dieline
- The PDF will render on the left panel

### 2. Navigate and Zoom the PDF
- **Mouse Wheel Zoom**: Scroll up/down to zoom in/out (zooms towards cursor position)
- **Middle-Click Pan**: Hold middle mouse button and drag to pan the PDF
- **Zoom Buttons**: Use 🔍+, 🔍-, and ⟲ buttons for zoom control
- **Left-Click Pan**: When zoomed in, left-click and drag to pan

### 3. Annotate the Dieline
- Select an annotation tool (Cut Line, Crease, Perforation, or Emboss)
- Draw directly on the PDF canvas
- Different line types are color-coded:
  - Red: Cut lines
  - Blue: Crease lines
  - Green: Perforation lines
  - Yellow: Emboss regions

### 4. Edit Lines (Manual and Auto-Detected)
- **Hover**: Move mouse over any line to see it glow/highlight
- **Drag**: Click and drag a line to reposition it
- **Right-Click Menu**: Right-click on any line to:
  - Change line type (Cut Line, Crease, Perforation, Emboss)
  - Delete the line
- These features work for both manually drawn and auto-detected lines

### 5. Auto-Detect Lines (Optional)
- Click "Auto-Detect Lines" to use OpenCV Hough Transform
- Detected lines will be automatically classified and added to the annotation layer
- Auto-detected lines can be edited just like manually drawn lines

### 6. Compile Geometry
- Click "Compile Geometry" to convert 2D annotations into 3D data
- The system extracts:
  - Panel definitions from cut lines
  - Hinge definitions from crease lines
  - Emboss maps from emboss annotations

### 7. Build 3D Scene
- Click "Build 3D" to generate the 3D model
- View the model in the right panel
- Camera rotates automatically around the scene
- **Click on any panel** in the 3D view to fold it by 45 degrees
- Each click increments the fold angle by 45 degrees

### 8. Load PDF Texture (Optional)
- Click "Load PDF Texture" to apply the PDF as a texture on the 3D model
- The PDF canvas will be mapped onto all 3D panels
- This provides a realistic preview of how the final folded dieline will look

### 9. Animate Fold
- Click "Animate Fold" to see the GSAP-powered fold sequence
- Panels fold along defined hinges with smooth animations

### 10. Export GLB
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