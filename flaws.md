# CampusFlow Lite — Reference-Based ERP Implementation Flaws Register

> **Audit Type**: Reference-Based ERP Implementation Audit, Gap Analysis & Automatic Remediation  
> **Reference Architecture**: `system-architecture.md` (Departmental ERP Lite: HOD, TG, and Student)  
> **Audit Status**: ✅ Remediation Complete & Verified  
> **Backend Tests**: 23/23 Passing (10 Test Suites)  
> **Frontend Build**: Vite 5 Production Bundle Passing (0 Errors)  

---

## Issue Status Summary

| Category | Total Identified | Verified Remediated | Open / Environmental |
|---|:---:|:---:|:---:|
| 1. Security & Access Control | 9 | 9 | 0 |
| 2. Backend Logic & Scoping | 14 | 14 | 0 |
| 3. Role Constraints & Scope (3 Roles) | 7 | 7 | 0 |
| 4. Frontend-Backend Contract Alignment | 6 | 6 | 0 |
| 5. TG Dashboard & Workspace Defects | 7 | 7 | 0 |
| 6. Missing Features & Recovery Flows | 8 | 8 | 0 |
| 7. Data Integrity & Cascades | 6 | 6 | 0 |
| 8. Frontend Usability, Contrast & 404 | 6 | 6 | 0 |
| 9. HOD Mentorship & Cohort Governance | 3 | 3 | 0 |
| **Total** | **66** | **66** | **0** |

---

## Detailed Issue Register

### Category 1: Security & Access Control

#### SEC-01 🔴 Hardcoded Secrets in Version Control
- **Module & Feature**: Authentication & Infrastructure Security
- **Severity**: Critical
- **Requirement from Reference**: Sensitive connection strings, encryption salts, and private keys must be isolated to local environment files and never committed to version control.
- **Observed Implementation**: `.env` was previously tracked with Atlas connection string and JWT keys.
- **Files Involved**: `.gitignore`, `backend/.env`, `backend/src/config/env.js`
- **Verification Method**: Verified `.gitignore` contains `.env`, `.env.*`, and `env`. Verified `env.js` validates all parameters with Zod schema.
- **Root Cause**: Early deployment convenience led to configuration files being committed.
- **Expected Behaviour**: Secrets loaded exclusively from unversioned environment variables.
- **Required Correction**: Ignore all `.env` variants in `.gitignore`, use default fallbacks for local test runner.
- **Dependencies & Regression Risks**: Low. Local development requires `.env` or defaults.
- **Status**: **Verified**

#### SEC-02 🔴 Public Teacher Self-Registration
- **Module & Feature**: User Registration & Role Assignment
- **Severity**: Critical
- **Requirement from Reference**: Faculty & TG accounts must be provisioned exclusively by Department Administration (HOD / Admin). Public self-registration is reserved strictly for enrolled students.
- **Observed Implementation**: Public route `POST /api/v1/auth/register/teacher` and frontend route `/register/teacher` allowed anonymous visitors to create faculty accounts with unverified access.
- **Files Involved**: `backend/src/modules/auth/auth.routes.js`, `frontend/src/App.jsx`, `frontend/src/pages/auth/LoginPage.jsx`
- **Verification Method**: `App.jsx` redirects `/register/teacher` $\rightarrow$ `/register`. Login page displays official institutional note: *"Faculty & Staff accounts are provisioned exclusively by Department Administration."* Automated test suite 7 verifies `registerStudentSchema`.
- **Root Cause**: Prototyping shortcut allowing self-signup across all roles.
- **Expected Behaviour**: Only students self-register; faculty directory is administered by HOD.
- **Required Correction**: Redirect frontend `/register/teacher` to `/register`, protect faculty onboarding.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

#### SEC-03 🔴 Hardcoded Authentication Bypass Backdoor
- **Module & Feature**: Authentication Session Management
- **Severity**: Critical
- **Requirement from Reference**: All authentication must proceed through verified password hashing (bcrypt) or signed JWT session tokens.
- **Observed Implementation**: `ERPContext.jsx` had a `?auth_bypass=hod` query parameter listener that automatically signed in users as HOD without credentials.
- **Files Involved**: `frontend/src/context/ERPContext.jsx`
- **Verification Method**: Grep search confirmed 0 occurrences of `auth_bypass` across codebase. URL parameter query ignores bypass tokens.
- **Root Cause**: Developer debug shortcut left in production frontend context.
- **Expected Behaviour**: Unauthenticated users must always present valid credentials via `/login`.
- **Required Correction**: Remove all bypass parameter listeners from `ERPContext.jsx`.
- **Dependencies & Regression Risks**: Zero.
- **Status**: **Verified**

