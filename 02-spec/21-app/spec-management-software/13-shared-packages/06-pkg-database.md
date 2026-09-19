# pkg/database Specification

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  
**Priority:** P1  

---

## Overview

The `pkg/database` package provides a SQLite abstraction layer with connection pooling, migrations, transactions, and health checks. It supports the four-tier database architecture defined for SpecBuilder Pro.

**Cross-References:**
- [Database Design](../07-database-design/00-overview.md)
- [pkg/config Specification](./05-pkg-config.md)
- [pkg/logging Specification](./04-pkg-logging.md)

---

## File Structure

```
pkg/database/
├── connection.go   # Connection pool management
├── migrations.go   # Migration runner
├── transaction.go  # Transaction helpers
├── query.go        # Query builder utilities
├── health.go       # Health check utilities
├── options.go      # Functional options
├── errors.go       # Database-specific errors
└── database_test.go
```

---

## Database Architecture Support

```
┌─────────────────────────────────────────────────────────────┐
│                     Database Tier                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ settings.db │  │ projects.db  │  │ {project-id}.db    │  │
│  │ (Global)    │  │ (Global)     │  │ (Per-Project)      │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  {conv-id}.db                          │ │
│  │                  (Per-Conversation)                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## connection.go

```go
package database

import (
    stdctx "context"
    // ALLOWED: database infrastructure layer — core connection wrapper for SQLite
    "database/sql"
    "fmt"
    "sync"
    "time"
    
    _ "modernc.org/sqlite"
    
    "github.com/specbuilder/pkg/errors"
    "github.com/specbuilder/pkg/logging"
)

// DB wraps sql.DB with additional functionality
type DB struct {
    *sql.DB
    
    path     string
    logger   logging.Logger
    mu       sync.RWMutex
    closed   bool
    
    // Connection settings
    maxOpen     int
    maxIdle     int
    maxLifetime time.Duration
    maxIdleTime time.Duration
    
    // SQLite settings
    busyTimeout     time.Duration
    journalMode     string
    synchronousMode string
    cacheSize       int
}

// Option configures the database
type Option func(*DB)

// WithLogger sets the logger
func WithLogger(logger logging.Logger) Option {
    return func(db *DB) {
        db.logger = logger
    }
}

// WithMaxOpenConns sets max open connections
func WithMaxOpenConns(n int) Option {
    return func(db *DB) {
        db.maxOpen = n
    }
}

// WithMaxIdleConns sets max idle connections
func WithMaxIdleConns(n int) Option {
    return func(db *DB) {
        db.maxIdle = n
    }
}

// WithConnMaxLifetime sets connection max lifetime
func WithConnMaxLifetime(d time.Duration) Option {
    return func(db *DB) {
        db.maxLifetime = d
    }
}

// WithBusyTimeout sets SQLite busy timeout
func WithBusyTimeout(d time.Duration) Option {
    return func(db *DB) {
        db.busyTimeout = d
    }
}

// WithJournalMode sets SQLite journal mode
func WithJournalMode(mode string) Option {
    return func(db *DB) {
        db.journalMode = mode
    }
}

// WithSynchronousMode sets SQLite synchronous mode
func WithSynchronousMode(mode string) Option {
    return func(db *DB) {
        db.synchronousMode = mode
    }
}

// WithCacheSize sets SQLite cache size
func WithCacheSize(size int) Option {
    return func(db *DB) {
        db.cacheSize = size
    }
}

