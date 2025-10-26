# Dieline Folding App - Quick Start Guide

## What is this?

This application helps you convert 2D PDF dielines (packaging templates) into interactive 3D models with fold animations. It's useful for:
- Packaging designers
- Print shops
- 3D artists working with packaging
- Anyone who needs to visualize how flat designs fold into 3D shapes

## Features at a Glance

1. **PDF Import** - Load your dieline PDF
2. **Annotation** - Draw cut lines, creases, perforations, and emboss regions
3. **Auto-Detection** - AI-powered line detection using OpenCV
4. **3D Preview** - See your flat design as a 3D model
5. **Fold Animation** - Watch it fold in real-time with smooth animations
6. **GLB Export** - Export for use in Blender, Unity, Three.js, etc.

## Installation Methods

### Method 1: Docker (Recommended)

**Prerequisites:** Docker Desktop or Docker Engine with Docker Compose

```bash
# Clone the repository
git clone <repository-url>
cd jfni_prototype

# Run setup script
./setup.sh

# Access the app
# Frontend: http://localhost:3002
# Backend: http://localhost:3003/api/health
```

### Method 2: Local Development

**Prerequisites:** Node.js 18+, PHP 8.2+

```bash
# Clone the repository
git clone <repository-url>
cd jfni_prototype

# Install frontend dependencies
cd frontend
npm install
cd ..

# Start both servers
./start-dev.sh

# Access the app
# Frontend: http://localhost:3002
# Backend: http://localhost:3003/api/health

# To stop
./stop-dev.sh
```

### Method 3: Manual Setup

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:3002

**Backend:**
```bash
cd backend
php -S localhost:3003 -t public
```
Runs on http://localhost:3003

## Basic Workflow

### Step 1: Load Your PDF
1. Click the "Load PDF" button in the toolbar
2. Select your dieline PDF file
3. The PDF will appear in the left panel

### Step 2: Add Annotations

**Manual Drawing:**
1. Select a tool from the toolbar:
   - **Cut Line** (Red) - Defines where to cut
   - **Crease** (Blue) - Defines fold lines
   - **Perforation** (Green) - Tear-away lines
   - **Emboss** (Yellow) - Raised/debossed areas
2. Draw on the PDF by clicking and dragging
3. Each line type is color-coded for easy identification

**Auto Detection:**
1. Click "Auto-Detect Lines" button
2. OpenCV will analyze the PDF and detect lines
3. Lines are automatically classified and added to the canvas

### Step 3: Compile Geometry
1. Click "Compile Geometry" button
2. The system analyzes your annotations and creates:
   - **Panels** - Individual flat pieces
   - **Hinges** - Connection points with fold angles
   - **Emboss Maps** - 3D surface details
3. Status bar shows number of panels and hinges detected

### Step 4: Build 3D Model
1. Click "Build 3D" button
2. The 3D model appears in the right panel
3. Camera automatically rotates around the model
4. You can see the flat panels arranged in 3D space

### Step 5: Animate Folding
1. Click "Animate Fold" button
2. Watch the panels fold along the crease lines
3. Smooth GSAP animations show the folding sequence
4. Animation plays automatically

### Step 6: Export Your Model
1. Click "Export GLB" button
2. File downloads as `dieline_model.glb`
3. Import into:
   - Blender (for rendering/animation)
   - Unity/Unreal (for games)
   - Three.js projects (for web)
   - Sketchfab (for sharing)

## Tips & Tricks

### For Best Results:
- Use high-contrast PDFs with clear lines
- Draw crease lines where you want the model to fold
- Cut lines should define the outer boundary
- Perforations are for tear-away sections
- Emboss areas will have depth in the 3D model

### Annotation Tips:
- Hold Shift while drawing for straight lines (coming soon)
- Use consistent line types for better results
- Don't overlap different line types on the same path
- Clear and redraw if you make a mistake

### 3D View Tips:
- The camera automatically orbits the model
- Panels are arranged based on compiled geometry
- Fold angles default to 90 degrees
- Animation speed can be adjusted in the code

