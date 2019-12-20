use_package("shiny")
use_package("shinythemes")
use_package("colourpicker")

source("def.R")

ui <- fluidPage(theme=shinythemes::shinytheme("united"),
   sidebarLayout(

     sidebarPanel(

         numericInput("static", "Static", 0)
       , numericInput("flow", "Test Flow", 0)
       , numericInput("residual", "Test Residual", 0)
       , colourpicker::colourInput("color", "fill", "black")
       , selectInput("linetype", "Line Type", r_lty)
       , actionButton("add", "Add")
       , hr()
       , sliderInput("max_flow", "Maximum Flow", 0,10000,5000, 1000)
       , hr()
       , textInput("title", "Title")
       , selectInput("legend", "Legend", r_legend)
       , checkboxInput("date", "Add Date")
       , checkboxInput("cya", "Add Provision")
       , actionButton("update", "Update")


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
