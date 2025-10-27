# Feature Guide: 3D Model Generator Improvements

## Table of Contents
1. [Polygon Mode](#polygon-mode)
2. [Unit System](#unit-system)
3. [Crease Validation](#crease-validation)
4. [Cut-off Area Highlighting](#cut-off-area-highlighting)
5. [Merged Cutlines](#merged-cutlines)
6. [Expand Cutline Tool](#expand-cutline-tool)
7. [Single 3D Plane Generation](#single-3d-plane-generation)

---

## Polygon Mode

### Description
Cut lines now use a click-to-place polygon drawing mode instead of free-form drawing. This ensures all cut lines are properly closed.

### How to Use
1. Select "Cut Line (Polygon)" tool
2. Click to place points on the canvas
3. Close by clicking near the first point OR pressing Enter
4. Press Escape to cancel

### Visual Indicators
- Yellow circle: First point (where to close)
- Green circles: Additional points
- Red preview line: Shows current shape

See [POLYGON_MODE_GUIDE.md](POLYGON_MODE_GUIDE.md) for detailed instructions.

---

## Unit System

### Description
Toggle between inches and centimeters for all measurement operations.

### How to Use
1. Click the "📏 Inches" button in the toolbar
2. Button toggles between "📏 Inches" and "📏 CM"
3. Current unit is displayed on the button
4. Used in expand cutline and other measurement features

### Technical Details
- Inches: 96 pixels per unit (standard DPI)
- Centimeters: 37.8 pixels per unit
- Conversion methods available: `pixelsToUnits()`, `unitsToPixels()`

---

## Crease Validation

### Description
Validates that crease lines connect to cut lines at both ends, as required for proper folding.

### How to Use
1. Draw cut lines using polygon mode
2. Draw crease lines
3. Click "✓ Validate" button to check all creases
4. View validation results in popup

### Visual Indicators
- ⚠️ Warning icon: Appears on invalid crease lines
- Hover over warning icon to see details
- Validation summary shows count of valid/invalid creases

### Validation Rules
- Both ends of crease must be within 10 pixels of a cut line
- Warning displayed if either end doesn't connect
- Automatic validation when adding new crease lines

---

## Cut-off Area Highlighting

### Description
Highlights areas that will be cut off (not appear in final 3D model) with a faint red overlay.

### How to Use
1. Draw your cut lines
2. Click "✂️ Cutoff" button to toggle highlighting
3. Button turns active (blue) when enabled
4. Click again to disable

### Visual Appearance
- Faint red overlay: `rgba(255, 0, 0, 0.1)`
- Covers entire canvas except cut line areas
- Semi-transparent to see PDF underneath

---

## Merged Cutlines

### Description
Multiple cut lines are automatically merged into a single boundary using boolean union operations.

### How it Works
1. **Outer Boundary**: Largest/outermost cutline defines the main shape
2. **Holes**: Inner cutlines become holes in the geometry
3. **Single Panel**: All cutlines merge into one panel definition

### Example Use Cases
- Draw a box cutline, then draw a circle inside = box with circular hole
- Multiple overlapping cutlines = merged into single outer boundary
- Complex shapes with cutouts and perforations

### Technical Details
- Uses bounding polygon algorithm for outer boundary
- Inner polygons stored as holes in panel data
- Generates single merged panel instead of multiple panels

---

## Expand Cutline Tool

### Description
Expands a cutline outward by a specified measurement, maintaining the shape.

### How to Use
1. Right-click on a cut line
2. Select "Expand Cutline..." from context menu
3. Enter expansion value (e.g., "0.5")
4. Value is in current units (inches or cm)
5. Cutline expands outward uniformly

### Algorithm
- Calculates normal vectors for each edge
- Averages normals at each vertex
- Offsets vertices in normal direction
- Preserves shape while expanding size

### Use Cases
- Add bleed to cutlines
- Create margin around shapes
- Adjust sizing after initial drawing

---

## Single 3D Plane Generation

### Description
Generates a single, foldable 3D plane from merged cutlines instead of multiple separate objects.

### How it Works
1. Compile Geometry merges all cutlines
2. Creates single panel with holes
3. Build 3D generates ExtrudeGeometry from shape
4. Result: One cohesive 3D model

### Benefits
- Realistic folding simulation
- Proper representation of die-cut shapes
- Supports complex geometries with holes
- Better for export and manufacturing

### Technical Implementation
- Uses THREE.Shape for polygon definition
- THREE.ExtrudeGeometry for 3D extrusion
- Holes supported via Shape.holes array
- Scaled to fit viewport

---

## Workflow Example

### Complete Die-Cut Workflow
1. **Load PDF**: Import your dieline PDF
2. **Set Units**: Choose inches or cm
3. **Draw Cut Line**: Use polygon mode to trace outer boundary
4. **Draw Holes**: Use polygon mode for any internal cutouts
5. **Add Creases**: Draw crease lines for folds
6. **Validate**: Click validate button to check creases
7. **Adjust**: Use expand cutline if needed
8. **Preview Cutoff**: Toggle cutoff highlight to see what will be removed
9. **Compile**: Click "Compile Geometry"
10. **Build 3D**: Click "Build 3D" to see single merged plane
11. **Load Texture**: Click "Load PDF Texture" to apply graphics
12. **Test Folds**: Click planes to fold by 45° increments
13. **Export**: Click "Export GLB" to save 3D model

---

## Tips and Best Practices

### Drawing Cutlines
- Start with outer boundary first
- Draw holes/cutouts second
- Use at least 4 points for rectangular shapes
- Use more points for curved edges
- Close carefully by clicking near first point

### Crease Lines
- Always draw after cut lines are complete
- Ensure both ends touch a cut line
- Use validate button to check
- Fix invalid creases before compiling

### Measurements
- Set units before using expand cutline
- Use consistent units throughout project
- Standard DPI used for accurate conversion

### 3D Generation
- Compile geometry before building 3D
- Single merged plane is generated automatically
- Check result in 3D view panel
- Use fold controls to test model

---

## Troubleshooting

### Polygon Won't Close
- Make sure you have at least 3 points
- Click within 15 pixels of first point
- Or press Enter to close manually

### Crease Shows Warning
- Check that both ends touch a cut line
- Zoom in to see connection points
- Adjust crease endpoint to connect properly

### 3D Model Looks Wrong
- Verify cut lines are closed
- Check that cutlines don't overlap incorrectly
- Recompile geometry after changes

### Expand Cutline Not Working
- Make sure you right-clicked a cut line
- Enter a valid numeric value
- Check that units are set correctly

---

## Keyboard Shortcuts Reference

| Shortcut | Action | Context |
|----------|--------|---------|
| `Enter` | Close current polygon | Polygon mode active |
| `Escape` | Cancel current polygon | Polygon mode active |
| Right-click | Open context menu | On any line |

---

## Additional Resources

- [Polygon Mode Guide](POLYGON_MODE_GUIDE.md) - Detailed polygon drawing instructions
- [README.md](README.md) - General application documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical architecture details
