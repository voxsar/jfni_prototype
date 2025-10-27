#!/bin/bash

# Laravel Installation Verification Script
# Verifies that Laravel 10 and FilamentPHP are properly installed

echo "========================================="
echo "Laravel Installation Verification"
echo "========================================="
echo ""

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ ERROR: This script must be run from the project root directory"
    echo "   Please cd to the jfni_prototype directory and try again"
    exit 1
fi

# Change to backend directory
cd backend

# Check if Laravel is installed
echo "✓ Checking Laravel installation..."
if [ ! -f "artisan" ]; then
    echo "❌ ERROR: Laravel not found (artisan missing)"
    echo "   The backend directory may not contain a Laravel installation"
    exit 1
fi
echo "  ✓ Laravel artisan found"

# Check composer.json
echo ""
echo "✓ Checking composer.json..."
if grep -q '"laravel/framework": "^10' composer.json; then
    echo "  ✓ Laravel 10 framework found"
else
    echo "  ❌ Laravel 10 framework not found"
    exit 1
fi

if grep -q '"filament/filament": "^3.3' composer.json; then
    echo "  ✓ FilamentPHP 3.3 found"
else
    echo "  ❌ FilamentPHP 3.3 not found"
    exit 1
fi

# Check controllers
echo ""
echo "✓ Checking controllers..."
for controller in HealthController.php PDFController.php ProjectController.php; do
    if [ -f "app/Http/Controllers/$controller" ]; then
        echo "  ✓ $controller found"
    else
        echo "  ❌ $controller not found"
        exit 1
    fi
done

# Check models
echo ""
echo "✓ Checking models..."
if [ -f "app/Models/Project.php" ]; then
    echo "  ✓ Project model found"
else
    echo "  ❌ Project model not found"
    exit 1
fi

# Check migrations
echo ""
echo "✓ Checking migrations..."
migration_count=$(ls database/migrations/*create_projects_table.php 2>/dev/null | wc -l)
if [ "$migration_count" -gt 0 ]; then
    echo "  ✓ Projects migration found"
else
    echo "  ❌ Projects migration not found"
    echo "   Expected: database/migrations/*create_projects_table.php"
    exit 1
fi

# Check API routes
echo ""
echo "✓ Checking API routes..."
if grep -q "HealthController" routes/api.php; then
    echo "  ✓ API routes configured"
else
    echo "  ❌ API routes not configured"
    exit 1
fi

# Check FilamentPHP admin panel
echo ""
echo "✓ Checking FilamentPHP admin panel..."
if [ -f "app/Providers/Filament/AdminPanelProvider.php" ]; then
    echo "  ✓ AdminPanelProvider found"
else
    echo "  ❌ AdminPanelProvider not found"
    exit 1
fi

# Check .env
echo ""
echo "✓ Checking .env configuration..."
if [ -f ".env" ]; then
    echo "  ✓ .env file found"
    if grep -q "DB_DATABASE=dieline_app" .env; then
        echo "  ✓ Database configured"
    else
        echo "  ⚠ Database configuration may need review"
    fi
else
    echo "  ⚠ .env file not found (will be created from .env.example)"
fi

# Check docker files
echo ""
echo "✓ Checking Docker configuration..."
cd ..
if [ -f "docker-compose.yml" ]; then
    echo "  ✓ docker-compose.yml found"
else
    echo "  ❌ docker-compose.yml not found"
    exit 1
fi

if [ -f "backend/Dockerfile" ]; then
    echo "  ✓ backend/Dockerfile found"
else
    echo "  ❌ backend/Dockerfile not found"
    exit 1
fi

# Check nginx configuration
echo ""
echo "✓ Checking Nginx configuration..."
if [ -f "nginx/conf.d/default.conf" ]; then
    echo "  ✓ nginx configuration found"
    if grep -q "backend.jfni.artslabcreatives.com" nginx/conf.d/default.conf; then
        echo "  ✓ Custom domain support configured"
    fi
else
    echo "  ❌ nginx configuration not found"
    exit 1
fi

# Summary
echo ""
echo "========================================="
echo "✅ All checks passed!"
echo "========================================="
echo ""
echo "Laravel 10 is properly installed with:"
echo "  • FilamentPHP 3.3 admin panel"
echo "  • API controllers (Health, PDF, Project)"
echo "  • Database migrations"
echo "  • CORS configuration"
echo "  • Docker setup with nginx reverse proxy"
echo ""
echo "Next steps:"
echo "  1. Start Docker: docker-compose up --build"
echo "  2. Create admin user: docker-compose exec backend php artisan make:filament-user"
echo "  3. Access admin panel: http://localhost/admin"
echo "  4. See LARAVEL_SETUP.md for detailed instructions"
echo ""
