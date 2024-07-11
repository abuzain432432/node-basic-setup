const express = require('express');
const morgan = require('morgan');
const rateLimiter = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewsRoutes');
const cookieParser = require('cookie-parser');
const globalErrorController = require('./controllers/special/errorController');
const notFoundController = require('./controllers/special/notFoundController');
const hpp = require('hpp');
const path = require('path');
const app = express();
const cors = require('cors');
const compression = require('compression'); //NOTE this package is used for compressing text response of controllers

const limiter = rateLimiter({
  windowMs: 60 * 1000, // 60 minutes
  // windowMs: 60 * 60 * 1000, // 60 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

// NOTE set security HTTP headers
app.use(helmet()); //This middleware must be at the top of the middleware stack

// NOTE enabling cross origin sharing
app.use(cors());
app.options('*', cors()); //This is required for preflight request sent by browsers

//NOTE  logging middleware for development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// NOTE  rate limiter middleware
app.use(limiter);
app.use(compression());
// NOTE body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' })); //NOTE extends allow to send nested objects in the request body
app.use(cookieParser());

// NOTE Data sanitization against NoSQL query injection // NOTE : This middleware will replace the dollar sign and dot in the request query and it must be after the body parser
app.use(
  mongoSanitize({
    replaceWith: '_',
  })
);

// NOTE Data sanitization against XSS  make sure this comes before any routes it will sanitize the data coming in the body, params and query string of the request object and it will remove all the malicious html code from the data and it will convert the html code to html entities so that it will not be executed by the browser and it will be displayed as a text in the browser and it will not be executed as a script
app.use(xss());

// NOTE Prevent parameter pollution This middleware will remove duplicate query parameters from the request query string and it will only allow one value for each query parameter and it will only allow one value for each query parameter and it will also remove the duplicate fields in the request body
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// NOTE serving static files
app.use(express.static(path.join(__dirname, 'public')));
// ! ///////////////  SERVER SIDE RENDERING STUFF/////////////////////////////////
//  setting the template engine and the views directory
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); // using the path  is required to prevent comment bugs like extra slashes and dots

// ! /////////////////////////////////////////////////

// NOTE ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// NOTE : This must be at the end .This is a catch all route handler to handle all the routes that we haven't handled in our application
app.all('*', notFoundController);
app.use(globalErrorController);
module.exports = app;
