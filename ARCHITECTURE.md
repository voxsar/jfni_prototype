# Dieline Folding App - Architecture Overview

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Frontend Application                    │ │
│  │              (Vite + Three.js + pdf.js)                   │ │
│  │                   Port 3002                                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              ▲                                   │
│                              │ HTTP/REST                         │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   Backend API Server                       │ │
│  │              (Laravel/PHP + FilamentPHP)                  │ │
│  │                   Port 3003                                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              ▲                                   │
│                              │ SQL                              │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   MySQL Database                           │ │
│  │                   Port 3306                                │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    All running in Docker Containers
```

## Frontend Architecture

### Module Breakdown

```
┌────────────────────────────────────────────────────────────────┐
│                      DielineApp (main.js)                      │
│                    Main Application Controller                 │
└────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ PDFRenderer  │  │ Annotation   │  │ LineDetector │
    │              │  │    Layer     │  │              │
    │  (pdf.js)    │  │   (Konva)    │  │  (OpenCV)    │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                 │                 │
            └────────┬────────┴────────┬────────┘
                     ▼                 ▼
              ┌──────────────┐  ┌──────────────┐
              │  Geometry    │  │  APIService  │
              │  Compiler    │  │              │
              └──────────────┘  └──────────────┘
                     │                 │
                     ▼                 │
              ┌──────────────┐        │
              │  ThreeScene  │        │
              │  (Three.js)  │        │
              │  + GSAP      │        │
              └──────────────┘        │
                     │                 │
                     └────────┬────────┘
                              ▼
                         Backend API
```

### Data Flow

```
1. PDF Upload
   User → File Input → PDFRenderer → Canvas → Annotation Layer

2. Annotation
   User → Tool Selection → Mouse Events → Konva Layer → Annotations Array

3. Auto-Detection
   Canvas → OpenCV.js → Hough Transform → Classified Lines → Konva Layer

4. Geometry Compilation
   Annotations → GeometryCompiler → Panels + Hinges + Emboss Maps

5. 3D Build
   Geometry Data → ThreeScene → Mesh Generation → Scene Rendering

6. Fold Animation
   ThreeScene → GSAP Timeline → Rotation/Translation → Animated Scene

7. GLB Export
   ThreeScene → GLTFExporter → Blob → Download

8. Backend Sync
   Project Data → APIService → Laravel API → MySQL Database