// Open opens a database connection
func Open(path string, opts ...Option) apperror.Result[DB] {
    db := &DB{
        path:            path,
        logger:          logging.NewNoop(),
        maxOpen:         10,
        maxIdle:         5,
        maxLifetime:     time.Hour,
        maxIdleTime:     30 * time.Minute,
        busyTimeout:     5 * time.Second,
        journalMode:     "WAL",
        synchronousMode: "NORMAL",
        cacheSize:       -64000, // 64MB
    }
    
    for _, opt := range opts {
        opt(db)
    }
    
    // Build connection string with pragmas
    dsn := fmt.Sprintf(
        "%s?_busy_timeout=%d&_journal_mode=%s&_synchronous=%s&_cache_size=%d&_foreign_keys=ON",
        path,
        db.busyTimeout.Milliseconds(),
        db.journalMode,
        db.synchronousMode,
        db.cacheSize,
    )
    
    sqlDb, err := sql.Open("sqlite", dsn)
    if err != nil {
        return apperror.FailNew[DB](
            errors.ErrDatabaseConnection,
            "failed to open database",
        )
    }
    
    // Configure connection pool
    sqlDb.SetMaxOpenConns(db.maxOpen)
    sqlDb.SetMaxIdleConns(db.maxIdle)
    sqlDb.SetConnMaxLifetime(db.maxLifetime)
    sqlDb.SetConnMaxIdleTime(db.maxIdleTime)
    
    db.DB = sqlDb
    
    // Verify connection
    context, cancel := stdctx.WithTimeout(stdctx.Background(), 5*time.Second)
    defer cancel()
    
    if err := db.PingContext(context); err != nil {
        sqlDb.Close()

        return apperror.FailNew[DB](
            errors.ErrDatabaseConnection,
            "failed to ping database",
        )
    }
    
    db.logger.Info("database opened",
        "path", path,
        "journal_mode", db.journalMode,
        "cache_size", db.cacheSize,
    )
    
    return apperror.Ok(*db)
}

// Close closes the database connection
func (db *DB) Close() error {
    db.mu.Lock()
    defer db.mu.Unlock()
    
    if db.closed {
        return nil
    }
    
    db.closed = true
    db.logger.Info("closing database", "path", db.path)
    
    // Checkpoint WAL before closing
    if db.journalMode == "WAL" {
        _, _ = db.Exec("PRAGMA wal_checkpoint(TRUNCATE)")
    }
    
    return db.DB.Close()
}

// Path returns the database file path
func (db *DB) Path() string {
    return db.path
}

// IsOpen returns true if the database is open
func (db *DB) IsOpen() bool {
    db.mu.RLock()
    defer db.mu.RUnlock()
    return !db.closed
}
```

---

## transaction.go

```go
package database

import (
    stdctx "context"
    // ALLOWED: database infrastructure layer — transaction management wrapper
    "database/sql"
    
    "github.com/specbuilder/pkg/errors"
)

// Tx wraps sql.Tx with additional functionality
type Tx struct {
    *sql.Tx
    db     *DB
    context    stdctx.Context
    done   bool
}

// TxOptions configures a transaction
type TxOptions struct {
    Isolation sql.IsolationLevel
    ReadOnly  bool
}

// Begin starts a new transaction
func (db *DB) Begin(context stdctx.Context) apperror.Result[Tx] {
    return db.BeginTx(context, nil)
}

// BeginTx starts a new transaction with options
func (db *DB) BeginTx(context stdctx.Context, opts *TxOptions) apperror.Result[Tx] {
    var sqlOpts *sql.TxOptions
    if opts != nil {
        sqlOpts = &sql.TxOptions{
            Isolation: opts.Isolation,
            ReadOnly:  opts.ReadOnly,
        }
    }
    
    tx, err := db.DB.BeginTx(context, sqlOpts)
    if err != nil {
        return apperror.FailNew[Tx](
            errors.ErrDatabaseTransaction,
            "failed to begin transaction",
        )
    }
    
    return apperror.Ok(Tx{
        Tx:      tx,
        db:      db,
        context: context,
    })
}

// Commit commits the transaction
func (tx *Tx) Commit() error {
    if tx.done {
        return nil
    }
    tx.done = true
    
    if err := tx.Tx.Commit(); err != nil {
        return errors.NewDatabase(
            errors.ErrDatabaseTransaction,
            "failed to commit transaction",
            nil,
        ).WithCause(err)
    }
    
    return nil
}

