// Data
// const fs = require('fs')
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`))

const Tour = require('../models/tourModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const factory = require('./handlerFactory')
const multer = require('multer')   // upload file
const sharp = require('sharp')   // resize photo

const multerStorage = multer.memoryStorage()
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {         // if file is a image
        cb(null, true)
    } else {
        cb(new AppError('Not an image! Please upload only images', 400), false)
    }
}
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})

exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },    // upload.single('imageCover')   => req.file
    { name: 'images', maxCount: 3 }         // upload.array('images',5)     => req.files
])
exports.resizeTourImages = catchAsync(async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images) return next()
    // 1) Cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.imageCover}`)
    // 2) Images
    req.body.images = []
    await Promise.all(
        req.files.images.map(async (file, index) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`
            await sharp(file.buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`public/img/tours/${filename}`)
            req.body.images.push(filename)
        })
    )
    next()
})

//CRUD
// exports.getAllTours = catchAsync(async (req, res, next) => {
//     // EXECUTE QUERY
//     const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate()
//     const tours = await features.query

//     // SEND RESPONSE
//     res.status(200).json({
//         status: 'success',
//         // console.log(req.requestTime)
//         requestdAt: req.requestTime,
//         results: tours.length,
//         data: {
//             tours
//         }
//     })
// })
exports.getAllTours = factory.getAll(Tour)

// exports.getTour = catchAsync(async (req, res, next) => {
//     // const tour = await Tour.findById(req.params.id).populate('guides')     // populate(): guideId  => guide Data 
//     const tour = await Tour.findById(req.params.id)
//     if (!tour) {
//         return next(new AppError('Can not find Tour with that ID', 404))
//     }
//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour
//         }
//     })
// })
exports.getTour = factory.getOne(Tour)

exports.createTour = factory.createOne(Tour)

exports.updateTour = factory.updateOne(Tour)

exports.deleteTour = factory.deleteOne(Tour)


//Matching Grouping Sorting
exports.getTourStats = catchAsync(async (req, res, next) => {

    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }   // chọn ra các Tour có rating >= 4.5
        },
        {
            $group: {             // group các Tour theo _id 
                // _id: '$ratingsAverage',
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            }
        },
        {
            $sort: {
                avgPrice: 1         // Sắp xếp các group theo giá trị tăng dần của avgPrice
                // avgPrice: -1         // giảm dần
            }
        }
    ])
    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    })
})

//Unwinding Projecting
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {

    const year = req.params.year * 1
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {          // chọn ra các Tour trong năm (req.params.year)
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },      // group các Tour trên theo tháng
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: { _id: 0 }    // giấu _id bằng cách gán giá trị 0
        },
        {
            $sort: { month: 1 }      // sắp xếp theo tháng tăng dần ( tháng 1 -> 12)
        }, {
            $limit: 12              // giới hạn 12 group
        }
    ])
    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    })
})

//'/tours-within/:distance/center/:latlng/unit/:unit'
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params
    const [lat, lng] = latlng.split(',')

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
        next(new AppError('Please provide latitutr and longitude in the format lat,lng.', 400))
    }
    const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } })

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    })
})

//'/distances/:latlng/unit/:unit'
exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params
    const [lat, lng] = latlng.split(',')

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001        // miles hoặc meter

    if (!lat || !lng) {
        next(new AppError('Please provide latitutr and longitude in the format lat,lng.', 400))
    }
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',         // tạo ra 1 field 'distance' trong document
                distanceMultiplier: multiplier     // tự động nhân giá trị của field 'distance' với multiplier
            }
        },
        {
            $project: {
                distance: 1,     // lấy các field bằng cách gán giá trị 1
                name: 1
            }
        }
    ])
    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    })
})