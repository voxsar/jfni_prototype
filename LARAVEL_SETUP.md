# Laravel 10 + FilamentPHP Setup Guide

This document describes the Laravel 10 and FilamentPHP 3.3 implementation for the JFNI Prototype project.

## What Was Done

### 1. Laravel 10 Installation
- Fresh Laravel 10 installation using `composer create-project laravel/laravel backend "10.*"`
- All core Laravel features available
- Configured for MySQL database
- CORS enabled for API access

### 2. FilamentPHP 3.3 Installation
- Installed via `composer require filament/filament:"^3.3" -W`
- Admin panel configured via `php artisan filament:install --panels`
- Admin panel accessible at `/admin` route
- Ready for resource management

### 3. API Implementation
All original API endpoints have been migrated to Laravel:

**Controllers Created:**
- `HealthController` - Health check endpoint
- `PDFController` - PDF file upload handling
- `ProjectController` - Full CRUD for projects + model export

**Routes Configured (`routes/api.php`):**
```php
GET     /api/health
POST    /api/upload-pdf
GET     /api/projects
POST    /api/projects
GET     /api/projects/{id}
PUT     /api/projects/{id}
DELETE  /api/projects/{id}
POST    /api/export-model
```

### 4. Database Setup
**Project Model** with fields:
- `name` - Project name
- `description` - Project description (nullable)
- `pdf_path` - Path to uploaded PDF (nullable)
- `geometry_data` - JSON data for 3D geometry (nullable)
- `annotations` - JSON data for 2D annotations (nullable)
- `status` - Project status (draft/processing/completed/error)
- `timestamps` - created_at, updated_at

**Migration:** `database/migrations/2025_10_27_043302_create_projects_table.php`

### 5. Nginx Reverse Proxy
Configured nginx reverse proxy for custom domain support:

**Supported Domains:**
- `backend.jfni.artslabcreatives.com` → Backend API
- `frontend.jfni.artslabcreatives.com` → Frontend
- `localhost` → Default access (frontend with `/api` and `/admin` routes to backend)

### 6. Docker Configuration
Updated `docker-compose.yml` with:
- **nginx service** - Reverse proxy on port 80
- **backend service** - Laravel application on port 3003
- **frontend service** - Vite application on port 3002
- **db service** - MySQL 8.0 database

All services connected via `app-network` bridge network.

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost/api/health
# Filament Admin: http://localhost/admin
```

### Option 2: Local Development

**Backend:**
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve --host=0.0.0.0 --port=3003
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Using Custom Domains Locally

### 1. Update Hosts File

Add these entries to `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 frontend.jfni.artslabcreatives.com
127.0.0.1 backend.jfni.artslabcreatives.com
```

### 2. Start Docker

```bash
docker-compose up --build
```

### 3. Access via Custom Domains

- Frontend: http://frontend.jfni.artslabcreatives.com
- Backend API: http://backend.jfni.artslabcreatives.com/api/health
- Filament Admin: http://backend.jfni.artslabcreatives.com/admin

## FilamentPHP Admin Panel Setup

### 1. Create Admin User

First, access the backend container:

```bash
docker-compose exec backend php artisan make:filament-user
```

Or locally:

```bash
cd backend
php artisan make:filament-user
```

Follow the prompts to create an admin user.

### 2. Access Admin Panel

Navigate to:
- Docker: http://localhost/admin
- Custom domain: http://backend.jfni.artslabcreatives.com/admin
- Local: http://localhost:3003/admin

### 3. Create Project Resource

To manage projects via FilamentPHP:

```bash
php artisan make:filament-resource Project
```

This creates:
- `app/Filament/Resources/ProjectResource.php`
- `app/Filament/Resources/ProjectResource/Pages/ListProjects.php`
- `app/Filament/Resources/ProjectResource/Pages/CreateProject.php`
- `app/Filament/Resources/ProjectResource/Pages/EditProject.php`

See `FILAMENT_SETUP.md` for detailed resource configuration.

## Environment Configuration

### Backend (.env)

```env
APP_NAME=DielineApp
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:3003

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=dieline_app
DB_USERNAME=root
DB_PASSWORD=secret

CORS_ALLOWED_ORIGINS=*
```

### Frontend

Update `frontend/.env` or environment variables:

```env
VITE_API_URL=http://localhost:3003
# Or for custom domain:
VITE_API_URL=http://backend.jfni.artslabcreatives.com
```

## API Testing

### Test Health Endpoint

```bash
curl http://localhost:3003/api/health
# or
curl http://localhost/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": 1698345600,
  "service": "Dieline App API",
  "version": "1.0.0"
}
```

### Test Project Creation

```bash
curl -X POST http://localhost:3003/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "status": "draft"
  }'