// Rollback rolls back the transaction
func (tx *Tx) Rollback() error {
    if tx.done {
        return nil
    }
    tx.done = true
    
    if err := tx.Tx.Rollback(); err != nil {
        return errors.NewDatabase(
            errors.ErrDatabaseTransaction,
            "failed to rollback transaction",
            nil,
        ).WithCause(err)
    }
    
    return nil
}

// WithTx executes a function within a transaction
// If the function returns an error, the transaction is rolled back
// Otherwise, it's committed
func (db *DB) WithTx(context stdctx.Context, fn func(*Tx) error) error {
    tx, err := db.Begin(context)
    if err != nil {
        return err
    }
    
    defer func() {
        if p := recover(); p != nil {
            tx.Rollback()
            panic(p)
        }
    }()
    
    if err := fn(tx); err != nil {
        tx.Rollback()
        return err
    }
    
    return tx.Commit()
}

// WithTxResult executes a function within a transaction and returns a result
func WithTxResult[T any](db *DB, context stdctx.Context, fn func(*Tx) apperror.Result[T]) apperror.Result[T] {
    txResult := db.Begin(context)
    if txResult.HasError() {
        return apperror.Fail[T](txResult.Error())
    }

    tx := txResult.Value()
    
    defer func() {
        if p := recover(); p != nil {
            tx.Rollback()
            panic(p)
        }
    }()
    
    result := fn(&tx)
    if result.HasError() {
        tx.Rollback()

        return result
    }
    
    if err := tx.Commit(); err != nil {
        return result, err
    }
    
    return result, nil
}

// Savepoint creates a savepoint within a transaction
func (tx *Tx) Savepoint(name string) error {
    _, err := tx.ExecContext(tx.context, "SAVEPOINT "+name)
    if err != nil {
        return errors.NewDatabase(
            errors.ErrDatabaseTransaction,
            "failed to create savepoint",
            errors.SavepointContext{Name: name},
        ).WithCause(err)
    }
    return nil
}

// RollbackTo rolls back to a savepoint
func (tx *Tx) RollbackTo(name string) error {
    _, err := tx.ExecContext(tx.context, "ROLLBACK TO SAVEPOINT "+name)
    if err != nil {
        return errors.NewDatabase(
            errors.ErrDatabaseTransaction,
            "failed to rollback to savepoint",
            errors.SavepointContext{Name: name},
        ).WithCause(err)
    }
    return nil
}

// Release releases a savepoint
func (tx *Tx) Release(name string) error {
    _, err := tx.ExecContext(tx.context, "RELEASE SAVEPOINT "+name)
    if err != nil {
        return errors.NewDatabase(
            errors.ErrDatabaseTransaction,
            "failed to release savepoint",
            errors.SavepointContext{Name: name},
        ).WithCause(err)
    }
    return nil
}
```

---

## migrations.go

```go
package database

import (
    stdctx "context"
    "embed"
    "fmt"
    "io/fs"
    "path/filepath"
    "sort"
    "strings"
    "time"
    
    "github.com/specbuilder/pkg/errors"
)

// Migration represents a database migration
type Migration struct {
    Version     int
    Name        string
    UpSQL       string
    DownSQL     string
    AppliedAt   *time.Time
}

// MigrationSource provides migrations
type MigrationSource interface {
    Migrations() apperror.Result[[]Migration]
}

// EmbedSource loads migrations from embedded files
type EmbedSource struct {
    FS   embed.FS
    Dir  string
}

