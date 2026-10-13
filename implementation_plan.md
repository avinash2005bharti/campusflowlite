# CampusFlow Lite — Consideration & Leave Management System
## Implementation Plan for AI Coding Agents

**Version:** 1.0.0
**Derived from:** CampusFlow CSE ERP v2.0.0 reference manual
**Stack:** MERN (MongoDB, Express, React, Node.js) + ImageKit + Socket.IO
**Purpose of this file:** A single source of truth that AI agents follow, phase by phase, to build the system. Read Sections 0–3 fully before writing any code.

---

## 0. Instructions for AI Agents (READ FIRST)

1. Build **only** what is in Section 2 "In Scope". Do not add features from Section 2 "Out of Scope", even if they seem helpful.
2. Follow the folder structure in Section 5 exactly. Do not invent new top-level folders.
3. Work **phase by phase** (Section 12). Finish a phase, run its acceptance checks, then move on. Do not start a phase while the previous one has failing checks.
4. Use **MongoDB + Mongoose only**. No PostgreSQL, no Qdrant, no Python/FastAPI service.
5. Every API route must have: authentication, role authorization, request validation (Zod), and a consistent error response (Section 8.1).
6. Never delete request/leave documents. Status changes are recorded in a `history` array and in `AuditLog` (Section 7.5).
7. Never trust the client for `studentId`, `tgId`, `role`, or `status`. Derive them on the server from the JWT and database.
8. Use ES modules (`"type": "module"`) in both `server` and `client`. Use JavaScript with JSDoc (or TypeScript if the repo owner specifies it later).
9. All dates are stored in UTC and displayed in **IST (Asia/Kolkata)**. Leave and consideration dates are stored as `YYYY-MM-DD` date-only values (IST calendar days) to avoid timezone drift.
10. Put secrets only in `.env`. Never commit `.env`. Keep `.env.example` updated.
11. Write tests for every state transition in Section 7.

---

## 1. Project Overview

A focused web application for one academic department that handles exactly two workflows:

1. **Attendance Consideration (OD / Duty)** — a student submits a request to have missed classes credited because of hackathons, sports, cultural events, or college duty.
2. **Leave Management** — students (and faculty) apply for leave, which goes through a multi-tier approval chain.

Both workflows use a **two-tier approval chain** inherited from the original ERP:

```
Student → Tutor Guardian (TG, Tier-1 recommend) → HOD (Tier-2 final decision)
```

Supporting documents (certificates, medical proofs) are uploaded to **ImageKit**. Users receive real-time updates through **Socket.IO** and persistent in-app notifications.

---

## 2. Scope

### 2.1 In Scope
- Authentication, user management, role-based access (Student, Teacher, TG, HOD, Admin)
- Student ↔ TG mentor mapping
- Attendance Consideration requests (full lifecycle)
- Student Leave applications (full lifecycle)
- Faculty Leave applications (HOD approves; simple, no substitution engine)
- Document upload/view via ImageKit
- 48-hour TG-inactivity escalation to HOD
- Real-time + persisted notifications (optional email)
- Dashboards per role, history/audit view
- HOD/Admin reports with Excel export
- Admin bulk import of students/teachers (Excel/CSV)

### 2.2 Out of Scope (REMOVED from original ERP — do NOT build)
| Removed | Original location |
| :--- | :--- |
| Attendance marking, roll-call, QR codes, attendance sessions/records | Flow 1, Teacher portal |
| Attendance correction/dispute requests | Flow 1 |
| Attendance percentage calculation and low-attendance alerts | Flow 6, Invariant #2 |
| Assignments, submissions, grading, tests | Flow 7 |
| Timetable generation, timetable entries, rooms, substitutions | Flows 4 & 5 |
| All AI services: Groq LLM, 10 AI agents, RAG, Qdrant, FastAPI, AI Workspace | Section 2.6, Flow 9 |
| Department circulars/notices broadcast | Flow 8 |
| PostgreSQL, Python microservice, tri-database architecture | Section 1 |

> **Consequence of removal:** The system does not know actual attendance. A leave or consideration approval is simply a **record of approval** (with dates / periods). Other systems may consume it later through the export/report API.

---

## 3. Roles & Permissions

| Role | How identified | Responsibilities |
| :--- | :--- | :--- |
| `STUDENT` | `User.role = STUDENT` + `Student` profile | File consideration & leave requests, track status, cancel while pending |
| `TEACHER` | `User.role = TEACHER` + `Teacher` profile | File own leave. Becomes **TG** automatically if they lead a `MentorGroup` |
| `TG` (derived) | Teacher who is `MentorGroup.tg` | Tier-1 review: `RECOMMENDED_BY_TG` or `REJECTED` for their mentees |
| `HOD` | `User.role = HOD` (one active per department) | Tier-2 final decision, handle escalated requests, approve faculty leave, assign TGs, reports |
| `ADMIN` | `User.role = ADMIN` | User provisioning, master data, bulk import, can act as HOD, approves HOD's own leave |

