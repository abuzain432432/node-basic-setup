const Tour = require('../modals/tourModal');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Booking = require('../modals/bookingModal');

exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'overview',
    tours,
  });
});
exports.getMyBookedTours = catchAsync(async (req, res, next) => {
  const tours = await Booking.find({ user: req.user._id }).populate(
    'tour'
  );
  const myTours = tours.map(tour => tour.tour);
  res.status(200).render('overview', {
    title: 'My Tours',
    tours: myTours,
  });
});

exports.getTourDetails = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({
    slug: req.params?.slug,
  }).populate({ path: 'reviews', fields: 'review rating user' });
  if (!tour) {
    return next(new AppError('No tour found with that name', 404));
  }
  res.status(200).render('tour', {
    tour,
    title: tour.name,
  });
});
exports.login = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: 'Login',
  });
});
exports.account = catchAsync(async (req, res) => {
  res.status(200).render('account', {
    title: 'Account',
  });
});
