context("Fireflow Objects")

test_that("ff() input errors", {
  expect_error(ff(60, "a", 20))
  expect_error(ff("a", 3000, 20))
  expect_error(ff(60, 3000, "a"))

  expect_warning(ff(120, 3000, 20))
  expect_warning(ff(60, 3000, 10))

  expect_error(ff(-60, 3000, 20))
  expect_error(ff(60, -3000, 20))
  expect_error(ff(60, 3000, -20))

  expect_error(ff(30, 3000, 40))
  expect_error(ff(30, 3000, 40, 4))
})

test_that("ff() is well-formed", {
  expect_equal(ff(60,3000,20)$Static, 60)
  expect_equal(as.numeric(ff(60,3000,20)[1]), 60)

  expect_equal(ff(60,3000,20)$Test_Flow, 3000)
  expect_equal(as.numeric(ff(60,3000,20)[3]), 3000)

  expect_equal(ff(60,3000,20)$Test_Residual, 20)
  expect_equal(as.numeric(ff(60,3000,20)[4]), 20)

  expect_equal(ff(60,3000,20, "a")$ID, "a")
  expect_equal(as.character(ff(60,3000,20, "a")[5]), "a")
})

test_that("ff() is correct", {
  expect_equal(ff(60,3000,20)$k, 1.477E-5, tolerance=0.001E-5)
  expect_equal(ff(50,2000,30)$k, 1.564E-5, tolerance=0.001E-5)
})

context("Graphical Interface")

