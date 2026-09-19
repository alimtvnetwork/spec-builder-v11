 # Lovable-Style Reasoning Defaults
 
 > **Version:** 5.0.0  
 > **Updated:** 2026-03-09  
 > **Status:** Draft
 > **Related:** `37-adaptive-reasoning-flow.md`, `41-memory-classification-flags.md`
 
 ---
 
 ## 1. Overview
 
 This specification establishes **Lovable-style reasoning as the default behavior** for all AI Bridge interactions. The system MUST reason first before executing any task, identify missing context, and generate clarifying questions with pre-defined sample answers.
 
 ---
 
 ## 2. Core Mandate
 
 > **DEFAULT BEHAVIOR: Always Reason First, Always Ask Clarifying Questions**
 
 | Behavior | Default State |
 |----------|---------------|
 | Reason before acting | **Always ON** |
 | Ask clarifying questions | **Always ON** |
 | Provide sample answers | **Always ON** |
 | Skip reasoning signals | Honored but not default |
 
 ---
 
 ## 3. Reasoning-First Flow
 
 ### 3.1 Mandatory Reasoning Step
 
 **EVERY prompt MUST go through reasoning first:**
 
 ```
 ┌─────────────────────────────────────────────────────────────┐
 │ User Prompt Received                                        │
 └─────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ STEP 1: Reasoning Analysis (MANDATORY)                      │
 │ ├── Analyze prompt for completeness                         │
 │ ├── Identify ambiguities or missing context                 │
 │ ├── Determine required clarifications                       │
 │ └── Check RAG memory for relevant context                   │
 └─────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ STEP 2: Question Generation (if needed)                     │
 │ ├── Generate clarifying questions                           │
 │ ├── Provide 2-4 sample answers per question                 │
 │ ├── Include "Other" option for custom input                 │
 │ └── Wait for user response                                  │
 └─────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ STEP 3: Execute Task (after clarification resolved)         │
 │ ├── Full context from Steps 1-2                             │
 │ ├── Generate response/content                               │
 │ └── Include follow-up suggestions                           │
 └─────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## 4. Question Format with Sample Answers
 
 ### 4.1 Mandatory Question Structure
 
 **All clarifying questions MUST include sample answers:**
 
 ```json
 {
   "Type": "Clarification",
   "Questions": [
     {
       "Id": "Q001",
       "Question": "Which authentication method should we use?",
       "Header": "Auth method",
       "Options": [
         {
           "Label": "OAuth 2.0",
           "Description": "Industry standard, works with Google, GitHub, etc."
         },
         {
           "Label": "JWT Sessions",
           "Description": "Simple token-based auth, easy to implement"
         },
         {
           "Label": "Passkeys",
           "Description": "Modern passwordless, highest security"
         }
       ],
       "AllowOther": true,
       "MultiSelect": false,
       "Required": true
     },
     {
       "Id": "Q002",
       "Question": "What database should we use for this project?",
       "Header": "Database",
       "Options": [
         {
           "Label": "PostgreSQL",
           "Description": "Robust relational database with JSON support"
         },
         {
           "Label": "SQLite",
           "Description": "Lightweight, file-based, great for embedded"
         },
         {
           "Label": "MongoDB",
           "Description": "Document database, flexible schema"
         }
       ],
       "AllowOther": true,
       "MultiSelect": false,
       "Required": true
     }
   ],
   "DefaultAction": null,
   "CanProceedWithDefaults": false
 }
 ```
 
 ### 4.2 Sample Answer Requirements
 
 | Requirement | Description |
 |-------------|-------------|
 | **Minimum 2 options** | Every question must have at least 2 sample answers |
 | **Maximum 4 options** | Keep choices focused and easy to scan |
 | **"Other" option** | Always allow custom input (AllowOther: true) |
 | **Descriptive labels** | Each option includes a brief description |
 | **One-click selection** | User can pick a sample answer instantly |
 
 ---
 
 ## 5. Understanding Verification
 
 ### 5.1 Mandatory Understanding Check
 
 After processing requirements, AI MUST verify understanding:
 
 ```json
 {
   "Type": "Understanding",
   "Summary": "Here's what I understand you want:",
   "Points": [
     "Build a user authentication system with OAuth 2.0",
     "Include email verification before account activation",
     "Support both social login and email/password"
   ],
   "ConfirmationQuestion": {
     "Question": "Do I understand your requirements correctly?",
     "Options": [
       {"Label": "Yes, proceed", "Action": "Execute"},
       {"Label": "No, let me clarify", "Action": "Revise"},
       {"Label": "Partially, see my notes", "Action": "Amend"}
     ]
   }
 }
 ```
 
 ### 5.2 Understanding Flow
 
 ```
 ┌─────────────────────────────────────────────────────────────┐
 │ After Questions Answered                                    │
 └─────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ AI Summarizes Understanding                                 │
 │ "Here's what I understand you want:                         │
 │  1. Build X with Y approach                                 │
 │  2. Include Z feature                                       │
 │  3. Use W technology"                                       │
 └─────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ Confirmation Request                                        │
 │ "Do I understand correctly?"                                │
 │ [Yes, proceed] [No, let me clarify] [Partially correct]     │
 └─────────────────┬───────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
     Proceed    Revise     Amend
     to task    questions  details
 ```
 
 ---
 
 ## 6. Go Implementation
 
 ### 6.1 Reasoning Configuration (Updated Defaults)
 
 ```go
