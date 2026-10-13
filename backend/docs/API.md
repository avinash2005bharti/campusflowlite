# CampusFlow Lite — API Reference Documentation

**Base URL:** `/api/v1`  
**Authentication:** `Authorization: Bearer <accessToken>` (JWT)  
**Refresh Token:** Automatic rotation via `httpOnly` secure cookie (`refreshToken`)

---

## 1. Response & Error Formats

### 1.1 Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 57,
    "totalPages": 3
  }
}
```

### 1.2 Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Detailed error message",
    "details": [
      { "path": "startDate", "message": "Start date must be in YYYY-MM-DD format" }
    ]
  }
}
```

Standard Error Codes:
- `VALIDATION_ERROR` (400)
- `UNAUTHENTICATED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `INVALID_STATE_TRANSITION` (400)
- `RATE_LIMITED` (429)
- `INTERNAL` (500)

---

## 2. Authentication (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `POST` | `/api/v1/auth/login` | Public | Login with email and password, returns access token and sets refresh cookie |
| `POST` | `/api/v1/auth/refresh` | Public (Cookie) | Rotates refresh token and returns new access token |
| `POST` | `/api/v1/auth/logout` | Auth | Revokes refresh token and clears cookie |
| `POST` | `/api/v1/auth/change-password` | Auth | Changes user password (required when `mustChangePassword=true`) |
| `GET` | `/api/v1/auth/me` | Auth | Returns current user details, role, `isTG` status, and profile |

---

## 3. Users & Master Data (`/api/v1`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/v1/users` | Admin | List users (supports pagination, `role`, `search`, `isActive`) |
| `POST` | `/api/v1/users` | Admin | Create user account |
| `GET` | `/api/v1/users/:id` | Admin | Get user profile |
| `PATCH` | `/api/v1/users/:id` | Admin | Update user details |
| `POST` | `/api/v1/users/:id/reset-password` | Admin | Reset user password to temporary password |
| `PATCH` | `/api/v1/users/:id/status` | Admin | Toggle user active/inactive status |
| `GET` | `/api/v1/sections` | HOD, Admin | List academic sections (filtered by `department`) |
| `POST` | `/api/v1/sections` | HOD, Admin | Create section (`year`, `semester`, `name`, `code`) |
| `GET` | `/api/v1/students` | HOD, Admin | List students with filters (`section`, `mentor`, `search`) |
| `GET` | `/api/v1/students/:id` | TG, HOD, Admin | Get student details |
| `GET` | `/api/v1/teachers` | HOD, Admin | List teachers with active TG status |

---

## 4. Mentorship (`/api/v1/mentor-groups`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/v1/mentor-groups/mine` | TG | Get current TG's cohort and student mentee list |
| `GET` | `/api/v1/mentor-groups` | HOD, Admin | List all mentor groups |
| `POST` | `/api/v1/mentor-groups` | HOD, Admin | Create group and assign TG (`department`, `tgId`, `academicYear`, `studentIds`) |
| `PUT` | `/api/v1/mentor-groups/:id/students` | HOD, Admin | Add/remove students (`addStudentIds`, `removeStudentIds`) |

---

## 5. Attendance Consideration Requests (`/api/v1/considerations`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `POST` | `/api/v1/considerations` | Student | Submit attendance consideration (requires `attachments >= 1`, dates `YYYY-MM-DD`, `requestedPeriods`) |
| `GET` | `/api/v1/considerations/mine` | Student | List own considerations |
| `GET` | `/api/v1/considerations/tg-queue` | TG | Review queue for assigned mentees |
| `GET` | `/api/v1/considerations/hod-queue` | HOD, Admin | HOD final review queue (`RECOMMENDED_BY_TG` + escalated) |
| `GET` | `/api/v1/considerations/:id` | Owner/TG/HOD/Admin | View full request details and history |
| `PATCH` | `/api/v1/considerations/:id/cancel` | Student Owner | Cancel request (only while `PENDING`) |
| `PATCH` | `/api/v1/considerations/:id/tg-review` | TG | Recommend or reject (`{ decision: 'RECOMMEND' \| 'REJECT', remarks }`) |
| `PATCH` | `/api/v1/considerations/:id/final-review` | HOD, Admin | Approve or reject (`{ decision: 'APPROVE' \| 'REJECT', remarks, approvedPeriods }`) |

---

## 6. Leave Applications (`/api/v1/leaves`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `POST` | `/api/v1/leaves` | Student, Teacher, HOD | Apply for leave (enforces no-overlap, medical proof rule for >2 days, backdate limit) |
| `GET` | `/api/v1/leaves/mine` | Any Applicant | List own applications |
| `GET` | `/api/v1/leaves/tg-queue` | TG | Student leave review queue |
| `GET` | `/api/v1/leaves/hod-queue` | HOD, Admin | HOD queue (recommended student leaves + pending faculty leaves) |
| `GET` | `/api/v1/leaves/admin-queue` | Admin | Admin queue for HOD leaves |
| `GET` | `/api/v1/leaves/:id` | Owner/Reviewers | View application details |
| `PATCH` | `/api/v1/leaves/:id/cancel` | Owner | Cancel leave (only while `PENDING`) |
| `PATCH` | `/api/v1/leaves/:id/tg-review` | TG | TG review on mentee leave |
| `PATCH` | `/api/v1/leaves/:id/final-review` | HOD, Admin | Final decision |

---

## 7. ImageKit Uploads (`/api/v1/uploads`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/v1/uploads/auth` | Auth | Get ImageKit client upload auth signature and token |
| `POST` | `/api/v1/uploads/verify` | Auth | Verify file metadata from ImageKit (`fileId`, size <= 5MB, PDF/JPG/PNG, correct user path) |
| `GET` | `/api/v1/uploads/signed-url` | Auth | Request a 5-minute signed URL for viewing private attachments (`fileId`) |
| `DELETE` | `/api/v1/uploads/:fileId` | Owner | Delete unlinked upload |

---

## 8. Dashboard, Reports & Audit (`/api/v1`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/v1/dashboard/summary` | Auth | Role-specific dashboard metrics and pending counts |
| `GET` | `/api/v1/reports/considerations` | HOD, Admin | Filtered consideration report |
| `GET` | `/api/v1/reports/leaves` | HOD, Admin | Filtered leaves report |
| `GET` | `/api/v1/reports/considerations/export` | HOD, Admin | Export considerations to Excel (`.xlsx`) |
| `GET` | `/api/v1/reports/leaves/export` | HOD, Admin | Export leaves to Excel (`.xlsx`) |
| `GET` | `/api/v1/audit` | HOD, Admin | Query immutable audit logs |

---

## 9. Bulk Import (`/api/v1/import`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/v1/import/template/:type` | Admin | Download Excel import template (`students` or `teachers`) |
| `POST` | `/api/v1/import/students` | Admin | Upload Excel file with row-level validation and batch creation |
| `POST` | `/api/v1/import/teachers` | Admin | Upload Excel file for teacher creation |

---

## 10. Real-time Events (Socket.IO)

**Connection URL:** `ws://<HOST>:<PORT>`  
**Auth:** `{ auth: { token: "<ACCESS_TOKEN>" } }`  
**Rooms joined automatically:** `user_<userId>`, `role_<ROLE>`, `tg_<teacherId>` (if TG).

**Events Emitted by Server:**
- `new_notification`: `{ id, title, message, type, link, createdAt }`
- `request_updated`: `{ kind: 'CONSIDERATION' | 'LEAVE', id, status }`
- `queue_changed`: `{ kind, scope: 'TG' | 'HOD' }`
