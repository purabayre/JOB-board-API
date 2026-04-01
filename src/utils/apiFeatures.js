class APIFeatures {
  constructor(query, queryString, model) {
    this.query = query;
    this.queryString = queryString;
    this.model = model;
  }

  filter() {
    const queryObj = { ...this.queryString };

    const excluded = ["page", "limit", "sort", "search", "salary"];
    excluded.forEach((el) => delete queryObj[el]);

    this.query = this.query.find(queryObj);
    this.filterObj = queryObj;

    if (this.queryString.salary) {
      const salary = Number(this.queryString.salary);

      const salaryFilter = {
        salaryMin: { $lte: salary },
        salaryMax: { $gte: salary },
      };

      this.query = this.query.find(salaryFilter);

      this.filterObj = { ...this.filterObj, ...salaryFilter };
    }

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

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  // ⭐ FIXED: paginate() is now synchronous
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 5;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    this.pagination = { page, limit };

    return this;
  }
}

module.exports = APIFeatures;
