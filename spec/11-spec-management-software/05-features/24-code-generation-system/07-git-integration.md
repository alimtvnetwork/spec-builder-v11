# Git Integration

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

The Git Integration module manages local and remote repository operations for generated code. It handles repository initialization, automatic commits with descriptive messages, GitHub/GitLab OAuth connections, and synchronization workflows.

**Cross-References:**
- [Architecture](./01-architecture.md)
- [Repository Structure](./10-repository-structure.md)
- [Project Settings](../03-project-management/00-overview.md)

---

## Repository Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REPOSITORY LIFECYCLE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. INITIALIZATION                                                   │
│     ┌─────────────────────────────────────────────────────────────┐ │
│     │ Project Created → Create Directory → git init → Initial     │ │
│     │                   (under code-repos/)          Commit       │ │
│     └─────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  2. CODE GENERATION CYCLE                                           │
│     ┌─────────────────────────────────────────────────────────────┐ │
│     │ Pre-check → Generate → Consistency → Build → Commit → Push  │ │
│     │ (git pull)   (write    Check         Check   (local)  (if   │ │
│     │              files)                                  remote)│ │
│     └─────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  3. REMOTE CONNECTION                                               │
│     ┌─────────────────────────────────────────────────────────────┐ │
│     │ OAuth → Create/Link → git remote add → git push → Update    │ │
│     │ Auth    Remote Repo    origin           --all     README    │ │
│     └─────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### RepositoryConnection

```go
type RepositoryConnection struct {
    Id            string    `gorm:"primaryKey;type:text"`
    ProjectId     string    `gorm:"type:text;not null;uniqueIndex"`
    Provider      string    `gorm:"type:text;not null"`  // github, gitlab
    RemoteUrl     string    `gorm:"type:text"`
    DefaultBranch string    `gorm:"type:text;default:main"`
    IsConnected   bool      `gorm:"type:boolean;default:false"`
    LastSyncAt    time.Time
    CreatedAt     time.Time
    UpdatedAt     time.Time
    
    // Relationships
    Project       Project `gorm:"foreignKey:ProjectId"`
}
```

### OAuthConnection

```go
type OAuthConnection struct {
    Id           string    `gorm:"primaryKey;type:text"`
    UserId       string    `gorm:"type:text;not null;index"`
    Provider     string    `gorm:"type:text;not null"`  // github, gitlab
    AccessToken  string    `gorm:"type:text;not null"`  // Encrypted
    RefreshToken string    `gorm:"type:text"`           // Encrypted
    ExpiresAt    time.Time
    Scopes       string    `gorm:"type:text"`           // Comma-separated
    Username     string    `gorm:"type:text"`
    AvatarUrl    string    `gorm:"type:text"`
    CreatedAt    time.Time
    UpdatedAt    time.Time
    
    // Relationships
    User         User `gorm:"foreignKey:UserId"`
}
```

### CommitRecord

```go
type CommitRecord struct {
    Id               string    `gorm:"primaryKey;type:text"`
    ProjectId        string    `gorm:"type:text;not null;index"`
    CommitHash       string    `gorm:"type:text;not null"`
    Message          string    `gorm:"type:text;not null"`
    Author           string    `gorm:"type:text"`
    FilesChanged     int       `gorm:"type:integer"`
    Insertions       int       `gorm:"type:integer"`
    Deletions        int       `gorm:"type:integer"`
    SpecReferences   string    `gorm:"type:text"`           // JSON array
    GenerationRunId  string    `gorm:"type:text;index"`     // Link to generation
    PushedAt         *time.Time
    CreatedAt        time.Time
}
```

---

## Git Manager

### Core Operations

