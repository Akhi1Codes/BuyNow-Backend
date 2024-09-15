class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }
  search() {
    const keyword = this.queryStr.keyword
      ? {
          name: {
            $regex: this.queryStr.keyword,
            $options: "i", //case insensitive
          },
        }
      : {};
    this.query = this.query.find({ ...keyword });
    return this;
  }
  filter() {
    const queryCopy = { ...this.queryStr };

    //removing fields from query
    const removeFields = ["keyword", "limit", "page"];
    removeFields.forEach((el) => delete queryCopy[el]);

    //adavnce filter for price rating
    let queryStr = JSON.stringify(queryCopy);

    //adding $ to match the mongocomponents
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  pagination(resPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;
    const skip = resPerPage * (currentPage - 1);

    this.query = this.query.skip(skip).limit(resPerPage);
    return this;
  }
}
module.exports = APIFeatures;
