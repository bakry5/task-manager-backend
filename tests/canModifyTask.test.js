const mongoose = require('mongoose');
const { canModifyTask } = require('../services/taskService');

describe('canModifyTask', () => {
  const creatorId = new mongoose.Types.ObjectId();
  const assigneeId = new mongoose.Types.ObjectId();
  const outsiderId = new mongoose.Types.ObjectId();

  const task = { creator: creatorId, assignee: assigneeId };

  test('allows a global admin', () => {
    expect(canModifyTask(task, { _id: outsiderId, role: 'admin' })).toBe(true);
  });

  test('allows the task creator', () => {
    expect(canModifyTask(task, { _id: creatorId, role: 'member' })).toBe(true);
  });

  test('allows the assignee', () => {
    expect(canModifyTask(task, { _id: assigneeId, role: 'member' })).toBe(true);
  });

  test('denies unrelated members', () => {
    expect(canModifyTask(task, { _id: outsiderId, role: 'member' })).toBe(false);
  });
});
