const catchAsync = require('../utils/catchAsync');
const User = require('../modals/userModal');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = (user, status, res) => {
  const token = signToken(user._id);
  user.password = undefined;
  user.passwordChangedAt = undefined;
  user.__v = undefined;
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // NOTE: cookie cannot be accessed or modified in any way by the browser
  };

  if (process.env.NODE_ENV === 'production')
    cookieOptions.secure = true; // NOTE: secure cookies are only sent over HTTPS

  res.cookie('jwt', token, cookieOptions);
  res.status(status).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const userDetails = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  };
  const newUser = await User.create(userDetails);
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email }).select(
    '+password'
  );

  if (!req.body.email || !req.body.password) {
    return next(
      new AppError('Please input your email and password', 404)
    );
  }

  if (!user) {
    return next(
      new AppError(
        'No user registered with this email or password',
        404
      )
    );
  }
  const isPasswordMatched = await user.correctPassword(
    req.body.password,
    user.password
  );
  if (!isPasswordMatched) {
    return next(new AppError('Invalid email or password', 401));
  }
  createSendToken(user, 200, res);
});
exports.logout = async (req, res) => {
  res.cookie('jwt', '__Logout__', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
    data: null,
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers?.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req?.cookies?.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError(
        'You are not logged in. Please login to get access',
        401
      )
    );
  }
  // Verify token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError(
        'The user belonging to this token does not exist',
        401
      )
    );
  }
  if (freshUser.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError(
        'User recently changed password. Please login again',
        401
      )
    );
  }
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = freshUser;
  res.locals.user = freshUser;

  next();
});
exports.isLoggedIn = async (req, res, next) => {
  let token;
  try {
    if (!req?.cookies?.jwt) return next();

    token = req.cookies.jwt;
    // Verify token
    const decoded = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET
    );
    const freshUser = await User.findById(decoded.id);

    if (!freshUser || freshUser.passwordChangedAfter(decoded.iat)) {
      return next();
    }

    // Express add the variables in the filed locals in the res object so we can add this manually so that use it withing pug file
    res.locals.user = freshUser;
    next();
  } catch (err) {
    return next();
  }
};

exports.restrictTo = function(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You don't have permission to perform this action",
          403
        )
      );
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user with this email', 404));
  }
  const resetToken = user.createPasswordResetToken();
  // NOTE we need to bypass the validations logic because we have reset the passwordConfirm in the middleware and when we try to save the user it will throw an error because passwordConfirm is required so we need to bypass the validators
  await user.save({ validateBeforeSave: false });
  try {
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/reset-password/${resetToken}`;
    new Email(user, resetUrl).sendForgetPassword();

    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 minutes)',
    //   message,
    // });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
  res.status(200).json({
    status: 'success',
    message: 'Token sent to email',
  });
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  const isPasswordMatched = await user.correctPassword(
    req.body.password,
    user.password
  );
  if (!isPasswordMatched) {
    return next(new AppError('Invalid password', 401));
  }

  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  createSendToken(user, 200, res);
});
