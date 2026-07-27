const { body, param } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.createProjectValidator = [
  body('name')
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ min: 3 })
    .withMessage('Too short project name'),

  body('description').optional().isString(),

  validatorMiddleware,
];

exports.projectIdValidator = [
  param('projectId').isMongoId().withMessage('Invalid project id format'),
  validatorMiddleware,
];

exports.updateProjectValidator = [
  param('projectId').isMongoId().withMessage('Invalid project id format'),
  body('name').optional().isLength({ min: 3 }).withMessage('Too short project name'),
  body('description').optional().isString(),
  validatorMiddleware,
];

exports.addMemberValidator = [
  param('projectId').isMongoId().withMessage('Invalid project id format'),
  body('email').isEmail().withMessage('A valid member email is required'),
  validatorMiddleware,
];

exports.removeMemberValidator = [
  param('projectId').isMongoId().withMessage('Invalid project id format'),
  param('userId').isMongoId().withMessage('Invalid user id format'),
  validatorMiddleware,
];
