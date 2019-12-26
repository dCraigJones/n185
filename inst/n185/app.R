library("shiny")
library("shinythemes")
library("colourpicker")

source("def.R")

ui <- fluidPage(theme=shinythemes::shinytheme("united"),
   sidebarLayout(

     sidebarPanel(

         HTML("<h3>Fireflow Instance:</h3>")
       , numericInput("ff_static", "Static", 0)

       , div(style="display:inline-block;vertical-align:top;", fluidRow(
            column(6, numericInput("ff_flow", "Flow", 0) ),
            column(6, numericInput("ff_residual", "Residual", 0) )
       )) #div

       , textInput("ff_id", "Fireflow Identifier", "")

       , div(style="display:inline-block;vertical-align:top;", fluidRow(
            column(6, colourpicker::colourInput("ff_color", "Line Color", "black") ),
            column(6, selectInput("ff_linetype", "Line Type", r_lty) )
       )) #div
       , br()
       , div(style="display:inline-block;vertical-align:top;", fluidRow(
            column(5, actionButton("ff_draw", "Draw") ),
            column(5, actionButton("ff_clear", "Clear") )
       )) #div

       , hr()

       , HTML("<h3>Graph Properties:</h3>")
       , textInput("title", "Title")
       , selectInput("legend", "Legend", r_legend)
       , checkboxInput("date", "Add Date")
       , checkboxInput("cya", "Add Provision")
       , br()
       , div(style="display:inline-block;vertical-align:top;", fluidRow(
           column(5, actionButton("draw", "Update") ),
           column(5, actionButton("clear", "Clear") )
       )) #div

       , hr()
       , HTML("<h3>Adjust Scale:</h3>")
       , sliderInput("max_flow", "Maximum Flow", 0,10000,5000, 1000)
       , sliderInput("max_psi", "Maximum Pressure", 0,100,100, 10)


     ), # sidebarPanel

     mainPanel(

         plotOutput("main_plot")
       , tableOutput("main_table")

     )

   ) # sidebarLayout

)

server <- function(input, output, session) {

  output$main_plot <- renderPlot( n185() )

  output$main_table <- renderTable( ff_info )

}

shinyApp(ui, server)
