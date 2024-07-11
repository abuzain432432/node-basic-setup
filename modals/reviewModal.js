const mongoose = require('mongoose');
const Tour = require('./tourModal');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name',
  });
  // this.populate({
  //   path: 'user',
  //   select: 'name',
  // }).populate({
  //   path: 'tour',
  //   select: 'name',
  // });
  next();
});

reviewSchema.statics.calcAverageTourReviewsRatings = async function(
  tourId
) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    // If there is no review then set the ratingsQuantity to 0 and ratingsAverage to 4.5 these are the default values
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// NOTE: This middleware is used to calculate the average rating of a tour after a review is saved and we have used the post version because we want to include the review that was just saved in the calculation means we want to include the currently processing document in the calculation
reviewSchema.post('save', function() {
  this.constructor.calcAverageTourReviewsRatings(this.tour);
});

// findByIdAndUpdate uses under the hood findOneAndUpdate
// findByIdAndDelete uses under the hood findOneAndDelete
// in these cases we don't have access to the document because these are query middleware and we only have access to the query not the document
reviewSchema.pre(/^findOneAnd/, async function(next) {
  // TODO  need to fix this in the case of delete tour
  this.r = await this.findOne(); //We can't execute that stats function here because the docs is not yet updated in the database so we need to do this calculation after updating the doc in the database
  next();
});
reviewSchema.post(/^findOneAnd/, async function() {
  await this.r.constructor.calcAverageTourReviewsRatings(this.r.tour);
});
// TODO need to test this to ensure that only one review can be written per user per tour
reviewSchema.index(
  {
    tour: 1,
    user: 1,
  },
  //this will make sure that a user can only write one review per tour
  { unique: true }
);

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
