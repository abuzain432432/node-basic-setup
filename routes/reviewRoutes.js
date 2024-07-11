const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// NOTE by default, each router only has access to parameters of their specific routes. To access parameters from other routers, we need to set mergeParams to true.
const router = express.Router({ mergeParams: true });

// NOTE: Protect all routes after this middleware
router.use(authController.protect);
router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setUserTourIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    reviewController.deleteReview
  )
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    reviewController.updateReview
  );

module.exports = router;
