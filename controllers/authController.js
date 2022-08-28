const User = require('./../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const Email = require('../utils/email')
const jwt = require('jsonwebtoken')
const { promisify } = require('util')    // Thư viện chức năng tích hợp sẵn trong node ( như 'fs' ) => promisify: function -> promise
const crypto = require('crypto')        // có sẵn trong node
const axios = require('axios')

const signToken = idUser => {
    return jwt.sign({ id: idUser }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id)

    res.cookie('jwt', token, {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),   // milliseconds
        httpOnly: true,
        secure: req.secure || req.header('x-forwarded-proto') === 'https'
    })   // Send JWT via Cookie

    //remove the password from output
    user.password = undefined         // ở đây ko .save() nên password trong database ko bị ảnh hưởng

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}


// ĐĂNG KÝ
exports.signUp = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body)

    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome()          // gửi email chào mừng người dùng mới cùng link để chỉnh sửa avatar
    createSendToken(newUser, 201, req, res)
})

// ĐĂNG NHẬP
exports.logIn = catchAsync(async (req, res, next) => {
    const { email, password } = req.body
    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400))
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password')       // thêm field password vào data user
    if (!user || !await user.correctPassword(password, user.password)) {
        return next(new AppError('Incorrect email or password', 401))
    }

    // 3) If everything ok, send token to client
    createSendToken(user, 200, req, res)
})

// ĐĂNH NHẬP VỚI GOOGLE
exports.loginWithGoogle = catchAsync(async (req, res, next) => {
    const { code } = req.query;
    const redirect_uri = `${req.protocol}://${req.get('host')}/api/sessions/oauth/google`
    const client_id = (process.env.NODE_ENV === 'production') ? process.env.GOOGLE_CLIENT_ID : process.env.GOOGLE_CLIENT_ID_DEV
    const client_secret = (process.env.NODE_ENV === 'production') ? process.env.GOOGLE_CLIENT_SECRET : process.env.GOOGLE_CLIENT_SECRET_DEV
    const grant_type = 'authorization_code'
    const url = 'https://oauth2.googleapis.com/token'
    const data = await axios({       // id_token vs acess_token
        method: 'POST',
        url,
        params: {
            client_id,
            client_secret,
            redirect_uri,
            code,
            grant_type
        }
    })
    if (!data) {
        return next(new AppError('Failed to get token from Google Api', 404))
    }
    const tokenFromGoogle = data.data.access_token
    const urlForGettingUserInfo = 'https://www.googleapis.com/oauth2/v2/userinfo'
    const userData = await axios({
        url: urlForGettingUserInfo,
        method: 'GET',
        headers: {
            Authorization: `Bearer ${tokenFromGoogle}`,
        },
    })
    if (!userData) {
        return next(new AppError('Failed to get User Info from Google Api', 404))
    }
    if (userData.data.verified_email === 'false') {
        return next(new AppError('Google account is not verified ', 403))
    }
    const body = {
        name: userData.data.name,
        email: userData.data.email,
        password: '123456789',
        passwordConfirm: '123456789',
        serviceProvider: 'google',
        // photo: userData.data.pictrue,
    }
    // console.log(userData.data)
    const user = await User.findOne({ email: body.email })
    if (!user) {
        const newUser = await User.create(body)
        await new Email(newUser, `${req.protocol}://${req.get('host')}/me`).sendWelcome()
        const token = signToken(newUser._id)
        res.cookie('jwt', token, {
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),   // milliseconds
            httpOnly: true,
            secure: req.secure || req.header('x-forwarded-proto') === 'https'
        })   // Send JWT via Cookie
        res.status(201).redirect('/')
    }
    // if user has been in database
    const token = signToken(user._id)
    await new Email(user, `${req.protocol}://${req.get('host')}/`).sendLoginWithGoogle()
    res.cookie('jwt', token, {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),   // milliseconds
        httpOnly: true,
        secure: req.secure || req.header('x-forwarded-proto') === 'https'
    })   // Send JWT via Cookie
    res.status(200).redirect('/')
})

// ĐĂNG XUẤT
exports.logOut = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),      // + 10s
        httpOnly: true
    })
    res.status(200).json({ status: 'success' })
}

// XÁC THỰC, BẢO VỆ ROUTER
exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check of it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]          // lấy token phía sau Bearer
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt
    }
    if (!token) {
        return next(new AppError('Your are not logged in! Please log in to get access.', 401))
    }
    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
        return next(new AppError('The user belonging to this token does no longer exist.', 401))
    }
    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please log in again.', 401))
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser
    res.locals.user = currentUser    // local storage
    next()
})

// PHÂN QUYỀN
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin','lead-guide']. role='user'
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403))
        }
        next()
    }
}

// ĐỔI MẬT KHẨU
exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user._id).select('+password')// lấy thông tin người dùng (bao gồm mật khẩu) đang đăng nhập req.user

    // 2) Check if POSTed current password is correct                     
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {  // Xác nhận đúng mật khẩu hiện tại
        return next(new AppError('Your current password is wrong.', 401))
    }
    // 3) If so, update password                                          
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()            // User.findByIdAndUpdate ko sử dụng vì nó ko hash password cũng như tạo thời gian đổi mật khẩu

    // 4) Log user in, send JWT
    createSendToken(user, 200, req, res)
})

// QUÊN MẬT KHẨU
exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new AppError('There is no user with email address.', 404))
    }
    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })             // bỏ qua validate với SAVE, lưu thời gian gửi token 
    // 3) Send it to user's email
    try {
        // const url = `${req.protocol}://${req.get('host')}/me`;
        const resetURL = `${req.protocol}://${req.get('host')}/resetPassword/${resetToken}`
        await new Email(user, resetURL).sendPasswordReset()

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        })
    } catch (err) {
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false })
        return next(new AppError('There was an error sending the email. Try again later!', 500))
    }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')   // Hash cái token trên URL(cái đc gửi đến email user)
    const user = await User.findOne({
        passwordResetToken: hashedToken,              // trùng hashToken ở database
        passwordResetExpires: { $gt: Date.now() }     // token reset password vẫn còn thời gian hiệu lực
    })

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400))
    }
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    // 3) Update changedPasswordAt property for the user

    // 4) Log the user in, send JWT
    createSendToken(user, 200, req, res)
})

// ĐÃ ĐĂNG NHẬP? (chỉ dùng cho RENDER Pages) => Ko phải protect Routes => no errors! => no error page!!
// Nếu đăng nhập thành công thì lưu biến res.locals.user để render thành phần pages theo điều kiện 
exports.isLoggedIn = async (req, res, next) => {
    try {
        if (req.cookies.jwt) {

            // 1) Verification token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)
            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id)
            if (!currentUser) {
                return next()
            }
            // 3) Check if user changed password after the token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next()
            }

            // THERE IS A LOGGED IN USER
            res.locals.user = currentUser      // local storage
            return next()
        }
    } catch (err) {
        return next()
    }
    next()
}