class APIFeatures {
  constructor(query, queryObj) {
    this.query = query;
    this.queryObj = queryObj;
  }

  filter() {
    // 1.A FILTERING
    const { ...queryObj } = this.queryObj; // Using destructuring to do hard copy
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1.B ADVANCE FILTERING
    let queryString = JSON.stringify(queryObj);
    const regex = /\b(gt|gte|lte|lt)\b/g;
    queryString = queryString.replace(regex, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryString));

    return this;
  }

  sort() {
    if (this.queryObj.sort) {
      const sortBy = this.queryObj.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitiFields() {
    // 3. Field Limiting
    if (this.queryObj.fields) {
      const fields = this.queryObj.fields.split(',').join(' ');
      // console.log('checking fields: ', fields);
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    // 4. Pagination
    const page = this.queryObj.page * 1 || 1;
    const limit = this.queryObj.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
