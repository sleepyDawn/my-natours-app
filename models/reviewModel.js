const mongoose = require('mongoose');
// const { callbackPromise } = require('nodemailer/lib/shared');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty.'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user'],
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: '-guides name',
  // }).populate({
  //   path: 'user',
  //   select: '-_id name photo',
  // });

  this.populate({
    path: 'user',
    select: '-_id name photo',
  });
  next();
});

reviewSchema.statics.calcRatingsAverage = async function (tourId) {
  // this points toward reviewModel
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // console.log('checking stats: ', stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  // console.log('Checking the this keyword in pre-save hook', this);
  // this points to current review
  // console.log('CHECKING THE THIS. CONSTRUCTOR: ', this.constructor);

  this.constructor.calcRatingsAverage(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  console.log('checking review in pre : ', this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function (doc, next) {
  // console.log('checking doc', doc);
  // console.log('checking this in post hook', this);
  // await this.findOne() doesn't work here as query has already been executed
  await doc.constructor.calcRatingsAverage(doc.tour);
  next();
  // console.log('checking in post middleware!!');
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
