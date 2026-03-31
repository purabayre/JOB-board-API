class APIFeatures {
  constructor(query, queryString, model) {
    this.query = query;
    this.queryString = queryString;
    this.model = model;
  }

  filter() {
    const queryObj = { ...this.queryString };

    const excluded = ["page", "limit", "sort", "search"];
    excluded.forEach((el) => delete queryObj[el]);

    this.query = this.query.find(queryObj);
    this.filterObj = queryObj;

    return this;
  }

  search() {
    if (this.queryString.search) {
      const searchQuery = {
        $or: [
          { title: { $regex: this.queryString.search, $options: "i" } },
          { description: { $regex: this.queryString.search, $options: "i" } },
        ],
      };

      this.query = this.query.find(searchQuery);

      this.filterObj = { ...this.filterObj, ...searchQuery };
    }

    return this;
  }

  async paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 5;
    const skip = (page - 1) * limit;

    const total = await this.model.countDocuments(this.filterObj || {});

    const totalPages = Math.ceil(total / limit);

    this.query = this.query.skip(skip).limit(limit);

    this.pagination = { page, limit, total, totalPages };

    return this;
  }
}

module.exports = APIFeatures;