### 3.1 Permission Matrix

| Capability | Student | Teacher | TG | HOD | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Submit consideration request | ✅ | ❌ | ❌ | ❌ | ❌ |
| Submit student leave | ✅ | ❌ | ❌ | ❌ | ❌ |
| Submit faculty leave | ❌ | ✅ | ✅ | ✅ | ❌ |
| Cancel own request (only while `PENDING`) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Tier-1 review of mentee requests | ❌ | ❌ | ✅ | ❌ | ❌ |
| Tier-2 final decision on student requests | ❌ | ❌ | ❌ | ✅ | ✅ |
| Direct decision on escalated requests | ❌ | ❌ | ❌ | ✅ | ✅ |
| Approve/reject faculty leave | ❌ | ❌ | ❌ | ✅ | ✅ |
| Approve/reject HOD leave | ❌ | ❌ | ❌ | ❌ | ✅ |
| Assign students to TG / appoint TG | ❌ | ❌ | ❌ | ✅ | ✅ |
| View department reports / export Excel | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage users, bulk import | ❌ | ❌ | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 4. Technology Stack

| Layer | Technology | Notes |
| :--- | :--- | :--- |
| Frontend | React 18 + Vite | React Router v6, TanStack Query, Zustand (auth state), React Hook Form + Zod, Tailwind CSS, shadcn/ui or Headless UI, `date-fns` / `date-fns-tz` |
| Backend | Node.js 20 + Express 4 | ES modules, `helmet`, `cors`, `express-rate-limit`, `cookie-parser`, `morgan`, `pino` logger |
| Database | MongoDB 7 + Mongoose 8 | Replica set required in production (transactions) |
| Auth | JWT (access 15 min) + refresh token (httpOnly cookie, 7 days) | `bcrypt` (cost 12) |
| Validation | Zod | Shared schema ideas on both sides |
| File storage | **ImageKit** | `imagekit` (server SDK) + `@imagekit/react` or `imagekitio-react` (client). Private files + signed URLs |
| Realtime | Socket.IO 4 | JWT-authenticated handshake |
| Jobs | `node-cron` | 48-hour escalation scan |
| Email (optional) | Brevo or Nodemailer SMTP | Behind a feature flag `EMAIL_ENABLED` |
| Excel | `exceljs` | Import and export |
| Testing | Vitest/Jest + Supertest + `mongodb-memory-server`; Playwright (smoke) | |

---

## 5. Repository Structure

```
campusflow-lite/
├── implementation_plan.md
├── README.md
├── package.json                 # npm workspaces: server, client
├── server/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── app.js               # express app (no listen)
│       ├── server.js            # http + socket.io + listen
│       ├── config/              # env.js, db.js, imagekit.js, cors.js
│       ├── models/              # User, Department, Section, Student, Teacher,
│       │                        # MentorGroup, HodAppointment, ConsiderationRequest,
│       │                        # LeaveApplication, Notification, AuditLog, RefreshToken
│       ├── middleware/          # auth.js, authorize.js, validate.js, errorHandler.js,
│       │                        # rateLimit.js, ownership.js
│       ├── modules/
│       │   ├── auth/            # routes, controller, service, schema
│       │   ├── users/
│       │   ├── students/
│       │   ├── teachers/
│       │   ├── mentorship/
│       │   ├── considerations/
│       │   ├── leaves/
│       │   ├── uploads/         # ImageKit auth + signed URL + delete
│       │   ├── notifications/
│       │   ├── reports/
│       │   ├── import/          # Excel bulk import
│       │   └── audit/
│       ├── sockets/             # index.js (auth + rooms), emitters.js
│       ├── jobs/                # escalation.job.js
│       ├── utils/               # ApiError.js, asyncHandler.js, dates.js, pagination.js
│       └── seed/                # seed.js
├── client/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── app/                 # router.jsx, queryClient.js, providers
│       ├── api/                 # axios instance + per-module api files
│       ├── store/               # authStore.js
│       ├── hooks/               # useSocket, useImageKitUpload, useAuth
│       ├── components/          # ui/, layout/, StatusBadge, Timeline, FileUploader, FilePreview
│       ├── pages/
│       │   ├── auth/            # Login, ChangePassword
│       │   ├── student/
│       │   ├── teacher/
│       │   ├── tg/
│       │   ├── hod/
│       │   └── admin/
│       └── utils/               # dates.js, constants.js
└── docs/                        # API.md (generated/maintained by agents)
```

