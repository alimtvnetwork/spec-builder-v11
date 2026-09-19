# Rubric: Context Utilization

**Version:** 5.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  
**Profiles:** `research`, `chat`, `spec`, `all`

---

## Purpose

Evaluates whether the response effectively uses all available context — conversation history, RAG documents, project memories, user preferences, and system knowledge. Catches responses that ignore provided context or fail to leverage relevant information.

---

## Scoring Criteria

| Score | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | **Poor** | Ignores all provided context; generic response | Answers as if no context was provided; ignores RAG results entirely |
| 2 | **Below Standard** | Uses some context but misses key information | Uses 1 of 5 provided sources; ignores relevant conversation history |
| 3 | **Adequate** | Uses main context; misses some supplementary info | Addresses primary sources; doesn't reference relevant prior messages |
| 4 | **Good** | Effectively uses all relevant context | Integrates RAG results, conversation history, and project knowledge |
| 5 | **Excellent** | Synthesizes context masterfully; draws connections | Connects information across multiple sources; references patterns across history |

---

## Default Threshold

**3** — Must use primary context; supplementary context optional.

## Weight

**1.0** — Standard importance.

---

## Context Types

| Type | Source | Priority |
|------|--------|----------|
| **User Prompt** | Current message | Critical — always use |
| **Conversation History** | Prior messages in session | High — maintain continuity |
| **RAG Documents** | Retrieved knowledge chunks | High — use when relevant |
| **Project Memories** | `.ai-memory/memories/` | Medium — apply constraints and preferences |
| **System Prompt** | Preset/template instructions | High — follow directives |
| **User Preferences** | Settings and profile | Low — nice to have |

---

## Judge Prompt Template

```
You are a context utilization judge. Evaluate whether the AI response effectively uses all available context.

## Context
- User prompt: {user_prompt}
- AI response: {ai_response}
- Conversation history (last 5 messages): {conversation_history}
- RAG context provided: {rag_context}
- Active memories: {active_memories}
- System prompt: {system_prompt}

## Instructions
1. List all context sources available to the AI
2. Check which sources are referenced or utilized in the response
3. Identify any relevant context that was ignored
4. Score utilization from 1-5

## Output (JSON)
{
  "score": <1-5>,
  "context_available": [<list of sources>],
  "context_used": [<list of sources used>],
  "context_ignored": [<list of relevant but unused sources>],
  "critique": "<actionable feedback for retry>"
}
```

---

## Retry Strategy

When score < threshold:
1. List ignored context sources
2. Re-inject the ignored context prominently
3. Add instruction: "Your response did not utilize the following relevant context: {context_ignored}. Please incorporate this information into your answer."
