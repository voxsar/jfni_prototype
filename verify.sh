#!/bin/bash

# Verification script for Dieline Folding App

echo "========================================"
echo "Dieline Folding App - Verification"
echo "========================================"
echo ""

ERRORS=0

# Check if required files exist
echo "1. Checking file structure..."

required_files=(
    "docker-compose.yml"
    "frontend/package.json"
    "frontend/index.html"
    "frontend/src/main.js"
    "backend/public/index.php"
    "backend/routes/api.php"
    "README.md"
    "QUICKSTART.md"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file NOT FOUND"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "2. Checking frontend modules..."

modules=(
    "frontend/src/modules/PDFRenderer.js"
    "frontend/src/modules/AnnotationLayer.js"
    "frontend/src/modules/LineDetector.js"
    "frontend/src/modules/GeometryCompiler.js"
    "frontend/src/modules/ThreeScene.js"
    "frontend/src/modules/APIService.js"
)

for module in "${modules[@]}"; do
    if [ -f "$module" ]; then
        echo "  ✓ $module"
    else
        echo "  ✗ $module NOT FOUND"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "3. Checking backend controllers..."

controllers=(
    "backend/app/Http/Controllers/HealthController.php"
    "backend/app/Http/Controllers/PDFController.php"
    "backend/app/Http/Controllers/ProjectController.php"
)

for controller in "${controllers[@]}"; do
    if [ -f "$controller" ]; then
        echo "  ✓ $controller"
    else
        echo "  ✗ $controller NOT FOUND"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "4. Testing backend API..."

# Start backend server
cd backend && php -S localhost:3003 -t public > /tmp/verify_backend.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 3

# Test health endpoint
HEALTH_RESPONSE=$(curl -s http://localhost:3003/api/health)
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo "  ✓ Backend health check: PASSED"
else
    echo "  ✗ Backend health check: FAILED"
    echo "    Response: $HEALTH_RESPONSE"
    ERRORS=$((ERRORS + 1))
fi

# Cleanup
kill $BACKEND_PID 2>/dev/null

echo ""
echo "5. Checking npm dependencies..."

cd frontend
if [ -d "node_modules" ]; then
    echo "  ✓ Frontend dependencies installed"
    
    # Check for key packages
    if [ -d "node_modules/three" ]; then
        echo "  ✓ Three.js installed"
    else
        echo "  ✗ Three.js NOT installed"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ -d "node_modules/pdfjs-dist" ]; then
        echo "  ✓ pdf.js installed"
    else
        echo "  ✗ pdf.js NOT installed"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ -d "node_modules/konva" ]; then
        echo "  ✓ Konva installed"
    else
        echo "  ✗ Konva NOT installed"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ -d "node_modules/gsap" ]; then
        echo "  ✓ GSAP installed"
    else
        echo "  ✗ GSAP NOT installed"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "  ! Frontend dependencies not installed (run: cd frontend && npm install)"
fi
cd ..

echo ""
echo "6. Checking Docker configuration..."

if [ -f "docker-compose.yml" ]; then
    if grep -q "frontend:" docker-compose.yml && \
       grep -q "backend:" docker-compose.yml && \
       grep -q "db:" docker-compose.yml; then
        echo "  ✓ Docker services configured"
    else
        echo "  ✗ Docker services incomplete"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "3002:3002" docker-compose.yml; then
        echo "  ✓ Frontend port 3002 configured"
    else
        echo "  ✗ Frontend port configuration missing"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "3003:3003" docker-compose.yml; then
        echo "  ✓ Backend port 3003 configured"
    else
        echo "  ✗ Backend port configuration missing"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""
echo "========================================"
echo "Verification Complete"
echo "========================================"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✓ All checks passed! The application is ready to use."
    echo ""
    echo "Next steps:"
    echo "  1. Run: ./setup.sh (for Docker)"
    echo "  OR"
    echo "  2. Run: ./start-dev.sh (for local development)"
    echo ""
    echo "Then access:"
    echo "  Frontend: http://localhost:3002"
    echo "  Backend: http://localhost:3003/api/health"
    exit 0
else
    echo "✗ Found $ERRORS error(s). Please fix them before running the app."
    exit 1
fi
