# Polygon Mode User Guide

## Overview
The Cut Line tool now uses a polygon drawing mode similar to Adobe Photoshop's polygon tool. This allows you to create precise, closed shapes by clicking to add points.

## How to Use Polygon Mode

### Starting a Polygon
1. Click the "Cut Line (Polygon)" button in the toolbar
2. Click on the canvas to place the first point (shown as a yellow circle)
3. Move your mouse to see a preview of the line
4. Click again to add the second point (shown as a green circle)
5. Continue clicking to add more points

### Visual Feedback
- **First Point**: Displayed as a larger yellow circle - this is where you'll close the polygon
- **Subsequent Points**: Displayed as smaller green circles
- **Preview Line**: Red line shows the current shape as you draw
- **Hover Line**: The line from the last point follows your cursor

### Closing the Polygon
You have three options to close the polygon:

1. **Click Near Start**: Click near the first point (yellow circle) - if you're within 15 pixels, the polygon automatically closes
2. **Press Enter**: Press the Enter key to close the polygon at any time (minimum 3 points required)
3. **Press Escape**: Press the Escape key to cancel the current polygon

### Requirements
- Minimum 3 points (6 coordinates) required to create a valid polygon
- The polygon is automatically closed, connecting the last point back to the first point
- All cut lines are guaranteed to be closed/completed

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Complete and close the current polygon |
| `Escape` | Cancel the current polygon drawing |

## Tips

1. **Precise Placement**: Click carefully to place each point exactly where you want it
2. **Closing Indicator**: The first point (yellow) is larger to help you identify where to close
3. **Preview**: Watch the red preview line to see how your shape will look
4. **Undo**: If you make a mistake, press Escape and start over
5. **Complex Shapes**: You can create complex shapes with as many points as needed

## Examples

### Drawing a Simple Rectangle
1. Click "Cut Line (Polygon)"
2. Click at top-left corner
3. Click at top-right corner
4. Click at bottom-right corner
5. Click at bottom-left corner
6. Click near the first point (or press Enter)

### Drawing a Custom Shape
1. Click "Cut Line (Polygon)"
2. Click to trace the outline of your desired shape
3. Add as many points as needed for curves or complex edges
4. Close by clicking near the first point or pressing Enter

## Other Drawing Modes

- **Crease**: Free-form drawing (click and drag)
- **Perforation**: Free-form drawing (click and drag)
- **Emboss**: Free-form drawing (click and drag)

Only the Cut Line tool uses polygon mode to ensure all cut lines are properly closed.
