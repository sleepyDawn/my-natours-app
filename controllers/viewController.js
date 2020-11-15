const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  //1. Get tour data from collection
  const tours = await Tour.find();
  //2. Build template

  //3. Render that template using tour data from 1.
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1. Get the data for the requested tour (including reviews and guides)
  // console.log('checking params: ', req.params.tourSlug);
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  // console.log('checking Tour: ', tour);

  if (!tour) {
    return next(new AppError('No tour Found!!', 404));
  }
  // 2. Build the template
  // 3. Render template using data from 1.

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1. Find all bookings

  const bookings = await Booking.find({ user: req.user._id });
  // console.log('checking my bookings: ', bookings);

  const tourIds = bookings.map((el) => el.tour._id);
  // console.log('checking tourIds : ', tourIds);
  const tours = await Tour.find({ _id: { $in: tourIds } });
  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });

  // 2. Find tours with the returned IDs
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  // console.log('checking form body: ', req.body);  //checking the form
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});
