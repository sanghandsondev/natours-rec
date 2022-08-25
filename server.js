// Variable Environment
const dotenv = require('dotenv')
dotenv.config()

// Catch Error Code    
// process.on('uncaughtException', err => {
//     console.log('UNCAUGHT EXCEPTION!! Shutting down...')
//     console.log(err)
//     process.exit(1)
// })

const app = require('./app')

// DATABASE
const mongoose = require('mongoose')
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(con => {
    console.log('DB connection successful!')
})

// Start Server
const port = process.env.PORT || 8080
const server = app.listen(port, () => {
    console.log(`App listening on port ${port}...`)
})

// catch lỗi kết nối database
// Error outside Express (ko phải lỗi server)
process.on('unhandledRejection', (err) => {
    // console.log(err)
    console.log('UNHANDLER REJECTION!! Shutting down...')
    server.close(() => {
        process.exit(1)
    })
})



