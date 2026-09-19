 # Error Code Registry - Complete


**Version:** 1.0.0  

 
 **Updated:** 2026-02-28
 **Status:** Active
 
 ---
 
 ## Overview
 
 This registry documents all error code ranges across the 9 Go-based CLI tools in the ecosystem. Error codes follow a strict partitioning scheme to prevent collisions and enable rapid debugging.
 
 ---
 
 ## Error Code Allocation Map
 
 | Range | CLI Tool | Prefix | Status |
 |-------|----------|--------|--------|
 | 1000-1999 | General/Shared | GEN | ✅ Active |
 | 2000-2999 | Spec Management | SM | ✅ Active |
 | 7000-7099 | GSearch CLI (Core) | GS | ✅ Active |
 | 7100-7599 | BRun CLI | BR | ✅ Active |
 | 7600-7609 | GSearch Movie Search | GS | ✅ Active |
 | 7700-7839 | GSearch BI Suite | GS | ✅ Active |
 | 8000-8399 | Nexus Flow CLI | NF | ✅ Active |
 | 9000-9849 | AI Bridge CLI | AB | ✅ Active |
 | 9500-9599 | PowerShell Integration | PS | ✅ Active (overlaps AB SEO 9500-9540, format-separated) |
 | 10000-10499 | WP Plugin Builder | WPB | ✅ Active (compressed from 10000-10999) |
 | 19000-19019 | AI Bridge Lovable Reasoning | AB | ✅ Active (reassigned from 10500-10519) |
 | 11000-11999 | Spec Reverse CLI | SRC | ✅ Active |
 | 12000-12599 | WP SEO Publish CLI | WSP | ✅ Active |
 | 13000-13999 | WP Plugin Publish | WPP | ✅ Active |
 | 14000-14499 | AI Transcribe CLI | AIT | ✅ Active |
 | 14500-14999 | Exam Manager | EQM | ✅ Active |
 | 15000-15999 | Link Manager | LM | ✅ Active |
 | 16000-16799 | SM Code Generation | SM-CG | ✅ Active (reassigned from 12xxx) |
 | 17000-17999 | SM Project Editor | SM-PE | ✅ Active (reassigned from 13xxx) |
 | 18000-18249 | SM GSearch CLI | SM-GS | ✅ Active (reassigned from 1xxx-12xxx) |
 | 2800-2849 | SM Realtime | SM-RT | ✅ Active (reassigned from 12xxx) |
 | 2850-2859 | SM Registry Validator | SM-RV | ✅ Active |
 
 ---
 
 ## GEN: General/Shared Categories (1000-1999)
 
 | Offset | Category | Description |
 |--------|----------|-------------|
 | +000 | Initialization | Config, environment setup |
 | +100 | Authentication | Login, tokens, sessions |
 | +200 | Authorization | Permissions, roles |
 | +300 | Validation | Input validation |
 | +400 | Business Logic | Domain-specific operations |
 | +500 | Database | CRUD, migrations |
 | +600 | Type Casting | Cast/conversion errors |
 | +700 | File System | I/O operations |
 | +800 | Network | HTTP, WebSocket |
 | +900 | Reserved | Future use |
 
 ### GEN-000: Initialization

 | Code | Name | Description |
 |------|------|-------------|
 | GEN-000-01 | CONFIG_MISSING | Configuration file not found |
 | GEN-000-02 | CONFIG_INVALID | Configuration file is malformed |
 | GEN-000-03 | ENV_MISSING | Required environment variable not set |

 ### GEN-100: Authentication

 | Code | Name | Description |
 |------|------|-------------|
 | GEN-100-01 | AUTH_REQUIRED | Authentication required |
 | GEN-100-02 | TOKEN_EXPIRED | Authentication token has expired |
 | GEN-100-03 | TOKEN_INVALID | Authentication token is invalid |
 | GEN-100-04 | CREDENTIALS_INVALID | Invalid username or password |

 ### GEN-200: Authorization

 | Code | Name | Description |
 |------|------|-------------|
 | GEN-200-01 | ACCESS_DENIED | Access denied to this resource |
 | GEN-200-02 | ROLE_REQUIRED | Insufficient role privileges |
 | GEN-200-03 | PERMISSION_DENIED | Permission not granted |

 ### GEN-300: Validation

 | Code | Name | Description |
 |------|------|-------------|
 | GEN-300-01 | FIELD_REQUIRED | Required field is missing |
 | GEN-300-02 | FIELD_INVALID | Field value is invalid |
 | GEN-300-03 | FORMAT_INVALID | Input format is invalid |
 | GEN-300-04 | LENGTH_EXCEEDED | Input exceeds maximum length |

 ### GEN-400: Business Logic

 | Code | Name | Description |
 |------|------|-------------|
 | GEN-400-01 | OPERATION_FAILED | Business operation failed |
 | GEN-400-02 | STATE_INVALID | Invalid state for requested operation |
 | GEN-400-03 | CONFLICT | Operation conflicts with current state |
 | GEN-400-04 | LIMIT_EXCEEDED | Operation limit exceeded |

 ### GEN-500: Database

 | Code | Name | Description |
 |------|------|-------------|
 | GEN-500-01 | DB_CONNECTION | Database connection failed |
 | GEN-500-02 | DB_QUERY | Database query failed |
 | GEN-500-03 | DB_TRANSACTION | Transaction failed |
 | GEN-500-04 | RECORD_NOT_FOUND | Record not found |
 | GEN-500-05 | DUPLICATE_RECORD | Record already exists |

 ### GEN-600: Type Casting / Conversion

 | Code | Name | Description |
 |------|------|-------------|
 | GEN-600-01 | CAST_TYPE_ASSERTION_FAILED | Type assertion failed |
 | GEN-600-02 | CAST_SLICE_ELEMENT_FAILED | Slice element cast failed |

 ### GEN-700: File System

 | Code | Name | Description |
 |------|------|-------------|
 | GEN-700-01 | FILE_NOT_FOUND | File not found at specified path |
 | GEN-700-02 | FILE_READ_FAILED | Failed to read file |
 | GEN-700-03 | FILE_WRITE_FAILED | Failed to write file |
 | GEN-700-04 | DIR_CREATE_FAILED | Failed to create directory |
 | GEN-700-05 | PERMISSION_DENIED | Insufficient file system permissions |

 ### GEN-800: Network

 | Code | Name | Description |
 |------|------|-------------|
 | GEN-800-01 | NETWORK_ERROR | Network request failed |
 | GEN-800-02 | TIMEOUT | Request timed out |
 | GEN-800-03 | SERVICE_UNAVAILABLE | Service temporarily unavailable |

 ### GEN-900: Reserved

 > Reserved for future cross-cutting error categories. No codes allocated.

 | Code | Name | Description |
 |------|------|-------------|
 | *(none allocated)* | — | Reserved for future use |

 ---
 
 ## Detailed Breakdown by CLI
 
 ### GSearch CLI (GS) — 7000-7099, 7600-7839
 
 #### Core Parser (7000-7099)
 | Range | Domain |
 |-------|--------|
 | 7000-7019 | Search initialization |
 | 7020-7039 | Query parsing |
 | 7040-7059 | Result extraction |
 | 7060-7079 | Cache operations |
 | 7080-7099 | API response |
 
 #### Movie Search (7600-7699)
 | Range | Domain |
 |-------|--------|
 | 7600-7609 | Movie query parsing |
 | 7610-7629 | IMDB extraction |
 | 7630-7649 | Rotten Tomatoes |
 | 7650-7669 | Streaming providers |
 | 7670-7699 | Aggregation |
 
 #### Business Intelligence Suite (7700-7839)
 | Range | Domain |
 |-------|--------|
 | 7700-7719 | Multi-engine search |
 | 7720-7739 | FAQ discovery |
 | 7740-7759 | SERP tracking |
 | 7760-7779 | Contact extraction |
 | 7780-7799 | Google Maps |
 | 7800-7819 | Response formatting |
 | 7820-7839 | Webhook notifications |
 
 ---
 
 ### BRun CLI (BR) — 7100-7599
 
 | Range | Domain |
 |-------|--------|
 | 7100-7149 | CLI initialization |
 | 7150-7199 | Configuration loading |
 | 7200-7299 | Profile management |
 | 7300-7399 | Build execution |
 | 7400-7449 | Port management |
 | 7450-7499 | Health monitoring |
 | 7500-7549 | Asset management |
 | 7550-7599 | Process control |
 
 ---
 
 ### Nexus Flow CLI (NF) — 8000-8399
 
 | Range | Domain |
 |-------|--------|
 | 8000-8049 | Canvas operations |
 | 8050-8099 | Node management |
 | 8100-8149 | Edge connections |
 | 8150-8199 | Workflow definition |
 | 8200-8249 | Execution engine |
 | 8250-8299 | State management |
 | 8300-8349 | Variable resolution |
 | 8350-8399 | Export/Import |
 
 ---
 
 ### AI Bridge CLI (AB) — 9000-9849
 
 #### Core (9000-9499)
 | Range | Domain |
 |-------|--------|
 | 9000-9049 | Initialization |
 | 9050-9099 | Provider routing |
 | 9100-9149 | Request validation |
 | 9150-9199 | Response processing |
 | 9200-9249 | Streaming |
 | 9250-9299 | Context management |
 | 9300-9349 | Tool execution |
 | 9350-9399 | Memory operations |
 | 9400-9449 | Cache layer |
 | 9450-9499 | Backend communication |
 
 #### SEO Module (9500-9699)
 | Range | Domain |
 |-------|--------|
 | 9500-9549 | SEO generation |
 | 9550-9599 | Meta tag creation |
 | 9600-9649 | Content optimization |
 | 9650-9699 | Keyword analysis |
 
 #### Advanced Features (9700-9849)
 | Range | Domain |
 |-------|--------|
 | 9700-9729 | Revisions system |
 | 9730-9759 | Suggestions engine |
 | 9760-9789 | RAG memory |
 | 9790-9829 | Reasoning flow |
 | 9830-9839 | WebSocket resilience |
 | 9840-9849 | Context integration |
 
 ---
 
 ### WP Plugin Builder (WPB) — 10000-10499
 
 | Range | Domain |
 |-------|--------|
 | 10000-10099 | General/Startup |
 | 10100-10199 | Configuration |
 | 10200-10299 | Database |
 | 10300-10399 | Project Management |
 | 10400-10419 | RAG/Vector |
 | 10420-10439 | Code Generation |
 | 10440-10459 | Spec Processing |
 | 10460-10479 | Server/API |
 | 10480-10489 | Settings |
 | 10490-10499 | Reset |
 
 ---
 
 ### Spec Reverse CLI (SRC) — 11000-11999
 
 | Range | Domain |
 |-------|--------|
 | 11000-11099 | General/Config |
 | 11100-11199 | Analysis pipeline |
 | 11200-11299 | AST parsing (Go) |
 | 11300-11399 | AST parsing (TS/JS) |
 | 11400-11499 | Pattern detection |
 | 11500-11599 | Output generation |
 | 11600-11699 | Format conversion |
 | 11700-11799 | Validation |
 | 11800-11899 | AI Bridge delegation |
 | 11900-11999 | Export operations |
 
 ---
 
 ### WP SEO Publish CLI (WSP) — 12000-12599
 
 | Range | Domain |
 |-------|--------|
 | 12000-12099 | Connection errors |
 | 12100-12199 | Authentication |
 | 12200-12299 | Publishing (posts) |
 | 12300-12399 | Publishing (pages) |
 | 12400-12449 | Categories/Tags |
 | 12450-12499 | AI Bridge delegation |
 | 12500-12549 | Variable system |
 | 12550-12599 | Database errors |
 
 ---
 
 ### WP Plugin Publish (WPP) — 13000-13999
 
 | Range | Domain |
 |-------|--------|
 | 13000-13049 | Initialization |
 | 13050-13099 | SVN operations |
 | 13100-13149 | Version management |
 | 13150-13199 | Asset upload |
 | 13200-13249 | Readme parsing |
 | 13250-13299 | Changelog generation |
 | 13300-13349 | Release validation |
 | 13350-13399 | WordPress.org API |
 | 13400-13449 | Rollback operations |
 | 13450-13499 | Notification |
 
 ---
 
 ### AI Transcribe CLI (AIT) — 14000-14499
 
 | Range | Domain |
 |-------|--------|
 | 14000-14049 | General/Config |
 | 14050-14099 | Model registry |
 | 14100-14149 | STT (Whisper local) |
 | 14150-14199 | STT (OpenAI API) |
 | 14200-14249 | STT (ElevenLabs) |
 | 14250-14299 | TTS (XTTS local) |
 | 14300-14349 | TTS (ElevenLabs) |
 | 14350-14399 | TTS (Azure) |
 | 14400-14449 | WebSocket streaming |
 | 14450-14499 | GPU acceleration |
 
 ---
 
