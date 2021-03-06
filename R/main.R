# # Standard JEA Colors
# JEA.Dark <- rgb(t(matrix(c(20, 43, 108)/255)))
# JEA.Blue <- rgb(t(matrix(c(0, 106, 151)/255)))
# JEA.Green <- rgb(t(matrix(c(65, 173, 73)/255)))
# JEA.Orange <- rgb(t(matrix(c(244, 199, 33)/255)))
# JEA.Grey <- rgb(t(matrix(c(109, 110, 113)/255)))
# JEA.Grey <- rgb(109/255, 110/255, 113/255, 0.5)

#ff_info <- NULL


#' Create a new n185 plot.
#'
#' Provides a framework for \out{n<sup>1.85</sup>} logarithmic graph based on NFPA 291 recommendations.
#'
#' @param MaxFlow Maximum Flow in GPM for x-axis
#' @param MaxPressure Maximum Pressure in PSI for y-axis
#'
#' @return framework for drawing fireflow objects
#' @export
#'
#' @examples
#' n185()
#'
#' a <- ff(60,3000,20)
#'
#' draw(a)
n185 <- function(MaxFlow=5000, MaxPressure=100) {
  #### error checking ####
  if ((MaxFlow<=0)|(MaxPressure<=0)) {
    stop("Must use a non-negative integer.")
  }

  if( !MaxFlow==trunc(MaxFlow)) {
      MaxFlow <- trunc(MaxFlow)
      message("Maximum flow truncated to integer.")
  }

  if( !MaxPressure==trunc(MaxPressure)) {
    MaxPressure <- trunc(MaxPressure)
    message("Maximum pressure truncated to integer.")
  }


  #### main body ####
  ff_info <<- NULL

  Q <- seq(MaxFlow/10,MaxFlow,MaxFlow/10)

  plot(0,0
       , xaxt="n"
       , yaxt="n"
       , type="l"
       , xaxs="i"
       , yaxs="i"
       , xlab=""
       , ylab=""
       , ylim=c(0, MaxPressure)
       , xlim=c(0,(MaxFlow)^1.85))

  # Grid Lines
  abline(h=seq(0,MaxPressure,10), v=seq(MaxFlow/10,MaxFlow,MaxFlow/20)^1.85, col="gray75")

  # Axis labels
  axis(1,at=Q^1.85,labels=prettyNum(Q, big.mark=","), line=0, col.axis="black", cex.axis=0.75)
  axis(2, at=seq(0,MaxPressure,10), labels=seq(0,MaxPressure,10), col.axis="black", cex.axis=0.75, line=0, tick=F)

  # Tick marks
  axis(1,at=(seq(100*MaxFlow,1000*MaxFlow,10*MaxFlow)/1000)^1.85,labels=NA, tck=0.02)
  axis(1,at=(seq(400*MaxFlow,990*MaxFlow,5*MaxFlow)/1000)^1.85,labels=NA, tck=0.01)
  axis(3,at=(seq(100*MaxFlow,1000*MaxFlow,10*MaxFlow)/1000)^1.85,labels=NA, tck=0.02)
  axis(3,at=(seq(400*MaxFlow,990*MaxFlow,5*MaxFlow)/1000)^1.85,labels=NA, tck=0.01)

  axis(2,at=seq(0,MaxPressure,5), labels=NA, tck=-0.02)
  axis(2,at=seq(0,MaxPressure,1), labels=NA, tck=-0.01)
  axis(4,at=seq(0,MaxPressure,5), labels=NA, tck=0.02)
  axis(4,at=seq(0,MaxPressure,1), labels=NA, tck=0.01)

  # Axis Title
  mtext("Flow (GPM)", side=1, line=3, cex=0.9, family="serif")
  mtext("Head (PSI)", side=2, line=3, cex=0.9, family="serif")

  box(lwd=2)

}

