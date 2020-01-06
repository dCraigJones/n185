r_lty <- c("solid","dashed","dotted","dot-dash","long-dash","two-dash")

r_legend <- c("none", "bottom", "bottomleft", "left", "topleft", "top", "topright", "right", "bottomright", "center")

sketch = htmltools::withTags(table(
  class = 'display',

  thead(
    tr(
      th(rowspan=2, align="center", valign="bottom", 'ID'),
      th(rowspan=1, halign="center", valign="bottom",'Static'),
      th(rowspan=1, align="center", valign="bottom",'Test Flow'),
      th(rowspan=1, align="center", valign="bottom",'Test Residual')
    ),

    tr(
      th(align="center", valign="bottom",'PSI'),
      th(align="center", valign="bottom",'GPM'),
      th(align="center", valign="bottom",'PSI')
    )
  )
))