```

### Test PDF Upload

```bash
curl -X POST http://localhost:3003/api/upload-pdf \
  -F "pdf=@/path/to/your/file.pdf"
```

## Database Management

### Run Migrations

```bash
# Docker
docker-compose exec backend php artisan migrate

# Local
cd backend && php artisan migrate
```

### Fresh Database

```bash
# Docker
docker-compose exec backend php artisan migrate:fresh

# Local
cd backend && php artisan migrate:fresh
```

### Seed Database (if seeders exist)

```bash
# Docker
docker-compose exec backend php artisan db:seed

# Local
cd backend && php artisan db:seed
```

## Troubleshooting

### Port Already in Use

If ports 80, 3002, or 3003 are in use:

```bash
# Find what's using the port
sudo lsof -i :80
sudo lsof -i :3003

# Stop the process or change ports in docker-compose.yml
```

### Database Connection Error

Make sure the database service is running:

```bash
docker-compose ps
docker-compose logs db
```

Wait for MySQL to fully initialize (can take 30-60 seconds on first run).

### Permission Errors in Docker

If you get permission errors:

```bash
# Fix storage and cache permissions
docker-compose exec backend chmod -R 775 storage bootstrap/cache
docker-compose exec backend chown -R www-data:www-data storage bootstrap/cache
```

### Frontend Can't Connect to Backend

1. Check backend is running: `curl http://localhost:3003/api/health`
2. Check CORS settings in `backend/config/cors.php`
3. Verify `VITE_API_URL` in frontend environment
4. Check browser console for specific error messages

### Composer Install Issues

If composer install fails in Docker:

```bash
# Manual install
docker-compose exec backend composer install
```

### Migration Errors

If migrations fail:

```bash
# Check database connection
docker-compose exec backend php artisan tinker
>>> DB::connection()->getPdo();

# Clear config cache
docker-compose exec backend php artisan config:clear
```

## Production Deployment

### 1. Update Environment

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://backend.jfni.artslabcreatives.com
```

### 2. Optimize Laravel

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

### 3. Setup SSL/TLS

See `nginx/README.md` for SSL certificate configuration with Let's Encrypt.

### 4. Update CORS

In production, restrict CORS to specific domains in `config/cors.php`:

```php
'allowed_origins' => [
    'https://frontend.jfni.artslabcreatives.com',
],
```

### 5. Database Backup

Set up automated backups:

```bash
# Manual backup
docker-compose exec db mysqldump -u root -p dieline_app > backup.sql

# Restore
docker-compose exec -T db mysql -u root -p dieline_app < backup.sql
```

## File Structure

```
backend/
├── app/
│   ├── Http/Controllers/
│   │   ├── HealthController.php
│   │   ├── PDFController.php
│   │   └── ProjectController.php
│   ├── Models/
│   │   └── Project.php
│   └── Providers/
│       └── Filament/
│           └── AdminPanelProvider.php
├── config/
│   ├── cors.php
│   └── [other Laravel configs]
├── database/
│   └── migrations/
│       └── 2025_10_27_043302_create_projects_table.php
├── docker/
│   ├── nginx.conf
│   └── start.sh
├── routes/
│   ├── api.php
│   └── web.php
├── .env
├── composer.json
└── Dockerfile
```

## Additional Resources

- **Laravel Documentation**: https://laravel.com/docs/10.x
- **FilamentPHP Documentation**: https://filamentphp.com/docs/3.x
- **Original Setup Guide**: `FILAMENT_SETUP.md`
- **Nginx Configuration**: `nginx/README.md`
- **Architecture Overview**: `ARCHITECTURE.md`

## Support

For issues specific to this implementation:
1. Check logs: `docker-compose logs backend`
2. Check Laravel logs: `backend/storage/logs/laravel.log`
3. Test API endpoints individually
4. Verify database connectivity

## Changes from Previous Implementation

| Aspect | Old Implementation | New Implementation |
|--------|-------------------|-------------------|
| Backend | Basic PHP router | Full Laravel 10 framework |
| API | Hardcoded responses | Database-backed with Eloquent ORM |
| Admin Panel | Not implemented | FilamentPHP 3.3 ready |
| Routing | Manual routing | Laravel routing with middleware |
| Database | Simulated | Real MySQL with migrations |
| CORS | Headers in PHP | Laravel CORS middleware |
| File Structure | Simple | Laravel standard structure |
| Reverse Proxy | Not configured | Nginx with custom domains |

## Next Steps

1. **Create FilamentPHP Resources** for managing Projects through admin panel
2. **Add Authentication** using Laravel Sanctum for API security
3. **Implement File Management** for PDF uploads with proper storage
4. **Add API Documentation** using tools like Scribe or L5 Swagger
5. **Setup Testing** using PHPUnit for API endpoint testing
6. **Configure Queue System** for long-running tasks (if needed)
7. **Add Logging** and monitoring for production
