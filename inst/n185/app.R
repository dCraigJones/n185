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
            column(5, actionButton("ff_reset", "Reset") )
       )) #div
       , div(textOutput("ff_msg"), style="color:red")

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

  clear_fireflow <- function() {

    updateNumericInput(session, "ff_static", value=0)
    updateNumericInput(session, "ff_flow", value=0)
    updateNumericInput(session, "ff_residual", value=0)
    updateTextInput(session, "ff_id", value="")
    updateColourInput(session, "ff_color", value="black")
    updateSelectInput(session, "ff_linetype", selected=r_lty[1])

  }

  draw_prev_fireflow <- function(tmp_ff_info) {
    if (!is.null(tmp_ff_info)) {
      for (i in 1:nrow(tmp_ff_info)) {
        draw(
          ff(
            as.numeric(tmp_ff_info[i,1])
            , as.numeric(tmp_ff_info[i,3])
            , as.numeric(tmp_ff_info[i,4])
            , as.character(tmp_ff_info[i,5])
          )
          , as.character(tmp_ff_info[i,6])
          , as.numeric(tmp_ff_info[i,7])
        )
      }
    }
  }

  observeEvent( input$ff_draw, {

    # Get parameters
    tmp_ff <- ff( input$ff_static, input$ff_flow, input$ff_residual, input$ff_id )
    tmp_col <- input$ff_color
    tmp_lty <- match(input$ff_linetype, r_lty)

    output$main_plot <- renderPlot({

      tmp_ff_info <<- ff_info

      n185()

      draw_prev_fireflow(tmp_ff_info)

      draw(tmp_ff, tmp_col, tmp_lty)


    })

    clear_fireflow()

  }) # oberseveEvent ff_draw

}

shinyApp(ui, server)
