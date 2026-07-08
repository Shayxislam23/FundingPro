# FundingPro Survival Plan

Goal: move FundingPro from "promising platform" to a defensible, outcome-driven product.

Important: 100% startup survival is impossible to guarantee. This plan defines the operating system that makes failure much harder: validated demand, measurable student outcomes, verified certificates, scalable code, and repeatable sales.

## 1. North Star

FundingPro must not be only a grant catalog, AI writer, or checklist.

FundingPro should become an execution system that helps an individual move from intention to a real submitted opportunity application.

North Star Metric:

- Percentage of active «Мой путь» participants who submit at least 1 verified real application within 30 days.

Target:

- Week 2: 20%
- Month 1: 35%
- Month 3: 50%
- Month 6: 60%+

Secondary metrics:

- Profile completion rate
- CV submitted and mentor-approved rate
- 10 opportunities selected rate
- Motivation letter approved rate
- First application proof approved rate
- Certificate eligibility rate
- Paid conversion rate
- Refund / complaint rate
- Mentor response time

## 2. Brutal Diagnosis

Current product strength:

- Clear local pain: young people need guidance, opportunities, CV, LinkedIn, and application support.
- Existing technical base: Next.js, Convex, Clerk, documents, grants, AI, payments, admin, tests.
- Strong wedge: Karakalpak/Uzbek-friendly guided execution can beat generic global platforms.

Current product weakness:

- v1 ships for individuals only; NGO/business segments are deferred to reduce positioning noise.
- The onboarding checklist can be self-completed without enough mentor verification.
- Certificate eligibility is not yet trustworthy enough.
- Admin journey view is useful but not yet scalable or workflow-complete.
- AI module can silently fall back to mock responses if providers fail.
- There is no hard outcome loop: selected opportunity -> draft -> mentor review -> submitted proof -> verified result.

Verdict:

- The idea is not technically doomed.
- The product will fail if it remains a content/checklist platform.
- The product can survive if it becomes a verified execution pipeline.

## 3. Non-Negotiable Product Positioning

Short positioning:

FundingPro helps individuals in Uzbekistan find grants, scholarships, and programs, prepare documents, and submit real applications with optional mentor-guided execution («Мой путь»).

Do not position as:

- A generic LMS
- A grant database only
- A motivational course
- An AI writing toy
- A certificate factory

Position as:

- Application execution assistant
- Opportunity tracker
- Mentor-reviewed application pipeline
- Proof-based certificate system

Promise:

- "By the end of the Lab, you will submit at least one real opportunity application or clearly understand why you are not ready yet."

## 4. Survival Architecture

### 4.1 Product Modes (v1)

Shipped modes:

- `individual` — default for all users (grants, eligibility, AI, «Мой путь»)
- `mentor` / `admin` — internal roles

Deferred (add later without breaking v1):

- `organization` — NGO/business profile, team seats, org-specific grants

Why individual-first:

- Clear ICP for pilot: young professionals and students applying as физлица
- One dashboard, one nav, one onboarding story
- NGO SaaS returns when positioning and sales motion are separate

Current implementation:

- `userMode` defaults to `individual`; legacy `organization` / `lab_student` map to individual UX
- `/dashboard/lab` = «Мой путь» (mentor track, not a separate student product)
- Org tables/API remain for future segment; hidden from primary UI

### 4.2 Verified Task Model

Current checklist should evolve into task records.

Create table: `labTasks`

Fields:

- `userId`
- `cohortId`
- `taskType`
- `studentStatus`
- `mentorStatus`
- `evidenceDocumentId`
- `submittedAt`
- `reviewedAt`
- `reviewedBy`
- `revisionNote`
- `createdAt`
- `updatedAt`

Task types:

- `profile_completed`
- `interests_selected`
- `cv_uploaded`
- `linkedin_added`
- `opportunities_selected`
- `motivation_letter_uploaded`
- `real_opportunity_chosen`
- `application_submitted`
- `proof_uploaded`
- `certificate_ready`

Student status:

- `not_started`
- `in_progress`
- `submitted`

Mentor status:

- `pending_review`
- `needs_revision`
- `approved`
- `rejected`

Rule:

- Certificate eligibility must use mentor-approved tasks, not user self-reported fields.

### 4.3 Cohorts

Create table: `labCohorts`

Fields:

- `name`
- `startsAt`
- `endsAt`
- `status`
- `mentorIds`
- `certificatePolicyVersion`

Why:

- Without cohorts, Lab becomes an unbounded checklist.
- Cohorts let you sell batches, measure outcomes, manage deadlines, and create urgency.

