 # Memory: features/ai-bridge/reasoning-behavior


**Version:** 1.0.0  

 
 **Updated:** 2026-02-05
 
 ---
 
 ## Summary
 
 AI Bridge defaults to a "Lovable/Bold" reasoning behavior. The system is mandated to reason first before executing any task, identifying missing context or ambiguities through clarifying questions. These questions must include pre-defined sample answers to facilitate rapid and easy user selection.
 
 ---
 
 ## Key Points
 
 - **Default Mode**: `TwoStage` (always reason first)
 - **Always Ask**: If confused, generate clarifying questions before proceeding
 - **Sample Answers**: Every question MUST include 2-4 sample answers
 - **Understanding Check**: AI summarizes understanding and asks for confirmation
 - **Skip Signals**: Phrases like "just do it", "no questions" bypass reasoning
 - **Error Codes**: 9830-9835 for reasoning behavior violations
 
 ---
 
 ## Question Format
 
 - Minimum 2 options, maximum 4 options per question
 - "Other" option always available for custom input
 - Each option includes label + description
 - One-click selection for fast user response
 
 ---
 
 ## Related Specs
 
 - `02-spec/22-ai-bridge-cli/01-backend/42-lovable-reasoning-defaults.md`
 - `02-spec/22-ai-bridge-cli/01-backend/37-adaptive-reasoning-flow.md`