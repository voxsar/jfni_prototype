# Crease Line Testing Guide

## Quick Test

To verify the crease line functionality works correctly:

### 1. Start the Development Server
```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3002` (or 3003 if 3002 is in use)

### 2. Draw a Simple Test Case

**A. Create a Square Cutline:**
1. Click the "✂️ Cut Line" button
2. Click 4 points to form a square (e.g., 200x200 pixels)
3. Click near the first point (yellow marker) to close the polygon
4. You should see a red square outline

**B. Add a Crease Line:**
1. Click the "📏 Crease" button
2. Draw a horizontal line from left edge to right edge through the middle
3. You should see a blue dashed line
4. The crease should snap to the cutline edges

**C. Compile and Build:**
1. Open the "🎨 3D" dropdown menu
2. Click "⚙️ Compile Geometry"
3. **CHECK**: Status bar should show "Compiled: 2 panels, 1 hinges" ✓
4. Click "🏗️ Build 3D"
5. **CHECK**: 3D view should show 2 separate panels ✓

**D. Test Wireframe Mode:**
1. Open "🎨 3D" dropdown
2. Click "🔲 Toggle Wireframe"
3. **CHECK**: Should see mesh edges/structure ✓

**E. Test Folding:**
1. Click on a panel in 3D view
2. **CHECK**: Panel rotates 45 degrees ✓
3. Click again
4. **CHECK**: Panel rotates to 90 degrees (L-shape) ✓
5. Right-click to fold in opposite direction

## Expected Console Output

When working correctly, you should see:
```
Compiling geometry from annotations...
Cut lines: 1
Crease lines: 1
Splitting polygon at crease lines...
Found 2 intersections for crease line
Split polygon into 2 panels: 6 and 6 vertices
Created 2 panels from crease subdivision
Compiled: 2 panels, 1 hinges
```

## Troubleshooting

**Problem: Status shows "1 panel" instead of "2 panels"**
- Ensure crease line spans full width of square
- Make sure crease connects to cutline at both ends
- Try redrawing more precisely

**Problem: Cannot see panels in 3D**
- Check browser console (F12) for errors
- Make sure you clicked "Build 3D" after "Compile Geometry"
- Try refreshing and starting over

**Problem: Clicking doesn't rotate panels**
- Click directly on the panel meshes
- Check console for JavaScript errors
- Try clicking different areas of the panel

## Test with PDFs

After verifying basic functionality:

1. Load `dielinebox.pdf` or `complex_dieline.pdf` from repository root
2. Use Auto-Detect Lines to find cut lines
3. Manually add crease lines where you want folds
4. Compile and build 3D
5. Verify panels fold at crease locations

## Success Criteria

✅ Crease lines connect to cut lines (snapping works)
✅ Geometry compilation creates multiple panels (not 1 merged panel)
✅ 3D view shows separate panel meshes
✅ Wireframe mode displays mesh structure
✅ Clicking panels rotates them by 45° increments
✅ Panels form L-shape when folded to 90 degrees

## Technical Documentation

See `CREASE_IMPLEMENTATION.md` for detailed technical information about:
- Algorithm implementation
- Code changes
- Future improvements
- API documentation
