// https://dashboard.stripe.com/test/logs  //NOTE you can view the loogs related to any stripe request heres
const Tour = require('../modals/tourModal');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../modals/bookingModal');
const factory = require('./factory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tourId = req.params.tourId;
  const tour = await Tour.findOne({ _id: tourId });
  if (!tour) {
    next(AppError('Tour not found', 404));
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?price=${
      tour.price
    }&tourId=${tour._id}&userId=${req.user._id}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tours/${
      tour.slug
    }`,
    customer_email: req.user.email,

    metadata: {
      tourId: tour._id.toString(),
    },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: tour.name,
            images: [`https://www.natours.dev/${tour.imageCover}`],
            description: tour.summary,
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  });
  res.json({
    status: 'success',
    session,
  });
});

exports.getMyBookedTours = catchAsync(async (req, res, next) => {
  const tours = await Booking.find({ user: req.user._id }).populate(
    'tour'
  );
  res.json({ status: 'success', tours });
});

exports.getAllBookings = factory.getAll(Booking);
exports.createBooking = factory.createOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
