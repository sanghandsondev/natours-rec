
class APIFeatures {
    constructor(query, queryString) {
        this.query = query
        this.queryString = queryString
    }
    // BUILD QUERY
    filter() {
        // 1A) Filtering
        let queryObj = { ...this.queryString }   // lưu các biến req.query vào 1 object
        const excludedFields = ['page', 'sort', 'limit', 'fields']  //các query bị loại bỏ nếu có gọi ra trên url
        excludedFields.forEach(el => delete queryObj[el])
        // 1B) Advanced filtering
        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)

        this.query = this.query.find(JSON.parse(queryStr))
        // let query = Tour.find(JSON.parse(queryStr))   // tìm kiếm tất cả dữ liệu thỏa mãn query được gọi trên url trừ 4 field trên
        return this
    }
    sort() {
        // 2) Sorting
        //http://localhost:8000/api/v1/tours?sort=-price,-ratingsAverage   ==> giảm dần
        //sort ('-price -ratingsAverage')     
        //http://localhost:8000/api/v1/tours?sort=price,ratingsAverage   ==> tăng dần
        //sort ('price ratingsAverage')        
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ')
            // console.log(sortBy)
            this.query = this.query.sort(sortBy)
        } else {
            this.query = this.query.sort('-createdAt')    // default:  The Newest Tour
        }
        return this

    }
    limitFields() {
        // 3) Field limiting
        //http://localhost:8000/api/v1/tours?fields=name,duration,difficulty,price   => chỉ lấy 4 trường này
        //http://localhost:8000/api/v1/tours?fields=-name,-duration                 => lấy tất cả các trường, trừ 2 trường này

        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields)      // .select()    => chọn ra các trường muốn lấy để gửi lên client
        } else {
            this.query = this.query.select('-__v')     //default: ko lấy "__v" gửi lên client
        }
        return this
    }
    paginate() {
        // 4) Pagination
        // ?page=2&limit=10   =>  page1: 1-10   ;   page2 : 11-20   ;  page3: 21-30  ; .....
        // http://localhost:8000/api/v1/tours?page=3&limit=3&sort=-price
        const page = this.queryString.page * 1 || 1    //default page 1
        const limit = this.queryString.limit * 1 || 20;    //default limit = 20
        const skip = (page - 1) * limit

        this.query = this.query.skip(skip).limit(limit)

        // nếu page ko tồn tại
        // if (this.queryString.page) {
        //     const numTours = await Tour.countDocuments()     // đếm xem có bao nhiêu dữ liệu trong Collection Tour
        //     if (skip >= numTours) throw new Error('This page does not exist') //  gửi tin nhắn lỗi vào 'err' ở Catch(err)
        // }
        return this
    }
}

module.exports = APIFeatures
