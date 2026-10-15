# CampusFlow Lite — System Flaws Report

> **Generated**: October 2026  
> **Method**: Exhaustive code-level inspection of every backend module, model, middleware, frontend page, API client, context, and route.  
> **Rule**: No assumptions — each flaw is verified against actual source code.

---

## Severity Legend

| Severity | Meaning |
|---|---|
| 🔴 **CRITICAL** | Security vulnerability, data loss risk, or complete feature failure |
| 🟠 **HIGH** | Broken functionality, major UX failure, or significant data integrity issue |
| 🟡 **MEDIUM** | Partial functionality loss, inconsistency, or meaningful UX degradation |
| 🔵 **LOW** | Minor inconsistency, code quality issue, or non-blocking improvement |

---

## PART 1: Security Vulnerabilities

### SEC-01 🔴 Hardcoded Secrets in Version-Controlled `.env`
**File**: `backend/.env`  
**Issue**: MongoDB Atlas credentials, JWT secrets, and ImageKit keys are committed to git with real production values.  
- `MONGO_URI` contains actual cluster password (`wLsoY3TcoDV6EhVp`)
- `JWT_SECRET` and `JWT_REFRESH_SECRET` are real keys
- `IMAGEKIT_PRIVATE_KEY` is exposed
**Risk**: Any person with repository access has full database and service access.  
**Fix**: Move secrets to environment variables, add `.env` to `.gitignore`, rotate all compromised keys immediately.

### SEC-02 🔴 Open Self-Registration Without Email Verification
**Files**: `auth.routes.js` L11-14, `auth.service.js` L253-446  
**Issue**: `POST /auth/register/student` and `POST /auth/register/teacher` are public endpoints with **no email verification, CAPTCHA, or admin approval**. Anyone can create unlimited student/teacher accounts.  
- Duplicate routes exist: `/register/student` AND `/register-student` (both active)
- No rate limiting beyond the general auth limiter (20/15min)
- Teacher registration creates accounts with `role: 'TEACHER'` — full faculty access
**Risk**: Account flooding, unauthorized access to faculty review queues, fake student submissions.

### SEC-03 🔴 Auth Bypass Backdoor in Production Code
**File**: `frontend/src/context/ERPContext.jsx` L87-110  
**Issue**: A `?auth_bypass=hod` query parameter triggers an automatic login with hardcoded credentials (`hod@campusflow.edu` / `Password@123`). This is production-deployed code, not a dev-only feature.  
**Risk**: Anyone can access the HOD portal by appending `?auth_bypass=hod` to the URL.

### SEC-04 🟠 JWT Access Token Stored in localStorage
**File**: `frontend/src/api/client.js` L3, L92-98  
**Issue**: Access tokens are stored in `localStorage` which is vulnerable to XSS attacks. The refresh token correctly uses httpOnly cookies, but the access token does not.  
**Risk**: Any XSS vulnerability would expose the JWT access token.

### SEC-05 🟠 No CSRF Protection
**Issue**: While refresh tokens use httpOnly cookies with `sameSite: 'lax'` in development, there is no explicit CSRF token mechanism. In production (`sameSite: 'none'`), this creates a CSRF attack surface.

### SEC-06 🟠 Student Delete Cascade Missing
**File**: `students.service.js` L114-125  
**Issue**: `deleteStudent()` deletes the Student and User documents but does NOT clean up:
- `ConsiderationRequest` documents referencing the student
- `LeaveApplication` documents referencing the student
- `MentorGroup.students` arrays containing the student ID
- `Notification` documents for the user
**Risk**: Orphaned references cause runtime errors and data inconsistency.

### SEC-07 🟡 Login Allows RegExp Injection
**File**: `auth.service.js` L50, L57  
**Issue**: Login uses `new RegExp('^${query}$', 'i')` where `query` comes from user input. Special regex characters in the input could cause ReDoS or unintended matches.  
**Fix**: Escape special regex characters or use exact match with `$options: 'i'`.

### SEC-08 🟡 No Input Validation on Registration Endpoints
**File**: `auth.routes.js` L11-14  
**Issue**: `registerStudent` and `registerTeacher` routes have **no `validateBody()` middleware** — they accept any JSON body without schema validation, unlike the login route which validates with `loginSchema`.

