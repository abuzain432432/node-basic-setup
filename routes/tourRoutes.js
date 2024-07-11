const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');
const router = express.Router();

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

//NOTE Nested routes
router.get(
  '/tours-within/:distance/center/:latlng/unit/:unit',
  tourController.getToursWithin
);
router.get(
  '/distance/:latlng/unit/:unit',
  tourController.getDistances
);
router.route('/:id/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopFiveTours, tourController.getAllTours);

router.route('/stats').get(tourController.getTourStats);
router
  .route(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    '/monthly-plan/:year'
  )
  .get(tourController.getMonthPlans);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.parseTourProfilePhoto,
    tourController.resizeTourPhoto,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    tourController.deleteTour
  );

module.exports = router;