## Reserved / Reassigned Ranges

| Range | Purpose | Status |
|-------|---------|--------|
| 2800-2849 | SM Realtime (reassigned from 12xxx) | ✅ Active |
| 2850-2859 | SM Registry Validator (SM-RV) | ✅ Active |
| 15000-15999 | Link Manager (LM, reassigned from 3xxx) | ✅ Active |
| 16000-16799 | SM Code Generation (reassigned from 12xxx) | ✅ Active |
| 16800-16999 | SM-CG Suggestions sub-range | ✅ Active |
| 17000-17999 | SM Project Editor (reassigned from 13xxx) | ✅ Active |
| 18000-18249 | SM GSearch CLI (reassigned from 1xxx-12xxx) | ✅ Active |
| 18250-18999 | Unallocated | 🟡 Reserved |
| 99000-99999 | Testing/Debug | ⚪ Internal |
 
 ---
 
 ## Error Code Format
 
 All error codes follow this structure:
 
 ```
 {PREFIX}{RANGE_CODE}: {MESSAGE}
 
 Example: GS7025: Failed to parse search query - invalid operator
 Example: AB9150: Response processing timeout after 30s
 Example: NF8205: Workflow execution halted - missing input node
 ```
 
 ---
 
 ## Cross-References
 
 | Resource | Location |
 |----------|----------|
 | Error Resolution Spec | `02-spec/04-error-resolution/` |
 | Constraints Summary | `.lovable/memories/constraints/cli-error-code-summary.md` |
 | Error Management | `.lovable/memories/constraints/error-management.md` |
 
 ---
 
 ## Validation Commands
 
 ```bash
 # Check for error code collisions
 grep -rh "Error\|Err" --include="*.go" | grep -oE "[A-Z]{2,3}[0-9]{4,5}" | sort | uniq -d
 
 # List all error codes in a CLI
 grep -rh "errors.New\|fmt.Errorf" internal/ | grep -oE "[0-9]{4,5}"
 
 # Verify prefix usage
 grep -rE "GS[0-9]{4}|BR[0-9]{4}|NF[0-9]{4}|AB[0-9]{4}" .
 ```