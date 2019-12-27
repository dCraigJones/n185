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
