# Implementation Plan — Admin/Student/Teacher Dashboard & Results/Exams/Admissions Overhaul

Date: 2026-01-31

## 0) Goals Summary
- Admin dashboard cards: include all main pages (Classes, Subjects, Teachers, Students, Exams, Attendance, Fees, Testimonials, etc.) and remove obsolete cards (Marks, Admission Form design/config, legacy Results pages).
- Admission form fill-up: only logged-in students can access; prefilled readonly student details; new subject-selection workflow with dynamic pricing; clear unauthenticated UI.
- Exam creation: remove invigilator selection and exam title requirement; use class → list subjects → optional date/time input table; confirm if missing routine entries; store schedule per subject; teachers associated via subject/class assignments.
- Exam routine download: for admin/student list pages; PDF routine with logo, school name, exam name, class, and subject schedule (N/A for missing times).
- Attendance/Results: teacher-specific filtering by assigned class/subject; result entry flow aligned with subject assignments and exams; admin review/publish; student results access only after publish.
- UI upgrades: student results table with icons/badges; marksheet download.
- Remove legacy marks/results pages and APIs where they conflict with new flow.

---

## 1) Current State Assessment (Key Files)
### Backend
- Exams/marks/attendance in academics app: [backend/academics/models.py](backend/academics/models.py), [backend/academics/views.py](backend/academics/views.py), [backend/academics/serializers.py](backend/academics/serializers.py), [backend/academics/urls.py](backend/academics/urls.py)
- Admission form templates and submissions: [backend/admissions/views.py](backend/admissions/views.py), [backend/admissions/services.py](backend/admissions/services.py)
- Existing exam admit card PDF generator: [backend/academics/services.py](backend/academics/services.py)

### Frontend
- Admin dashboard cards: [frontend/src/pages/admin/Dashboard.js](frontend/src/pages/admin/Dashboard.js)
- Admin classes UI: [frontend/src/pages/admin/ManageClasses.js](frontend/src/pages/admin/ManageClasses.js)
- Admin exams UI: [frontend/src/pages/admin/ManageExams.js](frontend/src/pages/admin/ManageExams.js)
- Student exams UI: [frontend/src/pages/student/Exams.js](frontend/src/pages/student/Exams.js)
- Teacher attendance/results: [frontend/src/pages/teacher/Attendance.js](frontend/src/pages/teacher/Attendance.js), [frontend/src/pages/teacher/Results.js](frontend/src/pages/teacher/Results.js)
- Admission form fill-up: [frontend/src/pages/AdmissionForm.js](frontend/src/pages/AdmissionForm.js)
- App routing: [frontend/src/App.js](frontend/src/App.js)

---

## 2) Data Model & API Changes (Backend)
### 2.1 Exams
**Current:** `Exam` requires `title`, `subject`, `invigilator`, `date` (non-null).

**Target:**
- Remove `title` requirement (or replace with derived exam group label). The “exam name” in UI should be configurable per group, but not mandatory.
- Remove `invigilator` from model/API usage.
- Allow subject entries with optional date/time; support “routine not set”.

**Tasks:**
1. Update `Exam` model:
   - Make `title` optional or derive from “exam group” concept.
   - Allow `date` nullable; same for `start_time`/`end_time`.
   - Remove/ignore `invigilator` or keep field but unused.
2. Update `ExamSerializer` and `ExamViewSet` to match new validation rules.
3. Update `ExamViewSet.create` to accept batch payload (class + subjects + optional date/time). Create one record per subject within a class exam group.
4. Adjust student/teacher filtering: ensure teachers see exams where their assigned subject is included; students see all exam entries for their class.

### 2.2 Results Flow
**Current:** `Mark` and `ResultSubmission` exist, but UI flow uses `marks` and `exam_name` string.

**Target:**
- Results are per exam + subject + class; only teachers assigned to that subject/class can submit.
- Admin can view status per subject and publish results.
- Students see “Check Result” only after published.

