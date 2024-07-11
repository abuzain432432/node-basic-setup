const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const router = express.Router();
router.get(
  '/',
  authController.isLoggedIn,
  viewsController.getOverview
);
router.get(
  '/my-tours',
  authController.protect,
  viewsController.getMyBookedTours
);
router.get(
  '/tours/:slug',
  authController.isLoggedIn,
  viewsController.getTourDetails
);
router.get(
  '/login',
  authController.isLoggedIn,
  viewsController.login
);
router.get(
  '/account',
  authController.protect,
  viewsController.account
);
module.exports = router;
