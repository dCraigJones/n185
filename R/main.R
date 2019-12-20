# Standard JEA Colors
JEA.Dark <- rgb(t(matrix(c(20, 43, 108)/255)))
JEA.Blue <- rgb(t(matrix(c(0, 106, 151)/255)))
JEA.Green <- rgb(t(matrix(c(65, 173, 73)/255)))
JEA.Orange <- rgb(t(matrix(c(244, 199, 33)/255)))
JEA.Grey <- rgb(t(matrix(c(109, 110, 113)/255)))
JEA.Grey <- rgb(109/255, 110/255, 113/255, 0.5)

#ff_info <- NULL


#' Provides a framework for N^1.85 logarithmic graph based on NFPA 291 recommendations.
#'
#' @param MaxFlow Maximum Flow in GPM
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
n185 <- function(MaxFlow=5000) {
  ff_info <<- NULL

  Q <- seq(MaxFlow/10,MaxFlow,MaxFlow/10)
  plot(0,0, xaxt="n", yaxt="n",type="l", xaxs="i", yaxs="i", xlab="", ylab="", ylim=c(0,100), xlim=c(0,(MaxFlow)^1.85))

  # Grid Lines
  abline(h=seq(0,100,10), v=seq(MaxFlow/10,MaxFlow,MaxFlow/20)^1.85, col="gray75")

  # Axis labels
  axis(1,at=Q^1.85,labels=prettyNum(Q, big.mark=","), line=0, col.axis="black", cex.axis=0.75)
  axis(2, at=seq(0,100,10), labels=seq(0,100,10), col.axis="black", cex.axis=0.75, line=0, tick=F)

  # Tick marks
  axis(1,at=(seq(100*MaxFlow,1000*MaxFlow,10*MaxFlow)/1000)^1.85,labels=NA, tck=0.02)
  axis(1,at=(seq(100*MaxFlow,990*MaxFlow,5*MaxFlow)/1000)^1.85,labels=NA, tck=0.01)
  axis(3,at=(seq(100*MaxFlow,1000*MaxFlow,10*MaxFlow)/1000)^1.85,labels=NA, tck=0.02)
  axis(3,at=(seq(100*MaxFlow,990*MaxFlow,5*MaxFlow)/1000)^1.85,labels=NA, tck=0.01)

  axis(2,at=seq(0,100,5), labels=NA, tck=-0.02)
  axis(2,at=seq(0,100,1), labels=NA, tck=-0.01)
  axis(4,at=seq(0,100,5), labels=NA, tck=0.02)
  axis(4,at=seq(0,100,1), labels=NA, tck=0.01)

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
#'
#' @examples
#' #' n185()
#'
#' a <- ff(60,3000,20, "first")
#' b <- ff(50,2750, 35, "second")
#'
#' draw(a, "red", 1)
#' draw(b, "blue", 2)
#'
#' draw_legend()
ff <- function(Ps, Qt, Pt, ID="") {
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

#' Title
#'
#' @param fireflow
#' @param static
#'
#' @return
#' @export
#'
#' @examples
#' n185()
#'
#' a <- ff(55, 4500, 50)
#'
#' draw(a)
#'
#' b <- shift(a, 40)
#'
#' draw(b, "grey50", 2)
shift <- function(fireflow, static) {
  fireflow[1] <- static

  return(fireflow)
}

tilt <- function(fireflow, friction_factor) {
  fireflow[2] <- unlist(fireflow[2])+friction_factor

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

ke <- function(D,C=130){return(10.44/C^1.85/D^4.87/2.31)}

# enter just Q, just P, or both
pt <- function(Qt=NULL, Pt=NULL, fireflow=NULL, color="black"){
  if(is.null(Qt)) Qt <- unname(aff(fireflow, Pt))
  if(is.null(Pt)) Pt <- unname(nff(fireflow, Qt))

  points(Qt^1.85,Pt, pch=21, bg="white", col=color, lwd=2, cex=1.5)
}

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
