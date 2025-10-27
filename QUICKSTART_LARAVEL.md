# Quick Start Guide - Laravel Implementation

This guide will get you up and running with the new Laravel 10 + FilamentPHP setup in 5 minutes.

## Prerequisites

- Docker and Docker Compose installed
- (Optional) For custom domains: ability to edit hosts file

## Step 1: Clone and Verify (30 seconds)

```bash
git clone https://github.com/voxsar/jfni_prototype.git
cd jfni_prototype
./verify-laravel.sh
```

You should see "✅ All checks passed!"

## Step 2: Start Services (2-3 minutes)

```bash
docker-compose up --build
# or
docker compose up --build
```

**Wait for all services to start**. You'll see:
- ✓ Database initialized
- ✓ Backend migrations running
- ✓ Frontend Vite server started
- ✓ Nginx proxy ready

## Step 3: Access the Application (immediate)

Open your browser:

### Main Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost/api/health (should show `{"status":"ok"}`)

### Direct Access (bypassing nginx)
- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:3003/api/health

### Admin Panel (FilamentPHP)
- **URL**: http://localhost/admin or http://localhost:3003/admin
- **First time?** You need to create an admin user (Step 4)

## Step 4: Create Admin User (30 seconds)

In a new terminal:

```bash
docker-compose exec backend php artisan make:filament-user
```

Follow the prompts:
- **Name**: Admin
- **Email**: admin@example.com
- **Password**: (choose a secure password)

Then login at http://localhost/admin

## Step 5: Test the Application (1 minute)

### Test Backend API
```bash
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

### Test Frontend
1. Go to http://localhost
2. You should see the Dieline Folding Application interface
3. Try loading a PDF and using the tools

### Test Admin Panel
1. Go to http://localhost/admin
2. Login with the credentials you created
3. You should see the FilamentPHP dashboard

## Optional: Custom Domains

To use custom domains like `backend.jfni.artslabcreatives.com`:

### Linux/Mac
```bash
sudo nano /etc/hosts
```

### Windows (as Administrator)
```
notepad C:\Windows\System32\drivers\etc\hosts
```

Add these lines:
```
127.0.0.1 frontend.jfni.artslabcreatives.com
127.0.0.1 backend.jfni.artslabcreatives.com
```

Save and access:
- http://frontend.jfni.artslabcreatives.com
- http://backend.jfni.artslabcreatives.com/admin

## Stopping the Application

```bash
docker-compose down
# or
docker compose down
```

To remove all data including database:
```bash
docker-compose down -v
```

## Troubleshooting

### "Port already in use"
Another service is using port 80, 3002, or 3003.

**Solution**: Stop the other service or change ports in `docker-compose.yml`

### "Database connection refused"
Database is still starting up.

**Solution**: Wait 30 seconds and try again. Check with `docker-compose logs db`

### "502 Bad Gateway"
Backend is still starting.

**Solution**: Wait a few seconds. Check with `docker-compose logs backend`

### "Cannot connect to backend"
CORS or networking issue.

**Solution**: 
1. Check backend is running: `curl http://localhost:3003/api/health`
2. Check logs: `docker-compose logs backend`
3. Verify CORS in `backend/config/cors.php`

### "Composer install failed"
Volume permission or composer cache issue.

**Solution**:
```bash
docker-compose down
docker-compose up --build
```

## What's Next?

1. **Create FilamentPHP Resources**: See [FILAMENT_SETUP.md](FILAMENT_SETUP.md)
2. **Configure Custom Domains**: See [nginx/README.md](nginx/README.md)
3. **Read Full Documentation**: See [LARAVEL_SETUP.md](LARAVEL_SETUP.md)
4. **Explore the API**: See [README.md](README.md#api-endpoints)

## Common Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Run Laravel commands
docker-compose exec backend php artisan migrate
docker-compose exec backend php artisan tinker
docker-compose exec backend php artisan make:filament-resource ModelName

# Access backend shell
docker-compose exec backend bash

# Rebuild after code changes
docker-compose up --build

# Reset database
docker-compose exec backend php artisan migrate:fresh
```

## Development Workflow

1. **Make changes** to your code
2. **Frontend**: Auto-reloads via Vite HMR
3. **Backend**: Restart container if needed: `docker-compose restart backend`
4. **Database changes**: Run migrations: `docker-compose exec backend php artisan migrate`

## Support

- **Issue with Laravel/FilamentPHP**: Check [LARAVEL_SETUP.md](LARAVEL_SETUP.md)
- **Issue with Nginx**: Check [nginx/README.md](nginx/README.md)  
- **General issues**: Check [README.md](README.md)
- **FilamentPHP resources**: Check [FILAMENT_SETUP.md](FILAMENT_SETUP.md)

## Success! 🎉

If you've reached this point, you have:
- ✅ Laravel 10 running with all features
- ✅ FilamentPHP 3.3 admin panel ready
- ✅ API endpoints working
- ✅ Frontend connected to backend
- ✅ Database configured and migrated
- ✅ Nginx reverse proxy set up

You're ready to start developing!
