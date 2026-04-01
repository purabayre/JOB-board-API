# Project 1 — Job Board REST API

## Overview

Build a fully functional **Job Board REST API** where employers can post jobs and candidates can apply with resume uploads. This project covers the full REST API lifecycle with role-based authentication, file handling, and email notifications — all core topics from the course.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens) |
| File Storage | Local disk via `multer` |
| Email | `nodemailer` (use Mailtrap for dev) |
| PDF | `pdfkit` — generate application receipts |
| Validation | `express-validator` |

---

## Functional Requirements

### Auth (`/api/auth`)
- `POST /register` — register as `employer` or `candidate` (role passed in body)
- `POST /login` — returns `accessToken` (15min) + `refreshToken` (7d) in httpOnly cookie
- `POST /refresh` — issue new access token using refresh token
- `POST /logout` — clear refresh token cookie

### Employer Routes (`/api/jobs`) — requires `employer` role
- `POST /` — create a job posting (title, description, location, salary range, deadline, tags)
- `PUT /:id` — edit own job posting
- `DELETE /:id` — delete own job posting
- `GET /my-jobs` — list all jobs posted by this employer
- `GET /:jobId/applications` — view all applications for a specific job

### Candidate Routes (`/api/applications`) — requires `candidate` role
- `POST /:jobId/apply` — apply to a job; accept `multipart/form-data` with a `resume` PDF (max 5MB)
- `GET /my-applications` — list all applications submitted by this candidate
- `DELETE /:id` — withdraw an application (only if job deadline hasn't passed)

### Public Routes
- `GET /api/jobs` — paginated job listings with filters: `location`, `tags`, `salaryMin`, `salaryMax`, `search` (text search on title + description)
- `GET /api/jobs/:id` — single job detail

---

## Business Rules & Constraints

1. A candidate **cannot apply to the same job twice** — return `409 Conflict`.
2. Applications are **closed after the job's deadline** — return `403 Forbidden` with a meaningful message.
3. An employer **cannot apply** to jobs; a candidate **cannot post** jobs — proper `403` responses required.
4. Resume files must be stored as `uploads/resumes/<userId>-<timestamp>.pdf`. Serve them at `GET /api/files/resume/:filename` — protected, only accessible to the owning candidate OR the job's employer.
5. On successful application, send an **email confirmation** to the candidate using `nodemailer`.
6. On viewing their applications list (`GET /my-applications`), if a PDF receipt doesn't yet exist for an application, **generate one on-the-fly** using `pdfkit` (include job title, company, applied date) and cache it to disk.

---

## Data Models

```
User
  - _id, name, email, passwordHash, role (employer|candidate), company (employer only), createdAt

Job
  - _id, title, description, location, salaryMin, salaryMax, tags[], deadline, employer (ref: User), isActive, createdAt

Application
  - _id, job (ref: Job), candidate (ref: User), resumePath, receiptPath, status (pending|reviewed|rejected), appliedAt
```

---

## API Response Standards

- All responses must follow a consistent envelope:
  ```json
  { "success": true, "data": {}, "message": "..." }
  { "success": false, "error": "...", "details": [] }
  ```
- Paginated responses must include: `page`, `limit`, `total`, `totalPages` in a `meta` key.
- All validation errors (from `express-validator`) must be returned as an array of `{ field, message }` objects.

---

## Error Handling

- Implement a **centralised error-handling middleware** as the last `app.use()`.
- Create a custom `AppError` class extending `Error` with `statusCode` and `isOperational` properties.
- Distinguish between operational errors (user mistakes → 4xx) and programmer errors (bugs → 500).
- Unhandled promise rejections and uncaught exceptions must be caught at the process level and logged before graceful shutdown.

---

## Project Structure

```
src/
├── config/           # db.js, env validation
├── controllers/      # auth, jobs, applications, files
├── middleware/        # authenticate.js, authorize.js, upload.js, errorHandler.js
├── models/           # User.js, Job.js, Application.js
├── routes/           # auth.js, jobs.js, applications.js, files.js
├── services/         # emailService.js, pdfService.js
├── utils/            # AppError.js, catchAsync.js, apiFeatures.js (filtering/pagination)
└── app.js
```

---

## Evaluation Criteria

| Area | What to Check |
|---|---|
| Auth | JWT rotation working, role guards on every protected route |
| File Handling | Files saved correctly, protected file serving route works |
| Email | Confirmation email received in Mailtrap on apply |
| PDF | Receipt generated and cached (second request returns existing file) |
| Validation | All inputs validated; missing/invalid fields return structured errors |
| Error Handling | Central handler used, no `try/catch` scattered randomly without `catchAsync` |
| Code Quality | MVC structure followed, no business logic in routes |

---

## Bonus Challenges

- Add a `PATCH /:id/status` endpoint (employer only) to update application status to `reviewed` or `rejected`, and send the candidate an email notification.
- Implement **rate limiting** on `/api/auth/login` (max 10 attempts per IP per 15 min) using `express-rate-limit`.
- Add a **text index** on Job's `title` + `description` in MongoDB for the search filter.

---

## Submission Checklist

- [ ] `.env.example` committed with all required keys listed (no actual secrets)
- [ ] `README.md` with setup instructions and all API endpoints documented
- [ ] Postman collection (`.json`) exported and included in the repo
- [ ] At least one example resume PDF in `uploads/` for testing (committed to repo or noted in README)