type ReasoningConfig struct {
    // Default: TwoStage (always reason first)
    Mode                  ReasoningMode
    
    // Default: true (always ask if confused)
    AlwaysAskIfConfused   bool
    
    // Default: true (always verify understanding)
    RequireUnderstandingCheck bool
    
    // Default: true (always provide sample answers)
    RequireSampleAnswers  bool
    
    // Sample answer constraints
    MinOptionsPerQuestion int  // Default: 2
    MaxOptionsPerQuestion int  // Default: 4
    
    // Skip signals (user can bypass reasoning)
    SkipSignals           []string
}
 
 // LovableDefaults returns the Lovable-style default configuration
 func LovableDefaults() ReasoningConfig {
     return ReasoningConfig{
         Mode:                      ReasoningModeTwoStage,
         AlwaysAskIfConfused:       true,
         RequireUnderstandingCheck: true,
         RequireSampleAnswers:      true,
         MinOptionsPerQuestion:     2,
         MaxOptionsPerQuestion:     4,
         SkipSignals: []string{
             "just do it",
             "no questions",
             "don't ask",
             "proceed directly",
             "skip clarification",
         },
     }
 }
 ```
 
 ### 6.2 Question Generator
 
 ```go
type ClarifyingQuestion struct {
    Id          string
    Question    string
    Header      string
    Options     []QuestionOption
    AllowOther  bool
    MultiSelect bool
    Required    bool
}

type QuestionOption struct {
    Label       string
    Description string
}