```

## Backend Architecture

### Laravel API Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Server                       │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                    Entry Point                        │ │
│  │                  public/index.php                     │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                    Router                             │ │
│  │                  routes/api.php                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│        ┌──────────────────┼──────────────────┐             │
│        ▼                  ▼                  ▼             │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐        │
│  │ Health   │      │   PDF    │      │ Project  │        │
│  │Controller│      │Controller│      │Controller│        │
│  └──────────┘      └──────────┘      └──────────┘        │
│        │                  │                  │             │
│        └──────────────────┼──────────────────┘             │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                    Models                             │ │
│  │                  app/Models/                          │ │
│  │                  - Project.php                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                  Database Layer                       │ │
│  │                  MySQL Database                       │ │
│  │  - projects table                                     │ │
│  │  - users table (for Filament)                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              FilamentPHP Admin Panel                  │ │
│  │                    /admin                             │ │
│  │  - Dashboard                                          │ │
│  │  - Project Management                                 │ │
│  │  - User Management                                    │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| POST | /api/upload-pdf | Upload PDF file |
| GET | /api/projects | List all projects |
| POST | /api/projects | Create new project |
| GET | /api/projects/{id} | Get project details |
| PUT | /api/projects/{id} | Update project |
| DELETE | /api/projects/{id} | Delete project |
| POST | /api/export-model | Export 3D model data |

## Technology Stack Details

### Frontend Dependencies

```json
{
  "three": "^0.160.0",           // 3D rendering engine
  "pdfjs-dist": "^3.11.174",     // PDF parsing and rendering
  "konva": "^9.3.1",             // 2D canvas manipulation
  "gsap": "^3.12.4",             // Animation library
  "opencv.js": "^1.2.1",         // Computer vision (line detection)
  "vite": "^5.0.10"              // Build tool and dev server
}
```

### Backend Dependencies

```json
{
  "php": "^8.1",
  "laravel/framework": "^10.0",   // PHP framework
  "filament/filament": "^3.0",    // Admin panel
  "guzzlehttp/guzzle": "^7.2"     // HTTP client
}
```

### Infrastructure

- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **MySQL 8**: Relational database
- **Nginx**: Web server (optional)
- **PHP-FPM**: PHP FastCGI Process Manager

## Key Features Implementation

### 1. PDF Rendering (PDFRenderer.js)

```javascript
pdf.js → Canvas 2D Context → Rendered PDF
```

- Uses Mozilla's pdf.js library
- Renders PDF to HTML5 canvas
- Supports multi-page documents
- Configurable scale/zoom

### 2. 2D Annotation (AnnotationLayer.js)

```javascript
Konva Stage → Konva Layer → Line Shapes
```

- Transparent overlay on PDF canvas
- Four annotation types (cut, crease, perf, emboss)
- Interactive drawing with mouse/touch
- Color-coded visualization
- Exports to SVG format

### 3. Line Detection (LineDetector.js)

```javascript
Canvas → OpenCV Mat → Canny Edge → Hough Lines → Classified Lines
```

- OpenCV.js for computer vision
- Hough Line Transform for line detection
- Automatic line classification by angle
- Configurable detection parameters

### 4. Geometry Compilation (GeometryCompiler.js)

```javascript
2D Annotations → Panel Extraction → Hinge Detection → 3D Data Structure
```

- Converts 2D lines to 3D geometry definitions
- Extracts panels from cut lines
- Identifies hinges from crease lines
- Generates emboss depth maps
- Outputs structured geometry data

### 5. 3D Visualization (ThreeScene.js)

```javascript
Geometry Data → Three.js Mesh → Scene → Renderer → Canvas
```

- Three.js for 3D rendering
- WebGL-based rendering
- Real-time camera movement
- PBR materials with lighting
- UV mapping for textures

### 6. Fold Animation (ThreeScene.js + GSAP)

```javascript
Hinge Data → GSAP Timeline → Mesh Rotation → Animated Fold
```

- GSAP for smooth animations
- Sequential panel folding
- Configurable timing and easing
- Rotation along hinge axes

### 7. GLB Export (ThreeScene.js)

```javascript
Three.js Scene → GLTFExporter → Binary GLB → File Download
```

- Exports to industry-standard GLB format
- Compatible with Blender, Unity, Three.js
- Includes geometry, materials, and UVs
- Ready for further processing

## Security Considerations

### CORS Configuration
- Development: Allow all origins (`*`)
- Production: Restrict to specific domains

### File Upload Security
- Validate file types (PDF only)
- Limit file size
- Store in secure directory
- Scan for malware (recommended)

### API Authentication
- Currently no authentication (add JWT/OAuth)
- FilamentPHP has built-in auth
- CSRF protection enabled

### Database Security
- Parameterized queries (Laravel ORM)
- Input validation
- SQL injection prevention

## Performance Optimization

### Frontend
- Lazy load large PDFs
- Limit annotation points
- Use requestAnimationFrame for animations
- Debounce drawing events
- Cache compiled geometry

### Backend
- Database indexing
- Query optimization
- Caching (Redis recommended)
- File compression
- CDN for static assets

### 3D Rendering
- LOD (Level of Detail) for complex geometries
- Frustum culling
- Texture optimization
- Geometry instancing for repeated elements

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Load balancer ready
- Session storage in Redis
- File storage in S3/CDN

### Vertical Scaling
- Optimize database queries
- Increase PHP workers
- Add more CPU/RAM
- GPU acceleration for 3D

### Microservices Architecture (Future)
```
Frontend ─┬─→ API Gateway ─┬─→ PDF Service
          │                ├─→ Geometry Service
          │                ├─→ 3D Rendering Service
          │                └─→ Storage Service
          └─→ WebSocket Server (for real-time)
```

## Monitoring & Logging

### Frontend
- Browser console errors
- Performance metrics
- User interaction tracking
- Error boundaries

### Backend
- Laravel logs (storage/logs)
- API request logging
- Database query logging
- Error tracking (Sentry recommended)

### Infrastructure
- Docker container logs
- Resource usage (CPU, RAM, disk)
- Network traffic
- Database performance

## Deployment Architecture

### Development
```
localhost:3002 (Frontend)
localhost:3003 (Backend)
localhost:3306 (Database)
```

### Production
```
https://app.example.com → CDN → Frontend (Nginx)
https://api.example.com → Load Balancer → Backend (PHP-FPM)
                                          ↓
                                      Database (RDS/Managed)
```

## Future Enhancements

1. **Real-time Collaboration**
   - WebSocket server
   - Shared annotation layer
   - Multi-user editing

2. **Machine Learning**
   - Automatic panel detection
   - Smart line classification
   - Fold prediction

3. **Advanced 3D**
   - Physics simulation
   - Collision detection
   - Material customization
   - Texture mapping from PDF

4. **Mobile Support**
   - Responsive design
   - Touch optimization
   - Progressive Web App
   - Native mobile apps

5. **Cloud Integration**
   - S3/Cloud storage
   - Serverless functions
   - Auto-scaling
   - Global CDN

## Conclusion

This architecture provides a solid foundation for a production-ready dieline folding application with:

- ✅ Clean separation of concerns
- ✅ Modular, maintainable code
- ✅ Scalable infrastructure
- ✅ Modern tech stack
- ✅ Security best practices
- ✅ Performance optimization
- ✅ Comprehensive documentation
- ✅ Easy deployment (Docker)
- ✅ Extensible design
- ✅ Production-ready APIs

The system is designed to handle complex dieline processing workflows while maintaining simplicity and ease of use for end users.
