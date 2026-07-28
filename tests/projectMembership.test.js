const mongoose = require('mongoose');
const Project = require('../models/projectModel');
const { isProjectMember } = require('../services/projectService');

describe('isProjectMember', () => {
  const memberId = new mongoose.Types.ObjectId();
  const strangerId = new mongoose.Types.ObjectId();

  const project = new Project({
    name: 'Test Project',
    owner: memberId,
    members: [memberId],
  });

  test('is true for a listed member', () => {
    expect(isProjectMember(project, memberId)).toBe(true);
  });

  test('is false for a user outside the project', () => {
    expect(isProjectMember(project, strangerId)).toBe(false);
  });
});
