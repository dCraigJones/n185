# n185 Fire Flow Analysis Web Application

A standalone, offline-capable web application for analyzing fire flow test results per NFPA 291 standards.

## Features

### Fire Flow Test Management
- **Add/Edit/Delete Tests** - Manage multiple fire flow tests with ease
- **Test Categorization** - Organize tests as Field Tests, Model Results, or Scenarios
- **Visibility Toggle** - Show/hide individual tests on the graph
- **Duplicate Tests** - Quickly create copies for what-if analysis

### n^1.85 Logarithmic Graph
- **NFPA 291 Standard** - Accurate logarithmic graph matching industry standards
- **Custom Scaling** - Adjust max flow and pressure for your specific needs
- **Interactive Tooltips** - Hover over graph to see flow and pressure values
- **High-Quality Export** - Export to PNG or JPG for reports

### Modeling & Analysis
- **Tilt (Friction Adjustment)** - Add or remove pipe friction loss
  - Specify pipe length, diameter, and C-value
  - Model upstream or downstream scenarios

- **Shift (Static Adjustment)** - Adjust for elevation or static pressure changes
  - Direct static pressure input
  - Automatic elevation conversion (0.433 PSI/ft)

- **What-If Scenarios** - Compare multiple pipe sizes simultaneously
  - Generate multiple scenarios with one click
  - Color-coded for easy comparison

### Live Calculations
- **Available Fire Flow (AFF)** - at 20, 30, and 40 PSI
- **Needed Fire Flow (NFF)** - pressure at common flow rates
- **Friction Coefficient** - k value for each test
- **Real-time Updates** - Calculations update as you select tests

### Project Management
- **Save Projects** - Save complete sessions as .n185 files
- **Load Projects** - Resume work from saved files
- **Offline Capable** - Works without internet connection
- **All Data Preserved** - Tests, modeling parameters, and graph settings

## How to Use

### Getting Started
1. Open `index.html` in a web browser (Chrome, Firefox, Safari, Edge)
2. No installation or internet connection required

### Basic Workflow

#### 1. Add a Fire Flow Test
- Enter test ID (e.g., "FH-1523")
- Input Static Pressure (PSI)
- Input Test Flow (GPM)
- Input Test Residual (PSI)
- Choose color and line type
- Click "Add Test"

#### 2. View and Manage Tests
- Tests appear in the left panel
- Click to select and view calculations
- Click 👁️ to toggle visibility
- Click 📋 to duplicate
- Click 🗑️ to delete

#### 3. Apply Transformations
Select a test, then use the modeling tools:

**Tilt Example:**
- Length: 3218 feet
- Diameter: 12 inches
- C-value: 130
- Operation: Add friction (downstream)
- Creates a new test showing conditions downstream

**Shift Example:**
- Elevation Change: 23 feet (higher)
- Automatically adjusts static pressure (-9.96 PSI)

**What-If Example:**
- Length: 1000 feet
- Sizes: 12, 16, 20
- Creates 3 scenarios for comparison

#### 4. Customize Graph
- Set title and toggle date display
- Adjust max flow and pressure ranges
- Tests automatically redraw

#### 5. Export Results
- **Export PNG/JPG** - Save graph as high-resolution image
- **Save Project** - Save complete session for later

## File Structure

```
n185-webapp/
├── index.html              # Main application page
├── css/
│   ├── main.css           # Application styling
│   └── panels.css         # Multi-panel layout
├── js/
│   ├── fireflow.js        # Core math engine (FF, kp, tilt, shift)
│   ├── canvas-graph.js    # n^1.85 graph renderer
│   ├── test-manager.js    # Test CRUD operations
│   ├── calculations.js    # Live calculations display
│   ├── modeling.js        # Tilt/shift/what-if UI
│   ├── project-io.js      # Save/load functionality
│   └── app.js             # Main application coordinator
├── lib/
│   └── FileSaver.js       # File download utility
└── README.md              # This file
```

## Technical Details

### Core Functions (fireflow.js)

#### FireFlow Class
```javascript
// Create a fire flow object
const ff = new FireFlow(Ps, Qt, Pt, ID, options);

// Calculate available fire flow at minimum pressure
ff.aff(minPressure);  // Default 20 PSI

// Calculate pressure at required flow
ff.nff(requiredFlow);

// Create tilted (friction-adjusted) fireflow
ff.tilt(frictionSlope);

// Create shifted (static-adjusted) fireflow
ff.shift(newStatic);
```

#### Hazen-Williams Functions
```javascript
// Unit friction slope (PSI per LF for Q^1.85)
kp(diameter, C);  // Default C = 130

// Pipe headloss
pipeHeadloss(length, diameter, flow, C);

// Elevation conversion
elevationToPressure(feet);  // Returns PSI
pressureToElevation(psi);   // Returns feet
```

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Offline Use
All code and libraries are bundled. No CDN dependencies. Works without internet after first download.

## Examples

### Example 1: Single Test
1. Add test: Static=60, Flow=3000, Residual=20, ID="Test A"
2. View AFF at 20 PSI in calculations panel
3. Export graph as PNG

### Example 2: Comparing Field Test to Model
1. Add field test: Static=58, Flow=2731, Residual=35, ID="FH-1523"
2. Select test and apply tilt:
   - Length: 3218 ft
   - Diameter: 12 in
   - Operation: Add friction
   - ID: "FH-1523 (3218 LF downstream)"
3. Compare both curves on graph

### Example 3: Pipe Upgrade Analysis
1. Add baseline test
2. Select test and use What-If:
   - Length: 5000 ft
   - Sizes: 12, 16, 20, 24
3. Compare all scenarios to see benefit of larger pipe

## Support

For issues, questions, or feature requests, please refer to the main n185 R package repository.

## License

Part of the n185 package ecosystem for fire flow analysis.
