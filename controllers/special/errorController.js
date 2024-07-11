const AppError = require('../../utils/appError');

const developmentError = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    const statusCode = err.statusCode || 500;
    const status = err.status || 'error';

    return res.status(statusCode).json({
      status: status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }
  return res.status(200).render('error', {
    message: err.message,
    title: 'Error',
  });
};
const productionsError = (err, req, res) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(statusCode).json({
        status: status,
        message: err.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Something unexpected happens',
    });
  }
  if (err.isOperational) {
    return res.status(statusCode).render('error', {
      message: err.message,
      title: 'Error',
    });
  }
  return res.status(500).render('error', {
    message: 'Something unexpected happens',
    title: 'Error',
  });
};

const dbCastError = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const dbDuplicateFieldError = err => {
  const fieldDetails = Object.entries(err.keyValue);
  const filedName = fieldDetails[0].length
    ? fieldDetails[0][0]
    : 'Unknown field name';
  const filedValue = fieldDetails[0].length
    ? fieldDetails[0][1]
    : 'Unknown field name';
  const message = `Duplicate ${filedName}: value (${filedValue}) `;
  return new AppError(message, 400);
};
const dbValidationError = err => {
  let message = Object.values(err.errors)
    .map(el => el.message)
    .join('. ');
  message = `Invalid input. ${message}`;
  return new AppError(message, 400);
};
const invalidJwtError = () => {
  return new AppError('Invalid token. Please login again', 401);
};
const expiredJwtError = () => {
  return new AppError('Token expired. Please login again', 401);
};

const errorController = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development')
    developmentError(err, req, res);
  else if (process.env.NODE_ENV === 'production') {
    let error = {
      ...err,
      message: err.message,
    };
    if (
      error.name === 'CastError' ||
      err?.reason?.toString()?.startsWith('BSONError:')
    ) {
      error = dbCastError(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = invalidJwtError(error);
    }
    if (error.name === 'TokenExpiredError') {
      error = expiredJwtError(error);
    }
    if (error?.code === 11000) {
      error = dbDuplicateFieldError(error);
    }
    if (error?.errors) {
      error = dbValidationError(error);
    }
    productionsError(error, req, res);
  }

  next();
};

module.exports = errorController;
