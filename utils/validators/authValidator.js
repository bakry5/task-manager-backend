const { body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.signupValidator = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3 })
    .withMessage('Too short user name'),

  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  validatorMiddleware,
];

exports.loginValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address'),

  body('password').notEmpty().withMessage('Password is required'),

  validatorMiddleware,
];