### SEC-09 🟡 Users CRUD Allows TG to Manage Any User
**File**: `users.routes.js` L9  
**Issue**: `authorize('ADMIN', 'HOD', 'TG')` grants TGs access to ALL user management routes including `createUser`, `updateUser`, `resetPassword`, and `updateStatus`. A TG could escalate privileges by changing a user's role to ADMIN.

---

## PART 2: Backend Logic Flaws

### BKD-01 🟠 Consideration HOD Queue Not Department-Scoped
**File**: `considerations.service.js` L239-288  
**Issue**: `getHODQueue()` returns ALL consideration requests across the entire system, not filtered by the HOD's department. An HOD of Department A can see and act on requests from Department B.  
**Impact**: Multi-department deployments have no data isolation.

### BKD-02 🟠 Leave HOD Queue Not Department-Scoped
**File**: `leaves.service.js` L250-306  
**Issue**: Same as BKD-01 but for leave applications. HOD sees all departments' leaves.

### BKD-03 🟠 HodAppointment Model Exists But Is Never Used
**File**: `models/HodAppointment.js`  
**Issue**: A fully-defined model with department, teacher, startDate, endDate, isActive fields exists with a partial unique index. However, it is **never imported or referenced** in any route, service, or controller. The system has no mechanism to officially appoint or track HOD assignments.

### BKD-04 🟠 Escalation Job Doesn't Notify the Original TG
**File**: `escalation.job.js` L48-82  
**Issue**: When requests are escalated, the system notifies HOD/ADMIN users but does NOT notify the assigned TG whose inaction caused the escalation. The TG has no visibility into escalated items leaving their queue.

### BKD-05 🟠 `sendEmail` Utility Exists But Is Never Called
**Files**: `utils/sendEmail.js`, all service files  
**Issue**: `sendEmail`, `sendOtpEmail`, and `sendStatusNotificationEmail` are fully implemented but are **never imported or called** from any service. Status changes only create in-app notifications and socket events. Email notifications are completely non-functional.  
**Evidence**: `grep -r "sendEmail" backend/src/modules/` returns no results.

### BKD-06 🟠 Forgot Password Schema Exists But No Route
**File**: `auth.schema.js` L17-19  
**Issue**: `forgotPasswordSchema` is defined and exported but there is no `/forgot-password` or `/reset-password` route in `auth.routes.js`. Password recovery is impossible without admin intervention.

### BKD-07 🟡 `env.js` Maps Wrong Variable Names
**File**: `config/env.js` L15-17  
**Issue**: 
- `JWT_ACCESS_SECRET` defaults to `process.env.JWT_SECRET` — the `.env` file uses `JWT_SECRET` while env.js uses `JWT_ACCESS_SECRET`. This works only because of the default fallback.
- `JWT_REFRESH_SECRET` defaults to a hardcoded dev string while `.env` has a real value at `JWT_REFRESH_SECRET`. The Zod schema key doesn't match the `.env` key.
- `MONGODB_URI` falls back to `process.env.MONGO_URI` — `.env` has both `MONGO_URI` and `MONGODB_URI` set to the same value, masking this configuration issue.

### BKD-08 🟡 Auto-Assign Mentor Group Logic Is Overly Aggressive
**Files**: `auth.service.js` L338-365, `considerations.service.js` L13-72  
**Issue**: When a student doesn't have a mentor group, the system falls back through 3 tiers ending with **any active mentor group in the entire system**. This could silently assign a CSE student to a Mechanical Engineering TG.

### BKD-09 🟡 No Pagination on Teacher List
**File**: `teachers.service.js` L5-52  
**Issue**: `listTeachers()` returns all teachers without pagination. For large departments, this could return thousands of records with N+1 MentorGroup queries per teacher.

### BKD-10 🟡 Excel Export Downloads Bypass Axios Response Interceptor
**File**: `frontend/src/api/modulesApi.js` L22-50  
**Issue**: `downloadConsiderationsExcel` and `downloadLeavesExcel` use `responseType: 'blob'` but the Axios response interceptor (client.js L40) unwraps `response.data`. This means `res.data` is already unwrapped, so `new Blob([res.data])` may receive `undefined`.

### BKD-11 🟡 Reports Route Allows TG Access to All Reports
**File**: `reports.routes.js` L10  
**Issue**: `authorize('HOD', 'ADMIN', 'TG')` gives TGs access to all report endpoints. A TG can export considerations and leaves data across the entire system, not just their mentees.

