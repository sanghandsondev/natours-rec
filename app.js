const express = require('express')
const path = require('path')

const app = express()

// SET VIEW ENGINE  --------------------------------------------------------------------------------
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

// GLOBAL MIDDLEWARES ----------------------------------------------------------------------------

// Serving static files
app.use(express.static(path.join(__dirname, 'public')))

// Set security HTTP headers
const helmet = require('helmet')
app.use(helmet())

// Development logging
const morgan = require('morgan')
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Limit request from same IP
const rateLimit = require('express-rate-limit')
const limiter = rateLimit({
  max: 100,                        // limit 100 requests from the same IP in 1 hour
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
})
app.use('/api', limiter)

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }))

const cookieParser = require('cookie-parser')
app.use(cookieParser())        // hiểu được req.cookies

// Data sanitization against NoSQL query injection    (kiểu khi mấy cái query find() phủng không hoạt động đúng như mong muốn)
const mongoSanitize = require('express-mongo-sanitize')
app.use(mongoSanitize())

// Data sanitization against XSS
const xss = require('xss-clean')
app.use(xss())

// Prevent parameter pollution
// Cho phép hiểu được localhost:8000/api/v1/tours?sort=duration&sort=price , api/v1/tours?duration=5&duration=9
// Khác với localhost:8000/api/v1/tours?sort=duration,price
const hpp = require('hpp')
app.use(hpp({
  whitelist: [
    'duration',
    'ratingsQuantity',
    'ratingsAverage',
    'maxGroupSize',
    'difficulty',
    'price'
  ]
}))

// nén file JS khi run build:js
const compression = require('compression')
app.use(compression())

// Test custom middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString()
  next()
})

// ROUTES ------------------------------------------------------------------------------------------------------------
// views
const viewRouter = require('./routes/viewRoute')
app.use('/', viewRouter)

// api
const tourRouter = require('./routes/tourRoute')
const userRouter = require('./routes/userRoute')
const reviewRouter = require('./routes/reviewRoute')

app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)

const AppError = require('./utils/appError')
app.all('*', (req, res, next) => {          // Sai đường dẫn URL / API ko tồn tại
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`
  // })

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`)
  // err.status = 'fail'
  // err.statusCode = 404
  // next(err)

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

const globalErrorHandler = require('./controllers/errorController')
app.use(globalErrorHandler)            // catch err ở controller sẽ next() vào đây

module.exports = app;