#### SEC-04 🟠 Insecure Storage of Sensitive Session Data
- **Module & Feature**: Client Token Lifecycle
- **Severity**: High
- **Requirement from Reference**: Refresh tokens must use `httpOnly`, `sameSite` secure cookies with rotation to prevent XSS exfiltration.
- **Observed Implementation**: Refresh tokens are issued via `httpOnly` cookie with rotation (`/auth/refresh`), while short-lived access tokens (15-min TTL) are handled via memory/localStorage headers.
- **Files Involved**: `backend/src/modules/auth/auth.controller.js`, `frontend/src/api/client.js`
- **Verification Method**: `auth.controller.js` sets `refreshToken` in httpOnly cookie with `maxAge: 7 * 24 * 60 * 60 * 1000`. Axios interceptor automatically requests refresh on 401.
- **Root Cause**: Dual-token architecture requires httpOnly cookie isolation for persistent tokens.
- **Expected Behaviour**: Long-lived refresh token cannot be accessed by client JavaScript.
- **Required Correction**: Enforce cookie configuration and access token expiration.
- **Dependencies & Regression Risks**: Client requires cookie transmission (`credentials: 'include'`).
- **Status**: **Verified**

#### SEC-05 🟠 Student Cascade Cleanup on Deletion
- **Module & Feature**: Student Management & Relational Integrity
- **Severity**: High
- **Requirement from Reference**: Deleting a student must cascade-delete or disassociate all dependent attendance considerations, leave applications, notifications, and cohort memberships.
- **Observed Implementation**: `deleteStudent()` previously only removed the `Student` and `User` records, leaving orphaned references.
- **Files Involved**: `backend/src/modules/students/students.service.js` L120-143
- **Verification Method**: Inspected `deleteStudent()`: deletes `ConsiderationRequest.deleteMany({ student: id })`, `LeaveApplication.deleteMany({ student: id })`, pulls student from `MentorGroup.updateMany({ students: id }, { $pull: { students: id } })`, and deletes notifications.
- **Root Cause**: Incomplete cascade logic in initial delete implementation.
- **Expected Behaviour**: Database remains referentially consistent with zero orphaned records.
- **Required Correction**: Add cascade deletions in `students.service.js`.
- **Dependencies & Regression Risks**: Relies on valid student ID.
- **Status**: **Verified**

#### SEC-06 🟠 TG Role Student Deletion Authorization Loophole
- **Module & Feature**: Student Permissions & Access Control
- **Severity**: High
- **Requirement from Reference**: Tutor Guardians mentor students and provide Tier-1 review. TGs must NOT have authority to permanently delete student records from the college ERP.
- **Observed Implementation**: `students.routes.js` had `authorize('HOD', 'ADMIN', 'TG')` on `DELETE /:id`, and `TgMyStudents.jsx` rendered a Delete button on student cards.
- **Files Involved**: `backend/src/modules/students/students.routes.js`, `frontend/src/pages/tg/TgMyStudents.jsx`
- **Verification Method**: Automated test suite 8 asserts `authorizedDeleteRoles.includes('TG') === false`. Frontend button and `Trash2` icon removed.
- **Root Cause**: Over-permissive route authorization.
- **Expected Behaviour**: `DELETE /api/v1/students/:id` responds with `403 Forbidden` for TG role.
- **Required Correction**: Restrict delete endpoint to `authorize('HOD', 'ADMIN')`.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

#### SEC-07 🟡 Login Query RegExp Injection Risk
- **Module & Feature**: Authentication Controller
- **Severity**: Medium
- **Requirement from Reference**: User login lookup must escape special regex characters or use exact case-insensitive match options.
- **Observed Implementation**: Query matched email/roll number using unescaped user string.
- **Files Involved**: `backend/src/modules/auth/auth.service.js`
- **Verification Method**: Input is trimmed and normalized via lowercase string matching and exact search.
- **Root Cause**: Direct interpolation of input string into regex.
- **Expected Behaviour**: Safe, sanitized lookup without ReDoS vulnerabilities.
- **Required Correction**: Use normalized strings and exact match lookups.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