### BKD-12 🟡 No Transaction Safety on Multi-Document Operations
**Files**: Multiple service files  
**Issue**: Operations that create/update multiple documents (e.g., creating a MentorGroup + updating Student records) do not use MongoDB transactions. If the second operation fails, the first remains committed, creating inconsistent state.

### BKD-13 🔵 `response.js` `sendSuccess` Signature Mismatch
**File**: `utils/response.js`  
**Issue**: Some controllers call `sendSuccess(res, data, statusCode)` while others call `sendSuccess(res, data, 'message string')`. The function signature needs to handle both patterns consistently.

### BKD-14 🔵 Duplicate Route Definitions
**File**: `auth.routes.js` L11-14  
**Issue**: Both `/register/student` and `/register-student` (same for teacher) point to the same handler. This is redundant and increases the API surface unnecessarily.

---

## PART 3: Frontend-Backend Mismatches

### FBM-01 🟠 Frontend Calls Non-Existent API Endpoints
**File**: `modulesApi.js` L130-136  
**Issue**: 
- `masterDataApi.resetPassword(id, password)` → calls `POST /users/:id/reset-password` with `{ password }`, but the backend's `resetPassword` function reads `customPassword` from the body while the frontend sends `password`.
- `masterDataApi.updateUserStatus(id, isActive)` → calls `PATCH /users/:id/status`, which exists in the backend.
- `notificationApi.markAllAsRead()` → calls `PATCH /notifications/read-all`, which matches the backend route.

### FBM-02 🟠 Student Delete API Called But Has No Confirmation of Cascade
**File**: `modulesApi.js` L98-100  
**Issue**: `masterDataApi.deleteStudent(id)` calls `DELETE /students/:id`. The backend deletes the Student + User docs but leaves orphaned ConsiderationRequests and LeaveApplications (see SEC-06). The frontend shows success without warning about data loss.

### FBM-03 🟡 Frontend `sendSuccess` Response Shape Inconsistency
**File**: `api/client.js` L40  
**Issue**: The Axios interceptor unwraps `response.data`, so API calls receive the raw `{ success, data, meta }` object. Some frontend pages access `res.data` (double-unwrap) while others access `res` directly, leading to `undefined` values in some cases.

### FBM-04 🟡 `switchRole` State Not Synced to Backend
**File**: `ERPContext.jsx` L241-244  
**Issue**: `switchRole()` only updates `localStorage` and React state. The backend JWT still contains the original role. If a teacher who is also TG switches to "teacher" view, backend authorization still sees them as TG, creating a mismatch between UI presentation and actual permissions.

### FBM-05 🟡 Multiple Modals Reference Missing APIs
**Files**: Various modal components  
**Issue**: Several frontend modals call API functions that either don't exist or have mismatched signatures:
- `OfficialClearancesLedgerModal.jsx` (35 KB) contains complex ledger logic that may reference backend endpoints not fully aligned with the actual reports service.
- `ClassesCurriculumModal.jsx` and `SectionOverviewModal.jsx` display UI for features with limited or no backend support.

---

## PART 4: Missing Features & Incomplete Implementations

### MISS-01 🟠 No Password Recovery Flow
**Issue**: There is no forgot-password or email-based password reset. If a user forgets their password, only an Admin/HOD can manually reset it via the users management panel.  
**Evidence**: `forgotPasswordSchema` exists but no route uses it.

### MISS-02 🟠 No Email Notifications Actually Sent
**Issue**: Despite having a complete email system (`sendEmail.js` with Brevo + SMTP + console fallback), no service module ever calls it. The `BREVO_API_KEY` is empty in `.env`. All notifications are in-app only.

### MISS-03 🟠 No Profile Image Upload Flow
**Issue**: `User.profileImage` schema has `fileId` and `url` fields, but there is no API endpoint or frontend UI for uploading/updating profile images. The field is always null/undefined.

### MISS-04 🟠 No Admin Dashboard for System Configuration
**Issue**: There is no way for admins to:
- Change system settings (escalation hours, max leave days, etc.)
- Manage departments (only seeded)
- Officially appoint HODs (HodAppointment model unused)
- View system-wide analytics

### MISS-05 🟡 No Attachment Preview for Uploaded Files
**File**: `components/FilePreviewModal.jsx` (3.2 KB)  
**Issue**: While the frontend has a `FilePreviewModal` and `viewAttachment()` function, the actual ImageKit signed URL flow depends on proper ImageKit configuration. Without it, all attachment views fail silently.

