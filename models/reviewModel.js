const mongoose = require('mongoose');
const Product = require('./productModel');

const reviewSchema = new mongoose.Schema(
  {
    title: String,
    ratings: {
      type: Number,
      min: [1, 'min ratings value is 1.0'],
      max: [5, 'max ratings value is 5.0'],
      required: [true, 'rating is required'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'review must belong to user'],
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: [true, 'review must belong to product'],
    },
  },
  { timestamps: true },
);

reviewSchema.statics.calcAverageRatingsAndQuantity = async function (
  productId,
) {
  const result = await this.aggregate([
    // Stage 1 : get all reviews in specific product
    {
      $match: { product: productId },
    },
    // Stage 2: Grouping reviews based on productID and calc avgRatings, ratingsQuantity
    {
      $group: {
        _id: 'product',
        avgRatings: { $avg: '$ratings' },
        ratingsQuantity: { $sum: 1 },
      },
    },
  ]);

  // console.log(result);
  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: result[0].avgRatings,
      ratingsQuantity: result[0].ratingsQuantity,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: 0,
      ratingsQuantity: 0,
    });
  }
};

reviewSchema.post('save', async function () {
  await this.constructor.calcAverageRatingsAndQuantity(this.product);
});
reviewSchema.post(
  'deleteOne',
  { document: true, query: true },
  async function () {
    await this.constructor.calcAverageRatingsAndQuantity(this.product);
  },
);
reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name' });
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
