const asyncHandler = require('express-async-handler');
const Project = require('../models/projectModel');
const Task = require('../models/taskModel');
const User = require('../models/userModel');
const ApiError = require('../utils/apiError');

const memberFields = 'name email role';

const isProjectMember = (project, userId) =>
  project.members.some((memberId) => memberId.toString() === userId.toString());

exports.isProjectMember = isProjectMember;

const canManageProject = (project, user) =>
  user.role === 'admin' || project.owner.toString() === user._id.toString();

exports.createProject = asyncHandler(async (req, res) => {
  const project = await Project.create({
    name: req.body.name,
    description: req.body.description,
    owner: req.user._id,
    members: [req.user._id],
  });

  await project.populate('owner', memberFields);
  await project.populate('members', memberFields);

  res.status(201).json({ data: project });
});

exports.getProjects = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { members: req.user._id };
  const projects = await Project.find(filter)
    .sort('-createdAt')
    .populate('owner', memberFields)
    .populate('members', memberFields);
  res.status(200).json({ results: projects.length, data: projects });
});

exports.loadProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) {
    return next(new ApiError('No project found with this id', 404));
  }

  if (req.user.role !== 'admin' && !isProjectMember(project, req.user._id)) {
    return next(new ApiError('You do not have access to this project', 403));
  }

  req.project = project;
  next();
});

exports.getProject = asyncHandler(async (req, res) => {
  await req.project.populate('owner', memberFields);
  await req.project.populate('members', memberFields);
  res.status(200).json({ data: req.project });
});

exports.updateProject = asyncHandler(async (req, res, next) => {
  if (!canManageProject(req.project, req.user)) {
    return next(new ApiError('You are not allowed to update this project', 403));
  }

  if (req.body.name !== undefined) req.project.name = req.body.name;
  if (req.body.description !== undefined) req.project.description = req.body.description;
  await req.project.save();
  await req.project.populate('owner', memberFields);
  await req.project.populate('members', memberFields);
  res.status(200).json({ data: req.project });
});

exports.deleteProject = asyncHandler(async (req, res, next) => {
  if (!canManageProject(req.project, req.user)) {
    return next(new ApiError('You are not allowed to delete this project', 403));
  }

  await Task.deleteMany({ project: req.project._id });
  await req.project.deleteOne();
  res.status(204).send();
});

exports.addMember = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ApiError('No user found with this email', 404));
  }

  if (isProjectMember(req.project, user._id)) {
    return next(new ApiError('User is already a project member', 400));
  }

  req.project.members.push(user._id);
  await req.project.save();
  await req.project.populate('owner', memberFields);
  await req.project.populate('members', memberFields);
  res.status(201).json({ data: req.project });
});

exports.removeMember = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  if (!isProjectMember(req.project, userId)) {
    return next(new ApiError('This user is not a member of the project', 404));
  }

  req.project.members = req.project.members.filter((id) => id.toString() !== userId);
  await req.project.save();
  await req.project.populate('owner', memberFields);
  await req.project.populate('members', memberFields);
  res.status(200).json({ data: req.project });
});