---

## 6. Data Model (MongoDB / Mongoose)

> All schemas use `timestamps: true`. All `ref` fields are `ObjectId`. Add the listed indexes.

### 6.1 User
```js
{
  name: String (required),
  email: String (required, unique, lowercase),
  passwordHash: String (required, select: false),
  role: { type: String, enum: ['STUDENT','TEACHER','HOD','ADMIN'], required: true },
  mustChangePassword: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  phone: String,
  profileImage: { fileId: String, url: String },   // ImageKit (optional)
  lastLoginAt: Date
}
// indexes: { email: 1 } unique, { role: 1 }
```

### 6.2 Department & Section
```js
Department { name, code (unique) }
Section    { department: ref, year: 1-4, semester: 1-8, name: 'A'|'B', code: 'CSE-5A' (unique) }
```

### 6.3 Student
```js
{
  user: ref User (unique),
  department: ref, section: ref Section,
  rollNumber: String (unique), enrollmentYear: Number,
  guardianName: String, guardianPhone: String,
  mentorGroup: ref MentorGroup | null          // denormalized for fast lookup
}
```

### 6.4 Teacher
```js
{ user: ref User (unique), department: ref, designation: String, employeeId: String (unique) }
```

### 6.5 MentorGroup (TG cohort)
```js
{ department: ref, tg: ref Teacher, academicYear: String, students: [ref Student], isActive: Boolean }
// index: { tg: 1, isActive: 1 }
// RULE: a student belongs to at most ONE active MentorGroup.
```

### 6.6 HodAppointment
```js
{ department: ref, teacher: ref Teacher, startDate: Date, endDate: Date|null, isActive: Boolean }
// partial unique index: { department: 1 } where { isActive: true }  → max 1 active HOD
```

### 6.7 Shared sub-schemas
```js
Attachment {
  fileId: String,        // ImageKit fileId (used for delete / verification)
  filePath: String,      // e.g. /campusflow/considerations/<userId>/cert.pdf
  name: String, mimeType: String, size: Number,
  uploadedAt: Date
}

HistoryEntry {
  status: String, actor: ref User, actorRole: String,
  remarks: String, at: Date, via: { type: String, enum: ['MANUAL','ESCALATION'] }
}
```

### 6.8 ConsiderationRequest
```js
{
  student: ref Student (required, indexed),
  tg: ref Teacher,                       // snapshot at submission time
  eventTitle: String (required),
  eventType: { enum: ['HACKATHON','SPORTS','CULTURAL','COLLEGE_DUTY','OTHER'] },
  organizer: String, venue: String,
  startDate: String 'YYYY-MM-DD', endDate: String 'YYYY-MM-DD',
  requestedPeriods: Number (min 1),      // total periods student asks to be credited
  description: String,
  attachments: [Attachment],             // certificates / invitation letters (≥1 required)

  status: { enum: ['PENDING','RECOMMENDED_BY_TG','APPROVED_BY_HOD','REJECTED','CANCELLED'], default: 'PENDING' },
  tgReview:  { remarks, reviewedAt, reviewedBy: ref User },
  hodReview: { remarks, reviewedAt, reviewedBy: ref User, approvedPeriods: Number },
  escalated: { type: Boolean, default: false },
  escalatedAt: Date,
  history: [HistoryEntry]
}
// indexes: { student:1, createdAt:-1 }, { tg:1, status:1 }, { status:1, createdAt:1 }
```

### 6.9 LeaveApplication
```js
{
  applicant: ref User (required, indexed),
  applicantRole: { enum: ['STUDENT','TEACHER','HOD'] },
  student: ref Student | null,
  teacher: ref Teacher | null,
  tg: ref Teacher | null,                // only for student leave
  leaveType: { enum: ['CASUAL','MEDICAL','EMERGENCY','OTHER'] },
  startDate: String 'YYYY-MM-DD', endDate: String 'YYYY-MM-DD',
  totalDays: Number,                     // computed on server (inclusive)
  reason: String (required),
  attachments: [Attachment],

  status: { enum: ['PENDING','RECOMMENDED_BY_TG','APPROVED_BY_HOD','APPROVED','REJECTED','CANCELLED'], default: 'PENDING' },
  // Student leave:  PENDING → RECOMMENDED_BY_TG → APPROVED_BY_HOD
  // Faculty leave:  PENDING → APPROVED (by HOD/Admin)
  // HOD leave:      PENDING → APPROVED (by Admin)
  tgReview:    { remarks, reviewedAt, reviewedBy },
  finalReview: { remarks, reviewedAt, reviewedBy },
  escalated: Boolean, escalatedAt: Date,
  history: [HistoryEntry]
}
// indexes: { applicant:1, startDate:1 }, { tg:1, status:1 }, { status:1, createdAt:1 }
```

