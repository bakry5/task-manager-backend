const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/userModel');
const Project = require('../models/projectModel');
const Task = require('../models/taskModel');
const createToken = require('../utils/createToken');

describe('Task creation', () => {
  const memberId = new mongoose.Types.ObjectId();
  const outsiderId = new mongoose.Types.ObjectId();
  const projectId = new mongoose.Types.ObjectId();

  const project = new Project({
    _id: projectId,
    name: 'Team Board',
    owner: memberId,
    members: [memberId],
  });

  afterEach(() => jest.restoreAllMocks());

  const authAs = (userId, role = 'member') => {
    jest.spyOn(User, 'findById').mockResolvedValue({ _id: userId, role });
    return `token=${createToken(userId)}`;
  };

  test('a project member can create a task', async () => {
    jest.spyOn(Project, 'findById').mockResolvedValue(project);
    jest.spyOn(Task, 'create').mockResolvedValue({ _id: 'task1', title: 'Ship feature' });
    const token = authAs(memberId);

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Cookie', token)
      .send({ title: 'Ship feature', priority: 'High' });

    expect(res.status).toBe(201);
  });

  test('rejects an invalid priority value in the body', async () => {
    jest.spyOn(Project, 'findById').mockResolvedValue(project);
    const token = authAs(memberId);

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Cookie', token)
      .send({ title: 'Ship feature', priority: 'Urgent' });

    expect(res.status).toBe(400);
  });

  test('a browser-sent Priority header does not affect body validation (regression)', async () => {
    jest.spyOn(Project, 'findById').mockResolvedValue(project);
    jest.spyOn(Task, 'create').mockResolvedValue({ _id: 'task1', title: 'Ship feature' });
    const token = authAs(memberId);

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Cookie', token)
      .set('Priority', 'u=1, i')
      .send({ title: 'Ship feature', priority: 'Low' });

    expect(res.status).toBe(201);
  });

  test('a non-member cannot create a task in the project', async () => {
    jest.spyOn(Project, 'findById').mockResolvedValue(project);
    const token = authAs(outsiderId);

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Cookie', token)
      .send({ title: 'Ship feature' });

    expect(res.status).toBe(403);
  });
});