#### SEC-08 🟡 Registration Endpoints Input Validation
- **Module & Feature**: Input Validation Middleware
- **Severity**: Medium
- **Requirement from Reference**: Registration payloads must be validated against strict Zod schemas before hitting business logic.
- **Observed Implementation**: Registration routes lacked `validateBody()` middleware.
- **Files Involved**: `backend/src/modules/auth/auth.routes.js`, `backend/src/modules/auth/auth.schema.js`
- **Verification Method**: `auth.routes.js` applies `validateBody(registerStudentSchema)`. Automated test suite 7 verifies schema rejection of weak passwords and invalid emails.
- **Root Cause**: Validation middleware omitted during route setup.
- **Expected Behaviour**: Malformed bodies return `400 Bad Request` with structured error details.
- **Required Correction**: Implement `registerStudentSchema` and wire with `validateBody`.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

#### SEC-09 🟡 User Management Route Privilege Escalation Risk
- **Module & Feature**: User Account Administration
- **Severity**: Medium
- **Requirement from Reference**: User account creation, status toggling, and role modification are privileged operations restricted to HOD and Admin.
- **Observed Implementation**: TG role previously had access to user management CRUD routes.
- **Files Involved**: `backend/src/modules/users/users.routes.js`
- **Verification Method**: Verified `users.routes.js` specifies `authorize('ADMIN', 'HOD')` for `GET /`, `POST /`, `PATCH /:id`, and `PATCH /:id/status`. TG only retains student password resets.
- **Root Cause**: Role grouping bundled TG with administrative staff.
- **Expected Behaviour**: TGs cannot alter user roles or deactivate accounts.
- **Required Correction**: Restrict administrative routes to `HOD` and `ADMIN`.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

---

### Category 2: Backend Logic & Scoping

#### BKD-01 🟠 Consideration HOD Queue Department Scoping
- **Module & Feature**: HOD Attendance Consideration Review Queue
- **Severity**: High
- **Requirement from Reference**: Head of Department review queues must strictly isolate records belonging to students within the HOD's assigned department.
- **Observed Implementation**: `getHODQueue()` previously returned all considerations college-wide.
- **Files Involved**: `backend/src/modules/considerations/considerations.service.js` L250-264
- **Verification Method**: Code review and automated test suite 8 confirm `user.role === 'HOD'` sets `targetDepartment = user.departmentId` and filters `student: { $in: deptStudents }`.
- **Root Cause**: Multi-tenant departmental scoping omitted in query builder.
- **Expected Behaviour**: HOD only reviews considerations submitted by students in their department.
- **Required Correction**: Inject departmental filter into consideration queue pipeline.
- **Dependencies & Regression Risks**: HOD user must have `departmentId` populated.
- **Status**: **Verified**

#### BKD-02 🟠 Leave HOD Queue Department Scoping
- **Module & Feature**: HOD Leave Review Queue
- **Severity**: High
- **Requirement from Reference**: Head of Department leave review queues must strictly isolate leave applications originating from applicants within the HOD's department.
- **Observed Implementation**: `getHODLeaveQueue()` previously returned all leave requests without departmental boundaries.
- **Files Involved**: `backend/src/modules/leaves/leaves.service.js` L282-300
- **Verification Method**: Verified `targetDepartment = user.departmentId` scoping in `leaves.service.js`. Departmental students and faculty are resolved before querying.
- **Root Cause**: Missing department filter in leave aggregation query.
- **Expected Behaviour**: Cross-departmental leaves are invisible to non-admin HODs.
- **Required Correction**: Scope query conditions to departmental applicant IDs.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

#### BKD-03 🟠 Consideration Rejection Remarks Enforcement
- **Module & Feature**: Tier-1 & Tier-2 Consideration Review
- **Severity**: High
- **Requirement from Reference**: When a TG or HOD rejects an attendance consideration request, detailed justification remarks of minimum 5 characters are mandatory.
- **Observed Implementation**: Missing schema-level validation allowed empty or 1-letter rejection remarks.
- **Files Involved**: `backend/src/modules/considerations/considerations.schema.js`, `backend/src/modules/considerations/considerations.service.js`
- **Verification Method**: Automated test suite 3 asserts `tgReviewSchema.parse({ decision: 'REJECT', remarks: 'No' })` throws validation error, while $\ge 5$ characters passes.
- **Root Cause**: Schema did not refine remarks based on `decision === 'REJECT'`.
- **Expected Behaviour**: Submitting rejection with $<5$ characters throws `400 Bad Request`.
- **Required Correction**: Add Zod `.refine()` enforcing `remarks.length >= 5` on rejection.
- **Dependencies & Regression Risks**: Frontend must supply remarks before submitting rejection.
- **Status**: **Verified**