### 6.10 Notification
```js
{ user: ref User (indexed), title, message, type: String, link: String, isRead: Boolean, readAt: Date }
// TTL optional: expire after 180 days
```

### 6.11 AuditLog
```js
{ actor: ref User, action: String, entityType: String, entityId: ObjectId, before: Mixed, after: Mixed, ip: String, userAgent: String }
// index: { entityType:1, entityId:1, createdAt:-1 }
```

### 6.12 RefreshToken
```js
{ user: ref User, tokenHash: String, expiresAt: Date (TTL index), revokedAt: Date, userAgent, ip }
```

---

## 7. Business Rules & State Machines

### 7.1 Consideration Request
```
PENDING ──(TG recommend)──► RECOMMENDED_BY_TG ──(HOD approve)──► APPROVED_BY_HOD
   │                               │
   ├──(TG reject)──► REJECTED      └──(HOD reject)──► REJECTED
   └──(student cancel)──► CANCELLED
```
Validation rules:
- `endDate >= startDate`; `requestedPeriods >= 1`.
- At least **one** attachment is required.
- HOD must supply `approvedPeriods` (0 < value ≤ `requestedPeriods`) on approval.
- Reject requires non-empty `remarks` (min 5 chars). Approve/recommend remarks optional.
- Student can cancel only while `PENDING`.
- Cannot create duplicate request for the same student with an overlapping date range and same `eventTitle` in non-terminal state.

### 7.2 Student Leave
```
PENDING ──(TG recommend)──► RECOMMENDED_BY_TG ──(HOD approve)──► APPROVED_BY_HOD
   │                               │
   ├──(TG reject)──► REJECTED      └──(HOD reject)──► REJECTED
   └──(student cancel)──► CANCELLED
```
Rules:
- `totalDays` = inclusive day count between `startDate` and `endDate`.
- **No overlap** with the same applicant's non-terminal or approved leaves.
- **Medical leave with `totalDays > 2` requires at least one attachment.**
- Past-dated leave: allow up to 7 days back (configurable `LEAVE_BACKDATE_DAYS`); otherwise reject.
- Max leave duration per request configurable (`LEAVE_MAX_DAYS`, default 30).

### 7.3 Faculty & HOD Leave
- Faculty: `PENDING → APPROVED | REJECTED | CANCELLED` — decided by HOD or Admin.
- HOD's own leave: decided by Admin only.
- No substitution/AI logic.

### 7.4 48-Hour Escalation (TG Fallback)
- `node-cron` job runs hourly.
- Finds `PENDING` items (consideration + student leave) where `createdAt <= now - 48h` **or** the TG's own leave is currently active (approved faculty leave covering today).
- Sets `escalated = true`, `escalatedAt = now`, appends `HistoryEntry { via: 'ESCALATION' }`, notifies HOD.
- HOD may then decide directly: allowed transitions for escalated items are `PENDING → APPROVED_BY_HOD | REJECTED`.
- The job must be **idempotent** (skip items already escalated).

### 7.5 Audit & Immutability
- No hard deletes for requests, leaves, users (use `isActive=false`).
- Every status change: push `history` entry **and** write `AuditLog`.
- Use Mongoose transactions when a status update must also write notifications + audit atomically (or write notifications after commit; never fail the main action because of a notification error).

### 7.6 Authorization Invariants
- A TG can act only on requests where `request.tg` equals their Teacher id **and** the student is in their active MentorGroup.
- A student can read only their own requests.
- HOD final decision requires status `RECOMMENDED_BY_TG`, **or** `escalated === true`.
- Users cannot approve their own requests (reject if `reviewer.user == applicant`).
- When the HOD is also a TG for a student, the HOD may complete both tiers, but each tier must be recorded separately in `history`.

---

## 8. API Specification

Base URL: `/api/v1`. JSON only. Auth: `Authorization: Bearer <accessToken>`; refresh via httpOnly cookie.

### 8.1 Response & Error Format
```json
// success
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 20, "total": 57 } }

// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [ ] } }
```
Error codes: `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INVALID_STATE_TRANSITION`, `RATE_LIMITED`, `INTERNAL`.