// Migrations loads migrations from embedded filesystem
func (s *EmbedSource) Migrations() apperror.Result[[]Migration] {
    var migrations []Migration
    
    entries, err := fs.ReadDir(s.FS, s.Dir)
    if err != nil {
        return nil, apperror.Wrap(
            err,
            ErrMigrationReadDir,
            "read migrations dir",
        )
    }
    
    for _, entry := range entries {
        if entry.IsDir() || stringutil.IsMissingSuffix(entry.Name(), ".up.sql") {
            continue
        }
        
        name := entry.Name()
        base := strings.TrimSuffix(name, ".up.sql")
        
        var version int
        var migrationName string
        if _, err := fmt.Sscanf(base, "%d_%s", &version, &migrationName); err != nil {
            continue
        }
        
        upPath := filepath.Join(s.Dir, name)
        downPath := filepath.Join(s.Dir, base+".down.sql")
        
        upSQL, err := fs.ReadFile(s.FS, upPath)
        if err != nil {
            return nil, apperror.Wrap(
                err,
                ErrMigrationReadFile,
                "read migration file",
            ).WithPath(upPath)
        }
        
        var downSQL []byte
        if downBytes, err := fs.ReadFile(s.FS, downPath); err == nil {
            downSQL = downBytes
        }
        
        migrations = append(migrations, Migration{
            Version: version,
            Name:    migrationName,
            UpSQL:   string(upSQL),
            DownSQL: string(downSQL),
        })
    }
    
    sort.Slice(migrations, func(i, j int) bool {
        return migrations[i].Version < migrations[j].Version
    })
    
    return migrations, nil
}

// Migrator handles database migrations
type Migrator struct {
    db     *DB
    source MigrationSource
}

// NewMigrator creates a new migrator
func NewMigrator(db *DB, source MigrationSource) *Migrator {
    return &Migrator{db: db, source: source}
}

// Migrate runs all pending migrations
func (m *Migrator) Migrate(context stdctx.Context) error {
    // Ensure migrations table exists
    if err := m.ensureMigrationsTable(context); err != nil {
        return err
    }
    
    // Get all migrations
    migrations, err := m.source.Migrations()
    if err != nil {
        return errors.NewDatabase(
            errors.ErrDatabaseMigration,
            "failed to load migrations",
            nil,
        ).WithCause(err)
    }
    
    // Get applied versions
    applied, err := m.getAppliedVersions(context)
    if err != nil {
        return err
    }
    
    // Run pending migrations
    for _, migration := range migrations {
        if applied[migration.Version] {
            continue
        }
        
        m.db.logger.Info("applying migration",
            "version", migration.Version,
            "name", migration.Name,
        )
        
        if err := m.applyMigration(context, migration); err != nil {
            return errors.NewDatabase(
                errors.ErrDatabaseMigration,
                fmt.Sprintf("failed to apply migration %d", migration.Version),
                map[string]any{"Name": migration.Name},
            ).WithCause(err)
        }
    }
    
    return nil
}

// Rollback rolls back the last n migrations
func (m *Migrator) Rollback(context stdctx.Context, n int) error {
    migrations, err := m.source.Migrations()
    if err != nil {
        return err
    }
    
    applied, err := m.getAppliedVersions(context)
    if err != nil {
        return err
    }
    
    // Find applied migrations in reverse order
    var toRollback []Migration
    for i := len(migrations) - 1; i >= 0 && len(toRollback) < n; i-- {
        if applied[migrations[i].Version] {
            toRollback = append(toRollback, migrations[i])
        }
    }
    
    for _, migration := range toRollback {
        if migration.DownSQL == "" {
            return errors.NewDatabase(
                errors.ErrDatabaseMigration,
                "no down migration available",
                map[string]any{"Version": migration.Version},
            )
        }
        
        m.db.logger.Info("rolling back migration",
            "version", migration.Version,
            "name", migration.Name,
        )
        
        if err := m.rollbackMigration(ctx, migration); err != nil {
            return err
        }
    }
    
    return nil
}