**Tasks:**
1. Align `Mark` to link to `Exam` (or store `exam_id` instead of `exam_name` string).
2. Create/adjust `ResultSubmission` usage:
   - Create one submission per exam+subject+class.
   - Store `max_score` at submission level.
3. Add endpoints:
   - Teacher: list eligible exams and subjects, submit marks.
   - Admin: list exam results status, view subject-specific marks, publish results.
4. Update publish action to set `Mark.published` for the submission.

### 2.3 Attendance Constraints
**Target:**
- Teacher can mark attendance only for subjects/classes they are assigned to.
- Student/teacher views filter by assignments.

**Tasks:**
1. Enforce subject/class checks in `AttendanceViewSet.mark` using `TeacherSubjectAssignment`.
2. Filter class/subject dropdowns via assignment list.

### 2.4 Admission Form Fill-up
**Target:**
- Only authenticated students can access.
- Prefill readonly student info.
- Subject selection logic with payment amount based on selection (all/one/two/three).

**Tasks:**
1. Create API endpoint to return student profile + class subjects.
2. Update admission form submission endpoint to accept subject selection payload and amount.
3. Update payment init logic to use new pricing and selection.
4. Remove template design/config endpoints from public/admin UI where not needed.

### 2.5 Exam Routine PDF
**Target:**
- New PDF routine download endpoint for admin/student.
- Layout: logo top center, school name, exam label, class label, table with subjects and date/time (N/A for missing).

**Tasks:**
1. Create `generate_exam_routine_pdf` in [backend/academics/services.py](backend/academics/services.py).
2. Add endpoints:
   - Admin: download routine for class exam group
   - Student: download routine for their class exam group

---

## 3) Frontend Changes
### 3.1 Admin Dashboard Cards
**Target:** Add missing cards, remove obsolete ones (Admission form design/config, Marks, legacy Results).

**Tasks:**
- Update [frontend/src/pages/admin/Dashboard.js](frontend/src/pages/admin/Dashboard.js) cards list.
- Ensure all cards have routes in [frontend/src/App.js](frontend/src/App.js).

### 3.2 Remove Admission Form Design/Submission Pages
**Target:** Remove Admin “Admission Form Design” & “Admission Submissions” pages.

**Tasks:**
- Remove route entries and cards.
- Remove menu links in admin dashboard.

### 3.3 Admission Form Fill-up (Student)
**Target:** Prefilled readonly UI + subject selection + dynamic pricing + auth guard.

**Tasks:**
- Update [frontend/src/pages/AdmissionForm.js](frontend/src/pages/AdmissionForm.js):
  - Require login; show login-required UI if unauthenticated.
  - Fetch student profile; render readonly personal fields.
  - Add subject selection UI:
    - Radio: All / One / Two / Three
    - For One/Two/Three: show selectable subject dropdowns (1/2/3) with validation.
    - For All: list all subjects readonly.
  - Display price based on selection: All=3600, One=1200, Two=1700, Three=2000.
  - Trigger payment with selection payload.

### 3.4 Admin Exam Creation UI
**Target:** Class selection only; subjects listed in table with optional date/time; confirm if missing.

**Tasks:**
- Update [frontend/src/pages/admin/ManageExams.js](frontend/src/pages/admin/ManageExams.js):
  - Remove title, invigilator, manual subject add.
  - After selecting class, list class subjects in a table with date/time inputs.
  - Add confirmation modal if none or some schedules are missing; list missing subjects.
  - Create exam entries even if dates are missing (routine optional).

### 3.5 Exam Routine Download Buttons
**Target:** Download routine from admin + student exam lists.

**Tasks:**
- Add “Download Routine” buttons in admin exam list and student exams list.
- Hook into new routine download endpoint.

### 3.6 Teacher Attendance Page
**Target:** Only classes/subjects assigned; better class/subject listing.

**Tasks:**
- Update [frontend/src/pages/teacher/Attendance.js](frontend/src/pages/teacher/Attendance.js) to list only assigned class/subject pairs (already partially present) and ensure backend enforcement.

