const express = require('express')
const router = express.Router()
const tourController = require('../controllers/tourController')
const tourMiddleware = require('../middlewares/tourMiddleware')
const authController = require('../controllers/authController')

const reviewRouter = require('./reviewRoute')

// Param middleware
// router.param('id', tourMiddleware.checkId)

router.route('/top-5-cheap').get(tourMiddleware.aliasTopTours, tourController.getAllTours)
router.route('/top-5-expensive').get(tourMiddleware.aliasTopTours2, tourController.getAllTours)

router.route('/tour-stats').get(tourController.getTourStats)
router.route('/monthly-plan/:year')
    .get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan)

router.get('/tours-within/:distance/center/:latlng/unit/:unit', tourController.getToursWithin)
router.get('/distances/:latlng/unit/:unit', tourController.getDistances)

router.route('/:id')
    .get(tourController.getTour)
    .patch(authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour)
    .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour)

// Nested Routes in Express  (Sử dụng luôn Route của Collection khác, truyền params tourId cho nó)
router.use('/:tourId/reviews', reviewRouter)

router.route('/')
    .get(tourController.getAllTours)
    .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour)

module.exports = router