```go
type GitManager struct {
    repoRoot       string
    localOps       *LocalGitOperations
    remoteOps      *RemoteGitOperations
    oauthManager   *OAuthManager
    commitBuilder  *CommitMessageBuilder
}

// Initialize a new repository for a project
func (g *GitManager) InitRepository(projectId string, projectName string) error {
    repoPath := g.getRepoPath(projectId)
    
    // Create directory structure
    if err := pathutil.EnsureDir(repoPath); err != nil {
        return err
    }
    
    // Initialize git
    cmd := exec.Command("git", "init")
    cmd.Dir = repoPath
    if err := cmd.Run(); err != nil {
        return apperror.Wrap(
            err,
            ErrGitInitFailed,
            "git init failed",
        )
    }
    
    // Create initial structure
    if err := g.createInitialStructure(repoPath, projectName); err != nil {
        return err
    }
    
    // Initial commit
    return g.Commit(projectId, "Initial commit: Project structure created", nil)
}

func (g *GitManager) getRepoPath(projectId string) string {
    return filepath.Join(g.repoRoot, projectId)
}

func (g *GitManager) createInitialStructure(repoPath, projectName string) error {
    // Create directories
    dirs := []string{"spec", "BE", "FE"}
    for _, dir := range dirs {
        if err := pathutil.EnsureDir(filepath.Join(repoPath, dir)); err != nil {
            return err
        }
        // Create .gitkeep
        gitkeep := filepath.Join(repoPath, dir, ".gitkeep")
        if err := pathutil.WriteFile(gitkeep, []byte{}, 0644); err != nil {
            return err
        }
    }
    
    // Create README
    readme := g.generateInitialReadme(projectName)
    return pathutil.WriteFile(filepath.Join(repoPath, "README.md"), []byte(readme), 0644)
}
```

### Pre-Commit Workflow

```go
// Always pull before committing to avoid conflicts
func (g *GitManager) PreCommitSync(projectId string) error {
    repoPath := g.getRepoPath(projectId)
    
    // Check if remote is configured
    hasRemote, err := g.hasRemote(repoPath)
    if err != nil {
        return err
    }
    
    if !hasRemote {
        return nil  // No remote, nothing to pull
    }
    
    // Stash local changes
    if err := g.stash(repoPath); err != nil {
        return err
    }
    
    // Pull from remote
    if err := g.pull(repoPath); err != nil {
        // Try to resolve conflicts
        if isConflictError(err) {
            if err := g.resolveConflicts(repoPath); err != nil {
                return apperror.Wrap(
                    err,
                    ErrResolveConflicts,
                    "failed to resolve conflicts",
                )
            }
        } else {
            return err
        }
    }
    
    // Apply stashed changes
    return g.stashPop(repoPath)
}

func (g *GitManager) hasRemote(repoPath string) apperror.Result[bool] {
    cmd := exec.Command("git", "remote", "-v")
    cmd.Dir = repoPath
    output, err := cmd.Output()
    if err != nil {
        return apperror.FailWrap[bool](
            err,
            "E8500",
            "failed to check git remote",
        )
    }

    return apperror.Ok(len(strings.TrimSpace(string(output))) > 0)
}

func (g *GitManager) pull(repoPath string) error {
    cmd := exec.Command("git", "pull", "--rebase", "origin", "main")
    cmd.Dir = repoPath
    return cmd.Run()
}
```

### Commit with Descriptive Messages

```go
type CommitMessageBuilder struct{}

type CommitContext struct {
    GenerationRunId string
    FilesChanged    []string
    SpecReferences  []string
    Phase           string  // writing, consistency, build_fix
}

func (b *CommitMessageBuilder) Build(ctx CommitContext) string {
    var sb strings.Builder
    
    // Title line (50 chars max)
    switch ctx.Phase {
    case "writing":
        sb.WriteString("feat: Generate code from specifications\n\n")
    case "consistency":
        sb.WriteString("fix: Apply consistency corrections\n\n")
    case "build_fix":
        sb.WriteString("fix: Apply build error corrections\n\n")
    }
    
    // Body: Files changed
    sb.WriteString("Files changed:\n")
    for _, file := range ctx.FilesChanged {
        sb.WriteString(fmt.Sprintf("  - %s\n", file))
    }
    sb.WriteString("\n")
    
    // Body: Spec references
    if len(ctx.SpecReferences) > 0 {
        sb.WriteString("Specifications implemented:\n")
        for _, spec := range ctx.SpecReferences {
            sb.WriteString(fmt.Sprintf("  - %s\n", spec))
        }
        sb.WriteString("\n")
    }
    
    // Footer: Generation run Id
    sb.WriteString(fmt.Sprintf("Generation-Run: %s\n", ctx.GenerationRunId))
    
    return sb.String()
}

func (g *GitManager) Commit(projectId string, message string, files []string) error {
    repoPath := g.getRepoPath(projectId)
    
    // Stage files
    if len(files) == 0 {
        // Stage all
        cmd := exec.Command("git", "add", "-A")
        cmd.Dir = repoPath
        if err := cmd.Run(); err != nil {
            return err
        }
    } else {
        // Stage specific files
        args := append([]string{"add"}, files...)
        cmd := exec.Command("git", args...)
        cmd.Dir = repoPath
        if err := cmd.Run(); err != nil {
            return err
        }
    }
    
    // Commit
    cmd := exec.Command("git", "commit", "-m", message)
    cmd.Dir = repoPath
    return cmd.Run()
}
```

