# Chat History Branching System

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09

---

## Overview

Persistent chat history with multi-path branching support, allowing users to explore alternative AI responses and maintain parallel conversation threads. All history stored in SQLite per project.

**Cross-References:**
- [AI Chat Interface](./25-ai-chat-interface.md) - Parent interface
- [Search Integration](./30-search-integration.md) - Search tracking
- [Project Management](../03-project-management/00-overview.md) - Project scope

---

## Branching Concept

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CHAT HISTORY TREE                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  [Session: Auth Implementation] Started: 2026-01-29 10:00 AM                    │
│                                                                                  │
│  ● You: Create authentication for my app                                       │
│  │                                                                              │
│  ├─● AI: I'll create JWT-based auth... (Branch 1 - Active)                     │
│  │  │                                                                           │
│  │  ├─● You: Use cookies instead                                               │
│  │  │  │                                                                        │
│  │  │  └─● AI: I'll switch to cookie-based sessions...                         │
│  │  │     │                                                                     │
│  │  │     └─● You: Perfect, continue                                           │
│  │  │        │                                                                  │
│  │  │        └─● AI: [Current message]  ◀ ACTIVE                               │
│  │  │                                                                           │
│  │  └─● You: Add OAuth providers (Branch 1.2)                                  │
│  │     │                                                                        │
│  │     └─● AI: I'll add Google and GitHub OAuth...                             │
│  │                                                                              │
│  └─● AI: Would you prefer session-based or token-based? (Branch 2)             │
│     │                                                                           │
│     └─● You: Session-based                                                      │
│        │                                                                        │
│        └─● AI: Implementing session-based auth...                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Branch Selection UI

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🤖 AI Response                                                    10:30 AM     │
│                                                                                  │
│  I'll create JWT-based authentication with refresh tokens...                    │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                           │  │
│  │  📍 This is the start of Branch 1                                         │  │
│  │                                                                           │  │
│  │  [Fork from here]    [View other branches (1)]    [Make this default]    │  │
│  │                                                                           │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Structures

### TypeScript Interfaces

```typescript
interface ChatSession {
  id: string;
  projectId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Session metadata
  mode: 'spec' | 'code';
  status: 'active' | 'archived' | 'deleted';
  
  // Branch info
  rootMessageId: string;
  activeBranchId: string;
  totalBranches: number;
  totalMessages: number;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  
  // Content
  role: 'user' | 'assistant' | 'system';
  content: string;
  
  // Branching
  parentId: string | null;      // null for root message
  branchId: string;             // Which branch this belongs to
  branchOrder: number;          // Position within branch
  
  // Alternative responses (for AI messages)
  siblingIds: string[];         // Other AI responses at same point
  isActiveInBranch: boolean;    // Currently shown in branch
  
  // Metadata
  timestamp: Date;
  
  // Attachments
  attachments: Attachment[];
  contextFiles: string[];
  
  // AI-specific
  model?: string;
  tokenCount?: number;
  processingTime?: number;
  
  // Search references
  searchRecordIds: string[];    // Linked search records
}

interface Branch {
  id: string;
  sessionId: string;
  
  // Branch metadata
  name: string;                 // Auto-generated or user-named
  description?: string;
  
  // Tree structure
  parentBranchId: string | null;
  forkPointMessageId: string;   // Where this branch split from parent
  
  // Branch stats
  messageCount: number;
  createdAt: Date;
  lastMessageAt: Date;
  
  // State
  isActive: boolean;
  isDefault: boolean;           // Default branch for session
}

interface ConversationPath {
  id: string;
  sessionId: string;
  
  // Path definition
  messageIds: string[];         // Ordered list of message IDs
  branchIds: string[];          // Branches traversed
  
  // Metadata
  createdAt: Date;
  name?: string;                // Optional user name
}
```

### Go Backend Models

