 # 01 - AI Bridge Dashboard Specification


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

 
 **Module:** AI Bridge CLI Frontend  
 **Domain:** Visual Monitoring & Control  
 **Stack:** React + TypeScript + Tailwind + shadcn/ui
 
 ---
 
 ## 1. Overview
 
 The AI Bridge Dashboard provides a visual interface for monitoring execution progress, pattern detection statistics, plan history, and system health. Built as a React SPA served by the CLI's embedded HTTP server.
 
 ---
 
 ## 2. Dashboard Architecture
 
 ```
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                        AI BRIDGE DASHBOARD ARCHITECTURE                         │
 ├─────────────────────────────────────────────────────────────────────────────────┤
 │                                                                                  │
 │     ┌───────────────────────────────────────────────────────────────────┐       │
 │     │                    REACT SPA (Vite + TypeScript)                  │       │
 │     │  ├── Pages: Dashboard, Patterns, Plans, History, Settings        │       │
 │     │  ├── State: React Query for data fetching                        │       │
 │     │  ├── WebSocket: Real-time progress updates                       │       │
 │     │  └── UI: shadcn/ui + Tailwind CSS                                │       │
 │     └───────────────────────────────────────────────────────────────────┘       │
 │                                    │                                            │
 │                              REST API + WS                                      │
 │                                    │                                            │
 │     ┌───────────────────────────────────────────────────────────────────┐       │
 │     │                    AI BRIDGE CLI BACKEND                          │       │
 │     │  ├── /api/v1/* endpoints                                         │       │
 │     │  ├── /ws for WebSocket streaming                                 │       │
 │     │  └── Static file serving for SPA                                 │       │
 │     └───────────────────────────────────────────────────────────────────┘       │
 │                                                                                  │
 └─────────────────────────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## 3. Page Structure
 
 ### 3.1 Navigation Layout
 
 ```
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │  ┌──────────┐                                                    ┌─────────┐   │
 │  │ AI Bridge│   Dashboard   Patterns   Plans   History   ⚙️     │ Status  │   │
 │  └──────────┘                                                    └─────────┘   │
 ├─────────────────────────────────────────────────────────────────────────────────┤
 │                                                                                  │
 │                              [ PAGE CONTENT ]                                    │
 │                                                                                  │
 └─────────────────────────────────────────────────────────────────────────────────┘
 ```
 
 ### 3.2 Page Inventory
 
 | Page | Route | Description |
 |------|-------|-------------|
 | Dashboard | `/` | Overview with live execution, quick stats |
 | Patterns | `/patterns` | Code pattern detection and management |
 | Plans | `/plans` | Plan list, creation, approval |
 | Plan Detail | `/plans/:id` | Single plan view with tasks |
 | History | `/history` | Execution history and metrics |
 | Settings | `/settings` | Configuration and preferences |
 
 ---
 
 ## 4. Dashboard Page (Home)
 
 ### 4.1 Layout
 
 ```
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                              DASHBOARD                                          │
 ├─────────────────────────────────────────────────────────────────────────────────┤
 │                                                                                  │
 │  ┌─────────────────────────────────┐  ┌─────────────────────────────────────┐  │
 │  │     CURRENT EXECUTION           │  │     QUICK STATS                     │  │
 │  │                                 │  │                                     │  │
 │  │  Plan: Add OAuth Authentication │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │  │
 │  │  Status: 🟢 Executing           │  │  │ 247 │ │ 12  │ │ 89  │ │ 94% │   │  │
 │  │                                 │  │  │Files│ │Patt.│ │Plans│ │Recall   │  │
 │  │  [████████████░░░░░░░░] 60%     │  │  └─────┘ └─────┘ └─────┘ └─────┘   │  │
 │  │                                 │  │                                     │  │
 │  │  Task 3/5: Creating handler.go  │  └─────────────────────────────────────┘  │
 │  │  ETA: 45s                       │                                           │
 │  │                                 │  ┌─────────────────────────────────────┐  │
 │  │  [Pause] [Cancel] [View Plan]   │  │     PATTERN CONFIDENCE              │  │
 │  └─────────────────────────────────┘  │                                     │  │
 │                                       │  PascalCase      ████████████ 94%   │  │
 │  ┌─────────────────────────────────┐  │  Error Wrapping  ██████████░░ 87%   │  │
 │  │     RECENT ACTIVITY             │  │  Service Layer   █████████░░░ 88%   │  │
 │  │                                 │  │  Test Pattern    ███████░░░░░ 76%   │  │
 │  │  • Task completed: config.go    │  │                                     │  │
 │  │  • Task started: handler.go     │  └─────────────────────────────────────┘  │
 │  │  • Plan approved by user        │                                           │
 │  │  • Index completed: 247 files   │                                           │
 │  │  • Pattern detected: Service    │                                           │
 │  └─────────────────────────────────┘                                           │
 │                                                                                  │
 └─────────────────────────────────────────────────────────────────────────────────┘
 ```
 
 ### 4.2 Components
 
 ```tsx
 // Dashboard page component structure
 interface DashboardPageProps {}
 
 const DashboardPage: React.FC<DashboardPageProps> = () => {
   return (
     <div className="grid grid-cols-12 gap-6 p-6">
       {/* Current Execution - Full width on mobile, 7 cols on desktop */}
       <div className="col-span-12 lg:col-span-7">
         <CurrentExecutionCard />
       </div>
       
       {/* Quick Stats - 5 cols on desktop */}
       <div className="col-span-12 lg:col-span-5 space-y-6">
         <QuickStatsGrid />
         <PatternConfidenceCard />
       </div>
       
       {/* Recent Activity - Full width */}
       <div className="col-span-12">
         <RecentActivityFeed />
       </div>
     </div>
   );
 };
 ```
 
 ---
 
 ## 5. Patterns Page
 
 ### 5.1 Layout
 
 ```
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                              PATTERNS                                           │
 ├─────────────────────────────────────────────────────────────────────────────────┤
 │                                                                                  │
 │  ┌─────────────────────────────────────────────────────────────────────────┐   │
 │  │  PATTERN DETECTION SUMMARY                                              │   │
 │  │                                                                          │   │
 │  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │   │
 │  │  │    NAMING      │  │    ERROR       │  │    ARCH        │             │   │
 │  │  │    Patterns    │  │    Handling    │  │    Patterns    │             │   │
 │  │  │                │  │                │  │                │             │   │
 │  │  │      5         │  │      3         │  │      4         │             │   │
 │  │  │   detected     │  │   detected     │  │   detected     │             │   │
 │  │  └────────────────┘  └────────────────┘  └────────────────┘             │   │
 │  └─────────────────────────────────────────────────────────────────────────┘   │
 │                                                                                  │
 │  ┌─────────────────────────────────────────────────────────────────────────┐   │
 │  │  DETECTED PATTERNS                                     [+ Add Pattern]  │   │
 │  │                                                                          │   │
 │  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
 │  │  │  📝 PascalCase Functions                              94% ████ │    │   │
 │  │  │  Category: Naming | Occurrences: 847/901 | Active ✓          │    │   │
 │  │  └─────────────────────────────────────────────────────────────────┘    │   │
 │  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
 │  │  │  ⚠️ Error Code Wrapping                               87% ████ │    │   │
 │  │  │  Category: Error | Occurrences: 156/179 | Active ✓            │    │   │
 │  │  └─────────────────────────────────────────────────────────────────┘    │   │
 │  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
 │  │  │  🏗️ Service-Repository Pattern                        88% ████ │    │   │
 │  │  │  Category: Architecture | Occurrences: 12/14 | Active ✓       │    │   │
 │  │  └─────────────────────────────────────────────────────────────────┘    │   │
 │  └─────────────────────────────────────────────────────────────────────────┘   │
 │                                                                                  │
 └─────────────────────────────────────────────────────────────────────────────────┘
 ```
 
 ### 5.2 Pattern Detail Modal
 
 ```tsx
 interface PatternDetailModalProps {
   pattern: Pattern;
   onClose: () => void;
 }
 
 // Shows:
 // - Pattern name and description
 // - Confidence score with trend
 // - Sample code matches (with syntax highlighting)
 // - Toggle to enable/disable
 // - Edit regex/rules button
 ```
 
 ---
 
 ## 6. Plans Page
 
 ### 6.1 Plan List Layout
 
 ```
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                              PLANS                                              │
 ├─────────────────────────────────────────────────────────────────────────────────┤
 │                                                                                  │
 │  ┌──────────────────────────────────────────────────────────────┐   [+ New Plan]│
 │  │  🔍 Search plans...              Filter: [All ▼]  Sort: [Recent ▼]          │
 │  └──────────────────────────────────────────────────────────────┘               │
 │                                                                                  │
 │  ┌─────────────────────────────────────────────────────────────────────────┐   │
 │  │  🟢 Add OAuth Authentication                                            │   │
 │  │  Status: Executing (3/5 tasks) | Created: 5 min ago                     │   │
 │  │  [View] [Pause]                                                          │   │
 │  └─────────────────────────────────────────────────────────────────────────┘   │
 │  ┌─────────────────────────────────────────────────────────────────────────┐   │
 │  │  🟡 Implement Search Feature                                             │   │
 │  │  Status: Pending Approval | Created: 1 hour ago                         │   │
 │  │  [View] [Approve] [Reject]                                               │   │
 │  └─────────────────────────────────────────────────────────────────────────┘   │
 │  ┌─────────────────────────────────────────────────────────────────────────┐   │
 │  │  ✅ Add User Settings Page                                               │   │
 │  │  Status: Completed | Created: 2 hours ago | Duration: 45s               │   │
 │  │  [View] [Re-run]                                                         │   │
 │  └─────────────────────────────────────────────────────────────────────────┘   │
 │  ┌─────────────────────────────────────────────────────────────────────────┐   │
 │  │  ❌ Database Migration                                                   │   │
 │  │  Status: Failed (Task 3) | Created: 3 hours ago                         │   │
 │  │  [View] [Retry] [Rollback]                                               │   │
 │  └─────────────────────────────────────────────────────────────────────────┘   │
 │                                                                                  │
 └─────────────────────────────────────────────────────────────────────────────────┘
 ```
 
 ### 6.2 Plan Detail View
 
 ```
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │  ← Back to Plans                                                                │
 ├─────────────────────────────────────────────────────────────────────────────────┤
 │                                                                                  │
 │  ┌─────────────────────────────────────────────────────────────────────────┐   │
 │  │  ADD OAUTH AUTHENTICATION                                               │   │
 │  │  Status: 🟢 Executing | Progress: 60% | ETA: 45s                        │   │
 │  │                                                                          │   │
 │  │  [Pause] [Cancel] [Edit] [Sync to File]                                 │   │
 │  └─────────────────────────────────────────────────────────────────────────┘   │
 │                                                                                  │
 │  ┌─────────────────────────────────────────────────────────────────────────┐   │
 │  │  TASKS                                                                   │   │
 │  │                                                                          │   │
 │  │  ✅ 1. Create OAuth Configuration                                       │   │
 │  │     └─ internal/auth/config.go (create) | 2.1s                          │   │
 │  │                                                                          │   │
 │  │  ✅ 2. Implement OAuth Handler                                          │   │
 │  │     └─ internal/auth/oauth_handler.go (create) | 5.3s                   │   │
 │  │                                                                          │   │
 │  │  🔄 3. Create User Session Service                          [Running]   │   │
 │  │     └─ internal/auth/session_service.go (create)                        │   │
 │  │     └─ Progress: [████████░░░░░░░░] 55%                                  │   │
 │  │                                                                          │   │
 │  │  ⏳ 4. Add Session Middleware                                            │   │
 │  │     └─ internal/middleware/auth.go (create) | Waiting for Task 3        │   │
 │  │                                                                          │   │
 │  │  ⏳ 5. Update Router Configuration                                       │   │
 │  │     └─ internal/server/router.go (modify) | Waiting for Tasks 2, 4      │   │
 │  └─────────────────────────────────────────────────────────────────────────┘   │
 │                                                                                  │
 │  ┌─────────────────────────────────────────────────────────────────────────┐   │
 │  │  DEPENDENCY GRAPH                                                        │   │
 │  │                                                                          │   │
 │  │     [1: Config] ──┬──► [2: Handler] ──┐                                 │   │
 │  │                   │                   ├──► [5: Router]                   │   │
 │  │                   └──► [3: Service] ──┤                                 │   │
 │  │                             │         │                                  │   │
 │  │                             ▼         │                                  │   │
 │  │                        [4: Middleware]┘                                  │   │
 │  └─────────────────────────────────────────────────────────────────────────┘   │
 │                                                                                  │
 └─────────────────────────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## 7. History Page
 
 ### 7.1 Layout
 
 ```
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                              EXECUTION HISTORY                                  │
 ├─────────────────────────────────────────────────────────────────────────────────┤
 │                                                                                  │
 │  ┌─────────────────────────────────────────────────────────────────────────┐   │
 │  │  STATISTICS (Last 30 days)                                              │   │
 │  │                                                                          │   │
 │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │   │
 │  │  │    89      │  │   92%      │  │   45s      │  │   2.3      │        │   │
 │  │  │ Executions │  │ Success    │  │ Avg Time   │  │ Avg Retries│        │   │
 │  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘        │   │
 │  └─────────────────────────────────────────────────────────────────────────┘   │
 │                                                                                  │
 │  ┌─────────────────────────────────────────────────────────────────────────┐   │
 │  │  EXECUTION TIMELINE                                                     │   │
 │  │                                                                          │   │
 │  │  Today                                                                   │   │
 │  │  ├─ 10:35 ✅ Add OAuth Authentication (5 tasks, 47s)                    │   │
 │  │  ├─ 09:15 ✅ Fix Login Bug (2 tasks, 12s)                               │   │
 │  │  └─ 08:30 ❌ Database Migration (failed at task 3, rolled back)         │   │
 │  │                                                                          │   │
 │  │  Yesterday                                                               │   │
 │  │  ├─ 16:45 ✅ Add User Settings (4 tasks, 35s)                           │   │
 │  │  ├─ 14:20 ✅ Implement Search (6 tasks, 1m 12s)                         │   │
 │  │  └─ 11:00 ✅ Create Dashboard Page (3 tasks, 28s)                       │   │
 │  └─────────────────────────────────────────────────────────────────────────┘   │
 │                                                                                  │
 │  ┌─────────────────────────────────────────────────────────────────────────┐   │
 │  │  SUCCESS RATE CHART                                                     │   │
 │  │                                                                          │   │
 │  │  100% │    ●     ●           ●     ●                                    │   │
 │  │   80% │ ●     ●     ●  ●  ●     ●     ●  ●                             │   │
 │  │   60% │                                       ●                          │   │
 │  │   40% │                                                                  │   │
 │  │       └──────────────────────────────────────────────                   │   │
 │  │         Mon  Tue  Wed  Thu  Fri  Sat  Sun                               │   │
 │  └─────────────────────────────────────────────────────────────────────────┘   │
 │                                                                                  │
 └─────────────────────────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## 8. Component Library
 
 ### 8.1 Core Components
 
 | Component | Description | Location |
 |-----------|-------------|----------|
 | `ExecutionProgressCard` | Live execution progress with controls | `components/execution/` |
 | `TaskStatusBadge` | Status indicator for tasks | `components/tasks/` |
 | `PatternCard` | Pattern display with confidence bar | `components/patterns/` |
 | `PlanCard` | Plan summary card for lists | `components/plans/` |
 | `DependencyGraph` | Visual task dependency graph | `components/plans/` |
 | `ActivityFeed` | Real-time activity stream | `components/activity/` |
 | `StatsCard` | Metric display card | `components/stats/` |
 | `ConfidenceBar` | Horizontal progress/confidence bar | `components/ui/` |
 | `ConnectionStatus` | WebSocket connection indicator | `components/status/` |
 
 ### 8.2 Shared UI Components (shadcn/ui)
 
 ```tsx
 // All shadcn/ui components should be themed via CSS variables
 // Use semantic tokens from design system
 
 // Example component usage
 import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Progress } from "@/components/ui/progress";
 ```
 
 ---
 
 ## 9. State Management
 
 ### 9.1 React Query Setup
 
 ```tsx
 // API hooks using React Query
 export function useExecutionProgress(executionId: string) {
   return useQuery({
     queryKey: ['execution', executionId, 'progress'],
     queryFn: () => api.getExecutionProgress(executionId),
     refetchInterval: 1000, // Fallback polling
   });
 }
 
 export function usePatterns() {
   return useQuery({
     queryKey: ['patterns'],
     queryFn: () => api.getPatterns(),
   });
 }
 
 export function usePlans(filters?: PlanFilters) {
   return useQuery({
     queryKey: ['plans', filters],
     queryFn: () => api.getPlans(filters),
   });
 }
 ```
 
 ### 9.2 WebSocket Integration
 
 ```tsx
 // WebSocket hook for real-time updates
 export function useExecutionWebSocket(executionId: string) {
   const queryClient = useQueryClient();
   
   useEffect(() => {
     const ws = new WebSocket(`ws://localhost:5040/ws/execution/${executionId}`);
     
     ws.onmessage = (event) => {
       const data = JSON.parse(event.data);
       
       switch (data.type) {
         case 'execution.progress':
           queryClient.setQueryData(
             ['execution', executionId, 'progress'],
             data.payload
           );
           break;
         case 'task.completed':
           queryClient.invalidateQueries(['execution', executionId]);
           break;
       }
     };
     
     return () => ws.close();
   }, [executionId, queryClient]);
 }
 ```
 
 ---
 
 ## 10. API Integration
 
 ### 10.1 API Client
 
 ```tsx
 // src/lib/api.ts
 const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5040/api/v1';
 
 export const api = {
   // Executions
   getExecutions: () => fetch(`${API_BASE}/executions`).then(r => r.json()),
   getExecution: (id: string) => fetch(`${API_BASE}/executions/${id}`).then(r => r.json()),
   getExecutionProgress: (id: string) => fetch(`${API_BASE}/executions/${id}/progress`).then(r => r.json()),
   pauseExecution: (id: string) => fetch(`${API_BASE}/executions/${id}/pause`, { method: HttpMethod.Post }),
   resumeExecution: (id: string) => fetch(`${API_BASE}/executions/${id}/resume`, { method: HttpMethod.Post }),
   
   // Plans
   getPlans: (filters?: PlanFilters) => fetch(`${API_BASE}/plans?${new URLSearchParams(filters)}`).then(r => r.json()),
   getPlan: (id: string) => fetch(`${API_BASE}/plans/${id}`).then(r => r.json()),
   approvePlan: (id: string) => fetch(`${API_BASE}/plans/${id}/approve`, { method: HttpMethod.Post }),
   executePlan: (id: string) => fetch(`${API_BASE}/plans/${id}/execute`, { method: HttpMethod.Post }),
   
   // Patterns
   getPatterns: () => fetch(`${API_BASE}/patterns`).then(r => r.json()),
   togglePattern: (id: string, enabled: boolean) => 
     fetch(`${API_BASE}/patterns/${id}`, { 
       method: HttpMethod.Patch, 
       body: JSON.stringify({ Enabled: enabled }) 
     }),
   
   // History
   getHistory: (params?: HistoryParams) => fetch(`${API_BASE}/history?${new URLSearchParams(params)}`).then(r => r.json()),
   getHistoryStats: () => fetch(`${API_BASE}/history/stats`).then(r => r.json()),
 };
 ```
 
 ---
 
 ## 11. Responsive Design
 
 ### 11.1 Breakpoints
 
 | Breakpoint | Width | Layout |
 |------------|-------|--------|
 | Mobile | < 640px | Single column, stacked cards |
 | Tablet | 640-1024px | 2-column grid |
 | Desktop | > 1024px | Full multi-column layout |
 
 ### 11.2 Mobile Considerations
 
 - Collapsible navigation (hamburger menu)
 - Swipeable cards for plan/task lists
 - Bottom action bar for common actions
 - Touch-friendly button sizes (min 44px)
 
 ---
 
 ## 12. File Structure
 
 ```
 src/
 ├── components/
 │   ├── activity/
 │   │   └── ActivityFeed.tsx
 │   ├── execution/
 │   │   ├── ExecutionProgressCard.tsx
 │   │   └── TaskProgress.tsx
 │   ├── patterns/
 │   │   ├── PatternCard.tsx
 │   │   ├── PatternDetailModal.tsx
 │   │   └── PatternGrid.tsx
 │   ├── plans/
 │   │   ├── PlanCard.tsx
 │   │   ├── PlanDetail.tsx
 │   │   ├── TaskList.tsx
 │   │   └── DependencyGraph.tsx
 │   ├── stats/
 │   │   ├── StatsCard.tsx
 │   │   └── StatsGrid.tsx
 │   ├── status/
 │   │   └── ConnectionStatus.tsx
 │   └── ui/
 │       └── (shadcn components)
 ├── hooks/
 │   ├── useExecutionProgress.ts
 │   ├── usePatterns.ts
 │   ├── usePlans.ts
 │   └── useWebSocket.ts
 ├── lib/
 │   ├── api.ts
 │   └── utils.ts
 ├── pages/
 │   ├── Dashboard.tsx
 │   ├── Patterns.tsx
 │   ├── Plans.tsx
 │   ├── PlanDetail.tsx
 │   ├── History.tsx
 │   └── Settings.tsx
 └── App.tsx
 ```
 
 ---
 
 ## 13. Related Specifications
 
 - [48-plan-execution-monitoring.md](../01-backend/48-plan-execution-monitoring.md) - Execution API
 - [43-code-pattern-learning.md](../01-backend/43-code-pattern-learning.md) - Patterns API
 - [44-plan-generation.md](../01-backend/44-plan-generation.md) - Plans API
 - [47-onboarding-guide.md](../01-backend/47-onboarding-guide.md) - Workflow reference
 
 ---
 
 *A visual command center for AI-assisted development.*