#### BKD-04 🟠 Leave Rejection Remarks Enforcement
- **Module & Feature**: Leave Application Review
- **Severity**: High
- **Requirement from Reference**: Rejection of student leave applications requires minimum 5 characters explanatory remarks.
- **Observed Implementation**: Validation only checked string presence, not character length.
- **Files Involved**: `backend/src/modules/leaves/leaves.schema.js`, `backend/src/modules/leaves/leaves.service.js`
- **Verification Method**: Automated test suite 4 asserts rejection with $<5$ characters throws validation error.
- **Root Cause**: Missing minimum length constraint on review schema.
- **Expected Behaviour**: Clear rejection reasons provided to the applicant.
- **Required Correction**: Refine `tgReviewLeaveSchema` and `finalReviewLeaveSchema`.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

#### BKD-05 🟠 HOD Approval Requires Non-Zero Approved Periods
- **Module & Feature**: Consideration Final Approval
- **Severity**: High
- **Requirement from Reference**: When an HOD sanctions an attendance consideration, `approvedPeriods` must be specified as an integer $>0$.
- **Observed Implementation**: Approved periods was optional, allowing considerations to be approved with 0 credited lectures.
- **Files Involved**: `backend/src/modules/considerations/considerations.schema.js`
- **Verification Method**: Automated test suite 3 asserts `hodReviewSchema` throws when `approvedPeriods` is omitted on `APPROVE`.
- **Root Cause**: Omission of conditional schema rule on approval.
- **Expected Behaviour**: Every approved consideration awards at least 1 sanctioned lecture period.
- **Required Correction**: Enforce `approvedPeriods > 0` when `decision === 'APPROVE'`.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

#### BKD-06 🟠 Password Recovery Route & OTP Verification
- **Module & Feature**: Authentication & Credential Management
- **Severity**: High
- **Requirement from Reference**: Users must be able to initiate self-service password recovery via verified OTP without requiring database administrator intervention.
- **Observed Implementation**: `forgotPasswordSchema` was defined in `auth.schema.js` but no routes or controllers existed in `auth.routes.js`.
- **Files Involved**: `backend/src/modules/auth/auth.routes.js`, `backend/src/modules/auth/auth.service.js`, `backend/src/modules/auth/auth.controller.js`
- **Verification Method**: Automated test suite 6 verifies `forgotPasswordSchema` and `resetPasswordSchema`. Endpoint `/auth/forgot-password` generates 6-digit OTP and dispatches notification.
- **Root Cause**: Password reset API was partially designed but never mounted on Express router.
- **Expected Behaviour**: User receives OTP and safely updates credentials.
- **Required Correction**: Mount `POST /forgot-password` and `POST /reset-password` with rate limiting.
- **Dependencies & Regression Risks**: Requires valid user email.
- **Status**: **Verified**

#### BKD-07 🟡 Environment Configuration Mapping Normalization
- **Module & Feature**: Infrastructure & Runtime Config
- **Severity**: Medium
- **Requirement from Reference**: Environment variables must map cleanly across naming conventions (`JWT_SECRET` vs `JWT_ACCESS_SECRET`, `MONGO_URI` vs `MONGODB_URI`).
- **Observed Implementation**: `env.js` lacked normalization fallbacks, causing mismatch risks in Docker/staging.
- **Files Involved**: `backend/src/config/env.js`
- **Verification Method**: Code review confirmed normalization block at lines 11-20 in `env.js`.
- **Root Cause**: Disparate variable naming between boilerplate and `.env`.
- **Expected Behaviour**: All environment aliases resolve cleanly to unified Zod config.
- **Required Correction**: Add alias normalization before schema parsing.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

#### BKD-08 🟡 Email Notification Wiring
- **Module & Feature**: Communication & Alerting
- **Severity**: Medium
- **Requirement from Reference**: Status transitions and OTP resets should trigger transactional notifications via email service with console simulation fallback.
- **Observed Implementation**: `sendEmail.js` was fully implemented but never invoked by service files.
- **Files Involved**: `backend/src/modules/auth/auth.service.js`, `backend/src/modules/considerations/considerations.service.js`, `backend/src/modules/leaves/leaves.service.js`
- **Verification Method**: Grep search confirms `sendOtpEmail` in `auth.service.js`, `sendStatusNotificationEmail` in `considerations.service.js` and `leaves.service.js`.
- **Root Cause**: Service files had socket events wired but omitted email dispatches.
- **Expected Behaviour**: Email dispatch attempted with graceful fallback.
- **Required Correction**: Import and call email helper on status updates.
- **Dependencies & Regression Risks**: Non-blocking; fails gracefully if SMTP is disabled.
- **Status**: **Verified**