### 4.4 Attendance

Do not build a complex attendance module first.

MVP:

- Add manual `attendancePercent`
- Add `attendanceReviewedBy`
- Add `attendanceReviewedAt`

Rule:

- If attendance is required by the cohort policy, missing attendance should block certificate eligibility.

Future:

- `labSessions`
- `labAttendance`
- QR check-in or mentor manual check.

## 5. Critical Engineering Fixes

### Fix 1: Stop Fake Certificate Eligibility

Problem:

- A user can mark some statuses manually.
- Certificate logic can treat missing attendance as passed.

Immediate patch:

- Certificate eligible only if:
  - profile approved
  - CV approved
  - LinkedIn present
  - 10 opportunities selected
  - motivation letter approved
  - proof approved
  - attendance passed if cohort requires it

Implementation:

1. Add mentor verification fields to `labParticipants` or create `labTasks`.
2. Update `computeLabStatus`.
3. Remove user control for proof/application approval.

Future:

- Certificate PDF should include policy version and verification metadata.

### Fix 2: Make Admin Journey Scalable

Problem:

- Admin views can become slow if they scan users or compute status per user.

Immediate patch:

- Read from `labParticipants` with pagination.
- Store denormalized:
  - `progressPercent`
  - `currentStage`
  - `nextAction`
  - `certificateEligible`

Future:

- Add filters:
  - cohort
  - mentor
  - status
  - needs reminder
  - certificate eligible

### Fix 3: Disable Mock AI In Production

Problem:

- AI provider failure can fall back to mock.
- This destroys trust in paid product.

Immediate patch:

- If `NODE_ENV === "production"` and provider fails, return an error.
- Show clear UI message.

Future:

- Add provider health dashboard.
- Add retry queue.
- Add cost and token budget tracking.

### Fix 4: Add Outcome Tracking

Problem:

- The product currently tracks tasks, not outcomes.

Immediate patch:

Add fields:

- `applicationSubmittedAt`
- `applicationProofDocumentId`
- `applicationUrl`
- `resultStatus`

Result statuses:

- `submitted`
- `under_review`
- `accepted`
- `rejected`
- `waitlisted`
- `unknown`

Future:

- Monthly alumni follow-up.
- Success stories generated from verified outcomes.

### Fix 5: Separate Lab UX From NGO UX

Problem:

- Lab student sees organization-related concepts.

Immediate patch:

- Add Lab dashboard first screen:
  - Next action
  - Deadline
  - Mentor feedback
  - Certificate progress
  - My selected opportunities

Future:

- Separate onboarding by persona at first login.

## 6. Product Roadmap

### Phase 0: Stabilize The Current MVP

Timeline: 3-5 days

Deliverables:

- Lab route exists and works.
- Student can fill profile, interests, LinkedIn, CV status.
- Student can upload CV, motivation letter, proof.
- Mentor can see journey table.
- Certificate card shows honest state.
- Production AI does not return mock.
- Typecheck, lint, tests pass.

Exit criteria:

- 10 test users can complete the flow without manual developer help.
- Mentor can identify who needs reminders.

### Phase 1: Verified Execution Loop

Timeline: 1-2 weeks

Deliverables:

- `labTasks` table.
- Mentor approval workflow.
- Revision notes.
- Proof review.
- Certificate eligibility based on approved tasks.
- Cohort support.

Exit criteria:

- At least 30 students in one cohort.
- 80% complete profile.
- 60% submit CV.
- 35% submit real application proof.

### Phase 2: Sales-Ready Lab

Timeline: 2-4 weeks

Deliverables:

- Pricing page for Lab.
- Payment flow for Lab product.
- Public landing page focused on student outcomes.
- Testimonials / success stories from verified users.
- Telegram reminder integration.
- Mentor workload dashboard.

Exit criteria:

- First 10 paying students.
- At least 3 verified application submissions.
- Refund rate below 10%.

### Phase 3: Scalable Cohort Engine

Timeline: 1-2 months

Deliverables:

- Cohort management.
- Mentor assignment.
- Session schedule.
- Attendance.
- Automated reminders.
- Outcome analytics.

Exit criteria:

- 100+ students across cohorts.
- Mentor response time under 24 hours.
- 50% application submission rate.

### Phase 4: Defensibility

Timeline: 3-6 months

Deliverables:

- Verified opportunity database.
- Local language guidance.
- Application templates by opportunity type.
- Alumni outcomes.
- Partnerships with schools, universities, NGOs.

Exit criteria:

