const AppError = require('../utils/AppError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate field value: ${Object.values(
    err.keyValue
  )}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input Data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJsonWebTokenError = () =>
  new AppError('Invalid Token. Please login again!', 401);

const handleTokenExpiredError = () =>
  new AppError('Your token hasexpired. Please Login again!', 401);

const sendErrorDev = (err, req, res) => {
  // A. FOR API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // B. FOR RENDERED WEBSITE
  console.error('ERROR(System created Error): ', err);
  res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // A. FOR API

  if (req.originalUrl.startsWith('/api')) {
    // Trusted operational error sent to client with actual details
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      // Programming or other unknown error that we don't want to leak to clients
    }
    // 1. Log error;
    console.error('ERROR(System created Error): ', err);

    // 2. Send Generic ERROR
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }

  // B. FOR RENDERED WEBSITE
  if (err.isOperational) {
    // Trusted operational error sent to client with actual details
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
    // Programming or other unknown error that we don't want to leak to clients
  } else {
    // 1. Log error;
    console.error('ERROR(System created Error): ', err);

    // 2. Send Generic ERROR
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: 'Please try again later',
    });
  }
};

module.exports = (err, req, res, next) => {
  // console.log('checking error properties _messsage: ', err._message);
  //   console.log(err.stack); //To track the entire call stack current error available from builtin error class

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.isOperational) {
      sendErrorProd(err, req, res);
    } else {
      let { ...error } = err;
      error.message = err.message;
      // console.log('checking error.name: ', error);
      if (err.name === 'CastError') error = handleCastErrorDB(error);
      if (err.code === 11000) error = handleDuplicateFieldsDB(error);
      if (err._message && err._message.includes('validation failed'))
        error = handleValidationErrorDB(error);
      if (err.name === 'JsonWebTokenError') error = handleJsonWebTokenError();
      if (error.name === 'TokenExpiredError') error = handleTokenExpiredError();

      sendErrorProd(error, req, res);
    }
  }
};
