# n185

## Overview
Creates n<sup>1.85</sup> logarithmic graphs based on NFPA 291 recommendations.  Additional verbs, such as `tilt()` and `shift()`, are provided to aid analysis, in addition to common utility functions, such as `aff()` to calculate available fireflow at 20 PSI.

## Installation
```
install.packages("devtools")
devtools::install_github("dCraigJones/n185")
```
	
## Usage

Typical usage is to create a blank graph template using the `n185()` command, then add fireflow objects to the graph template with the `draw()` command.  Fireflow objects are defined by specifying the fireflow test results with the `ff()`.  

For example,
```
# Fireflow test results defined as
# Static, Test Flow, Test Residual
a <- ff(60, 3000, 20)

# Create a blank graph template
n185()

# Add the fireflow object to the template
draw(a)
```
![basic n185](/fig/basic_n185.jpeg?raw=true)


The `n185_ui()` function simplifies fireflow plots with a graphical interface that can:
- create fireflow objects, 
- define graphical parameters (such as color and line type)
- specify graph information, such as title and date
- automatically populate legend at a user-defined location
- refine x-axis and y-axis boundary
- export to clipboard or save by right-clicking the graphic

![ui example](/fig/ui_example.jpg?raw=true)

### Utility Functions

#### `aff()`

Available Fireflow calculates the flow at the minimum allowable pressure (typically 20 PSI) using the fireflow object.

```
# Define a fireflow object and the available fire flow
a <- ff(60, 3000, 20)
aff(a)

# Default minimum allowable pressure is 20 PSI
# However, other pressures can be defined.
aff(a, 35)
```

#### `nff()`

Needed Fireflow calculated the minimum allowable pressure for the required fireflow.  It is useful when checking the available pressure at the connection point (or supply curve) of fireflow calcuations.

```
# Define a fireflow object
a <- ff(60, 3000, 20)

# Required fireflow must be specified
nff(a, 1500)
```

#### `kp()`

Defines the unit friction slope per linear foot of pipeline in PSI.  It provides a general function to calculate Hazen-Williams headloss for arbitrary pipe lengths.

```
# Friction slope in 1 miles (5280 ft) of 12-inch pipe
k <- 5280*kp(12)

# Corresponding Headloss at 2000 GPM
k*2000^1.85

# default friction factor (C value) is 130
# other values can be passed to the function
k <- 5280*kp(12, 100)
k*2000^1.85
```


### Verbs

#### `tilt()`

Tilt is used with `kp()` when translating fireflow test results to a location further downstream.

```
# intitialize n185 graph template
n185()

# define fireflow object and draw to graph template
a <- ff(60, 3000, 20)
draw(a)

# calculate friciton factor to downstream location
k <- 5280*kp(12)
b <- tilt(a, k)

# draw new fireflow
draw(b, "grey50", 2)
```

#### `shift()`
Shift is used to translate fireflow results to a different static condition.  It is used to correct for changes in elevation or to account to variations in static pressure.

```
# intitialize n185 graph template
n185()

# define fireflow object and draw to graph template
a <- ff(60, 3000, 20)
draw(a)

# translate fireflow to a new static condition
b <- shift(a, 40)

# draw new fireflow
draw(b, "grey50", 2)
```

## Example Workflow

Assumed that two field tests are conducted on the same water main.  

The first test is on Hydrant Asset ID FH-1523.  The second test is 3,218 LF downstream on the same 12-inch water main at Hydrant Asset ID FH-1680.

```
# Create Graph Template with User-Defined axis
n185(5000, 60)

# Create Fireflow Object from field tests
a <- ff(58, 2731, 35, "Asset FH-1523")
b <- ff(53, 1243, 43, "Asset FH-1680")

# Graph fireflow results
draw(a, "blue")
draw(b, "grey15")
```

The model results and field test can be confirmed by adding the headloss from 3,218 LF of 12-inch pipeline and adjusting for elevation differences

```
# Translate Fireflow from FH-1523 to the location of FH-1680
# (asterisk notates modified fireflow)
k <- 3218*kp(12)			# Calculate friction slope
a_12 <- tilt(a, k)			# Add headloss
a_12 <- shift(a_12, 54)		# Adjust for Elevation

# Graph Results
draw(a_12, "blue", 2)
```

Based on the engineer's fireflow calculations 35 PSI at 2,000 GPM is required at FH-1680.  Back-out the headloss from 12-inch pipe and re-apply using a 16-inch

```
# Check available pressure at Needed Fire Flow
nff(b, 2000)

# Remove headloss from 12-inch piping
a_16 <- tilt(b, -k)

# Add headloss from 16-inch piping
k <- 3218*kp(16)
a_16 <- tilt(a_16, k)

# Check available pressure at Needed Fire Flow
nff(a_16, 2000)

# Graph Results
draw(a_16, "grey15", 2)

# Draw a point to highlight the fireflow supply point
pt(2000,,a_16, "grey15")

```

Fireflow objects are stored with the `draw()` and `n185()` commands.  They can be displayed on a legend by `draw_legend()` command.  Other information can be added to the graph using BASE graphics, such as title and abline.

```
# Automatically add legend to the graph
# default position in "topright"
draw_legend()

# Add a title
title("Fireflow Test Results")

# Add contact info
title(sub="For more information contact: FireFlow@ABC-Engineering.com")

# Draw a line to indicated the minimum allowable pressure
abline(h=20, col="red")
```

![workflow](/fig/workflow.jpeg?raw=true)


