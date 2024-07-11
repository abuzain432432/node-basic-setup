class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    const cleanedQueryString = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete cleanedQueryString[el]);

    let filteredQuery = JSON.stringify(cleanedQueryString);
    filteredQuery = filteredQuery.replace(
      /(?<=")(gte|gt|lte|lt)(?=":)/g,
      match => `$${match}`
    );
    this.query = this.query.find(JSON.parse(filteredQuery));
    return this;
  }
  pagination() {
    if (this.queryString.page && this.queryString.limit) {
      const page = parseInt(this.queryString.page);
      const limit = parseInt(this.queryString.limit);
      const skip = (page - 1) * limit;
      this.query = this.query.skip(skip).limit(limit);
    }
    return this;
  }

  sorting() {
    if (this.queryString.sort) {
      const sortBy = this.queryString?.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }
  limitFields() {
    if (this.queryString?.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }
}
module.exports = ApiFeatures;
