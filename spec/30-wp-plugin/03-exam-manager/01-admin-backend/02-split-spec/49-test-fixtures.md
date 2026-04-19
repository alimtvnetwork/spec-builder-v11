# 49. Test Data Fixtures


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

## Overview
Pre-defined test data fixtures for development, testing, and demonstration purposes.

---

## 49.1 Sample Exam Fixture

### Complete Exam (All Fields)

```json
{
  "Id": 1,
  "Title": "Advanced JavaScript Certification",
  "Slug": "advanced-javascript",
  "Description": "Comprehensive exam covering ES6+, async patterns, and best practices",
  "Content": "## Module 1: ES6 Fundamentals\n\nLearn about...\n\n## Module 2: Async Programming\n\nUnderstand promises...\n\n## Module 3: Design Patterns\n\nImplement common patterns...",
  "Visibility": "AUTHENTICATED",
  "ParentId": null,
  "SortOrder": 1,
  "SoftDeadlineDays": 14,
  "HardDeadlineDays": 21,
  "InheritDeadline": false,
  "RequiresPrerequisites": true,
  "AllowExtensions": true,
  "MaxExtensionDays": 14,
  "IsActive": true,
  "SectionCount": 3,
  "CreatedBy": 1,
  "CreatedAt": "2026-01-01T00:00:00Z",
  "UpdatedAt": "2026-01-15T12:30:00Z"
}
```

### Minimal Exam

```json
{
  "Title": "Quick Quiz",
  "Slug": "quick-quiz",
  "Content": "## Question 1\n\nAnswer here...",
  "Visibility": "PUBLIC",
  "IsActive": true
}
```

### Sub-Exam (Child)

```json
{
  "Title": "JavaScript Basics - Part 1",
  "Slug": "js-basics-part-1",
  "ParentId": 1,
  "SortOrder": 1,
  "InheritDeadline": true,
  "Content": "## Introduction\n\nBasics of JS..."
}
```

---

## 49.2 Participant Fixtures

### Participant at Each Status

```json
[
  {
    "Id": 1,
    "ExamId": 1,
    "UserId": 10,
    "Email": "invited@example.com",
    "Status": "INVITED",
    "ProgressPercent": 0,
    "CreatedAt": "2026-01-20T10:00:00Z",
    "SoftDeadline": "2026-02-03T10:00:00Z",
    "HardDeadline": "2026-02-10T10:00:00Z"
  },
  {
    "Id": 2,
    "ExamId": 1,
    "UserId": 11,
    "Email": "active@example.com",
    "Status": "ACTIVE",
    "ProgressPercent": 35,
    "StartedAt": "2026-01-21T09:00:00Z",
    "SoftDeadline": "2026-02-04T09:00:00Z",
    "HardDeadline": "2026-02-11T09:00:00Z"
  },
  {
    "Id": 3,
    "ExamId": 1,
    "UserId": 12,
    "Email": "paused@example.com",
    "Status": "PAUSED",
    "ProgressPercent": 50,
    "PausedAt": "2026-01-25T14:00:00Z",
    "PauseReason": "Personal circumstances"
  },
  {
    "Id": 4,
    "ExamId": 1,
    "UserId": 13,
    "Email": "soft-deadline@example.com",
    "Status": "SOFT_DEADLINE_REACHED",
    "ProgressPercent": 65,
    "SoftDeadlineReachedAt": "2026-01-28T10:00:00Z"
  },
  {
    "Id": 5,
    "ExamId": 1,
    "UserId": 14,
    "Email": "hard-deadline@example.com",
    "Status": "HARD_DEADLINE_REACHED",
    "ProgressPercent": 80,
    "HardDeadlineReachedAt": "2026-01-30T10:00:00Z"
  },
  {
    "Id": 6,
    "ExamId": 1,
    "UserId": 15,
    "Email": "extended@example.com",
    "Status": "EXTENDED",
    "ProgressPercent": 70,
    "ExtensionGrantedAt": "2026-01-29T16:00:00Z",
    "ExtensionDays": 7,
    "OriginalHardDeadline": "2026-02-05T10:00:00Z",
    "HardDeadline": "2026-02-12T10:00:00Z"
  },
  {
    "Id": 7,
    "ExamId": 1,
    "UserId": 16,
    "Email": "completed@example.com",
    "Status": "COMPLETED",
    "ProgressPercent": 100,
    "CompletedAt": "2026-01-28T11:30:00Z"
  },
  {
    "Id": 8,
    "ExamId": 1,
    "UserId": 17,
    "Email": "locked@example.com",
    "Status": "LOCKED",
    "ProgressPercent": 45,
    "LockedAt": "2026-01-30T00:00:00Z",
    "LockReason": "Hard deadline passed"
  },
  {
    "Id": 9,
    "ExamId": 1,
    "UserId": 18,
    "Email": "withdrawn@example.com",
    "Status": "WITHDRAWN",
    "ProgressPercent": 20,
    "WithdrawnAt": "2026-01-22T15:00:00Z",
    "WithdrawReason": "Changed career path"
  }
]
```

