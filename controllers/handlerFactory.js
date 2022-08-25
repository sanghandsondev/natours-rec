const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const APIFeatures = require('./../utils/apiFeatures')

exports.deleteOne = (Model) => {
    return catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id)
        if (!doc) {
            return next(new AppError('No document found with that ID', 404))
        }
        //204 No content -> ko có data trả về
        res.status(204).json({
            status: 'success',
            data: null
        })
    })
}

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true     // chạy validate trong Schema
    })
    if (!doc) {
        return next(new AppError('No document found with that ID', 404))
    }
    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    })
})

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body)
    res.status(201).json({
        status: 'success',
        data: {
            data: newDoc
        }
    })
})

exports.getOne = (Model, popOptions) => {
    return catchAsync(async (req, res, next) => {
        // const tour = await Tour.findById(req.params.id).populate({path: 'guides'})     // populate(): guideId  => guide Data 
        let query = Model.findById(req.params.id)
        if (popOptions) query = query.populate(popOptions)
        const doc = await query

        if (!doc) {
            return next(new AppError('No document found with that ID', 404))
        }
        doc.__v = undefined
        res.status(200).json({
            status: 'success',
            data: {
                doc
            }
        })
    })
}

exports.getAll = Model => catchAsync(async (req, res, next) => {
    // Nested Get Endpoint (reviews on Tour) -> hack
    let filter = {}
    if (req.params.tourId) filter = { tour: req.params.tourId }    // trường hợp bị sử dụng bởi tourRoute

    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginate()
    // const docs = await features.query.explain()
    const docs = await features.query        // .query ở đây là Model.find()

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        // console.log(req.requestTime)
        requestdAt: req.requestTime,
        results: docs.length,
        data: {
            data: docs
        }
    })
})