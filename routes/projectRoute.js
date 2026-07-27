const express = require('express');
const {
  createProjectValidator,
  projectIdValidator,
  updateProjectValidator,
  addMemberValidator,
  removeMemberValidator,
} = require('../utils/validators/projectValidator');
const authService = require('../services/authService');
const projectService = require('../services/projectService');
const taskRoute = require('./taskRoute');

const router = express.Router();

router.use(authService.protect);

router.use('/:projectId/tasks', projectIdValidator, projectService.loadProject, taskRoute);

router
  .route('/')
  .post(createProjectValidator, projectService.createProject)
  .get(projectService.getProjects);

router
  .route('/:projectId')
  .get(projectIdValidator, projectService.loadProject, projectService.getProject)
  .put(updateProjectValidator, projectService.loadProject, projectService.updateProject)
  .delete(projectIdValidator, projectService.loadProject, projectService.deleteProject);

router
  .route('/:projectId/members')
  .post(
    addMemberValidator,
    projectService.loadProject,
    authService.allowedTo('admin'),
    projectService.addMember
  );

router
  .route('/:projectId/members/:userId')
  .delete(
    removeMemberValidator,
    projectService.loadProject,
    authService.allowedTo('admin'),
    projectService.removeMember
  );

module.exports = router;
