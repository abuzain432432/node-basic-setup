const AppError = require('../../utils/appError');

const notFoundController = (req, res, next) => {
  next(
    new AppError(`Can't find ${req.originalUrl} on this server!`, 404)
  );
};
module.exports = notFoundController;