```go
type ChatSession struct {
    Id          string    `gorm:"primaryKey"`
    ProjectId   string    `gorm:"index;not null"`
    Title       string
    CreatedAt   time.Time
    UpdatedAt   time.Time
    
    Mode        string    `gorm:"default:spec"`
    Status      string    `gorm:"default:active"`
    
    RootMessageId   string
    ActiveBranchId  string
    TotalBranches   int    `gorm:"default:1"`
    TotalMessages   int    `gorm:"default:0"`
    
    Messages []ChatMessage `gorm:"foreignKey:SessionId" json:"-"`
    Branches []Branch      `gorm:"foreignKey:SessionId" json:"-"`
}

type ChatMessage struct {
    Id          string    `gorm:"primaryKey"`
    SessionId   string    `gorm:"index;not null"`
    
    Role        string    `gorm:"not null"`
    Content     string    `gorm:"type:text"`
    
    ParentId    *string   `gorm:"index"`
    BranchId    string    `gorm:"index;not null"`
    BranchOrder int
    
    SiblingIds        pq.StringArray `gorm:"type:text"`
    IsActiveInBranch  bool           `gorm:"default:true"`
    
    Timestamp time.Time
    
    Attachments  JSON   `gorm:"type:jsonb"`
    ContextFiles JSON   `gorm:"type:jsonb"`
    
    Model          *string `json:",omitempty"`
    TokenCount     *int    `json:",omitempty"`
    ProcessingTime *int    `json:",omitempty"`
    
    SearchRecordIds pq.StringArray `gorm:"type:text"`
    
    Session ChatSession  `gorm:"foreignKey:SessionId" json:"-"`
    Branch  Branch       `gorm:"foreignKey:BranchId" json:"-"`
    Parent  *ChatMessage `gorm:"foreignKey:ParentId" json:"-"`
}

type Branch struct {
    Id          string    `gorm:"primaryKey"`
    SessionId   string    `gorm:"index;not null"`
    
    Name        string
    Description *string   `json:",omitempty"`
    
    ParentBranchId     *string `gorm:"index"`
    ForkPointMessageId string
    
    MessageCount  int       `gorm:"default:0"`
    CreatedAt     time.Time
    LastMessageAt time.Time
    
    IsActive  bool `gorm:"default:false"`
    IsDefault bool `gorm:"default:false"`
    
    Session      ChatSession   `gorm:"foreignKey:SessionId" json:"-"`
    ParentBranch *Branch       `gorm:"foreignKey:ParentBranchId" json:"-"`
    Messages     []ChatMessage `gorm:"foreignKey:BranchId" json:"-"`
}
```

---

## Branching Operations

### Create Branch (Fork Conversation)

```go
type BranchManager struct {
    db *gorm.DB
}

func (m *BranchManager) CreateBranch(
    sessionId string,
    forkPointMessageId string,
    name string,
) apperror.Result[Branch] {
    // Get fork point message
    var forkPoint ChatMessage
    if err := m.db.First(&forkPoint, "id = ?", forkPointMessageId).Error; err != nil {
        return apperror.FailWrap[Branch](
            err,
            "E7300",
            "fork point not found",
        )
    }
    
    // Create new branch
    branch := &Branch{
        Id:                 uuid.NewString(),
        SessionId:          sessionId,
        Name:               name,
        ParentBranchId:     &forkPoint.BranchId,
        ForkPointMessageId: forkPointMessageId,
        CreatedAt:          time.Now(),
        LastMessageAt:      time.Now(),
        IsActive:           true,
        IsDefault:          false,
    }
    
    if err := m.db.Create(branch).Error; err != nil {
        return apperror.FailWrap[Branch](
            err,
            "E7300",
            "failed to create branch",
        )
    }
    
    // Update session stats — typed struct for GORM .Updates()
    type SessionBranchUpdate struct {
        TotalBranches  *gorm.Expr `gorm:"column:total_branches"`
        ActiveBranchId string     `gorm:"column:active_branch_id"`
    }
    m.db.Model(&ChatSession{}).Where("id = ?", sessionId).Updates(SessionBranchUpdate{
        TotalBranches:  gorm.Expr("total_branches + 1"),
        ActiveBranchId: branch.Id,
    })
    
    return apperror.Ok(*branch)
}

func (m *BranchManager) SwitchBranch(sessionId, branchId string) error {
    // Deactivate current branch
    m.db.Model(&Branch{}).Where("session_id = ? AND is_active = ?", sessionId, true).
        Update("is_active", false)
    
    // Activate new branch
    if err := m.db.Model(&Branch{}).Where("id = ?", branchId).
        Update("is_active", true).Error; err != nil {
        return err
    }
    
    // Update session
    return m.db.Model(&ChatSession{}).Where("id = ?", sessionId).
        Update("active_branch_id", branchId).Error
}

func (m *BranchManager) GetBranchMessages(branchId string) apperror.Result[[]ChatMessage] {
    var branch Branch
    if err := m.db.First(&branch, "id = ?", branchId).Error; err != nil {
        return apperror.FailWrap[[]ChatMessage](
            err,
            "E7301",
            "branch not found",
        )
    }
    
    // Get messages from this branch and all parent branches up to fork point
    messages := []ChatMessage{}
    currentBranchId := branchId
    
    for currentBranchId != "" {
        var branchMessages []ChatMessage
        m.db.Where("branch_id = ? AND is_active_in_branch = ?", currentBranchId, true).
            Order("branch_order ASC").
            Find(&branchMessages)
        
        messages = append(branchMessages, messages...)
        
        var b Branch
        if err := m.db.First(&b, "id = ?", currentBranchId).Error; err != nil {
            break
        }
        
        if b.ParentBranchId == nil {
            break
        }

        currentBranchId = *b.ParentBranchId
    }
    
    return apperror.Ok(messages)
}
```

