---
id: X.X.X.X.X.X
title: [Single Feature Name]
status: Draft
owner: [Implementation Owner Role]
assigned_roles: [List of roles working on this feature]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# [Single Feature Name] PRD

## Table of Contents
1. [Overview](#sec-1)
2. [User Stories](#sec-2)
3. [Functional Requirements](#sec-3)
4. [Non-Functional Requirements](#sec-4)
5. [Architecture & Design](#sec-5)
6. [Implementation Notes](#sec-6)
7. [Testing & Acceptance](#sec-7)
8. [Changelog](#sec-8)
9. [Dynamic Collaboration & Review Workflow](#sec-9)
10. [Reference Links](#sec-10)

<a id="sec-1"></a>
## 1. Overview

### 1.1 Purpose
[Describe the purpose of this SINGLE FEATURE and its business value]

### 1.2 Scope
[Define what's included and excluded for this ONE FEATURE]

### 1.3 Success Metrics
- [Metric 1 specific to this feature]
- [Metric 2 specific to this feature]

<a id="sec-2"></a>
## 2. User Stories

### 2.1 Primary User Story
As a [user type], I want to [action] so that [benefit].

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

<a id="sec-3"></a>
## 3. Functional Requirements

### 3.1 Core Functionality
- REQ-001: [Requirement description for this feature]
- REQ-002: [Requirement description for this feature]

<a id="sec-4"></a>
## 4. Non-Functional Requirements

### 4.1 Performance
- Response time < 500ms
- Support 100 concurrent users

### 4.2 Security
- Authentication required
- Data encryption at rest

<a id="sec-5"></a>
## 5. Architecture & Design

### 5.1 System Architecture
[Describe architecture approach for this feature]

### 5.2 Database Schema
[Define schema changes if any for this feature]

<a id="sec-6"></a>
## 6. Implementation Notes

### 6.1 Technical Constraints
- Use existing framework
- Maintain backward compatibility

### 6.2 Dependencies
- [Dependency 1]
- [Dependency 2]

<a id="sec-7"></a>
## 7. Testing & Acceptance

### 7.1 Test Scenarios
- TS-001: [Scenario description]
- TS-002: [Scenario description]

### 7.2 Acceptance Criteria
- All scenarios pass
- Overall Status: Pass in QA results
- Security evidence attached; no High/Critical

### 7.3 QA Artifacts
- Test cases file: `QA/[X.X.X.X.X.X]-[slug]/test-cases.md`
- Latest results: `QA/[X.X.X.X.X.X]-[slug]/test-results-YYYY-MM-DD.md`
- Example: `QA/1.1.2.1.1.0-profile-avatar-upload/test-cases.md`

<a id="sec-8"></a>
## 8. Changelog
- v1.0: Initial draft created

<a id="sec-9"></a>
## 9. Dynamic Collaboration & Review Workflow

**NOTE: This section is dynamically generated based on the roles assigned to this PRD**

### 9.1 Assigned Roles for This Feature

Based on the `assigned_roles` field in the frontmatter, the following roles are involved:

<!-- Dynamic list based on assigned_roles -->
- Implementation Owner: [From owner field]
- Assigned Team Members: [From assigned_roles field]

### 9.2 Dynamic Role Order and Responsibilities

The review and implementation order is determined by the assigned roles:

1. **Requirements Phase** (if Product Manager assigned)
   - Product Manager → Defines scope and acceptance criteria
   - VP-Product → Approves business alignment
   
2. **Technical Design Phase** (if technical roles assigned)
   - CTO/Staff Engineer → Reviews technical approach
   - Security roles → Threat modeling if assigned
   
3. **Implementation Phase** (based on assigned engineers)
   - Frontend Engineer → UI implementation if assigned
   - Backend Engineer → API implementation if assigned
   - Full-Stack Engineer → End-to-end if assigned
   
4. **Quality Phase** (if QA roles assigned)
   - QA Engineer → Test execution
   - QA Automation Engineer → Automated tests
   
5. **Deployment Phase** (if DevOps/SRE assigned)
   - DevOps Engineer → Deployment pipeline
   - SRE → Monitoring and reliability

### 9.3 Dynamic Inputs/Outputs per Role

<!-- This table is generated based on assigned roles -->
| Role | Inputs Required | Outputs Delivered | Handoff To |
|------|----------------|-------------------|------------|
| [Dynamic based on assigned_roles] | [Dynamic] | [Dynamic] | [Dynamic] |

### 9.4 Execution Plan (Decomposed Tasks)

**Tasks are generated based on assigned roles and feature requirements:**

| Task ID | Owner (Role) | Description | Dependencies | Outputs | Status |
|---------|--------------|-------------|--------------|---------|--------|
| T-[feature]-001 | [Dynamic from assigned_roles] | [Task based on role] | [Deps] | [Output] | Planned |
| T-[feature]-002 | [Dynamic from assigned_roles] | [Task based on role] | [Deps] | [Output] | Planned |

### 9.5 Review Notes

**Dynamic review checklist based on assigned roles:**

<!-- Generated based on assigned_roles -->
- [ ] If PM assigned: Scope and user stories confirmed
- [ ] If VP-Product assigned: Business alignment confirmed
- [ ] If CTO assigned: Technical approach approved
- [ ] If Security assigned: Threat model reviewed
- [ ] If UX assigned: Design mockups approved
- [ ] If QA assigned: Test scenarios confirmed
- [ ] If DevOps assigned: Deployment plan approved

### 9.6 Decision Log & Sign-offs

**Required sign-offs (only for assigned roles):**

<!-- Only show checkboxes for roles in assigned_roles -->
- [ ] [Role 1 from assigned_roles] — [Responsibility area] confirmed
- [ ] [Role 2 from assigned_roles] — [Responsibility area] confirmed
- [ ] [Implementation Owner] — Feature complete with evidence

<a id="sec-10"></a>
## 10. Reference Links

- Roadmap: `Plans/product-roadmap.md`
- Parent Epic: [If this feature is part of a larger epic]
- Related PRDs: [Other single-feature PRDs that relate]
- Design Docs: [Link]
- API Specs: [Link]