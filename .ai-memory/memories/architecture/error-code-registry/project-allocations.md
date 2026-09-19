# Memory: architecture/error-code-registry/project-allocations


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

The project maintains a project-specific error code registry to prevent ID collisions between modules. Key allocated ranges include:

- Spec Management (SM): 2000–2999 (allocated, no consolidated index yet; sub-modules tracked separately).
- GSearch (GS): 7000–7919 (local codes; ecosystem-remapped to SM-GS 18000–18249).
- BRun (BR): 7100–7599 (sub-range within GS; allocated, no index yet).
- Nexus Flow (NF): 8000–8099 (compressed from original 8000–8399; codes 8100–8999 are unallocated).
- AI Bridge (AB) / PowerShell (PS): 9000–9999. A known overlap in the 9500–9540 range is intentional and handled by format distinction: PS uses prefixed strings (e.g., 'PS-9500-00') while AB SEO uses flat integers (e.g., '9501').
- WP Plugin Builder (WPB): 10000–10499 (compressed from original 10000–10999; codes 10500–10999 are unallocated).
- Spec Reverse (SRC): 11000–11999 (allocated, no index yet).
- WP SEO Publish CLI (WSP): 12000–12599.
- WP Plugin Publish (WPP): 13000–13499 (compressed from original 13000–13999; codes 13500–13999 are unallocated).
- Exam Manager (EQM): 14500–14999.
- License Manager (LM): 15000–15999.
- Spec Management (SM):
    - Code Generation System (SM-CG): 16000–16799 (reassigned from 12xxx).
    - Project Editor (SM-PE): 17000–17999 (reassigned from 13xxx).
    - Spec Editor: 6010–6013.
    - Error Recovery Patterns: 6020–6027.
- AB Lovable Reasoning: 19000–19049 (expanded from 19000–19019; originally reassigned from 10500–10519 via Resolution 13).

The canonical authority for all error code allocations is '02-spec/03-error-code-registry/01-registry.md'.