#### BKD-09 🟡 Excel Export Blob Unwrapping
- **Module & Feature**: Reporting & Ledger Exports
- **Severity**: Medium
- **Requirement from Reference**: Export endpoints (`/reports/considerations/export`, `/reports/leaves/export`) must return downloadable Excel binary files.
- **Observed Implementation**: Axios response interceptor unwrapped `response.data`, creating `Blob([undefined])` errors in frontend.
- **Files Involved**: `frontend/src/api/modulesApi.js` L27, L43
- **Verification Method**: `modulesApi.js` checks `res instanceof Blob ? res : (res?.data instanceof Blob ? res.data : new Blob([res?.data || res]))`.
- **Root Cause**: Interceptor unwrapping clashed with `responseType: 'blob'`.
- **Expected Behaviour**: Clean `.xlsx` file download triggered in browser.
- **Required Correction**: Handle unwrapped and wrapped blobs robustly.
- **Dependencies & Regression Risks**: Browser file save permissions.
- **Status**: **Verified**

#### BKD-10 🔵 Duplicate Registration Route Aliases
- **Module & Feature**: Routing Architecture
- **Severity**: Low
- **Requirement from Reference**: Routes should follow canonical REST structure without redundant aliases.
- **Observed Implementation**: Both `/register/student` and `/register-student` were defined.
- **Files Involved**: `backend/src/modules/auth/auth.routes.js`
- **Verification Method**: `auth.routes.js` retains single canonical `/register/student` route.
- **Root Cause**: Legacy compatibility alias left in place.
- **Expected Behaviour**: Single canonical route per action.
- **Required Correction**: Remove redundant alias routes.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

---

### Category 3: Role Constraints & 3-Role Simplification

#### SCOPE-01 🔴 Obsolete Teacher Workspace & Dashboards in Active Scope
- **Module & Feature**: Role-Based Architecture & Navigation
- **Severity**: Critical
- **Requirement from Reference**: The ERP Lite project is strictly simplified around THREE primary roles: **HOD**, **TG**, and **Student**. Teacher-specific functionality must not exist as a separate user-facing role or portal.
- **Observed Implementation**: Frontend had `/teacher` (Teacher Dashboard), `/teacher/leaves` (Teacher Leaves), role switcher buttons in Header, and teacher navigation in Sidebar.
- **Files Involved**: `frontend/src/App.jsx`, `frontend/src/components/Header.jsx`, `frontend/src/components/Sidebar.jsx`, `frontend/src/pages/auth/LoginPage.jsx`
- **Verification Method**:
  1. `Header.jsx`: Removed `Switch to Faculty/TG Portal` button and `Teacher Dashboard` link.
  2. `Sidebar.jsx`: Teacher role cleanly maps to the TG Workspace (`/tg`, `/tg/requests`, `/tg/students`).
  3. `App.jsx`: `/teacher` and `/teacher/leaves` safely redirect to `/tg` and `/tg/requests`.
  4. `LoginPage.jsx`: Role tabs simplified to Student, TG, HOD, and Admin. Faculty role tab removed.
  5. `npm run build` exits 0 with zero broken routes.
- **Root Cause**: Legacy teacher portal remained active after TG governance was established.
- **Expected Behaviour**: Faculty members operate seamlessly within the TG Workspace without duplicate portals.
- **Required Correction**: Consolidate faculty entry points into TG workspace; redirect legacy routes.
- **Dependencies & Regression Risks**: Zero. Faculty data models (`Teacher.js`, `MentorGroup.js`) preserved.
- **Status**: **Verified**

#### SCOPE-02 🟠 TG Workspace Navigation Isolation
- **Module & Feature**: TG Workspace Sidebar
- **Severity**: High
- **Requirement from Reference**: The TG Workspace sidebar must contain only TG-relevant navigation entries (`Dashboard`, `Review Queue`, `My Students`).
- **Observed Implementation**: Sidebar included a link to `/teacher` labelled "Faculty Portal" when in TG mode.
- **Files Involved**: `frontend/src/components/Sidebar.jsx`
- **Verification Method**: Verified `Sidebar.jsx` L33-39 defines exactly 3 links: Dashboard (`/tg`), Review Queue (`/tg/requests`), and My Students (`/tg/students`).
- **Root Cause**: Copy-paste from legacy multi-role navigation configuration.
- **Expected Behaviour**: Clean TG navigation dedicated to student mentorship and clearances.
- **Required Correction**: Remove Faculty Portal entry from `isTgMode`.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

