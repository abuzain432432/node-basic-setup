const bookingController = require('../controllers/bookingController');
const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
router.use(authController.protect);
router.route('/my-bookings').get(bookingController.getMyBookedTours);
router
  .route('/checkout-session/:tourId')
  .get(bookingController.getCheckoutSession);

router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .delete(bookingController.deleteBooking)
  .patch(bookingController.updateBooking);

module.exports = router;
