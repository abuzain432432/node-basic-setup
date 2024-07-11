const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const crypto = require('crypto');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please input your name'],
  },
  email: {
    type: String,
    required: [true, 'Please input your email'],
    unique: true,
    validate: [validator.isEmail, 'Please input a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  password: {
    type: String,
    required: [true, 'Please input your password'],
    minLength: [8, 'Password must be at least 8 characters long'],
    select: false,
  },
  role: {
    type: String,
    default: 'user',
    enum: {
      values: ['user', 'admin', 'guide', 'lead-guide'],
      message: 'Role is either: user, admin, lead-guide, guide',
    },
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(val) {
        return val === this.password;
      },
      message: 'Passwords do not match',
    },
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  deleted: {
    type: Boolean,
    default: false,
    select: false,
  },
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);

  // NOTE: Setting passwordConfirm to undefined before saving is intentional.
  // This field is required for input validation but is removed before saving to the database
  // for security reasons. This does not affect its 'required' status for input validation.

  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  // Set passwordChangedAt to a time slightly earlier than the actual password change time
  // This ensures that any tokens issued before the password change are considered invalid.
  // some time saving data to db is slower than issuing token so we need to make sure that the token is issued after the password is changed
  this.passwordChangedAt = Date.now() - 1000;
  next();
});
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(`${candidatePassword}`, userPassword);
};
userSchema.methods.passwordChangedAfter = function(JWTTimestamp) {
  // NOTE : The passwordChangedAt field is not available for new users meaning password has not been changed yet
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ deleted: { $ne: true } });
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
