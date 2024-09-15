const ErrorHandler = require("../utils/errorhandler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  //Wrong Mongoose object ID Error
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    error = new ErrorHandler(message, 400);
  }

  //Handling Mongoose Validation Error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((value) => value.message);
    error = new ErrorHandler(message, 400);
  }

  //Handling Mongoose duplicate Key Error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    error = new ErrorHandler(message, 400);
  }

  //Handling wrong JWT error
  if (err.name === "JsonWebTokenError") {
    const message = "JSON Web TOken is invalid.Try Again!!!";
    error = new ErrorHandler(message, 400);
  }

  //Handling Expired JWT token
  if (err.name === "TokenExpiredError") {
    const message = "JSON Web TOKEN is expired.Try Again";
    error = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    error: err.message,
  });
};
