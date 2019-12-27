library("shiny")
library("shinythemes")
library("colourpicker")
library("DT")

source("def.R")
source("util.R")

ui <- fluidPage(theme=shinythemes::shinytheme("united"),
   sidebarLayout(

    #### Sidebar UI ####
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
       , textInput("g_title", "Title")
       , selectInput("g_legend", "Legend", r_legend)
       , checkboxInput("g_date", "Add Date")
       , checkboxInput("g_cya", "Add Provision")
       , br()
       , actionButton("g_draw", "Update")
       # , div(style="display:inline-block;vertical-align:top;", fluidRow(
       #     column(5, actionButton("g_draw", "Update") ),
       #     column(5, actionButton("g_clear", "Clear") )
       # )) #div

       , hr()
       , HTML("<h3>Adjust Scale:</h3>")
       , sliderInput("max_flow", "Maximum Flow", 0,10000,5000, 1000)
       , sliderInput("max_psi", "Maximum Pressure", 0,100,100, 10)


     ), # sidebarPanel

    #### Main Panel UI ####
     mainPanel(
         htmlOutput("main_hover")
       , plotOutput("main_plot", hover="main_hover")
       , textOutput("main_table")

     )

   ) # sidebarLayout

)

server <- function(input, output, session) {

  output$main_hover <- renderText( paste0() )

  output$main_plot <- renderPlot( n185(input$max_flow, input$max_psi) )

  observeEvent( input$ff_reset, {
    output$main_plot <- renderPlot({ n185() })

    ff_info <<- NULL

  })

  observeEvent( input$g_draw, {
    output$main_plot <- renderPlot({

      tmp_ff_info <<- ff_info

      n185( input$max_flow, input$max_psi )

      draw_prev_fireflow(tmp_ff_info)

      title( input$g_title )

      if (!input$g_legend=="none") {
        draw_legend(input$g_legend)
      }

      if (input$g_cya) {mtext("This document is for JEA planning purposes only and should not be used for design.",side=3, line=0, cex=0.50, font=3)}
      if (input$g_date) {mtext(Sys.Date(),side=3, line=2, cex=0.5, adj=1)}
    })

  })

  observeEvent( input$ff_draw, {

    # Get parameters
    tmp_ff <- ff( input$ff_static, input$ff_flow, input$ff_residual, input$ff_id )
    tmp_col <- input$ff_color
    tmp_lty <- match(input$ff_linetype, r_lty)

    output$main_plot <- renderPlot({

      tmp_ff_info <<- ff_info

      n185( input$max_flow, input$max_psi )

      draw_prev_fireflow(tmp_ff_info)

      draw(tmp_ff, tmp_col, tmp_lty)
    })

    clear_fireflow(session)

    # output$main_table <- DT::renderDataTable(as.data.frame(ff_info[,c(5,1,3,4)])
    #     , rownames=FALSE
    #     , options=list(dom="tip")
    # )

  }) # oberseveEvent ff_draw



}

shinyApp(ui, server)