### 8.2 Auth
| Method | Route | Access | Description |
| :--- | :--- | :--- | :--- |
| POST | `/auth/login` | Public | Email + password → access token, sets refresh cookie |
| POST | `/auth/refresh` | Cookie | Rotate refresh token |
| POST | `/auth/logout` | Auth | Revoke refresh token |
| POST | `/auth/change-password` | Auth | Required when `mustChangePassword` |
| POST | `/auth/forgot-password` | Public | Optional (email flag) |
| GET | `/auth/me` | Auth | Current user + profile + `isTG` flag |

### 8.3 Users & Master Data (Admin / HOD)
| Method | Route | Access |
| :--- | :--- | :--- |
| GET/POST | `/users` | Admin |
| GET/PATCH | `/users/:id` | Admin |
| POST | `/users/:id/reset-password` | Admin |
| PATCH | `/users/:id/status` | Admin |
| GET/POST | `/sections` | Admin, HOD |
| GET | `/students` (filters: section, search, mentor) | HOD, Admin |
| GET | `/teachers` | HOD, Admin |
| POST | `/import/students`, `/import/teachers` (multipart xlsx) | Admin |
| GET | `/import/template/:type` | Admin |

### 8.4 Mentorship
| Method | Route | Access |
| :--- | :--- | :--- |
| GET | `/mentor-groups` | HOD, Admin |
| POST | `/mentor-groups` (create, assign TG) | HOD, Admin |
| PUT | `/mentor-groups/:id/students` (add/remove) | HOD, Admin |
| GET | `/mentor-groups/mine` | TG (my cohort + mentee list) |

### 8.5 Considerations
| Method | Route | Access | Notes |
| :--- | :--- | :--- | :--- |
| POST | `/considerations` | Student | Creates `PENDING`; server sets `student`, `tg` |
| GET | `/considerations/mine` | Student | Paginated + status filter |
| GET | `/considerations/tg-queue` | TG | Mentees' requests (`PENDING` default) |
| GET | `/considerations/hod-queue` | HOD, Admin | `RECOMMENDED_BY_TG` + escalated |
| GET | `/considerations/:id` | Owner / TG / HOD / Admin | Includes history |
| PATCH | `/considerations/:id/cancel` | Student (owner) | Only `PENDING` |
| PATCH | `/considerations/:id/tg-review` | TG | `{ decision: 'RECOMMEND'|'REJECT', remarks }` |
| PATCH | `/considerations/:id/final-review` | HOD, Admin | `{ decision: 'APPROVE'|'REJECT', remarks, approvedPeriods }` |

### 8.6 Leaves
| Method | Route | Access | Notes |
| :--- | :--- | :--- | :--- |
| POST | `/leaves` | Student, Teacher, HOD | Server derives `applicantRole`, chain |
| GET | `/leaves/mine` | Any applicant | |
| GET | `/leaves/tg-queue` | TG | |
| GET | `/leaves/hod-queue` | HOD, Admin | Student: `RECOMMENDED_BY_TG`/escalated; Faculty: `PENDING` |
| GET | `/leaves/admin-queue` | Admin | HOD leaves |
| GET | `/leaves/:id` | Owner / reviewers | |
| PATCH | `/leaves/:id/cancel` | Owner | Only `PENDING` |
| PATCH | `/leaves/:id/tg-review` | TG | `{ decision, remarks }` |
| PATCH | `/leaves/:id/final-review` | HOD, Admin | `{ decision, remarks }` |

### 8.7 Uploads (ImageKit)
| Method | Route | Access | Description |
| :--- | :--- | :--- | :--- |
| GET | `/uploads/auth` | Auth | Returns `{ token, expire, signature, publicKey, urlEndpoint }` from `imagekit.getAuthenticationParameters()` |
| POST | `/uploads/verify` | Auth | Body `{ fileId }` → server calls ImageKit `getFileDetails`, checks folder prefix + size + MIME, returns normalized `Attachment` |
| GET | `/uploads/signed-url?fileId=…` | Auth + access check | Returns a short-lived signed URL (e.g. 300 s) for a private file |
| DELETE | `/uploads/:fileId` | Owner, only if attachment not yet on a submitted request | Delete unused uploads |

### 8.8 Notifications, Reports, Audit
| Method | Route | Access |
| :--- | :--- | :--- |
| GET | `/notifications` (pagination, `unread=true`) | Auth |
| PATCH | `/notifications/:id/read`, `/notifications/read-all` | Auth |
| GET | `/dashboard/summary` | Role-specific counts |
| GET | `/reports/considerations` (filters: from, to, section, status, student) | HOD, Admin |
| GET | `/reports/leaves` | HOD, Admin |
| GET | `/reports/*/export` → `.xlsx` | HOD, Admin |
| GET | `/audit` | HOD, Admin |

