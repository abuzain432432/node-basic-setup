const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [
        40,
        'A tour name must have less or equal then 40 characters',
      ],
      minLength: [
        10,
        'A tour name must have more or equal then 10 characters',
      ],
      // validate: [
      //   validator.isAlpha,
      //   'Tour name must only  characters',
      // ],
    },
    slug: String,
    ratings: {
      type: Number,
      default: 4.5,
    },
    maxGroupSize: {
      type: Number,
      min: [1, 'A tour must have at least 1 member'],
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        // This only points to current doc on NEW document creation no update
        // NOTE : This validator will run on update if 'runValidators: true' is set
        validator: function(val) {
          /// this only points to current doc on NEW document creation not on update
          // NOTE : this to current doc on update if 'runValidators: true' is set
          return val < this.price;
        },
        message:
          'Discount price ({VALUE}) should be below the regular price',
      },
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    ratingsAverage: {
      type: Number,
      default: 4,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10, // 4.6 => 5 workaround can be 4.6666666 => 46.666666 => 47 => 4.7
    },
    duration: Number,
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    images: [String],
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secret: {
      type: Boolean,
      default: false,
    },
    // MONGODB use  GEOJSON for geospatial data
    // NOTE this startLocations is not an array of objects but an object with properties so it is not an embedded document

    startLocation: {
      description: String,
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: [Number], // first value is for longitude and second is for latitude however in the case of google map first one latitude and second is longitude
      address: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        description: String,
        coordinates: [Number],
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// tourSchema.index({
//   price: 1,

// });
// this is required for the geostatic queries
tourSchema.index({
  startLocation: '2dsphere', // if you are using the read earth points you have to use 2dsphere if we are using fraction points then we have to use 2d
});
tourSchema.index({
  slug: 1,
});
tourSchema.index({
  price: 1,
  ratingsAverage: -1,
});

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// NOTE : virtual populate is similar to child referencing but it is not going to store the data in the database it is only going to show the data in the output
tourSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'tour',
});

tourSchema.pre('save', function(next) {
  // console.log('###########################');
  // console.log(this);
  // Will only run when you save documents with .save and .create
  this.slug = slugify(this.name, '_');
  next();
});

//NOTE : This is a post middleware
// tourSchema.post('save', function(doc, next) {
//   console.log('###########################');
//   console.log(doc);
//   next();
// });
// NOTE Query Middleware: keep in mind this is only ogin to work with find not with any of these  findOne, findOneAndDelete, findOneAndUpdate, etc
// tourSchema.pre('find', function(next) {
//   next();
// });

//NOTE : This is going to work with all the find queries like findOne, findOneAndDelete, findOneAndUpdate, etc
tourSchema.pre(/^find/, function(next) {
  this.find({ secret: { $ne: true } });
  next();
});

//NOTE  Don’t overuse the populate functions it can create performance issues
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});
// NOTE: This is a post middleware for all the find queries like findOne, findOneAndDelete, findOneAndUpdate, etc
// tourSchema.post(/^find/, function(docs, next) {
//   next();
// });

// NOTE you have another options here you can use this approach to hide the secret tours from the query
// tourSchema.pre('findOne', function(next) {});
// tourSchema.pre('find', function(next) {});

// NOTE: keep in mind that we also have to exclude the secret tours from the aggregation pipeline
// NOTE this code is commented so that we can run the geo query otherwise it will cause error view getDistances in tourController.js for more details
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secret: { $ne: true } } });
//   next();
// });
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