---

## OAuth Integration

### GitHub OAuth

```go
type GitHubOAuthClient struct {
    clientId     string
    clientSecret string
    redirectUrl  string
    httpClient   *http.Client
}

type GitHubAuthConfig struct {
    ClientId     string
    ClientSecret string
    RedirectUrl  string
    Scopes       []string  // repo, read:user
}

func (c *GitHubOAuthClient) GetAuthUrl(state string) string {
    params := url.Values{
        "client_id":    {c.clientId},
        "redirect_uri": {c.redirectUrl},
        "scope":        {"repo,read:user"},
        "state":        {state},
    }
    return "https://github.com/login/oauth/authorize?" + params.Encode()
}

func (c *GitHubOAuthClient) ExchangeCode(code string) apperror.Result[OAuthTokens] {
    data := url.Values{
        "client_id":     {c.clientId},
        "client_secret": {c.clientSecret},
        "code":          {code},
    }
    
    resp, err := c.httpClient.PostForm(
        "https://github.com/login/oauth/access_token",
        data,
    )
    if err != nil {
        return apperror.FailWrap[OAuthTokens](
            err,
            "E8501",
            "OAuth token exchange failed",
        )
    }
    defer resp.Body.Close()
    
    // Parse response
    body, _ := io.ReadAll(resp.Body)
    values, _ := url.ParseQuery(string(body))
    
    return apperror.Ok(OAuthTokens{
        AccessToken:  values.Get("access_token"),
        TokenType:    values.Get("token_type"),
        Scope:        values.Get("scope"),
    })
}

func (c *GitHubOAuthClient) CreateRepository(
    token string,
    name string,
    private bool,
) apperror.Result[RepositoryInfo] {
    // GitHubCreateRepoRequest is the typed request for GitHub's Create Repository API
    // EXEMPTED: GitHub REST API request format
    type GitHubCreateRepoRequest struct {
        Name     string `json:"name"`
        Private  bool   `json:"private"`
        AutoInit bool   `json:"auto_init"`
    }
    
    reqBody := GitHubCreateRepoRequest{
        Name:     name,
        Private:  private,
        AutoInit: false,
    }
    
    jsonBody, _ := json.Marshal(reqBody)
    req, _ := http.NewRequest(httpmethod.Post.String(),
        "https://api.github.com/user/repos",
        bytes.NewBuffer(jsonBody),
    )
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Accept", "application/vnd.github+json")
    
    resp, err := c.httpClient.Do(req)
    if err != nil {
        return apperror.FailWrap[RepositoryInfo](
            err,
            "E8502",
            "GitHub repository creation failed",
        )
    }
    defer resp.Body.Close()
    
    var repoInfo RepositoryInfo
    json.NewDecoder(resp.Body).Decode(&repoInfo)
    
    return apperror.Ok(repoInfo)
}
```

### GitLab OAuth

```go
type GitLabOAuthClient struct {
    clientId     string
    clientSecret string
    redirectUrl  string
    baseUrl      string  // For self-hosted GitLab
    httpClient   *http.Client
}

func (c *GitLabOAuthClient) GetAuthUrl(state string) string {
    params := url.Values{
        "client_id":     {c.clientId},
        "redirect_uri":  {c.redirectUrl},
        "response_type": {"code"},
        "scope":         {"api read_user"},
        "state":         {state},
    }
    return c.baseUrl + "/oauth/authorize?" + params.Encode()
}
```

---

## Remote Operations

### Push Workflow