#' Draws Fireflow Objects
#'
#' @param fireflow fireflow object defined using ff function.
#' @param color A specification for the default plotting color. See section ‘Color Specification’.
#' @param LineType The line type. Line types can either be specified as an integer (0=blank, 1=solid (default), 2=dashed, 3=dotted, 4=dotdash, 5=longdash, 6=twodash)
#' @export
#'
#' @seealso
#' \code{\link{ff}}
#' \code{\link{tilt}}
#' \code{\link{shift}}
#'
#' @examples
#' n185()
#'
#' a <- ff(60,3000,20, "first")
#' b <- ff(50,2750, 35, "second")
#'
#' draw(a, "red", 1)
#' draw(b, "blue", 2)
#'
#' draw_legend()
draw <- function(fireflow, color="black", LineType=1) {

  #### Error Checking ####
  if(!exists("ff_info")) { stop("Must call n185() before draw()") }


  #### Main Body ####
  tmp <- fireflow
  tmp$color <- color
  tmp$linetype <- LineType

  ff_info <<- rbind(ff_info, tmp)


  Ps <- unlist(fireflow[1])
  k <- unlist(fireflow[2])

  Qi <- seq(0,10000,1000)
  Pi <- Ps - k*Qi^1.85

  lines(Qi^1.85,Pi, col=color, lwd=2, lty=LineType)

}

#' Creates a fire flow supply curve based on a single hydrant test per NFPA 291 Recommended Practice for Fire Flow Testing
#'
#' @param Ps Static Pressure from Field Fire Flow Test, in PSI
#' @param Qt Test Flow from Field Fire Flow Test, in GPM
#' @param Pt Test Residual from Field Fire Flow Test, in GPM
#' @param ID Unique name for Field Fire Flow Test (used for legend)
#'
#' @return FireFlow Object
#' @export
#'
#' @seealso [tilt] , shift
#'
#' @examples
#' n185()
#'
#' a <- ff(60,3000,20, "first")
#' b <- ff(50,2750, 35, "second")
#'
#' draw(a, "red", 1)
#' draw(b, "blue", 2)
#'
#' draw_legend()
ff <- function(Ps, Qt, Pt, ID="") {
  #### Error Checking ####

  # Convert numeric-type string input to numeric...
  Ps <- suppressWarnings(as.numeric(Ps))
  Qt <- suppressWarnings(as.numeric(Qt))
  Pt <- suppressWarnings(as.numeric(Pt))

  # ... return warning if input is non-numeric.
  if(is.na(Ps)|is.na(Qt)|is.na(Pt)) { stop("Numerical inputs required.") }

  # Check for negative input values
  if (Ps <= 0) stop("Static must be greater than 0.")
  if (Qt <= 0) stop("Test Flow must be greater than 0.")
  if (Pt <= 0) stop("Test Residual must be greater than 0.")

  # Check Input for unreasonable values
  if (Ps > 100) warning("Static is greater than 100 PSI.  This may be unreasonable.")
  if (Pt < 20) warning("Test Residual is less than 20 PSI.  This may be unreasonable.")
  if (Ps <= Pt) stop("Static pressure must be greater than residual pressure.")

  if (!class(ID)=="character") stop("Fireflow ID must be a character/string.")

  #### Main Body ####

  k_psi <- (Ps-Pt)/(Qt^1.85)

  ff <- structure(list(), class="fireflow")
  ff[1] <- Ps
  ff[2] <- k_psi
  ff[3] <- Qt
  ff[4] <- Pt
  ff[5] <- ID
  names(ff) <- c("Static", "k", "Test_Flow", "Test_Residual", "ID")


  return(ff)
}

#' Shift FireFlow Static Head
#'
#' @param fireflow fireflow object, defined using ff()
#' @param static proposed static head, in PSI
#'
#' @return FireFlow Object
#' @export
#'
#' @examples
#' n185()
#'
#' a <- ff(55, 4500, 40)
#' draw(a)
#'
#' # assume the same friction loss at a new static head of 40 psi
#' b <- shift(a, 40)
#' draw(b, "grey50", 2)
shift <- function(fireflow, static) {
  fireflow[1] <- static
  fireflow[5] <- paste0(fireflow[5],"*")
  return(fireflow)
}

#' Tilt FireFlow Friction Slope
#'
#' @param fireflow fireflow object, defined using ff()
#' @param friction_slope proposed reduction in friction slope
#'
#' @return FireFlow Object
#' @export
#'
#' @examples
#' n185()
#'
#' a <- ff(55, 4500, 40)
#' draw(a)
#'
#' # add friction loss from 1000 LF of 12-inch pipeline
#' b <- tilt(a, 1000*kp(12))
#' draw(b, "grey50", 2)
tilt <- function(fireflow, friction_slope) {
  fireflow[2] <- unlist(fireflow[2])+friction_slope
  fireflow[3] <- NA
  fireflow[4] <- NA
  fireflow[5] <- paste0(fireflow[5],"*")
  return(fireflow)
}

