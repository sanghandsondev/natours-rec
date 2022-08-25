const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],      //shorthand của values và message
        unique: true,
        trim: true,  // loại bỏ các dấu cách thừa thãi ở đầu và cuối String
        maxlength: [40, 'A tour name must have less or equal than 40 characters'],
        minlength: [10, 'A tour name must have more or equal than 10 characters'],
        // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium, difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],       // giá trị nhỏ nhất
        max: [5, 'Rating must be below 5.0'],       // lớn nhất
        set: val => Math.round(val * 10) / 10   // 4.66666 =>  46.6666 =>  47 => 4.7      //set: biến đổi giá trị
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                // custom validate: only points to current doc on NEW document creation
                // chỉ đúng với khi tạo thêm DOC (Tour) mới
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a summary']
    },
    description: {
        type: String,
        trim: true,
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false        // trường này mặc định ko gửi lên trên client khi Query
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        // GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [          // Embedding data + 1:FEW   (1 Tours: Few Locations)
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [           // Child Referencing 
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

// tourSchema.index({ price: 1});
tourSchema.index({ price: 1, ratingsAverage: -1 })
tourSchema.index({ slug: 1 })
tourSchema.index({ startLocation: '2dsphere' })

// VIRTUAL properties     => Ko lưu vào database
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
})
//Virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',         // kết nối ngược lại field 'tour' ở bên reviewModel để lấy thông tin Reviews của mình
    localField: '_id'      // lưu các review dưới dạng Id
})

// DOCUMENT middleware: runs before .save() .create() .update() ...
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true })      // tự tạo slug khi thêm mới Tour (1 Tour là 1 document)
    next()
})

// Embedding Guides into Tours   // Embedding  FEW:FEW  (Few Tours: Few Users (Guides))   => guides: Array
// tourSchema.pre('save', async function (next) {
//     const guidesPromises = this.guides.map(async (id) => await User.findById(id))        // thay thế userID bằng userData
//     this.guides = await Promise.all(guidesPromises)
//     next()
// })

// QUERY middleware
tourSchema.pre(/^find/, function (next) {
    // method bắt đầu với find (find(),findOne(),findById()...) sẽ ko tìm thấy những Tour có secretTour = true
    this.find({ secretTour: { $ne: true } })
    next()
})

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'    // vừa lấy data của các guides, vừa ẩn đi các field ko cần show trong data đó
    }).populate({
        path: 'reviews',
        select: '-__v'
    })

    next()
})

// ARRREGATION middleware
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })   // ko lấy các secret Tour
//     // console.log(this.pipeline())
//     next()
// })

const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour