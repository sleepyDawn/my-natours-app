const stripe = require('stripe')(
  'sk_test_51HmxQZEIBiWRqXwIpeYUm7NSTpkAfifidqrW7HSQ2AGILdWvU1gxsK4POnCXty0YKxAt2lrLppnWrAgPCM7NXG6v007AL5Zj3s'
);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
// const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. Get Currently booked Tour
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) return next(new AppError('No Tour found', 400));

  // 2. Create Checkout session
  const session = await stripe.checkout.sessions.create({
    // All the fields name below come from stripe
    payment_method_types: ['card'],
    // not secure at all this success url till now
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user._id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });
  // 3. Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only temporary, because it is unsafe: everyone can make booking withiout paying.
  const { tour, user, price } = req.query;
  if (!tour || !user || !price) return next();

  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