- Repeatable acquisition channel.
- 3+ institutional partners.
- 500+ verified student profiles.
- Clear case studies.

## 7. Go-To-Market Plan

### Target Customers

Primary:

- High school and university students in Uzbekistan and Karakalpakstan.
- Students applying for scholarships, forums, exchange programs, competitions, internships.

Secondary:

- Parents paying for guided support.
- Schools and learning centers.
- Youth NGOs.
- Universities and departments.

### Offer Ladder

Free:

- Opportunity catalog
- Basic checklist
- Newsletter / Telegram digest

Low-ticket:

- Opportunities Lab cohort
- CV + LinkedIn + motivation letter + application proof

Mid-ticket:

- Mentor-reviewed application package

B2B:

- School/university cohort dashboard
- Mentor analytics
- Student certificate tracking

### Pricing Hypothesis

Pilot:

- 99,000 - 199,000 UZS per student

Standard:

- 299,000 - 499,000 UZS per cohort

Premium:

- 700,000+ UZS with 1:1 mentor review

Validation:

- Do not debate pricing internally.
- Test 3 price points with real buyers.

## 8. Metrics Dashboard

Admin must see:

- New students
- Active students
- Profile completed
- CV submitted
- CV approved
- 10 opportunities selected
- Motivation letter submitted
- Motivation letter approved
- Real application submitted
- Proof approved
- Certificate eligible
- Dropped users
- Needs reminder

Business must track:

- CAC
- Conversion rate
- Payment conversion
- Refund rate
- Application submission rate
- Certificate eligibility rate
- Accepted/rejected outcomes
- Mentor hours per student

## 9. Weekly Operating Cadence

Monday:

- Review funnel metrics.
- Identify stuck students.
- Assign mentor actions.

Wednesday:

- Review CV/motivation/proof queue.
- Send reminders.

Friday:

- Outcome review.
- Publish wins.
- Interview 3 students.

Sunday:

- Update opportunity list.
- Prepare next cohort content.

## 10. Technical Quality Bar

Every release must pass:

```bash
npm run typecheck
npm run lint
npm run test:convex
npm test
```

Before production deploy:

```bash
npm run deploy:prep
```

Minimum test coverage for Lab:

- Student can update Lab profile.
- Student cannot approve own proof.
- Mentor can approve proof.
- Certificate is blocked before proof approval.
- Admin journey pagination works.
- Production AI cannot return mock.

## 11. Immediate Engineering Backlog

Priority 0:

1. Add `labTasks`.
2. Add mentor approval API.
3. Update certificate eligibility.
4. Block self-approved proof.
5. Disable mock AI in production.

Priority 1:

1. Add `labCohorts`.
2. Add mentor notes and revision workflow.
3. Add reminders.
4. Add Lab-only dashboard.
5. Add outcome tracking.

Priority 2:

1. Add certificate generation.
2. Add alumni success tracking.
3. Add B2B cohort dashboard.
4. Add Telegram bot integration.

## 12. Risk Register

Risk: Students do not pay.

Mitigation:

- Sell pilot manually before building more.
- Offer cohort with mentor review, not just software.

Risk: Students complete checklist but do not submit real applications.

Mitigation:

- Make application proof the main milestone.
- Mentor reminders and deadlines.

Risk: Certificate becomes meaningless.

Mitigation:

- Require proof approval.
- Include verification metadata.

Risk: Mentor workload does not scale.

Mitigation:

- Standardized rubrics.
- Batch reviews.
- AI-assisted first review, human final approval.

Risk: Generic competitors copy features.

Mitigation:

- Build local opportunity database, local language guidance, verified outcomes, partnerships.

## 13. Definition Of Survival

FundingPro is surviving if:

- Users pay.
- Students submit real applications.
- Mentors can manage cohorts without chaos.
- Certificates are trusted.
- The product has a repeatable acquisition channel.

FundingPro is not surviving if:

- It has many signups but no submitted applications.
- It sells certificates without verification.
- It remains a generic checklist.
- Admin work depends on manual spreadsheets.
- AI gives mock or low-quality outputs in production.

## 14. Final Rule

Do not build more features until the core loop works:

Student joins -> completes profile -> selects opportunities -> prepares documents -> mentor reviews -> student submits real application -> proof approved -> certificate issued -> outcome tracked.

Everything outside this loop is secondary.

## 15. Pilot operations

For the first 10–20 student cohort, use [`docs/PILOT.md`](./PILOT.md): mentor SLA table, weekly rhythm, and week-4 success criteria aligned with the North Star metric above.