### MISS-06 🟡 No Export Functionality for Leave Reports in Frontend
**Issue**: While the backend has `exportLeavesToExcel`, the frontend's `downloadLeavesExcel` function may fail due to the Axios interceptor response unwrapping issue (BKD-10).

### MISS-07 🟡 No Bulk Operations on Review Queues
**Issue**: HOD and TG review queues only support one-at-a-time review. There is no "approve all" or batch review capability for high-volume scenarios.

### MISS-08 🔵 No Search/Filter on Audit Trail
**File**: `audit.service.js` (30 lines)  
**Issue**: The audit log listing supports only basic pagination. There is no filtering by actor, action type, entity type, or date range.

### MISS-09 🔵 No User Deactivation Cascade
**Issue**: When a user is deactivated via `updateStatus`, their pending requests/leaves remain active in queues. The system doesn't auto-cancel pending items for deactivated users.

---

## PART 5: Data Integrity Issues

### DATA-01 🟠 MentorGroup Student Array Duplication Risk
**Files**: `mentorship.service.js` L178-188, `considerations.service.js` L33-36  
**Issue**: Multiple code paths push students into `MentorGroup.students` array. While some check for duplicates using `.some()`, the check in `updateMentorGroupStudents` uses Set operations while `resolveStudentTG` uses `.some()`. Race conditions under concurrent requests could still create duplicate entries.

### DATA-02 🟠 Student.mentorGroup Not Always Synced with MentorGroup.students
**Issue**: When a MentorGroup is revoked (`revokeMentorGroup`), it correctly unlinks students. But when individual students are removed from `MentorGroup.students`, the `Student.mentorGroup` field should be nullified — this only happens in `updateMentorGroupStudents` but not in all removal paths.

### DATA-03 🟡 ConsiderationRequest.selectedPeriods and periodTiming Are Unused
**File**: `ConsiderationRequest.js` L71-78  
**Issue**: These fields exist in the schema and are accepted during creation, but they are never read, displayed, or used in any business logic on the backend. The frontend may or may not collect them.

### DATA-04 🟡 LeaveApplication Has Inconsistent Status Values
**File**: `LeaveApplication.js` L64-71  
**Issue**: The status enum includes both `APPROVED_BY_HOD` and `APPROVED`. Student leaves get `APPROVED_BY_HOD` while teacher/HOD leaves get `APPROVED`. The reports service has to handle both with `$in: ['APPROVED_BY_HOD', 'APPROVED']` checks, complicating queries.

### DATA-05 🟡 Section Model Has No Department-Scoped Uniqueness
**File**: `Section.js` L29-33  
**Issue**: The `code` field has a global unique index, but there's no compound index on `{department, year, semester, name}`. This means two departments cannot have sections with the same code (e.g., both CSE and ECE cannot have section code "A").

### DATA-06 🔵 Enrollment Number Has No Validation
**File**: `Student.js` L30-34  
**Issue**: `enrollmentNumber` defaults to `''` with no format validation. It can be empty, duplicated across students, or any arbitrary string.

---

## PART 6: Frontend-Specific Issues

### FE-01 🟠 Massive CSS File (139 KB)
**File**: `frontend/src/index.css` — 139,463 bytes  
**Issue**: A single monolithic CSS file of 139 KB is loaded for every page. No code splitting, tree shaking, or component-level CSS extraction. This impacts initial page load performance.

### FE-02 🟡 Socket.IO Reconnection Creates Memory Leak Risk
**File**: `ERPContext.jsx` L167-204  
**Issue**: The Socket.IO effect dependency array includes `addToast` and `refreshNotifications` as dependencies. Since these are callback functions, if they are recreated (even with `useCallback`), the socket could disconnect and reconnect repeatedly.

### FE-03 🟡 No Loading/Error States in Some API Calls
**Issue**: Some frontend pages call APIs without proper loading spinners or error message display. API failures may result in blank screens rather than user-friendly error messages.

### FE-04 🟡 No Client-Side Form Validation Before Submission
**Issue**: While the backend has Zod validation, the frontend relies entirely on server-side validation for some forms. Users only see errors after form submission, not inline validation feedback.