---

## 9. ImageKit Integration Design

**Goal:** Upload directly from the browser to ImageKit; the Node server never proxies file bytes.

### 9.1 Flow
```
1. Client  → GET /api/v1/uploads/auth                (JWT required)
2. Server  → returns {token, expire, signature, publicKey, urlEndpoint}
3. Client  → uploads file to ImageKit with those params
             folder: /campusflow/{considerations|leaves}/{userId}/
             isPrivateFile: true, useUniqueFileName: true, tags: [userId, type]
4. Client  → POST /api/v1/uploads/verify {fileId}    (server re-checks with ImageKit API)
5. Client  → includes verified attachment objects in POST /considerations or /leaves
6. Viewing → GET /uploads/signed-url?fileId=…        (server checks the caller may view that request)
```

### 9.2 Rules
- Allowed MIME: `application/pdf`, `image/jpeg`, `image/png`. Max **5 MB**, max **5 files** per request. Enforce on the client **and** in `/uploads/verify`.
- Always upload with `isPrivateFile: true`. Never store permanent public URLs; store `fileId` + `filePath` and generate signed URLs on demand.
- `/uploads/verify` must reject a `fileId` whose `filePath` does not start with `/campusflow/*/{currentUserId}/`.
- Submission endpoints must re-verify every attachment `fileId` belongs to the submitting user.
- A weekly cleanup script (optional) deletes ImageKit files tagged by a user but not referenced by any request older than 24 h.
- Keys: `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY` (server only), `IMAGEKIT_URL_ENDPOINT`.

---

## 10. Real-Time (Socket.IO)

- Handshake auth: `io(url, { auth: { token: accessToken } })`; verify JWT in `io.use()`.
- On connect, join rooms: `user_{userId}`, `role_{ROLE}`, and `tg_{teacherId}` if the user is a TG.

| Event (Server → Client) | Payload | Trigger |
| :--- | :--- | :--- |
| `new_notification` | `{ id, title, message, type, link }` | Any workflow step |
| `request_updated` | `{ kind: 'CONSIDERATION'|'LEAVE', id, status }` | Any status change (to student, TG, HOD rooms involved) |
| `queue_changed` | `{ kind, scope: 'TG'|'HOD' }` | Tells reviewers to refetch their queue |

Notification recipients per step:
| Step | Notify |
| :--- | :--- |
| Student submits | Assigned TG (or HOD if no TG assigned) |
| TG recommends | HOD (+ student informed of progress) |
| TG rejects | Student |
| HOD approves/rejects | Student (+ TG informed) |
| Escalation | HOD (+ student informed) |
| Faculty leave submitted | HOD; decision → applicant |
| HOD leave submitted | Admin; decision → applicant |

Persist every notification to MongoDB **and** emit via socket. Optional email via Brevo when `EMAIL_ENABLED=true`.

---

## 11. Frontend Routes

| Route | Role | Page |
| :--- | :--- | :--- |
| `/login`, `/change-password` | Public / Auth | Auth pages |
| `/student` | Student | Dashboard (pending count, recent decisions) |
| `/student/considerations` | Student | List + status timeline |
| `/student/considerations/new` | Student | Form + ImageKit uploader |
| `/student/leaves` · `/student/leaves/new` | Student | List / apply |
| `/student/profile` | Student | Profile + TG details |
| `/teacher` | Teacher | Dashboard |
| `/teacher/leaves` · `/teacher/leaves/new` | Teacher | Own faculty leave |
| `/tg` | TG | Dashboard (pending queue, mentee summary) |
| `/tg/students` | TG | Mentee directory |
| `/tg/considerations` · `/tg/leaves` | TG | Review queues with approve/reject drawers |
| `/hod` | HOD | Dashboard (queue counts, escalated, on-leave today) |
| `/hod/considerations` · `/hod/leaves` | HOD | Final-decision queues |
| `/hod/faculty-leaves` | HOD | Faculty leave approvals |
| `/hod/mentorship` | HOD | TG assignment, cohort management |
| `/hod/students` · `/hod/teachers` | HOD | Directories |
| `/hod/reports` | HOD | Filters + Excel export |
| `/admin` | Admin | Dashboard |
| `/admin/users` · `/admin/import` · `/admin/sections` | Admin | Management |
| `/admin/hod-leaves` | Admin | HOD leave approvals |
| `/audit` | HOD, Admin | Audit viewer |