```go
func (g *GitManager) Push(projectId string, force bool) error {
    repoPath := g.getRepoPath(projectId)
    
    // Get connection
    conn, err := g.getConnection(projectId)
    if err != nil {
        return err
    }
    
    if conn.IsDisconnected {
        return errors.New("no remote connection configured")
    }
    
    // Set up credentials
    if err := g.setupCredentials(projectId, conn); err != nil {
        return err
    }
    
    // Push
    args := []string{"push", "origin", conn.DefaultBranch}
    if force {
        args = append(args, "--force")
    }
    
    cmd := exec.Command("git", args...)
    cmd.Dir = repoPath
    output, err := cmd.CombinedOutput()
    
    if err != nil {
        return apperror.New(
            ErrGitPushFailed,
            "push failed: "+string(output),
        )
    }
    
    // Update sync time
    g.updateLastSync(projectId)
    
    return nil
}

func (g *GitManager) setupCredentials(projectId string, conn *RepositoryConnection) error {
    repoPath := g.getRepoPath(projectId)
    
    // Get OAuth token
    oauth, err := g.oauthManager.GetConnection(conn.UserId, conn.Provider)
    if err != nil {
        return err
    }
    
    // Configure credential helper
    // Use git credential store with token
    credUrl := fmt.Sprintf("https://%s@%s",
        oauth.AccessToken,
        strings.TrimPrefix(conn.RemoteUrl, "https://"),
    )
    
    cmd := exec.Command("git", "remote", "set-url", "origin", credUrl)
    cmd.Dir = repoPath
    return cmd.Run()
}
```

### Connect to Remote

```go
func (g *GitManager) ConnectToRemote(
    projectId string,
    userId string,
    provider string,
    createNew bool,
    repoName string,
) apperror.Result[RepositoryConnection] {
    
    // Get OAuth connection
    oauth, err := g.oauthManager.GetConnection(userId, provider)
    if err != nil {
        return apperror.FailNew[RepositoryConnection](
            "E8503",
            fmt.Sprintf("no OAuth connection for %s", provider),
        )
    }
    
    var remoteUrl string
    
    if createNew {
        // Create new repository
        switch provider {
        case "github":
            repoResult := g.githubClient.CreateRepository(oauth.AccessToken, repoName, true)
            if repoResult.HasError() {
                return apperror.Fail[RepositoryConnection](repoResult.Error())
            }

            remoteUrl = repoResult.Value().CloneUrl
            
        case "gitlab":
            repoResult := g.gitlabClient.CreateRepository(oauth.AccessToken, repoName, true)
            if repoResult.HasError() {
                return apperror.Fail[RepositoryConnection](repoResult.Error())
            }

            remoteUrl = repoResult.Value().HttpUrlToRepo
        }
    } else {
        // Use provided URL
        remoteUrl = repoName  // In this case, repoName is the URL
    }
    
    // Add remote to local repo
    repoPath := g.getRepoPath(projectId)
    cmd := exec.Command("git", "remote", "add", "origin", remoteUrl)
    cmd.Dir = repoPath
    if err := cmd.Run(); err != nil {
        // Remote might already exist, try to update
        cmd = exec.Command("git", "remote", "set-url", "origin", remoteUrl)
        cmd.Dir = repoPath
        if err := cmd.Run(); err != nil {
            return apperror.FailWrap[RepositoryConnection](
                err,
                "E8503",
                "failed to set git remote",
            )
        }
    }
    
    // Push existing commits
    if err := g.Push(projectId, true); err != nil {
        return apperror.FailWrap[RepositoryConnection](
            err,
            "E8503",
            "initial push failed",
        )
    }
    
    // Update README with clone instructions
    if err := g.updateReadmeWithRemote(projectId, remoteUrl); err != nil {
        // Non-fatal
        log.Printf("Warning: failed to update README: %v", err)
    }
    
    // Save connection
    conn := RepositoryConnection{
        Id:            uuid.New().String(),
        ProjectId:     projectId,
        Provider:      provider,
        RemoteUrl:     remoteUrl,
        DefaultBranch: "main",
        IsConnected:   true,
        LastSyncAt:    time.Now(),
    }
    
    if err := g.db.Save(&conn).Error; err != nil {
        return apperror.FailWrap[RepositoryConnection](
            err,
            "E8503",
            "failed to save connection",
        )
    }

    return apperror.Ok(conn)
}
```

---

## Conflict Resolution