### Anonymous Participant

```json
{
  "Id": 100,
  "ExamId": 1,
  "UserId": null,
  "Email": "anon-1706180400-abc123@exam.local",
  "TrackingId": "trk_abc123def456",
  "Status": "ACTIVE",
  "ProgressPercent": 25,
  "IsAnonymous": true,
  "SecretKeyId": 5,
  "CreatedAt": "2026-01-25T10:00:00Z"
}
```

---

## 49.3 Secret Key Fixtures

### Active Secret Key

```json
{
  "Id": 5,
  "ExamId": 1,
  "KeyHash": "$argon2id$v=19$m=65536,t=3,p=4$...",
  "Label": "Team Alpha Access",
  "IsActive": true,
  "UsageLimit": 50,
  "UsageCount": 12,
  "ExpiresAt": "2026-03-01T00:00:00Z",
  "LastUsedAt": "2026-01-25T14:30:00Z",
  "IpPattern": null,
  "CreatedBy": 1,
  "CreatedAt": "2026-01-01T00:00:00Z"
}
```

### Expired Secret Key

```json
{
  "Id": 6,
  "ExamId": 1,
  "KeyHash": "$argon2id$v=19$...",
  "Label": "Q4 2025 Access",
  "IsActive": true,
  "UsageLimit": 100,
  "UsageCount": 87,
  "ExpiresAt": "2025-12-31T23:59:59Z",
  "CreatedAt": "2025-10-01T00:00:00Z"
}
```

### Limit Reached Key

```json
{
  "Id": 7,
  "ExamId": 1,
  "KeyHash": "$argon2id$v=19$...",
  "Label": "Limited Access",
  "IsActive": true,
  "UsageLimit": 10,
  "UsageCount": 10,
  "ExpiresAt": null,
  "CreatedAt": "2026-01-15T00:00:00Z"
}
```

---

## 49.4 Extension Request Fixtures

### Pending Request

```json
{
  "Id": 1,
  "ParticipantId": 5,
  "RequestedDays": 7,
  "Reason": "I experienced unexpected family circumstances that prevented me from completing the exam on time. My father was hospitalized and I needed to take care of family matters.",
  "AttachmentPath": "/uploads/extensions/medical_note_123.pdf",
  "Status": "PENDING",
  "RequestedAt": "2026-01-30T09:00:00Z",
  "ReviewedBy": null,
  "ReviewedAt": null,
  "GrantedDays": null,
  "DenialReason": null
}
```

### Approved Request

```json
{
  "Id": 2,
  "ParticipantId": 6,
  "RequestedDays": 14,
  "Reason": "Work project deadline conflict requiring full attention for two weeks.",
  "Status": "APPROVED",
  "RequestedAt": "2026-01-28T10:00:00Z",
  "ReviewedBy": 1,
  "ReviewedAt": "2026-01-29T16:00:00Z",
  "GrantedDays": 7,
  "DenialReason": null
}
```