UI requirements (all roles):
- A `ProtectedRoute` that checks role and redirects to the correct home.
- `StatusBadge` with consistent colors per status; `Timeline` component rendering `history`.
- Notification bell (unread count, dropdown, mark-as-read) driven by socket + REST.
- `FileUploader` (drag-and-drop, progress, type/size validation) and `FilePreview` (fetches signed URL on click).
- Loading skeletons, empty states, error toasts, responsive layout (mobile-first — students use phones).

---

## 12. Phased Implementation Plan

> Each phase lists **Tasks** and **Acceptance Checks**. Do not proceed until all checks pass.

### Phase 1 — Project Foundation
**Tasks**
- Initialize npm workspaces (`server`, `client`). Configure ESLint + Prettier.
- Server: Express app, `config/env.js` (validate env with Zod), Mongo connection, `helmet`, CORS, rate limiting, central error handler, `ApiError`, `asyncHandler`, health route `GET /api/v1/health`.
- Client: Vite + React + Tailwind + Router + TanStack Query + axios instance (with refresh interceptor).
- Write `.env.example` for both packages.

**Acceptance**
- `npm run dev` starts both apps; `/health` returns 200; lint passes.

### Phase 2 — Auth, Users & Seed
**Tasks**
- Models: `User`, `Department`, `Section`, `Student`, `Teacher`, `RefreshToken`, `HodAppointment`.
- Auth module (login, refresh rotation, logout, change-password, `/auth/me`). `bcrypt` cost 12.
- Middleware: `auth` (verify JWT), `authorize(...roles)`, `validate(zodSchema)`.
- Force password change on first login (`mustChangePassword`).
- Seed script: 1 department, 2 sections, 1 admin, 1 HOD, 3 teachers, 10 students (printed credentials for dev only).
- Client: Login page, auth store, `ProtectedRoute`, role-based layout shells.

**Acceptance**
- Each seeded role can log in and lands on its own home route.
- Accessing another role's route returns 403 (API) / redirect (UI).
- Refresh token rotation works; reused refresh token is rejected.

### Phase 3 — Mentorship & Master Data
**Tasks**
- Models: `MentorGroup`. Endpoints from 8.3 and 8.4.
- Enforce: one active `MentorGroup` per student; `Student.mentorGroup` synced.
- HOD UI: assign TG, add/remove students. Admin UI: user CRUD, section CRUD.
- `/auth/me` returns `isTG` and the TG's `mentorGroupId`.

**Acceptance**
- Assigning a student to a second group fails with `CONFLICT`.
- A teacher becomes TG immediately after group creation (TG menu appears).

### Phase 4 — ImageKit Uploads
**Tasks**
- Server: `config/imagekit.js`, uploads module (8.7) following Section 9.
- Client: `useImageKitUpload` hook + `FileUploader` + `FilePreview`.

**Acceptance**
- Student can upload PDF/JPG/PNG ≤ 5 MB; larger/other types are rejected client- and server-side.
- Uploaded file is private; direct URL without signature fails; signed URL expires.
- Verifying another user's `fileId` returns `FORBIDDEN`.

### Phase 5 — Consideration Workflow
**Tasks**
- Model `ConsiderationRequest`; module with all routes in 8.5; state machine in a dedicated `considerations.service.js` (pure functions + transition table) so it is unit-testable.
- Notification service (`notify(userIds, payload)`) + `sockets/emitters.js`.
- UI: student form/list/detail with timeline; TG queue & review drawer; HOD queue & final-review drawer with `approvedPeriods` input.

