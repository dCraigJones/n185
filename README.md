# n185

## Overview
Creates n<sup>1.85</sup> logarithmic graphs based on NFPA 291 recommendations.  Additional verbs, such as `tilt()` and `shift()`, are provided to aid analysis, in addition to common utility functions, such as `aff()` to calculate available fireflow at 20 PSI.

## Insallation
```
install.packages("devtools")
devtools::install_github("dCraigJones/n185")
```
	
## Usage

Typical usage is to create a blank n185 graph template using the `n185()` command, then add fireflow objects to the graph template with the `draw()` command.  Fireflow objects are defined by specifying the fireflow test results with the `ff()`.  

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

## Analysis
