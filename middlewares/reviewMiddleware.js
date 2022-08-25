const AppError = require('../utils/appError')
const Review = require('./../models/reviewModel')

// Xác nhận người nào đang review và review cho Tour nào
exports.setTourUserIds = (req, res, next) => {
    // Allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId
    if (!req.body.user) req.body.user = req.user.id     // từ người đang đăng nhập
    next()
}
