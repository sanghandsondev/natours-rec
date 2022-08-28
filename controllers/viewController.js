const Tour = require('../models/tourModel')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const getGoogleURL = require('../utils/getGoogleURL')


exports.getOverview = catchAsync(async (req, res) => {
    // 1) Get tour data from collection
    const tours = await Tour.find()

    // 2) Build template


    // 3) Render that template using tour data from 1)
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    })
})

exports.getTour = catchAsync(async (req, res, next) => {
    // 1) get the data, for the requested tour (including reviews and guides)  -> relative data
    // const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    //     path: 'reviews',
    //     fields: 'review rating user'     // các field muốn lấy
    // })
    const tour = await Tour.findOne({ slug: req.params.slug })
    if (!tour) {
        return next(new AppError('There is no tour with that name.', 404))
    }
    // 2) Build template

    // Render template using data from 1)
    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour
    })
})

exports.getLoginForm = (req, res) => {
    if (res.locals.user) res.redirect('/')        // nếu đang đăng nhập rồi thì ko thể truy cập /login
    const ggUrl = getGoogleURL()
    res.status(200).render('login', {
        title: 'Log into your account',
        ggUrl
    })
}
exports.getSignupForm = (req, res) => {
    if (res.locals.user) res.redirect('/')        // nếu đang đăng nhập rồi thì ko thể truy cập /signup
    res.status(200).render('signup', {
        title: 'Sign up new account'
    })
}
exports.getForgotPasswordForm = (req, res) => {
    if (res.locals.user) res.redirect('/')
    res.status(200).render('forgotPassword', {
        title: 'Forgot your password'
    })
}
exports.getResetPasswordForm = (req, res) => {
    if (res.locals.user) res.redirect('/')
    res.status(200).render('resetPassword', {
        title: 'Reset your password',
        resetToken: req.params.resetToken
    })
}

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account'
    })
}