// Status returns the status of all migrations
func (m *Migrator) Status(context stdctx.Context) apperror.Result[[]Migration] {
    migrations, err := m.source.Migrations()
    if err != nil {
        return nil, err
    }
    
    rows, err := m.db.QueryContext(context,
        "SELECT Version, AppliedAt FROM Migrations ORDER BY Version",
    )
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    appliedAt := make(map[int]time.Time)
    for rows.Next() {
        var version int
        var at time.Time
        if err := rows.Scan(&version, &at); err != nil {
            return nil, err
        }
        appliedAt[version] = at
    }
    
    for i := range migrations {
        if at, ok := appliedAt[migrations[i].Version]; ok {
            migrations[i].AppliedAt = &at
        }
    }
    
    return migrations, nil
}

func (m *Migrator) ensureMigrationsTable(context stdctx.Context) *apperror.AppError {
    _, err := m.db.ExecContext(context, `
        CREATE TABLE IF NOT EXISTS Migrations (
            Version   INTEGER PRIMARY KEY,
            Name      TEXT NOT NULL,
            AppliedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `)
    return err
}

func (m *Migrator) getAppliedVersions(context stdctx.Context) apperror.Result[map[int]bool] {
    rows, err := m.db.QueryContext(context, "SELECT Version FROM Migrations")
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    applied := make(map[int]bool)
    for rows.Next() {
        var version int
        if err := rows.Scan(&version); err != nil {
            return nil, err
        }
        applied[version] = true
    }
    
    return applied, nil
}

func (m *Migrator) applyMigration(context stdctx.Context, migration Migration) error {
    return m.db.WithTx(context, func(tx *Tx) error {
        if _, err := tx.ExecContext(context, migration.UpSQL); err != nil {
            return err
        }
        
        _, err := tx.ExecContext(context,
            "INSERT INTO Migrations (Version, Name) VALUES (?, ?)",
            migration.Version, migration.Name,
        )
        return err
    })
}

func (m *Migrator) rollbackMigration(context stdctx.Context, migration Migration) error {
    return m.db.WithTx(context, func(tx *Tx) error {
        if _, err := tx.ExecContext(context, migration.DownSQL); err != nil {
            return err
        }
        
        _, err := tx.ExecContext(context,
            "DELETE FROM Migrations WHERE Version = ?",
            migration.Version,
        )
        return err
    })
}
```

---

## health.go

```go
package database

import (
    stdctx "context"
    "time"
)

// Health represents database health status
type Health struct {
    Status       HealthStatus
    Latency      time.Duration
    OpenConns    int
    InUse        int
    Idle         int
    WaitCount    int64
    WaitDuration time.Duration
    Message      string `json:",omitempty"`
}

// HealthStatus represents health status
type HealthStatus string

const (
    HealthStatusUp       HealthStatus = "UP"
    HealthStatusDown     HealthStatus = "DOWN"
    HealthStatusDegraded HealthStatus = "DEGRADED"
)

// HealthCheck performs a health check on the database
func (db *DB) HealthCheck(context stdctx.Context) Health {
    health := Health{
        Status: HealthStatusUp,
    }
    
    // Get connection stats
    stats := db.Stats()
    health.OpenConns = stats.OpenConnections
    health.InUse = stats.InUse
    health.Idle = stats.Idle
    health.WaitCount = stats.WaitCount
    health.WaitDuration = stats.WaitDuration
    
    // Measure ping latency
    start := time.Now()
    if err := db.PingContext(context); err != nil {
        health.Status = HealthStatusDown
        health.Message = err.Error()
        health.Latency = time.Since(start)
        return health
    }
    health.Latency = time.Since(start)
    
    // Check for degraded state
    if health.Latency > 100*time.Millisecond {
        health.Status = HealthStatusDegraded
        health.Message = "high latency detected"
    }
    
    if float64(health.InUse)/float64(db.maxOpen) > 0.9 {
        health.Status = HealthStatusDegraded
        health.Message = "connection pool nearly exhausted"
    }
    
    return health
}

