const mongoose = require('mongoose')
const Tour = require('./tourModel')

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review can not be empty!']
    },
    rating: {
        type: Number,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: {        // Parent Referencing 
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour.']
    },
    user: {        // Parent Referencing 
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user.']
    }
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

reviewSchema.index({ tour: 1, user: 1 });    // Mỗi người chỉ được review 1 Tour 1 lần


// Query middleware
reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'name photo'  // chỉ lấy tên và ảnh của người review
    })
    next()
})

reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }      // trỏ vào tất cả review có Tour là tourId 
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ])
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {         // tính toán lại Rating trong Tour đó
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        })
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,             // khi ko có review nào thì tour sẽ trả lại giá trị Rating mặc định
            ratingsAverage: 4.5
        })
    }
}


reviewSchema.post('save', function () {  // mỗi khi POST một review mới
    this.constructor.calcAverageRatings(this.tour)
})

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.findOne()
    next()
})
reviewSchema.post(/^findOneAnd/, async function () {       // mỗi khi sửa hoặc xóa một Review
    //await this.findOne() does NOT work here, query has already executed
    await this.r.constructor.calcAverageRatings(this.r.tour)
})


const Review = mongoose.model('Review', reviewSchema)

module.exports = Review
