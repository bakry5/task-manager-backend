# Task Manager - Backend

REST API for a team task board. Users create projects, invite members with
`admin` or `member` roles, and manage tasks inside each project.

## Tech Stack

- Node.js / Express
- MongoDB / Mongoose
- JWT authentication (Bearer token)
- express-validator for request validation
- Jest + Supertest for automated tests

## Getting Started

```bash
npm install
cp .env.example .env   # fill in your own values
npm run start:dev
```

Server runs on `http://localhost:8000` by default.

## Environment Variables

| Variable | Description |
| --- | --- |
| `NODE_ENV` | `development` / `production` / `test` |
| `PORT` | Port the server listens on |
| `DB_URI` | MongoDB connection string |
| `JWT_SECRET_KEY` | Secret used to sign JWTs |
| `JWT_EXPIRE_TIME` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Deployed frontend origin (used for reference/CORS) |

## Seed Data / Test Accounts

```bash
npm run seed
```

Creates two accounts in a shared "Demo Project" so you can review Admin vs
Member behavior immediately:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `password123` |
| Member | `member@example.com` | `password123` |

## Running Tests

```bash
npm test
```

26 automated tests across 7 suites. Since the sandbox this project was built
in has no network access to download a real MongoDB binary, the tests use
Jest mocks/spies on the Mongoose models instead of `mongodb-memory-server` -
this keeps the suite fast and fully offline while still exercising the real
Express routes, middleware chain, and authorization logic end to end via
Supertest. Pure logic (project membership helpers, `ApiError`, token
creation, task-modification rules) is covered with direct unit tests.

Covered:

- Signup/login validation and error cases
- Project membership access control (member vs non-member vs unauthenticated)
- Task creation, including a regression test for a validator bug where a
  browser's `Priority` request header collided with the `priority` body
  field (see "Design Decisions" below)
- Task modification permission rules (admin / creator / assignee vs everyone else)

## Project Structure

```
config/         mongoose connection
models/         User, Project, Task schemas
middlewares/    global error handler, express-validator wrapper
utils/          ApiError, JWT helper, request validators
services/       route handler logic (auth, project, task)
routes/         express routers, wiring validators + services
seed/           creates demo Admin/Member accounts and sample data
tests/          jest test suites
```

## Data Model

- **User**: name, email, hashed password, `role` (`admin` or `member`,
  defaults to `member`). The role lives directly on the user - it is a
  simple, global field, not something tracked per project.
- **Project**: name, description, owner, `members: [User]` - a plain list
  of member user ids. The creator is automatically added as a member.
- **Task**: title, description, status, priority, dueDate, `project`,
  `creator`, `assignee`. `assignee` must be a member of the task's project.

All authorization logic (who can view/edit/delete what) lives in the
`services/` layer as plain functions - the Mongoose models only define
schemas and stay free of business logic.

## API Overview

All routes are prefixed with `/api/v1`. Every route below except
signup/login requires `Authorization: Bearer <token>`.

**Auth**
- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`

**Projects**
- `POST /projects` - create a project (creator is added as a member)
- `GET /projects` - list projects the current user belongs to (admins see all)
- `GET /projects/:projectId` - must be a member, or a global admin
- `PUT /projects/:projectId` - project owner or a global admin
- `DELETE /projects/:projectId` - project owner or a global admin
- `POST /projects/:projectId/members` - global admin only, body `{ email }`
- `DELETE /projects/:projectId/members/:userId` - global admin only

**Tasks** (nested under a project, requester must be a project member)
- `POST /projects/:projectId/tasks`
- `GET /projects/:projectId/tasks` - supports `?status=`, `?priority=`, `?assignee=`
- `GET /projects/:projectId/tasks/:id`
- `PUT /projects/:projectId/tasks/:id` - admin, creator, or assignee only
- `DELETE /projects/:projectId/tasks/:id` - admin or creator only

A ready-to-import Postman collection is at `postman_collection.json`.

## Design Decisions

- **Bearer-token auth instead of cookies.** With the frontend and backend
  deployed as separate origins (e.g. two Vercel projects), cookie-based
  auth runs into cross-site cookie restrictions (`SameSite`, Safari ITP)
  and CORS credential edge cases. A stateless Bearer token avoids that
  class of problem entirely and keeps the API easy to test directly with
  Postman/curl.
- **`role` is a single, global field on the User model** (`admin` or
  `member`), not a per-project setting. This keeps the model and the
  authorization checks simple: `authService.allowedTo('admin')` is a
  one-line reusable middleware, and there is no separate "membership"
  schema to reason about. Member management (`POST`/`DELETE
  /projects/:projectId/members`) is restricted to global admins with this
  middleware.
- **Project update/delete is allowed for the project's owner or a global
  admin.** Any other project member can view and work with tasks inside
  the project but can't edit the project itself.
- **Task modification is allowed for a global admin, the task's creator,
  or its assignee.** Any other project member can view and filter tasks
  but not edit them.
- **No logic lives on the Mongoose models.** `models/` only defines
  schemas and fields (plus the bcrypt password-hashing hook, which has to
  live on the schema to run automatically on save). Every authorization
  decision (`isProjectMember`, `canManageProject`, `canModifyTask`,
  `allowedTo`) is a plain function in `services/`, so the logic is easy to
  find, read top-to-bottom, and unit test in isolation.
- express-validator's `check()` implicitly reads from body, query, params,
  *and headers*, which caused a real bug in an earlier project (a
  browser's `Priority` header collided with a `priority` body field). All
  validators here use explicit `body()`/`param()` to avoid that entirely.

## Known Limitations

- No project-level activity/audit log.
- No real-time updates (WebSockets) - clients need to re-fetch after changes.
- No pagination on task/project lists yet.

## AI Tools Disclosure

AI tools (e.g. Claude) were used to help write clear and consistent commit
messages, and to help draft this README. All code, architecture decisions,
and implementation were written and reviewed manually.