// IntegrityCheck runs SQLite integrity check
func (db *DB) IntegrityCheck(context stdctx.Context) apperror.Result[bool] {
    var result string
    err := db.QueryRowContext(context, "PRAGMA integrity_check").Scan(&result)
    if err != nil {
        return apperror.FailWrap[bool](
            err,
            errors.ErrDatabaseQuery,
            "integrity check failed",
        )
    }

    return apperror.Ok(result == "ok")
}

// Vacuum runs SQLite VACUUM
func (db *DB) Vacuum(context stdctx.Context) error {
    _, err := db.ExecContext(context, "VACUUM")
    return err
}

// Analyze runs SQLite ANALYZE
func (db *DB) Analyze(context stdctx.Context) error {
    _, err := db.ExecContext(context, "ANALYZE")
    return err
}

// WALCheckpoint performs WAL checkpoint
func (db *DB) WALCheckpoint(context stdctx.Context) error {
    _, err := db.ExecContext(context, "PRAGMA wal_checkpoint(TRUNCATE)")
    return err
}
```

---

## query.go

```go
package database

import (
    stdctx "context"
    // ALLOWED: database infrastructure layer — query builder uses sql.Result and sql.Rows interfaces
    "database/sql"
    "fmt"
    "strings"
    
    "github.com/specbuilder/pkg/errors"
    "github.com/specbuilder/pkg/types"
)

// Executor can execute queries (DB or Tx)
type Executor interface {
    ExecContext(context stdctx.Context, query string, args ...any) (sql.Result, error) // EXEMPTED: database/sql stdlib interface
    QueryContext(context stdctx.Context, query string, args ...any) (*sql.Rows, error) // EXEMPTED: database/sql stdlib interface
    QueryRowContext(context stdctx.Context, query string, args ...any) *sql.Row
}

// QueryBuilder helps build SQL queries
type QueryBuilder struct {
    table      string
    columns    []string
    conditions []string
    args       []any
    orderBy    string
    limit      int
    offset     int
}

// NewQuery creates a new query builder
func NewQuery(table string) *QueryBuilder {
    return &QueryBuilder{table: table}
}

// Select specifies columns to select
func (q *QueryBuilder) Select(columns ...string) *QueryBuilder {
    q.columns = columns
    return q
}

// Where adds a condition
func (q *QueryBuilder) Where(condition string, args ...any) *QueryBuilder {
    q.conditions = append(q.conditions, condition)
    q.args = append(q.args, args...)
    return q
}

// OrderBy sets the order
func (q *QueryBuilder) OrderBy(column string, dir types.SortDirection) *QueryBuilder {
    q.orderBy = fmt.Sprintf("%s %s", column, dir)
    return q
}

// Limit sets the limit
func (q *QueryBuilder) Limit(n int) *QueryBuilder {
    q.limit = n
    return q
}

// Offset sets the offset
func (q *QueryBuilder) Offset(n int) *QueryBuilder {
    q.offset = n
    return q
}

// Paginate applies pagination
func (q *QueryBuilder) Paginate(req types.PageRequest) *QueryBuilder {
    q.limit = req.Limit()
    q.offset = req.Offset()
    if req.SortBy != "" {
        q.orderBy = fmt.Sprintf("%s %s", req.SortBy, req.SortDir)
    }
    return q
}

// Build returns the SQL query and args
func (q *QueryBuilder) Build() (string, []any) {
    var sb strings.Builder
    
    // SELECT
    sb.WriteString("SELECT ")
    if len(q.columns) > 0 {
        sb.WriteString(strings.Join(q.columns, ", "))
    } else {
        sb.WriteString("*")
    }
    
    // FROM
    sb.WriteString(" FROM ")
    sb.WriteString(q.table)
    
    // WHERE
    if len(q.conditions) > 0 {
        sb.WriteString(" WHERE ")
        sb.WriteString(strings.Join(q.conditions, " AND "))
    }
    
    // ORDER BY
    if q.orderBy != "" {
        sb.WriteString(" ORDER BY ")
        sb.WriteString(q.orderBy)
    }
    
    // LIMIT
    if q.limit > 0 {
        sb.WriteString(fmt.Sprintf(" LIMIT %d", q.limit))
    }
    
    // OFFSET
    if q.offset > 0 {
        sb.WriteString(fmt.Sprintf(" OFFSET %d", q.offset))
    }
    
    return sb.String(), q.args
}