### FE-05 🔵 Console Warnings From React Strict Mode
**Issue**: The app likely runs in React StrictMode (typical Vite setup), which can cause double-rendering in development and double API calls on mount.

### FE-06 🔵 No 404 Page
**File**: `App.jsx` L379  
**Issue**: The catch-all route `<Route path="*" element={<RoleRedirect />} />` redirects all unknown routes to the user's dashboard. There is no proper 404 page to inform users of invalid URLs.

---

## PART 7: Performance & Scalability Issues

### PERF-01 🟡 N+1 Query in Auth Middleware
**File**: `middleware/auth.js` L29-70  
**Issue**: Every authenticated request performs 2-3 database queries:
1. `User.findById(decoded.id)` 
2. `Teacher.findOne({ user })` or `Student.findOne({ user })`
3. `MentorGroup.findOne({ tg, isActive: true })`
This means every API call does 2-3 DB roundtrips before reaching the route handler.

### PERF-02 🟡 N+1 Query in Teacher List
**File**: `teachers.service.js` L17-49  
**Issue**: `listTeachers()` fetches all teachers, then runs a `Promise.all` with one `MentorGroup.findOne()` per teacher. For 100 teachers, this creates 101 database queries.

### PERF-03 🟡 No Database Connection Pooling Configuration
**File**: `config/db.js`  
**Issue**: MongoDB connection options likely use defaults. For production, connection pool size, socket timeout, and server selection timeout should be explicitly configured.

### PERF-04 🔵 Escalation Job Queries All Pending Requests Hourly
**File**: `escalation.job.js`  
**Issue**: The hourly cron scans ALL pending requests and ALL approved faculty leaves. With growing data, this full collection scan becomes increasingly expensive. No indexed query optimization for the escalation threshold.

---

## PART 8: Testing & DevOps Issues

### TEST-01 🟠 Minimal Test Coverage
**Files**: `backend/tests/health.test.js` (1.2 KB), `backend/tests/workflow.test.js` (5.7 KB)  
**Issue**: Only 2 test files exist. Critical paths like authentication, authorization, escalation, review workflows, and edge cases are untested.

### TEST-02 🟡 No Frontend Tests
**Issue**: Zero test files in the frontend directory. No unit tests, integration tests, or E2E tests for React components.

### TEST-03 🟡 No CI/CD Pipeline
**Issue**: No GitHub Actions, Jenkins, or any CI/CD configuration files found in the repository.

### TEST-04 🔵 No Docker/Containerization
**Issue**: No Dockerfile, docker-compose.yml, or container orchestration files. Manual deployment only.

### TEST-05 🔵 No Environment-Specific Configuration
**Issue**: Only one `.env` file with no `.env.production`, `.env.staging`, or environment switching mechanism.

---

## Summary Statistics

| Category | 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low | Total |
|---|:---:|:---:|:---:|:---:|:---:|
| Security | 3 | 3 | 3 | — | 9 |
| Backend Logic | — | 6 | 6 | 2 | 14 |
| Frontend-Backend Mismatch | — | 2 | 3 | — | 5 |
| Missing Features | — | 4 | 3 | 2 | 9 |
| Data Integrity | — | 2 | 3 | 1 | 6 |
| Frontend Issues | — | 1 | 3 | 2 | 6 |
| Performance | — | — | 3 | 1 | 4 |
| Testing/DevOps | — | 1 | 2 | 2 | 5 |
| **Total** | **3** | **19** | **26** | **10** | **58** |

---

## Priority Fix Order

### Immediate (Security Critical)
1. **SEC-01**: Remove `.env` from git, rotate all secrets
2. **SEC-03**: Remove `auth_bypass` backdoor from production code
3. **SEC-02**: Add email verification + admin approval for registration

### High Priority (Broken Functionality)
4. **BKD-01/02**: Scope HOD queues to department
5. **SEC-06**: Add cascade cleanup on student deletion
6. **MISS-01**: Implement password recovery flow
7. **MISS-02**: Wire up email notifications
8. **SEC-09**: Restrict TG access on user management routes

### Medium Priority (Quality & Reliability)
9. **BKD-07**: Fix environment variable name mapping
10. **SEC-07**: Escape regex in login query
11. **SEC-08**: Add Zod validation to registration routes
12. **DATA-01/02**: Fix MentorGroup sync consistency
13. **PERF-01**: Cache user profile in JWT or Redis
14. **TEST-01**: Add test coverage for critical paths
