# n185

## Overview
Creates n<sup>1.85</sup> logarithmic graphs based on NFPA 291 recommendations.  Additional verbs, such as `tilt()` and `shift()`, are provided to aid analysis, in addition to common utility functions, such as `aff()` to calculate available fireflow at 20 PSI.

## Insallation
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

![ut example](/fig/ui_example.jpg?raw=true)

### Verbs

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