// CountQuery returns a COUNT query
func (q *QueryBuilder) CountQuery() (string, []any) {
    var sb strings.Builder
    
    sb.WriteString("SELECT COUNT(*) FROM ")
    sb.WriteString(q.table)
    
    if len(q.conditions) > 0 {
        sb.WriteString(" WHERE ")
        sb.WriteString(strings.Join(q.conditions, " AND "))
    }
    
    return sb.String(), q.args
}

// GetOne retrieves a single row
func GetOne[T any](context stdctx.Context, e Executor, query string, args []any, scan func(*sql.Row) apperror.Result[T]) apperror.Result[T] {
    row := e.QueryRowContext(context, query, args...)
    result := scan(row)
    if result.HasError() {
        return result
    }

    return result
}

// GetMany retrieves multiple rows
func GetMany[T any](context stdctx.Context, e Executor, query string, args []any, scan func(*sql.Rows) apperror.Result[T]) apperror.Result[[]T] {
    rows, err := e.QueryContext(context, query, args...)
    if err != nil {
        return apperror.FailNew[[]T](
            errors.ErrDatabaseQuery,
            "failed to execute query",
        )
    }
    defer rows.Close()
    
    var results []T
    for rows.Next() {
        itemResult := scan(rows)
        if itemResult.HasError() {
            return apperror.Fail[[]T](itemResult.Error())
        }

        results = append(results, itemResult.Value())
    }
    
    if err := rows.Err(); err != nil {
        return apperror.FailNew[[]T](
            errors.ErrDatabaseQuery,
            "error iterating rows",
        )
    }
    
    return apperror.Ok(results)
}

// Count returns the count of matching rows
func Count(context stdctx.Context, e Executor, query string, args []any) apperror.Result[int] {
    var count int
    err := e.QueryRowContext(context, query, args...).Scan(&count)
    if err != nil {
        return apperror.FailNew[int](
            errors.ErrDatabaseQuery,
            "failed to count records",
        )
    }

    return apperror.Ok(count)
}
    }
    return count, nil
}
```

---

## Usage Examples

### Opening a Database

```go
db, err := database.Open("./data/settings.db",
    database.WithLogger(logger),
    database.WithJournalMode("WAL"),
    database.WithMaxOpenConns(10),
)
if err != nil {
    log.Fatal(err)
}
defer db.Close()
```

### Running Migrations

```go
//go:embed migrations/*.sql
var migrationsFS embed.FS

source := &database.EmbedSource{
    FS:  migrationsFS,
    Dir: "migrations",
}

migrator := database.NewMigrator(db, source)
if err := migrator.Migrate(ctx); err != nil {
    log.Fatal(err)
}
```

### Using Transactions

```go
err := db.WithTx(ctx, func(tx *database.Tx) error {
    // All operations in same transaction
    _, err := tx.ExecContext(ctx, 
        "INSERT INTO Specs (ID, Name) VALUES (?, ?)",
        id, name,
    )
    if err != nil {
        return err // Rollback happens automatically
    }
    
    _, err = tx.ExecContext(ctx,
        "UPDATE Projects SET SpecCount = SpecCount + 1 WHERE Id = ?",
        projectId,
    )
    return err // Commit happens if nil
})
```

### Query Builder

```go
query := database.NewQuery("Specs").
    Select("Id", "Name", "Status", "CreatedAt").
    Where("ProjectId = ?", projectId).
    Where("Status = ?", types.StatusActive).
    Paginate(pageReq)

sql, args := query.Build()
specs, err := database.GetMany(ctx, db, sql, args, scanSpec)
```