**Acceptance**
- Happy path: student → TG recommend → HOD approve ends in `APPROVED_BY_HOD` with `approvedPeriods`.
- Every illegal transition (e.g., HOD approving `PENDING` non-escalated, TG acting on another TG's mentee, student cancelling after TG review) returns `INVALID_STATE_TRANSITION` or `FORBIDDEN`.
- History and AuditLog entries exist for every step; notifications arrive in real time.

### Phase 6 — Leave Workflow
**Tasks**
- Model `LeaveApplication`; routes in 8.6; rules in 7.2 and 7.3 (overlap check, medical-proof rule, `totalDays`, backdate limit).
- Chain resolver: `resolveApprovalChain(applicantRole)` → student: TG→HOD; teacher: HOD; HOD: Admin.
- UI: student/teacher leave forms and lists; TG leave queue; HOD student-leave + faculty-leave queues; Admin HOD-leave queue.

**Acceptance**
- Medical leave of 3 days without attachment is rejected; 2 days passes.
- Overlapping leave is rejected with `CONFLICT`.
- Faculty leave bypasses TG; HOD leave goes only to Admin.

### Phase 7 — Escalation Job & Notifications Center
**Tasks**
- `jobs/escalation.job.js` per 7.4 (hourly cron, idempotent). Inject a clock for testing.
- Notification REST endpoints (8.8) and bell UI; optional Brevo email behind `EMAIL_ENABLED`.

**Acceptance**
- With a clock set +49 h, a `PENDING` item is escalated once (second run changes nothing) and HOD can decide it directly.
- Items whose TG is on approved leave escalate regardless of age.

### Phase 8 — Dashboards, Reports & Audit
**Tasks**
- `/dashboard/summary` per role (counts, escalated, recent decisions, "on leave today" for HOD).
- Reports with filters + `exceljs` export (columns: student, roll no., section, event/leave type, dates, periods/days, status, approver, decision date).
- Audit viewer with entity filter.

**Acceptance**
- Excel export opens with correct data and respects filters.
- Non-HOD/Admin users receive 403 on reports and audit.

### Phase 9 — Bulk Import (Admin)
**Tasks**
- Excel template download; import endpoints with row-level validation, duplicate detection (email, roll number), transactional batch insert, per-row error report.
- New accounts get a random temp password, `mustChangePassword = true`; optionally email credentials.

**Acceptance**
- Importing 100 valid rows succeeds; a file with 3 bad rows returns an error report and imports nothing (all-or-nothing) **or** imports valid rows only — pick one behaviour, document it in `docs/API.md`, and test it.

### Phase 10 — Hardening, Testing & Deployment
**Tasks**
- Test suites: unit (state machines, date utils, chain resolver), integration (Supertest + in-memory Mongo for each module), e2e smoke (Playwright: login → submit → TG → HOD).
- Security pass: Section 13 checklist. Add request-size limits, NoSQL-injection sanitization (`express-mongo-sanitize`), strict CORS.
- Dockerfiles + `docker-compose.yml` (server, client, mongo replica set) for local dev.
- Write `README.md` (setup, env, scripts) and finalize `docs/API.md`.

**Acceptance**
- All tests pass in CI; Lighthouse mobile performance ≥ 80 on dashboards; no high-severity `npm audit` issues.

---

## 13. Security Checklist

- [ ] Passwords hashed with bcrypt; never returned from any query (`select: false`).
- [ ] Access token short-lived; refresh token in httpOnly, `Secure`, `SameSite=Lax/Strict` cookie, rotated and revocable.
- [ ] Login rate-limited (e.g., 5 attempts / 15 min / IP+email) with generic error messages.
- [ ] Zod validation on every body, query, and param; unknown keys stripped.
- [ ] Ownership/role checks in services, not only in routes.
- [ ] `express-mongo-sanitize`, `helmet`, strict CORS allow-list.
- [ ] ImageKit private key never reaches the client; uploads private + signed URLs.
- [ ] Socket.IO handshake verified; users can only join their own rooms.
- [ ] No hard deletes; audit trail on every state change.
- [ ] Secrets only via environment variables; `.env` ignored by git.

---

## 14. Environment Variables

**server/.env.example**
```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/campusflow_lite
JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me_too
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=7

IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

LEAVE_MAX_DAYS=30
LEAVE_BACKDATE_DAYS=7
ESCALATION_HOURS=48
TZ=Asia/Kolkata

EMAIL_ENABLED=false
BREVO_API_KEY=
EMAIL_FROM=no-reply@example.edu
```

**client/.env.example**
```
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

---

## 15. Definition of Done

The project is complete when:
1. All Phase 1–10 acceptance checks pass.
2. The full workflow works end-to-end for each role: Student files a consideration and a leave → TG recommends → HOD approves → student is notified in real time; escalation and faculty/HOD leave paths work.
3. No feature from Section 2.2 exists in the codebase.
4. `README.md` and `docs/API.md` let a new developer run and understand the system in under 15 minutes.

---

## 16. Mapping to the Original ERP (for reference)

| Original concept | New system equivalent |
| :--- | :--- |
| Flow 2: Attendance Consideration | Section 7.1 / Phase 5 (kept, simplified: no attendance recalculation) |
| Flow 3: Student Leave (multi-tier) | Section 7.2 / Phase 6 (kept; no `ON_LEAVE` sync because there is no attendance ledger) |
| Flow 4: Faculty leave | Section 7.3 (kept; AI substitution removed) |
| TG fallback after 48 hours | Section 7.4 / Phase 7 |
| ImageKit document storage | Section 9 / Phase 4 (private files + signed URLs) |
| Socket.IO notifications | Section 10 |
| Master data Excel import (Flow 10) | Phase 9 |
| PostgreSQL entities | Replaced by Mongoose models in Section 6 |
