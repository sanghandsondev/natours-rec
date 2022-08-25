const express = require('express')
const reviewController = require('./../controllers/reviewController')
const authController = require('./../controllers/authController')
const reviewMiddleware = require('./../middlewares/reviewMiddleware')

const router = express.Router({ mergeParams: true })      // lấy params của thằng sử dụng nó => tourId của tourRoute


router.route('/:id')
    .get(reviewController.getReview)
    .patch(authController.protect, authController.restrictTo('user', 'admin'), reviewController.updateReview)
    .delete(authController.protect, authController.restrictTo('user', 'admin'), reviewController.deleteReview)

// POST api/v1/tours/432423432/reviews   =   POST api/v1/reviews             
// GET  api/v1/tours/423432324/reviews   =   GET api/v1/reviews                         
router.route('/')
    .get(reviewController.getAllReviews)
    .post(authController.protect, authController.restrictTo('user'), reviewMiddleware.setTourUserIds, reviewController.createReview)

module.exports = router
