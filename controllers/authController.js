const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');

const signToken = (_id) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { _id },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
      (err, createdToken) => {
        if (err) {
          reject(err);
        }
        resolve(createdToken);
      }
    );
  });
};

const createSendToken = async (user, statusCode, res) => {
  const token = await signToken(user._id);
  // console.log('checking creation of token......', token);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  if (user) {
    user.password = undefined;
    user.passwordChangedAt = undefined;
  }

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // this type of saving to avoid user to manually input a role
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    photo: req.body.photo,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    // role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log('checking the url for email: ', url);
  await new Email(newUser, url).sendWelcome();

  await createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //   1.check if email and password is exists
  if (!email || !password)
    return next(new AppError('please provide Email and password!', 400));

  // check if user exists && password is correct

  const user = await User.findOne({ email }).select('+password');
  //   We are using select method to select password which is permanently unselected in user model

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect email or password!', 401));

  // 3. if everything ok, send token to client
  await createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // console.log('checking protech function');
  // 1. Getting token and check if it is there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // console.log('checking sign in  token: ', token);
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // console.log('checking token: ', token);
  // 2. VERIFIVATION validate token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log('checking decoded data: ', decoded);

  // 3. Check if user still exists
  const currentUser = await User.findById(decoded._id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token does no longer exist', 401)
    );
  }

  // 4. Check if user changes password after the token was issued
  if (currentUser.changesPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please login again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  // console.log('checking current user: ', currentUser);
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles = ['admin', 'lead-guide'], role='user'
    // console.log('checking role in restrictTO dunction: ', req.currentUser);
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permissoin to perform this action', 401)
      );
    }

    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2.Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
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
    message: 'Token sent to email!',
  });
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // console.log('cheking current date Time : ', Date.now());

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // console.log('checdking users: ', user);

  // 2. If token has not expired, and ther is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // console.log('checking after save:::', Date.now());

  // 3. Update the change password property for the user in pre middleware function with save hook in userModel
  // log the user in, send JWT

  // console.log('checking after token creation:::', Date.now());
  await createSendToken(user, 200, res);
});

// For logged in user
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from collection
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    return next(new AppError('No user available with given id', 400));
  }
  // console.log('checking user in update password: ', user);

  // 2. check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  user.password = req.body.passwordNew;
  user.passwordConfirm = req.body.passwordConfirmNew;
  await user.save(); //User.findByIdAndUpdate won't work indeed
  // 3. If the password is correct then update the password

  // 4. log in the user, send jwt
  await createSendToken(user, 200, res);
});

// Only for rendered pages, no Error
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 2. VERIFIVATION validate token

      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // console.log('checking decoded data: ', decoded);

      // 3. Check if user still exists
      const currentUser = await User.findById(decoded._id);
      if (!currentUser) {
        return next();
      }

      // 4. Check if user changes password after the token was issued
      if (currentUser.changesPasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a logged in user
      // Making available the user data to our pug template
      res.locals.user = currentUser;
      return next();
      // console.log('checking current user: ', currentUser);
    } catch (err) {
      return next();
    }
  }
  next();
};
