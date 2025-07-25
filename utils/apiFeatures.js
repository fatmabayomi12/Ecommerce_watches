class ApiFeatures {
    constructor(mongooseQuery, queryString) {
        this.mongooseQuery = mongooseQuery;
        this.queryString = queryString;
    }

    filter() {
        const queryStringObj = { ...this.queryString };
        const excludesFields = ['page', 'sort', 'limit', 'fields'];
        excludesFields.forEach((field) => delete queryStringObj[field]);

        let queryStr = JSON.stringify(queryStringObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

        this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));

        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.mongooseQuery = this.mongooseQuery.sort(sortBy);
        }
        else {
            this.mongooseQuery = this.mongooseQuery.sort('-createdAt');
        }

        return this;
    }
    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.mongooseQuery = this.mongooseQuery.select(fields);
        } else {
            this.mongooseQuery = this.mongooseQuery.select('-__v');
        }

        return this;
    }

    search(modelName) {
        if (this.queryString.keyword && this.queryString.keyword.trim() !== '') {
            let keyword = this.queryString.keyword;
            let query = {};
            if (modelName.toLowerCase() === 'Products') {
                query.$or = [
                    { title: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } }
                ];
            }
            else {
                query = { name: { $regex: keyword, $options: 'i' } };
            }

            this.mongooseQuery = this.mongooseQuery.find(query);

        }

        return this;
    }

    paginate(countDocuments) {
        const page = Math.max(1, this.queryString.page * 1 || 1);
        const limit = Math.max(1, this.queryString.limit * 1 || 50);
        const skip = (page - 1) * limit;
        const endIndex = page * limit;

        const pagination = {};
        pagination.currentPage = page;
        pagination.limit = limit;
        pagination.numberOfPages = countDocuments > 0 ? Math.ceil(countDocuments / limit) : 1;

        if (endIndex < countDocuments) {
            pagination.next = page + 1;
        }
        if (skip > 0) {
            pagination.prev = page - 1;
        }

        this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
        this.paginationResult = pagination;

        return this;
    }
}

export default ApiFeatures;