type UnderstandingCheck struct {
    Summary              string
    Points               []string
    ConfirmationQuestion ClarifyingQuestion
}
 
 // GenerateQuestions creates questions with sample answers
 func GenerateQuestions(prompt string, context []RAGChunk) ClarifyingQuestionSlice {
     questions := []ClarifyingQuestion{}
     
     // Analyze prompt for ambiguities
     ambiguities := AnalyzeAmbiguities(prompt, context)
     
     for _, amb := range ambiguities {
         q := ClarifyingQuestion{
             Id:          generateQuestionId(),
             Question:    amb.Question,
             Header:      amb.Category,
             Options:     generateSampleAnswers(amb),
             AllowOther:  true,
             MultiSelect: amb.AllowMultiple,
             Required:    amb.IsCritical,
         }
         
         // Enforce sample answer requirements
         if len(q.Options) < 2 {
             q.Options = padWithDefaultOptions(q.Options, amb.Category)
         }
         if len(q.Options) > 4 {
             q.Options = q.Options[:4]
         }
         
         questions = append(questions, q)
     }
     
     return appfault.Ok(questions)
 }
 ```
 
 ### 6.3 Reasoning Flow Executor
 
 ```go
 func ExecuteReasoningFlow(prompt string, session *Session) appfault.Result[*ReasoningResult] {
     config := session.GetReasoningConfig()
     
     // STEP 1: Always reason first (no skip unless explicit signal)
     if !ShouldSkipReasoning(prompt, config.SkipSignals) {
         
         // Load prioritized RAG context (Critical > Important > Regular)
         contextResult := LoadPrioritizedContext(session)
         if contextResult.HasError() {
             return appfault.Fail[*ReasoningResult](contextResult.Error())
         }
         
         // Generate clarifying questions with sample answers
         questionsResult := GenerateQuestions(prompt, contextResult.Value())
         if questionsResult.HasError() {
             return appfault.Fail[*ReasoningResult](questionsResult.Error())
         }
         
         // If questions exist, return them for user response
        if len(questionsResult.Value()) > 0 {
              return appfault.Ok(&ReasoningResult{
                  Status:     ReasoningStatusNeedsInput,
                  Questions:  questionsResult.Value(),
                  WaitingFor: "UserResponse",
              })
          }
      }
      
      // STEP 2: Generate understanding check (if enabled)
      if config.RequireUnderstandingCheck {
          understanding := GenerateUnderstandingCheck(prompt, session)
          return appfault.Ok(&ReasoningResult{
              Status:       ReasoningStatusConfirmUnderstanding,
              Understanding: understanding,
              WaitingFor:   "UserConfirmation",
          })
      }
     
     // STEP 3: Ready to execute
     return &ReasoningResult{
         Status:    ReasoningStatusReady,
         Context:   BuildFullContext(prompt, session),
     }, nil
 }
 ```
 
 ---
 
 ## 7. Updated Database Schema
 
 ### 7.1 ModuleReasoningSettings (Updated Defaults)
 
 ```sql
 -- Drop and recreate with new defaults
 CREATE TABLE IF NOT EXISTS ModuleReasoningSettings (
     Id                      INTEGER PRIMARY KEY AUTOINCREMENT,
     Module                  TEXT UNIQUE NOT NULL,
     ReasoningMode           TEXT DEFAULT 'TwoStage',    -- Changed from 'Auto'
     EnableQuestions         INTEGER DEFAULT 1,
     EnableSuggestions       INTEGER DEFAULT 1,
     RequireSampleAnswers    INTEGER DEFAULT 1,          -- New: always include samples
     RequireUnderstandingCheck INTEGER DEFAULT 1,        -- New: verify before acting
     MinOptionsPerQuestion   INTEGER DEFAULT 2,          -- New: minimum sample answers
     MaxOptionsPerQuestion   INTEGER DEFAULT 4,          -- New: maximum sample answers
     MaxQuestionsPerResponse INTEGER DEFAULT 5,
     HeuristicThreshold      INTEGER DEFAULT 3,
     UpdatedAt               TEXT DEFAULT (datetime('now'))
 );
 
 -- Lovable-style defaults for all modules
 INSERT OR REPLACE INTO ModuleReasoningSettings 
     (Module, ReasoningMode, RequireSampleAnswers, RequireUnderstandingCheck) 
 VALUES 
     ('Chat', 'TwoStage', 1, 1),
     ('Blog', 'TwoStage', 1, 1),
     ('Faq', 'TwoStage', 1, 1),
     ('Code', 'TwoStage', 1, 1),
     ('Paragraph', 'TwoStage', 1, 0);  -- Paragraph skips understanding check for brevity
 ```
 
 ---
 
 ## 8. Configuration (Seedable)
 
 Update `config.seed.json`:
 
 ```json
 {
   "LovableReasoning": {
     "DefaultMode": "TwoStage",
     "AlwaysAskIfConfused": true,
     "RequireUnderstandingCheck": true,
     "RequireSampleAnswers": true,
     "SampleAnswerConstraints": {
       "MinOptions": 2,
       "MaxOptions": 4,
       "AlwaysAllowOther": true
     },
     "UnderstandingCheck": {
       "Enabled": true,
       "SummaryMaxPoints": 5,
       "ConfirmationOptions": [
         {"Label": "Yes, proceed", "Action": "Execute"},
         {"Label": "No, let me clarify", "Action": "Revise"},
         {"Label": "Partially correct", "Action": "Amend"}
       ]
     },
     "SkipSignals": [
       "just do it",
       "no questions",
       "don't ask",
       "proceed directly",
       "skip clarification",
       "context is clear",
       "I know what I want"
     ],
     "ModuleOverrides": {
       "Paragraph": {
         "RequireUnderstandingCheck": false
       }
     }
   }
 }
 ```
 
 ---
 
 ## 9. Error Codes
 
 | Code | Name | Description |
 |------|------|-------------|
 | 19000 | `ErrReasoningRequired` | Reasoning step was bypassed incorrectly |
 | 19001 | `ErrSampleAnswersMissing` | Question generated without sample answers |
 | 19002 | `ErrUnderstandingNotConfirmed` | Task executed without understanding check |
 | 19003 | `ErrInvalidQuestionFormat` | Question does not meet format requirements |
 | 19004 | `ErrTooFewOptions` | Question has fewer than minimum options |
 | 19005 | `ErrTooManyOptions` | Question has more than maximum options |
 
 ---
 
 ## 10. UI Integration
 
 ### 10.1 Question Display with Sample Answers
 
 ```
 ┌─────────────────────────────────────────────────────────────┐
 │  🤔 I have a few questions before proceeding...            │
 ├─────────────────────────────────────────────────────────────┤
 │                                                              │
 │  Auth method                                                 │
 │  ┌─────────────────────────────────────────────────────┐    │
 │  │ Which authentication method should we use?           │    │
 │  │                                                       │    │
 │  │ ○ OAuth 2.0                                          │    │
 │  │   Industry standard, works with Google, GitHub, etc. │    │
 │  │                                                       │    │
 │  │ ○ JWT Sessions                                       │    │
 │  │   Simple token-based auth, easy to implement         │    │
 │  │                                                       │    │
 │  │ ○ Passkeys                                           │    │
 │  │   Modern passwordless, highest security              │    │
 │  │                                                       │    │
 │  │ ○ Other: [________________]                          │    │
 │  └─────────────────────────────────────────────────────┘    │
 │                                                              │
 │  Database                                                    │
 │  ┌─────────────────────────────────────────────────────┐    │
 │  │ What database should we use for this project?        │    │
 │  │                                                       │    │
 │  │ ○ PostgreSQL - Robust relational with JSON support   │    │
 │  │ ○ SQLite - Lightweight, file-based                   │    │
 │  │ ○ MongoDB - Document database, flexible schema       │    │
 │  │ ○ Other: [________________]                          │    │
 │  └─────────────────────────────────────────────────────┘    │
 │                                                              │
 ├─────────────────────────────────────────────────────────────┤
 │                                            [Submit Answers]  │
 └─────────────────────────────────────────────────────────────┘
 ```
 
 ### 10.2 Understanding Confirmation
 
 ```
 ┌─────────────────────────────────────────────────────────────┐
 │  ✅ Here's what I understand you want:                      │
 ├─────────────────────────────────────────────────────────────┤
 │                                                              │
 │  1. Build a user authentication system with OAuth 2.0       │
 │  2. Include email verification before account activation    │
 │  3. Support both social login and email/password            │
 │  4. Use PostgreSQL for the database                         │
 │                                                              │
 │  ─────────────────────────────────────────────────────────  │
 │                                                              │
 │  Do I understand your requirements correctly?                │
 │                                                              │
 │  [Yes, proceed]  [No, let me clarify]  [Partially correct]  │
 │                                                              │
 └─────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## 11. Migration from Previous Defaults
 
 ### 11.1 Migration Script
 
 ```sql
 -- Update existing settings to Lovable defaults
 UPDATE ModuleReasoningSettings 
 SET ReasoningMode = 'TwoStage',
     RequireSampleAnswers = 1,
     RequireUnderstandingCheck = 1
 WHERE ReasoningMode = 'Auto';
 
 -- Add new columns if not exists
 ALTER TABLE ModuleReasoningSettings ADD COLUMN RequireSampleAnswers INTEGER DEFAULT 1;
 ALTER TABLE ModuleReasoningSettings ADD COLUMN RequireUnderstandingCheck INTEGER DEFAULT 1;
 ALTER TABLE ModuleReasoningSettings ADD COLUMN MinOptionsPerQuestion INTEGER DEFAULT 2;
 ALTER TABLE ModuleReasoningSettings ADD COLUMN MaxOptionsPerQuestion INTEGER DEFAULT 4;
 ```
 
 ---
 
 ## 12. Related Specifications
 
 | Spec | Relationship |
 |------|--------------|
 | `37-adaptive-reasoning-flow.md` | Base reasoning architecture (now defaults to Lovable-style) |
 | `41-memory-classification-flags.md` | Critical/Important context prioritized in reasoning |
 | `34-suggestions-system.md` | Suggestions included with reasoning responses |
 | `36-session-scoped-rag-memory.md` | RAG context used for reasoning |
 | `39-adaptive-reasoning-api.md` | API for managing reasoning settings |