```go
type ConflictResolver struct {
    gitManager *GitManager
}

type ConflictInfo struct {
    FilePath    string
    OurChanges  string
    TheirChanges string
    Merged      string
}

func (r *ConflictResolver) DetectConflicts(repoPath string) apperror.Result[[]ConflictInfo] {
    cmd := exec.Command("git", "diff", "--name-only", "--diff-filter=U")
    cmd.Dir = repoPath
    output, err := cmd.Output()
    if err != nil {
        return nil, err
    }
    
    files := strings.Split(strings.TrimSpace(string(output)), "\n")
    conflicts := make([]ConflictInfo, 0, len(files))
    
    for _, file := range files {
        if file == "" {
            continue
        }
        conflicts = append(conflicts, ConflictInfo{FilePath: file})
    }
    
    return conflicts, nil
}

func (r *ConflictResolver) ResolveWithOurs(repoPath string, files []string) error {
    for _, file := range files {
        cmd := exec.Command("git", "checkout", "--ours", file)
        cmd.Dir = repoPath
        if err := cmd.Run(); err != nil {
            return err
        }
        
        cmd = exec.Command("git", "add", file)
        cmd.Dir = repoPath
        if err := cmd.Run(); err != nil {
            return err
        }
    }
    return nil
}

func (r *ConflictResolver) ResolveWithTheirs(repoPath string, files []string) error {
    for _, file := range files {
        cmd := exec.Command("git", "checkout", "--theirs", file)
        cmd.Dir = repoPath
        if err := cmd.Run(); err != nil {
            return err
        }
        
        cmd = exec.Command("git", "add", file)
        cmd.Dir = repoPath
        if err := cmd.Run(); err != nil {
            return err
        }
    }
    return nil
}
```

---

## README Generation

```go
func (g *GitManager) generateInitialReadme(projectName string) string {
    return fmt.Sprintf(`# %s

Generated by Spec Management Software

## Project Structure

` + "```" + `
├── spec/          # Specification documents
├── BE/            # Backend code (Go)
├── FE/            # Frontend code (React)
└── README.md      # This file
` + "```" + `

## Local Repository

This is currently a local repository. To connect to GitHub or GitLab:

1. Go to Project Settings > Git Integration
2. Connect your GitHub/GitLab account
3. Create or link a remote repository

## Getting Started

*Instructions will be updated once the repository is connected to a remote.*

---

*Generated on %s*
`, projectName, time.Now().Format("2006-01-02"))
}

func (g *GitManager) updateReadmeWithRemote(projectId, remoteUrl string) error {
    repoPath := g.getRepoPath(projectId)
    readmePath := filepath.Join(repoPath, "README.md")
    
    // Read current README
    content, err := pathutil.ReadFile(readmePath)
    if err != nil {
        return err
    }
    
    // Add clone instructions
    cloneSection := fmt.Sprintf(`
## Clone Instructions

` + "```" + `bash
git clone %s
cd %s
` + "```" + `

`, remoteUrl, filepath.Base(remoteUrl))
    
    // Insert after project structure section
    newContent := strings.Replace(
        string(content),
        "## Local Repository",
        cloneSection+"## Remote Repository\n\nThis repository is connected to: "+remoteUrl,
        1,
    )
    
    // Write updated README
    if err := pathutil.WriteFile(readmePath, []byte(newContent), 0644); err != nil {
        return err
    }
    
    // Commit the change
    return g.Commit(projectId, "docs: Update README with clone instructions", []string{"README.md"})
}
```

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 8400 | `ErrGitInitFailed` | Failed to initialize repository |
| 8401 | `ErrGitCommitFailed` | Failed to commit changes |
| 8402 | `ErrGitPushFailed` | Failed to push to remote |
| 8403 | `ErrGitPullFailed` | Failed to pull from remote |
| 8404 | `ErrGitConflict` | Merge conflict detected |
| 8405 | `ErrGitNoRemote` | No remote configured |
| 8406 | `ErrOauthNotConnected` | OAuth not connected for provider |
| 8407 | `ErrOauthTokenExpired` | OAuth token expired |
| 8408 | `ErrOauthRefreshFailed` | Failed to refresh OAuth token |
| 8409 | `ErrGitRepoCreateFailed` | Failed to create remote repository |

---

## Related Specs

- [Architecture](./01-architecture.md)
- [Repository Structure](./10-repository-structure.md)
- [Project Settings](../03-project-management/00-overview.md)