aff <- function(fireflow, MinPressure=20) {
  S <- unlist(fireflow[1])
  k <- unlist(fireflow[2])

  Q <- ((S-MinPressure)/k)^(1/1.85)
  names(Q) <- "Avail Fireflow (GPM)"
  return(Q)
}

nff <- function(fireflow, Q) {
  Ps <- unlist(fireflow[1])
  k <- unlist(fireflow[2])

  Pi <- Ps - (k)*(Q)^1.85
  names(Pi) <- "Pressure (PSI)"
  return(Pi)

}

#' Unit Friction Slope
#'
#' @param D Pipe diameter in Inches
#' @param C Hazen-Williams friction factor
#'
#' @return k' (numerical) unit friction slope for 1 LF of pipeline (corrected for PSI)
#' @export
#'
#' @examples
#' # friction factor for 5,000 LF of 12-inch pipe
#' k <- 5000*kp(12)
#'
#' # Headloss at 2,000 GPM for 5,000 LF of 12-inch pipe
#' k*2000^1.85
#'
#' #' # friction factor for 5,000 LF of 12-inch pipe at C=100
#' k <- 5000*kp(12, 100)
#'
#' # Headloss at 2,000 GPM for 5,000 LF of 12-inch pipe
#' k*2000^1.85
kp <- function(D,C=130){return(10.44/C^1.85/D^4.87/2.31)}


# enter just Q, just P, or both
#' Draw Fire-Flow Point
#'
#' Test Test Test
#'
#' @param Qt Test Flow to be plotted, in GPM
#' @param Pt Test Residual to be plotted, in GPM
#' @param fireflow fireflow object defined using ff function.
#' @param color A specification for the point plotting color. See section ‘Color Specification’.
#'
#' @export
#'
#' @examples
#' n185()
#'
#' a <- ff(60,3000,20, "first")
#' b <- ff(50,2750, 35, "second")
#'
#' draw(a, "red", 1)
#' draw(b, "blue", 2)
#'
#' draw_legend()
#'
#' pt(3000,,a, "red")
#' pt(,20,"blue")
#' pt(2000,20)
pt <- function(Qt=NULL, Pt=NULL, fireflow=NULL, color="black"){
  if(is.null(Qt)) Qt <- unname(aff(fireflow, Pt))
  if(is.null(Pt)) Pt <- unname(nff(fireflow, Qt))

  points(Qt^1.85,Pt, pch=21, bg="white", col=color, lwd=2, cex=1.5)
}

#' Draw Legend
#'
#' @param position keyword for position.  See Details.
#'
#' The location may be specified by setting position to a single keyword from the list "bottomright", "bottom", "bottomleft", "left", "topleft", "top", "topright", "right" and "center". This places the legend on the inside of the plot frame at the given location. Partial argument matching is used.
#'
#' @export
#'
#' @examples
#' n185()
#'
#' a <- ff(60,3000,20, "first")
#' b <- ff(50,2750, 35, "second")
#'
#' draw(a, "red", 1)
#' draw(b, "blue", 2)
#'
#' draw_legend()
draw_legend <- function(position="topright") {

  legend(position
         , unname(unlist(ff_info[,"ID"]))
         , lwd=rep(2,nrow(ff_info))
         , lty=unname(unlist(ff_info[,"linetype"]))
         , col=unname(unlist(ff_info[,"color"]))
         , inset=c(0.05,0.05)
         , seg.len = 4
         #, pch=PointSymbol
         , cex=0.8
         , y.intersp=0.8
         , bty = "n"
         , box.col=rgb(1,1,1,0.75)
         , bg=rgb(1,1,1,0.75)
         , horiz=FALSE
         , text.font=2
  )
}

#' Graphic User-Interface for n185
#'
#' @export
#'
#' @examples
#' n185_ui()
n185_ui <- function() { library(shiny); shiny::runApp("./inst/n185") }