## Troubleshooting

### "Backend: Offline" message
- Make sure backend server is running
- Check http://localhost:3003/api/health in browser
- Restart backend: `./stop-dev.sh && ./start-dev.sh`

### PDF not loading
- Ensure file is a valid PDF
- Try a smaller PDF file
- Check browser console for errors (F12)

### Lines not detecting
- Wait for "OpenCV.js ready" in console
- Make sure PDF has loaded first
- Try a PDF with clearer lines
- Manual annotation always works

### 3D model not showing
- Make sure you clicked "Build 3D" after compiling geometry
- Check that panels were detected (status bar shows count)
- Try refreshing the page

### Animation not working
- Make sure you have hinges (crease lines) defined
- Build 3D first before animating
- Check browser console for errors

## Advanced Usage

### Custom Fold Angles
Edit `frontend/src/modules/GeometryCompiler.js`:
```javascript
foldAngle: 90, // Change to desired angle
```

### Animation Duration
Edit `frontend/src/modules/ThreeScene.js`:
```javascript
duration: 2, // Change to seconds
```

### PDF Scale
Edit `frontend/src/modules/PDFRenderer.js`:
```javascript
this.scale = 1.5; // Adjust for performance
```

## API Integration

The backend provides REST APIs for integration:

```javascript
// Health check
GET http://localhost:3003/api/health

// Upload PDF
POST http://localhost:3003/api/upload-pdf
Content-Type: multipart/form-data
Body: { pdf: File }

// Save project
POST http://localhost:3003/api/projects
Content-Type: application/json
Body: { name: "My Project", data: {...} }

// Get project
GET http://localhost:3003/api/projects/{id}
```

## Docker Commands

```bash
# Start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild after code changes
docker-compose up --build

# Remove everything (including volumes)
docker-compose down -v
```

## Development

### Frontend Structure
```
frontend/src/
├── main.js                  # Main app initialization
└── modules/
    ├── PDFRenderer.js       # PDF rendering with pdf.js
    ├── AnnotationLayer.js   # Konva drawing layer
    ├── LineDetector.js      # OpenCV line detection
    ├── GeometryCompiler.js  # 2D to 3D conversion
    ├── ThreeScene.js        # 3D rendering & animation
    └── APIService.js        # Backend communication
```

### Backend Structure
```
backend/
├── routes/api.php                  # API routes
├── app/Http/Controllers/           # API controllers
│   ├── HealthController.php
│   ├── PDFController.php
│   └── ProjectController.php
└── public/index.php                # API entry point
```

### Making Changes

1. **Frontend changes:**
   - Edit files in `frontend/src/`
   - Vite hot-reloads automatically
   - No restart needed

2. **Backend changes:**
   - Edit files in `backend/app/`
   - Save file
   - Restart PHP server or use Docker

## Next Steps

### Add FilamentPHP Admin Panel

```bash
cd backend
composer require filament/filament:"^3.0"
php artisan filament:install --panels
php artisan make:filament-resource Project
```

### Add Real Database

1. Update `docker-compose.yml` to include MySQL (already there!)
2. Update `.env` with database credentials
3. Run migrations: `php artisan migrate`

### Deploy to Production

1. Build frontend: `cd frontend && npm run build`
2. Configure web server (Nginx/Apache)
3. Set environment variables
4. Enable HTTPS
5. Configure CORS for production domain

## Resources

- **Three.js Docs:** https://threejs.org/docs/
- **pdf.js Docs:** https://mozilla.github.io/pdf.js/
- **Konva Docs:** https://konvajs.org/docs/
- **OpenCV.js Tutorial:** https://docs.opencv.org/3.4/d5/d10/tutorial_js_root.html
- **GSAP Docs:** https://greensock.com/docs/
- **Laravel Docs:** https://laravel.com/docs
- **FilamentPHP Docs:** https://filamentphp.com/docs

## Support

- Issues: GitHub Issues
- Discussions: GitHub Discussions
- Email: [your-email]

## License

MIT License - Feel free to use in your projects!
