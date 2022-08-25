const User = require('../models/userModel')
const APIFeatures = require('../utils/apiFeatures')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const factory = require('./handlerFactory')
const multer = require('multer')   // upload file
const sharp = require('sharp')   // resize photo

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users')
//     },
//     filename: (req, file, cb) => {
//         //user-321321321321b-32121321231.jpeg
//         const ext = file.mimetype.split('/')[1]      // .jpeg    .jpg   .png
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//     }
// })
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
exports.uploadUserPhoto = upload.single('photo')

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next()

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`)
    next()
})

const filterObj = (obj, ...allowedFields) => {
    const newObj = {}
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el]
    })
    return newObj
}
exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password updates. Please use /updateMyPassWord.', 400))
    }
    // 2) Filtered out unwanted fields names are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email')            // chỉ cho phép thay đổi name và email (nếu có)
    if (req.file) {
        filteredBody.photo = req.file.filename        // thêm field photo 
    }
    // 3) Update user document
    const updateUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
        new: true,
        runValidators: true
    })
    res.status(200).json({
        status: 'success',
        data: {
            user: updateUser
        }
    })
})



// Soft Delete
exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false, deletedAt: Date.now() - 1000 })
    res.status(204).json({
        status: 'success',
        data: null
    })
})

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id
    next()
}

// Manage Users
exports.getAllUsers = factory.getAll(User)
exports.getUser = factory.getOne(User)
exports.createUser = catchAsync(async (req, res, next) => {
    return next(new AppError('This route is not defined! Please use /signup instead', 400))
})
//do NOT update password with this  => don't send req.body.password
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)