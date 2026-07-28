const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const mongoose = require('mongoose');
const User = require('../models/userModel');
const Project = require('../models/projectModel');
const Task = require('../models/taskModel');

const run = async () => {
  await mongoose.connect(process.env.DB_URI);

  await User.deleteMany({ email: { $in: ['admin@example.com', 'member@example.com'] } });

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
  });

  const member = await User.create({
    name: 'Member User',
    email: 'member@example.com',
    password: 'password123',
  });

  const project = await Project.create({
    name: 'Demo Project',
    description: 'Seeded project for reviewing the app',
    owner: admin._id,
    members: [admin._id, member._id],
  });

  await Task.create([
    {
      title: 'Set up project board',
      description: 'Create the initial columns and invite the team',
      status: 'Done',
      priority: 'Medium',
      project: project._id,
      creator: admin._id,
      assignee: admin._id,
    },
    {
      title: 'Write onboarding docs',
      description: 'Draft the onboarding guide for new members',
      status: 'In Progress',
      priority: 'High',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      project: project._id,
      creator: admin._id,
      assignee: member._id,
    },
  ]);

  console.log('Seed complete');
  console.log('Admin login: admin@example.com / password123');
  console.log('Member login: member@example.com / password123');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