### Denied Request

```json
{
  "Id": 3,
  "ParticipantId": 8,
  "RequestedDays": 30,
  "Reason": "Just need more time.",
  "Status": "DENIED",
  "RequestedAt": "2026-01-29T11:00:00Z",
  "ReviewedBy": 1,
  "ReviewedAt": "2026-01-29T14:00:00Z",
  "GrantedDays": null,
  "DenialReason": "Reason does not meet our extension criteria. Please provide specific circumstances that prevented completion."
}
```

---

## 49.5 Checklist & Progress Fixtures

### Exam Checklist Items

```json
[
  {
    "Id": 1,
    "ExamId": 1,
    "Phase": "PRE",
    "Label": "Watch introduction video",
    "Description": "15-minute overview of the certification",
    "SortOrder": 1,
    "IsRequired": true,
    "VideoUrl": "https://youtube.com/watch?v=example1"
  },
  {
    "Id": 2,
    "ExamId": 1,
    "Phase": "PRE",
    "Label": "Read coding guidelines",
    "SortOrder": 2,
    "IsRequired": true,
    "LinkUrl": "https://example.com/guidelines"
  },
  {
    "Id": 3,
    "ExamId": 1,
    "Phase": "IN_EXAM",
    "Label": "Module 1: ES6 Fundamentals",
    "SectionNumber": 1,
    "SortOrder": 1,
    "IsRequired": true
  },
  {
    "Id": 4,
    "ExamId": 1,
    "Phase": "IN_EXAM",
    "Label": "Module 2: Async Programming",
    "SectionNumber": 2,
    "SortOrder": 2,
    "IsRequired": true
  },
  {
    "Id": 5,
    "ExamId": 1,
    "Phase": "IN_EXAM",
    "Label": "Module 3: Design Patterns",
    "SectionNumber": 3,
    "SortOrder": 3,
    "IsRequired": true
  },
  {
    "Id": 6,
    "ExamId": 1,
    "Phase": "POST",
    "Label": "Submit LinkedIn profile",
    "SortOrder": 1,
    "IsRequired": false,
    "RequiresEvidence": true,
    "EvidenceType": "URL"
  }
]
```

### Participant Progress

```json
[
  {
    "ParticipantId": 2,
    "ItemId": 1,
    "CompletedAt": "2026-01-21T09:30:00Z"
  },
  {
    "ParticipantId": 2,
    "ItemId": 2,
    "CompletedAt": "2026-01-21T10:00:00Z"
  },
  {
    "ParticipantId": 2,
    "ItemId": 3,
    "CompletedAt": "2026-01-22T14:00:00Z"
  }
]
```

---

## 49.6 Edge Case Fixtures

### Exam with No Deadline

```json
{
  "Title": "Self-Paced Course",
  "Slug": "self-paced",
  "SoftDeadlineDays": null,
  "HardDeadlineDays": null,
  "AllowExtensions": false
}
```

### Participant with Multiple Extensions

```json
{
  "Id": 50,
  "ExamId": 1,
  "Status": "EXTENDED",
  "ExtensionDays": 21,
  "OriginalHardDeadline": "2026-01-15T00:00:00Z",
  "HardDeadline": "2026-02-05T00:00:00Z",
  "ExtensionHistory": [
    { "GrantedDays": 7, "GrantedAt": "2026-01-14T10:00:00Z" },
    { "GrantedDays": 7, "GrantedAt": "2026-01-21T14:00:00Z" },
    { "GrantedDays": 7, "GrantedAt": "2026-01-28T09:00:00Z" }
  ]
}
```

### Locked Exam (Inactive)

```json
{
  "Id": 99,
  "Title": "Archived Exam 2024",
  "Slug": "archived-2024",
  "IsActive": false,
  "Visibility": "PRIVATE"
}
```

---

## 49.7 Performance Test Data

### Volume Specifications

