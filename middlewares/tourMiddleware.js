// Data
// const fs = require('fs')
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`))

// const Tour = require('../models/tourModel')

// exports.checkId = (req, res, next, val) => {
//     // console.log(`Tour id is: ${val}`)
//     // val = req.params.id
//     if (req.params.id * 1 > tours.length) {
//         return res.status(404).json({
//             status: 'fail',
//             message: 'Invalid Id'
//         })
//     }
//     next()
// }

exports.aliasTopTours = (req, res, next) => {
    // top 5 Tour rẻ nhất
    req.query.limit = '5'
    req.query.sort = 'price'
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
    next()
}

exports.aliasTopTours2 = (req, res, next) => {
    // top 5 Tour đắt nhất
    req.query.limit = '5'
    req.query.sort = '-price'
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
    next()
}