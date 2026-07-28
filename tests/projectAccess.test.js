const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/userModel');
const Project = require('../models/projectModel');
const createToken = require('../utils/createToken');

describe('Project access control', () => {
  const memberId = new mongoose.Types.ObjectId();
  const outsiderId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
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

  test('a project member can view the project', async () => {
    jest.spyOn(Project, 'findById').mockResolvedValue(project);
    const token = authAs(memberId);

    const res = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Cookie', token);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Team Board');
  });

  test('a non-member is forbidden from viewing the project', async () => {
    jest.spyOn(Project, 'findById').mockResolvedValue(project);
    const token = authAs(outsiderId);

    const res = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Cookie', token);

    expect(res.status).toBe(403);
  });

  test('a global admin can view a project they are not a member of', async () => {
    jest.spyOn(Project, 'findById').mockResolvedValue(project);
    const token = authAs(outsiderId, 'admin');

    const res = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Cookie', token);

    expect(res.status).toBe(200);
  });

  test('an unauthenticated request is rejected', async () => {
    const res = await request(app).get(`/api/v1/projects/${projectId}`);
    expect(res.status).toBe(401);
  });
});