| Scenario | Exams | Participants | Progress Records |
|----------|-------|--------------|------------------|
| Small | 5 | 50 | 500 |
| Medium | 20 | 500 | 10,000 |
| Large | 50 | 5,000 | 150,000 |
| Stress | 100 | 50,000 | 2,000,000 |

### Seeder Commands

```bash
# Development seed (small)
wp eqm seed --size=small

# Demo seed (medium with realistic distribution)
wp eqm seed --size=medium --demo

# Performance test seed (large)
wp eqm seed --size=large

# Stress test seed
wp eqm seed --size=stress --skip-events
```

### Distribution Rules

For realistic test data:
- 10% INVITED (not started)
- 35% ACTIVE (in progress)
- 5% PAUSED
- 15% SOFT_DEADLINE_REACHED
- 10% HARD_DEADLINE_REACHED
- 5% EXTENDED
- 15% COMPLETED
- 3% LOCKED
- 2% WITHDRAWN

---

## 49.8 Seed Script Pseudocode

```php
class TestDataSeeder {
    public function seed(string $size): void {
        $config = $this->getConfig($size);
        
        // Phase 1: Create users
        $users = $this->createUsers($config['Users']);
        
        // Phase 2: Create exams with hierarchy
        $exams = $this->createExams($config['Exams']);
        foreach ($exams as $exam) {
            $this->createChecklists($exam);
            $this->createSecretKeys($exam, $config['KeysPerExam']);
        }
        
        // Phase 3: Create participants with distribution
        foreach ($exams as $exam) {
            $this->createParticipants(
                $exam,
                $users,
                $config['ParticipantsPerExam'],
                $config['StatusDistribution']
            );
        }
        
        // Phase 4: Create progress records
        $this->createProgressRecords($config['ProgressDensity']);
        
        // Phase 5: Create extension requests
        $this->createExtensionRequests($config['ExtensionRate']);
        
        // Phase 6: Recalculate cached values
        $this->recalculateProgress();
    }
    
    private function getConfig(string $size): array {
        return match($size) {
            'small' => [
                'Users' => 50,
                'Exams' => 5,
                'ParticipantsPerExam' => 10,
                'KeysPerExam' => 2,
                'ProgressDensity' => 0.5,
                'ExtensionRate' => 0.1,
            ],
            'medium' => [
                'Users' => 500,
                'Exams' => 20,
                'ParticipantsPerExam' => 25,
                'KeysPerExam' => 5,
                'ProgressDensity' => 0.6,
                'ExtensionRate' => 0.15,
            ],
            'large' => [
                'Users' => 5000,
                'Exams' => 50,
                'ParticipantsPerExam' => 100,
                'KeysPerExam' => 10,
                'ProgressDensity' => 0.7,
                'ExtensionRate' => 0.2,
            ],
            'stress' => [
                'Users' => 50000,
                'Exams' => 100,
                'ParticipantsPerExam' => 500,
                'KeysPerExam' => 20,
                'ProgressDensity' => 0.8,
                'ExtensionRate' => 0.25,
            ],
        };
    }
}
```

---

## 49.9 Cleanup Commands

```bash
# Clear all test data (preserves schema)
wp eqm seed --clear

# Clear specific entity
wp eqm seed --clear=participants

# Reset to initial state
wp eqm seed --reset
```

---

## Acceptance Criteria

- [ ] All fixtures validate against schema
- [ ] Seeder creates realistic data relationships
- [ ] Status distribution matches specification
- [ ] Progress percentages correctly calculated
- [ ] Large seed completes in < 5 minutes
- [ ] Stress seed completes in < 30 minutes
- [ ] Cleanup removes all test data
- [ ] No test data markers in production

---

## Related Specifications

| Topic | Spec |
|-------|------|
| Testing Requirements | [41-testing-requirements](41-testing-requirements.md) |
| Database Schema | [04-database-schema](04-database-schema.md) |
| Participant Service | [27-participant-service](27-participant-service.md) |
| Enums | [06-enums-constants](06-enums-constants.md) |

---

*This concludes the test fixtures specification.*