### Regenerate Response (Create Sibling)

```go
func (m *BranchManager) RegenerateResponse(messageId string) apperror.Result[ChatMessage] {
    var original ChatMessage
    if err := m.db.First(&original, "id = ?", messageId).Error; err != nil {
        return apperror.FailWrap[ChatMessage](
            err,
            "E7302",
            "message not found",
        )
    }
    
    if original.Role != "assistant" {
        return apperror.FailNew[ChatMessage](
            "E7302",
            "can only regenerate assistant messages",
        )
    }
    
    // Get the parent (user message)
    var userMessage ChatMessage
    if err := m.db.First(&userMessage, "id = ?", original.ParentId).Error; err != nil {
        return apperror.FailWrap[ChatMessage](
            err,
            "E7302",
            "parent message not found",
        )
    }
    
    // Create new AI response (will be populated by AI)
    newResponse := &ChatMessage{
        Id:          uuid.NewString(),
        SessionId:   original.SessionId,
        Role:        "assistant",
        Content:     "",  // To be filled by AI
        ParentId:    original.ParentId,
        BranchId:    original.BranchId,
        BranchOrder: original.BranchOrder,
        Timestamp:   time.Now(),
        IsActiveInBranch: true,
    }
    
    // Mark original as inactive
    m.db.Model(&original).Update("is_active_in_branch", false)
    
    // Update sibling references
    siblings := append(original.SiblingIds, original.Id)
    newResponse.SiblingIds = siblings
    
    // Update all siblings to include new message
    for _, sibId := range original.SiblingIds {
        m.db.Model(&ChatMessage{}).Where("id = ?", sibId).
            Update("sibling_ids", append(siblings, newResponse.Id))
    }

    m.db.Model(&original).Update("sibling_ids", append(siblings, newResponse.Id))
    
    if err := m.db.Create(newResponse).Error; err != nil {
        return apperror.FailWrap[ChatMessage](
            err,
            "E7302",
            "failed to create regenerated response",
        )
    }
    
    return apperror.Ok(*newResponse)
}
```

---

## Database Schema

```sql
-- Chat sessions table
CREATE TABLE chat_sessions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    mode TEXT DEFAULT 'spec',         -- 'spec' or 'code'
    status TEXT DEFAULT 'active',     -- 'active', 'archived', 'deleted'
    
    root_message_id TEXT,
    active_branch_id TEXT,
    total_branches INTEGER DEFAULT 1,
    total_messages INTEGER DEFAULT 0,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Branches table
CREATE TABLE branches (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    
    name TEXT NOT NULL,
    description TEXT,
    
    parent_branch_id TEXT,
    fork_point_message_id TEXT NOT NULL,
    
    message_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    is_active BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_branch_id) REFERENCES branches(id)
);

-- Chat messages table
CREATE TABLE chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    
    role TEXT NOT NULL,               -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    
    parent_id TEXT,                   -- NULL for root
    branch_id TEXT NOT NULL,
    branch_order INTEGER NOT NULL,
    
    sibling_ids TEXT,                 -- JSON array
    is_active_in_branch BOOLEAN DEFAULT TRUE,
    
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    attachments TEXT,                 -- JSON
    context_files TEXT,               -- JSON array
    
    model TEXT,
    token_count INTEGER,
    processing_time INTEGER,
    
    search_record_ids TEXT,           -- JSON array
    
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (parent_id) REFERENCES chat_messages(id)
);

-- Indexes
CREATE INDEX IdxChatSessionsProject ON chat_sessions(project_id);
CREATE INDEX IdxBranchesSession ON branches(session_id);
CREATE INDEX IdxChatMessagesSession ON chat_messages(session_id);
CREATE INDEX IdxChatMessagesBranch ON chat_messages(branch_id);
CREATE INDEX IdxChatMessagesParent ON chat_messages(parent_id);
CREATE INDEX IdxChatMessagesActive ON chat_messages(branch_id, is_active_in_branch);
```

---

## Component Structure

