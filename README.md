# n185

Overview
	<<Brief Description>>

Installation
```
install.packages("devtools")
devtools::install_github("dCraigJones/n185")
```
	
Usage

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
![basic n185]("fig/basic_n185.jpg")


...

<<ui example>>