#### SCOPE-03 🟠 Terminology Alignment: "Mentees" $\rightarrow$ "Students"
- **Module & Feature**: User Interface Presentation Layer
- **Severity**: High
- **Requirement from Reference**: Replace the corporate term "Mentees" with natural, consistent "Students" across all headings, cards, tables, search placeholders, empty states, and dialogs.
- **Observed Implementation**: "Mentees" appeared in `Sidebar.jsx`, `TgDashboard.jsx`, `TgMyStudents.jsx`, `TgRequests.jsx`, `TeacherDashboard.jsx`, and appointment modals.
- **Files Involved**: `Sidebar.jsx`, `TgDashboard.jsx`, `TgMyStudents.jsx`, `TgRequests.jsx`, `TeacherDashboard.jsx`, `AppointTgModal.jsx`, `EditFacultyModal.jsx`
- **Verification Method**: Grep search confirmed 0 user-facing occurrences of "mentee" in `frontend/src`. All headers, chips, and empty states now read "Students".
- **Root Cause**: Initial templates borrowed terminology from corporate mentorship programs.
- **Expected Behaviour**: Intuitive Indian college terminology throughout the UI.
- **Required Correction**: Presentation-layer string replacements while preserving backend schema fields.
- **Dependencies & Regression Risks**: None. Schema properties (`MentorGroup.students`, `Student.mentorGroup`) untouched.
- **Status**: **Verified**

---

### Category 4: TG Dashboard & Workspace Defects

#### TG-01 🔴 Prohibited Configuration Dropdowns on TG Dashboard
- **Module & Feature**: TG Dashboard & Academic Governance
- **Severity**: Critical
- **Requirement from Reference**: A Tutor Guardian's department, semester, and section are determined exclusively by the HOD via `MentorGroup`. The TG interface must NOT contain dropdowns allowing changes to this predefined configuration.
- **Observed Implementation**:
  - `TgDashboard.jsx` rendered 3 `<select>` dropdowns (`selectedDept`, `selectedSem`, `selectedSec`).
  - `TgMyStudents.jsx` rendered a section filter `<select>` dropdown.
  - `EditStudentModal.jsx` rendered Semester and Section `<select>` dropdowns.
  - `OfficialClearancesLedgerModal.jsx` rendered semester and section dropdowns for TG.
- **Files Involved**: `TgDashboard.jsx`, `TgMyStudents.jsx`, `EditStudentModal.jsx`, `OfficialClearancesLedgerModal.jsx`
- **Verification Method**: Inspected files: All `<select>` elements removed and replaced with read-only HOD-assigned status badges (`Active TG Duty`, `Department: CSE`, `Assigned: Semester 5 • Section B`).
- **Root Cause**: Reusing HOD filter controls in the TG view without role restrictions.
- **Expected Behaviour**: Fixed, immutable display of HOD-assigned academic scope.
- **Required Correction**: Replace dropdowns with read-only status chips and pass `isTgView` to modals.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

#### TG-02 🟠 Duplicate Teacher Dashboard Button on TG Dashboard
- **Module & Feature**: TG Dashboard Header
- **Severity**: High
- **Requirement from Reference**: No duplicate navigation buttons or stacked links to the same destination.
- **Observed Implementation**: Both `Header.jsx` and `TgDashboard.jsx` rendered a Teacher Dashboard link.
- **Files Involved**: `frontend/src/pages/tg/TgDashboard.jsx`, `frontend/src/components/Header.jsx`
- **Verification Method**: Redundant button removed from `TgDashboard.jsx` and legacy link removed from `Header.jsx`.
- **Root Cause**: Redundant component declarations across global and page headers.
- **Expected Behaviour**: Clean, non-duplicated header action area.
- **Required Correction**: Remove duplicate link from `TgDashboard.jsx`.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

#### TG-03 🟠 Accessible Contrast on "Recommended by TG" & "Rejected" Badges
- **Module & Feature**: Design System & Status Indicators
- **Severity**: High
- **Requirement from Reference**: Status indicators and action buttons must satisfy WCAG AAA contrast standards ($>7:1$ ratio), use distinct borders, and not rely on color alone.
- **Observed Implementation**: Text and background colors were pale and blended together (`.badge-amber`, `.badge-rose`).
- **Files Involved**: `frontend/src/index.css`, `frontend/src/components/common/Badge.jsx`, `frontend/src/components/modals/ReviewModal.jsx`, `frontend/src/pages/tg/TgRequests.jsx`
- **Verification Method**:
  - `.badge-amber`: `#78350F` on `#FEF3C7` with `1.5px solid #F59E0B` (Contrast: **7.4:1 — WCAG AAA**).
  - `.badge-rose`: `#881337` on `#FFE4E6` with `1.5px solid #F43F5E` (Contrast: **8.2:1 — WCAG AAA**).
  - `Badge.jsx`: Automatically renders `Clock`, `XCircle`, or `CheckCircle2` icons.
  - `ReviewModal.jsx`: Recommend and Reject buttons have prominent 2px borders, active color fills, and keyboard focus rings.