```
ChatHistory/
├── components/
│   ├── ChatSessionList.tsx         # List of sessions
│   ├── ChatHistory.tsx             # Main chat display
│   ├── BranchSelector.tsx          # Branch dropdown/tree
│   ├── BranchTreeView.tsx          # Visual branch tree
│   ├── MessageBubble.tsx           # Single message
│   ├── MessageSiblings.tsx         # Sibling navigation
│   ├── ForkButton.tsx              # Create branch action
│   ├── RegenerateButton.tsx        # Regenerate response
│   └── BranchIndicator.tsx         # Branch position marker
│
├── hooks/
│   ├── useChatSession.ts           # Session management
│   ├── useBranches.ts              # Branch operations
│   ├── useMessageHistory.ts        # Message loading
│   └── useBranchNavigation.ts      # Navigate between branches
│
└── types/
    └── chat.ts                     # TypeScript interfaces
```

---

## UI Components

### Branch Selector Dropdown

```tsx
interface BranchSelectorProps {
  sessionId: string;
  activeBranchId: string;
  onBranchChange: (branchId: string) => void;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({
  sessionId,
  activeBranchId,
  onBranchChange
}) => {
  const { branches, isLoading } = useBranches(sessionId);
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <GitBranch className="h-4 w-4 mr-2" />
          {branches.find(b => b.id === activeBranchId)?.name || 'Main'}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Conversation Branches</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {branches.map(branch => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => onBranchChange(branch.id)}
            className={cn(
              branch.id === activeBranchId && "bg-accent"
            )}
          >
            <div className="flex flex-col">
              <span className="font-medium">{branch.name}</span>
              <span className="text-xs text-muted-foreground">
                {branch.messageCount} messages · {formatRelative(branch.lastMessageAt)}
              </span>
            </div>
            {branch.isDefault && (
              <Badge variant="secondary" className="ml-auto">Default</Badge>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {}}>
          <GitBranch className="h-4 w-4 mr-2" />
          Create new branch
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

### Message with Siblings Navigation

```tsx
interface MessageWithSiblingsProps {
  message: ChatMessage;
  onSelectSibling: (messageId: string) => void;
}

export const MessageWithSiblings: React.FC<MessageWithSiblingsProps> = ({
  message,
  onSelectSibling
}) => {
  const siblings = [message.id, ...message.siblingIds];
  const currentIndex = siblings.indexOf(message.id);
  
  if (siblings.length <= 1) {
    return <MessageBubble message={message} />;
  }
  
  return (
    <div className="relative">
      <MessageBubble message={message} />
      
      {/* Sibling navigation */}
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 rounded-md px-2 py-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={currentIndex === 0}
          onClick={() => onSelectSibling(siblings[currentIndex - 1])}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">
          {currentIndex + 1}/{siblings.length}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={currentIndex === siblings.length - 1}
          onClick={() => onSelectSibling(siblings[currentIndex + 1])}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
```

---

## API Endpoints

### Session Management

```
POST   /api/v1/projects/{projectId}/sessions     Create session
GET    /api/v1/projects/{projectId}/sessions     List sessions
GET    /api/v1/sessions/{sessionId}              Get session
DELETE /api/v1/sessions/{sessionId}              Archive session
```

### Branch Operations

```
POST   /api/v1/sessions/{sessionId}/branches           Create branch
GET    /api/v1/sessions/{sessionId}/branches           List branches
GET    /api/v1/branches/{branchId}                     Get branch
PUT    /api/v1/branches/{branchId}                     Update branch
POST   /api/v1/sessions/{sessionId}/branches/switch    Switch active branch
DELETE /api/v1/branches/{branchId}                     Delete branch
```

### Message Operations

```
POST   /api/v1/sessions/{sessionId}/messages           Add message
GET    /api/v1/branches/{branchId}/messages           Get branch messages
GET    /api/v1/messages/{messageId}                    Get message
POST   /api/v1/messages/{messageId}/regenerate         Regenerate AI response
POST   /api/v1/messages/{messageId}/fork               Fork from message
PUT    /api/v1/messages/{messageId}/sibling            Switch to sibling
```

---

## Configuration Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `chat.maxBranches` | int | 20 | Max branches per session |
| `chat.maxMessagesPerBranch` | int | 500 | Max messages per branch |
| `chat.autoNameBranches` | bool | true | Auto-generate branch names |
| `chat.showBranchTree` | bool | false | Show visual tree by default |
| `chat.historyRetention` | int | 90 | Days to keep archived sessions |

---

## Error Codes

| Code | Description |
|------|-------------|
| 12830 | Session not found |
| 12831 | Branch not found |
| 12832 | Message not found |
| 12833 | Cannot fork from this message |
| 12834 | Max branches exceeded |
| 12835 | Cannot delete default branch |
| 12836 | Invalid parent message |
| 12837 | Branch already exists at fork point |
