const asyncHandler = require('express-async-handler');
const Task = require('../models/taskModel');
const ApiError = require('../utils/apiError');
const { isProjectMember } = require('./projectService');

const userFields = 'name email role';

exports.createTask = asyncHandler(async (req, res, next) => {
  if (req.body.assignee && !isProjectMember(req.project, req.body.assignee)) {
    return next(new ApiError('Assignee must be a member of this project', 400));
  }

  const task = await Task.create({
    title: req.body.title,
    description: req.body.description,
    status: req.body.status,
    priority: req.body.priority,
    dueDate: req.body.dueDate,
    assignee: req.body.assignee || null,
    project: req.project._id,
    creator: req.user._id,
  });

  await task.populate('creator', userFields);
  await task.populate('assignee', userFields);

  res.status(201).json({ data: task });
});

exports.getTasks = asyncHandler(async (req, res) => {
  const filter = { project: req.project._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.assignee) filter.assignee = req.query.assignee;

  const tasks = await Task.find(filter)
    .sort('-createdAt')
    .populate('creator', userFields)
    .populate('assignee', userFields);
  res.status(200).json({ results: tasks.length, data: tasks });
});

exports.loadTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findOne({ _id: req.params.id, project: req.project._id });
  if (!task) {
    return next(new ApiError('No task found with this id', 404));
  }
  req.task = task;
  next();
});

exports.getTask = asyncHandler(async (req, res) => {
  await req.task.populate('creator', userFields);
  await req.task.populate('assignee', userFields);
  res.status(200).json({ data: req.task });
});

const canModifyTask = (task, user) =>
  user.role === 'admin' ||
  task.creator.toString() === user._id.toString() ||
  (task.assignee && task.assignee.toString() === user._id.toString());

exports.canModifyTask = canModifyTask;

exports.updateTask = asyncHandler(async (req, res, next) => {
  if (!canModifyTask(req.task, req.user)) {
    return next(new ApiError('You are not allowed to modify this task', 403));
  }

  if (req.body.assignee && !isProjectMember(req.project, req.body.assignee)) {
    return next(new ApiError('Assignee must be a member of this project', 400));
  }

  const fields = ['title', 'description', 'status', 'priority', 'dueDate', 'assignee'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) req.task[field] = req.body[field];
  });

  await req.task.save();
  await req.task.populate('creator', userFields);
  await req.task.populate('assignee', userFields);
  res.status(200).json({ data: req.task });
});

exports.deleteTask = asyncHandler(async (req, res, next) => {
  const isCreatorOrAdmin =
    req.user.role === 'admin' || req.task.creator.toString() === req.user._id.toString();

  if (!isCreatorOrAdmin) {
    return next(new ApiError('You are not allowed to delete this task', 403));
  }

  await req.task.deleteOne();
  res.status(204).send();
});
