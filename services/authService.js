const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const ApiError = require('../utils/apiError');
const createToken = require('../utils/createToken');

const isDeployed = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

const cookieOptions = {
  httpOnly: true,
  secure: isDeployed,
  sameSite: isDeployed ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

exports.signup = asyncHandler(async (req, res, next) => {
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return next(new ApiError('Email already in use', 400));
  }

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });

  const token = createToken(user._id);
  res.cookie('token', token, cookieOptions);
  res.status(201).json({ data: user });
});

exports.login = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  const isCorrectPassword = user && (await bcrypt.compare(req.body.password, user.password));

  if (!isCorrectPassword) {
    return next(new ApiError('Incorrect email or password', 401));
  }

  const token = createToken(user._id);
  res.cookie('token', token, cookieOptions);
  res.status(200).json({ data: user });
});

exports.logout = asyncHandler(async (req, res) => {
  const { maxAge, ...clearOptions } = cookieOptions;
  res.clearCookie('token', clearOptions);
  res.status(200).json({ status: 'Success' });
});

exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ data: req.user });
});

exports.protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return next(new ApiError('You are not logged in, please login to get access', 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  const currentUser = await User.findById(decoded.userId);
  if (!currentUser) {
    return next(new ApiError('The user belonging to this token no longer exists', 401));
  }

  req.user = currentUser;
  next();
});

exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError('You are not allowed to access this route', 403));
    }
    next();
  });
