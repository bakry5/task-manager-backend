const express = require('express');
const {
  createTaskValidator,
  taskIdValidator,
  updateTaskValidator,
} = require('../utils/validators/taskValidator');
const taskService = require('../services/taskService');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .post(createTaskValidator, taskService.createTask)
  .get(taskService.getTasks);

router
  .route('/:id')
  .get(taskIdValidator, taskService.loadTask, taskService.getTask)
  .put(updateTaskValidator, taskService.loadTask, taskService.updateTask)
  .delete(taskIdValidator, taskService.loadTask, taskService.deleteTask);

module.exports = router;