### 3.7 Teacher Results Flow
**Target:** Paginated list of eligible exams; result entry page per subject.

**Tasks:**
- Replace [frontend/src/pages/teacher/Results.js](frontend/src/pages/teacher/Results.js) with:
  - Exam list view (paginated + search) showing only exams where teacher’s subject is present.
  - Action: “Make Result” to open result entry page.
  - Result entry page: list students, input obtained marks, set total marks (default 100), save.

### 3.8 Admin Results Flow
**Target:** Admin exam list with result status; view per subject; publish results.

**Tasks:**
- Add admin results page:
  - Exam list with status badges (pending/published).
  - “View Results” → subject list with submission status.
  - Subject details: readonly marks table + summary card.
  - Publish results button.

### 3.9 Student Exams & Results
**Target:** Student exams list shows routine download, check result if published; exam detail view.

**Tasks:**
- Update [frontend/src/pages/student/Exams.js](frontend/src/pages/student/Exams.js):
  - Add “Download Routine” button.
  - Add “Check Result” button only if published.
  - Improve UI badges/icons.
- Update student exam detail page (if separate) to show subject schedule table + actions.
- Remove legacy student “results” pages if not aligned with new flow.

### 3.10 Student Result Table UI + Marksheet
**Target:** Improved UI with badges/icons + PDF marksheet download.

**Tasks:**
- Update student result view to show icons/badges.
- Add marksheet download endpoint and button.

---

## 4) Removals & Cleanup
- Remove or hide:
  - Admission form design/config pages.
  - Admin “Marks” and legacy “Results” pages.
  - Student “Results” card/pages that do not match new flow.
- Remove routes and menu entries.
- Deprecate unused API endpoints and front-end calls.

---

## 5) Backend Validation & Permissions
- Admission form fill-up: enforce student-only, authenticated.
- Exam creation: admin-only.
- Result submission: teacher-only with assignment checks.
- Result publish: admin-only.
- Attendance marking: teacher-only and subject assignment checks.

---

## 6) Testing Plan
- Verify admin dashboard cards and route access.
- Create exams without routine → confirmation modal triggered.
- Create exams with partial routine → modal lists missing subjects.
- Teacher sees only assigned exams/subjects.
- Teacher can submit marks only for assigned subjects.
- Admin can view/publish results; students see published results only.
- Student routine download returns PDF and shows “N/A” where missing.
- Admission form fill-up: unauthenticated UI, authenticated prefill, pricing by selection, payment flow.

---

## 7) Milestones / Task Breakdown
1. **Backend model/API adjustments**: exams, results, attendance constraints.
2. **Routine PDF generator + endpoint**.
3. **Admission fill-up flow rework** (backend + frontend).
4. **Admin UI cleanup + cards update**.
5. **Teacher results flow rewrite**.
6. **Admin results workflow + publishing**.
7. **Student exams/results UX improvements + marksheet**.
8. **Remove legacy pages/routes** and smoke test.

---

## 8) Notes for Implementation
- Keep backwards compatibility where necessary but remove UI entry points to deprecated flows.
- Prefer using `TeacherSubjectAssignment` for permissions and filtering.
- When optional fields are empty, display placeholders and keep UI consistent.
- Use consistent badge styles across admin/teacher/student pages for statuses.

---

## Status Update (2026-01-31)
- ✅ Backend model/API adjustments (exams/results/attendance constraints) — done.
- ✅ Routine PDF generator + endpoint — done.
- ✅ Admission fill-up flow rework (backend + frontend) — done.
- ✅ Admin UI cleanup + cards update — done.
- ✅ Admin exam creation UI (routine table + confirm) — done.
- ✅ Teacher results flow rewrite — done.
- ✅ Student exams/results UX improvements — done (exam list + routine download + results view).
- ✅ Admin results workflow + publishing UI — done.
- ✅ Student marksheet download + enhanced result UI — done.
- ✅ Remove legacy pages/routes — done (public results route removed; legacy admin pages neutralized).