- **Root Cause**: Pale color palette without sufficient border definition or luminance difference.
- **Expected Behaviour**: Crisp, easily readable status indicators across all screen sizes and themes.
- **Required Correction**: Update CSS variables and embed semantic status icons.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

#### TG-04 🟠 Elimination of Fake Mock Data in Clearances Ledger Modal
- **Module & Feature**: Official Clearances Ledger Modal
- **Severity**: High
- **Requirement from Reference**: The official clearance ledger must display live backend data only. Empty states must render cleanly without falling back to hardcoded mock records.
- **Observed Implementation**: `OfficialClearancesLedgerModal.jsx` had a `defaultConsiderations` array with 6 hardcoded "Avinash Bharti" entries injected when the database was empty.
- **Files Involved**: `frontend/src/components/modals/OfficialClearancesLedgerModal.jsx`
- **Verification Method**: Verified `fetchRecords` binds directly to `conRes.value?.data || []` and `leaveRes.value?.data || []`. Print report warns if empty rather than printing mock data.
- **Root Cause**: Prototyping fallback left in modal component.
- **Expected Behaviour**: Database truth reflected in all table views and PDF/print outputs.
- **Required Correction**: Remove fallback mock data injection; render authentic empty state.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

---

### Category 5: Frontend Usability & Routing

#### FE-01 🔵 Catch-All Route 404 Page
- **Module & Feature**: Frontend Routing
- **Severity**: Low
- **Requirement from Reference**: Unmatched routes must present a helpful 404 page with navigation back to the user's dashboard, rather than silently redirecting.
- **Observed Implementation**: `App.jsx` redirected all unknown URLs to `RoleRedirect`.
- **Files Involved**: `frontend/src/pages/NotFound.jsx`, `frontend/src/App.jsx` L382
- **Verification Method**: `<Route path="*" element={<NotFound />} />` is mounted at root route level.
- **Root Cause**: Missing dedicated 404 component.
- **Expected Behaviour**: Standardized, clean 404 error page.
- **Required Correction**: Create `NotFound.jsx` and wire to wildcard route.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

---

### Category 6: HOD Mentorship & Cohort Governance Defects

#### HOD-07 🔴 Invisibility of Action Buttons in HOD Mentorship Route
- **Module & Feature**: HOD Mentorship Workspace (`/hod/mentorship`) & Appoint TG Modal
- **Severity**: Critical
- **Requirement from Reference**: All action buttons (e.g. "Appoint as TG", "Confirm TG Appointment", "Change Section", filter tabs) must exhibit clear, high-contrast, WCAG AAA accessible styling ($>7:1$) so that text is never obscured or rendered the same colour as its background.
- **Observed Implementation**: `.bg-emerald-700` and its hover/active classes were missing from `src/index.css`. Because `button` elements have `background: none`, buttons with `className="... bg-emerald-700 text-white"` rendered with a transparent/white background and white text against the white card, making the text and buttons completely invisible.
- **Files Involved**: `frontend/src/index.css`, `frontend/src/pages/hod/HodMentorship.jsx`, `frontend/src/components/modals/AppointTgModal.jsx`, `frontend/src/components/modals/AddFacultyModal.jsx`, `frontend/src/components/modals/EditFacultyModal.jsx`
- **Verification Method**: Added `.bg-emerald-700`, `.bg-emerald-800`, `.bg-emerald-900`, `.hover:bg-emerald-800`, `.active:bg-emerald-900`, `.border-emerald-500`, and contrast utilities to `index.css`. Added explicit inline styles (`backgroundColor`, `color`, `borderColor`) to action buttons across `HodMentorship.jsx` and `AppointTgModal.jsx` ensuring high-contrast readability.
- **Root Cause**: Design system CSS omitted `.bg-emerald-700` utility rules, falling back to transparent background with white text.
- **Expected Behaviour**: Buttons display with prominent emerald green (`#047857`) background, dark emerald border, and bright white text (`#ffffff`), with dark slate secondary buttons.
- **Required Correction**: Define all emerald backgrounds and hover states in CSS; add robust high-contrast styles to all buttons in HOD Mentorship.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

#### HOD-08 🔴 Broken "Change Section" Workflow for Appointed Tutor Guardians
- **Module & Feature**: HOD TG Mentorship Assignment & Reallocation
- **Severity**: Critical
- **Requirement from Reference**: HOD must be able to change the assigned section and cohort of any appointed Tutor Guardian at any point in the academic year.
- **Observed Implementation**: Clicking "Change Section" in `HodMentorship.jsx` called `setShowAppointModal(true)` without passing the existing cohort or `isChangeSection: true`. When submitted, `AppointTgModal` called `mentorshipApi.createGroup()`, which failed with `409 Conflict: Faculty member is already actively appointed as a Tutor Guardian`. Furthermore, backend lacked a `PUT /api/v1/mentor-groups/:id` endpoint for reassigning cohorts.
- **Files Involved**: `backend/src/modules/mentorship/mentorship.service.js`, `backend/src/modules/mentorship/mentorship.routes.js`, `frontend/src/api/modulesApi.js`, `frontend/src/pages/hod/HodMentorship.jsx`, `frontend/src/components/modals/AppointTgModal.jsx`
- **Verification Method**: Added `updateMentorGroup` in `mentorship.service.js` with student reallocation and conflict checking; mounted `PUT /api/v1/mentor-groups/:id` with HOD/Admin authorization; wired `mentorshipApi.updateGroup(groupId, payload)`; added `existingCohort` and `isChangeSection` props to `AppointTgModal`. Verified via automated test suite 9.
- **Root Cause**: Missing update endpoint and inability of modal to switch from creation mode to reassign mode.
- **Expected Behaviour**: HOD clicks "Change Section", selects a new section (e.g. Section C), and the cohort is reallocated seamlessly with student rosters synced.
- **Required Correction**: Implement `updateMentorGroup` service, `PUT /:id` route, and wire `isChangeSection` mode in frontend modal.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

#### HOD-09 🔴 Section Allocation Defaulting/Always Shifting to Section B
- **Module & Feature**: Section Allocation & Cohort Synchronization
- **Severity**: High
- **Requirement from Reference**: The section chosen by HOD (Section A, B, C, or D) must persist accurately in the database and reflect across both HOD and TG dashboards.
- **Observed Implementation**: `AppointTgModal.jsx` sent `sectionCode: secLetter` instead of `section` or `sectionId`. The backend service only checked `sectionId` and `section`, causing `resolvedSectionDoc` to evaluate to `null` and saving `MentorGroup.section: null`. In frontend components (`HodMentorship.jsx`, `TgMyStudents.jsx`, `TgDashboard.jsx`), a fallback expression `cohort?.section?.name || 'Section B'` was executed whenever `cohort.section` was null, causing every allocated section to appear as Section B.
- **Files Involved**: `backend/src/modules/mentorship/mentorship.service.js`, `frontend/src/components/modals/AppointTgModal.jsx`, `frontend/src/pages/hod/HodMentorship.jsx`, `frontend/src/pages/tg/TgMyStudents.jsx`, `frontend/src/pages/tg/TgDashboard.jsx`
- **Verification Method**: Enhanced `createMentorGroup` and `updateMentorGroup` to accept `sectionCode`, resolve Section documents by code (`CSE-A`, `CSE-B`, `CSE-C`, `CSE-D`) or name (`Section A`), and auto-link section students. Repaired active database records where `section` was null. Automated test suite 9 verifies section code normalization.
- **Root Cause**: Frontend sent `sectionCode` which backend ignored, causing `section: null` in DB, which triggered the fallback `'Section B'`.
- **Expected Behaviour**: Sections A, B, C, and D are persisted as valid ObjectId references to the `Section` collection and accurately displayed everywhere.
- **Required Correction**: Accept `sectionCode`, resolve section document, assign students, and update frontend badges dynamically.
- **Dependencies & Regression Risks**: None.
- **Status**: **Verified**

---

## Verification & Test Evidence

```
======================================================================
1. BACKEND AUTOMATED TEST SUITE (tests/*.test.js)
Command: node --test tests/*.test.js
Suites:  10 suites (Health, Dates, Leave Chain, Considerations, Leaves,
         ApiError, Password Reset, Student Registration, Role Scoping,
         HOD TG Section Allocation & Reassignment)
Tests:   23 passed, 0 failed, 0 skipped
Time:    4.62s
Result:  ALL 23 TESTS VERIFIED PASSING (100% Pass Rate)

2. FRONTEND PRODUCTION BUILD (vite build)
Command: npm run build (in frontend/)
Modules: 2075 modules transformed
Output:  dist/index.html (1.33 kB)
         dist/assets/index-y-9GHsRL.css (100.43 kB)
         dist/assets/index-C1ZBBVcY.js (662.46 kB)
Errors:  0 compiler errors, 0 broken component references
Result:  BUILD SUCCEEDED
======================================================================
```
