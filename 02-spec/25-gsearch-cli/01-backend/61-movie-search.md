# GSearch CLI: Movie Search

> **Version:** 2.0.0  
> **Status:** Draft  
> **Last Updated:** 2026-03-09

---

## Overview

The Movie Search feature enables searching for movie and TV show metadata from IMDB, TMDB (The Movie Database), and OMDB APIs. It includes intelligent filename normalization to extract titles from release-format filenames and distinguishes between movies and TV shows.

---

## Architecture

### Split DB Pattern

```
data/
├── gsearch.db                              # Root DB (global settings + seedable config)
├── movies-and-tv.db                        # ALL Movies + TV Shows metadata
│   ├── Movies                              # Movie metadata cache
│   ├── TvShows                             # TV show metadata cache
│   └── ApiKeyUsage                         # API key rotation tracking
│
└── movies/
    ├── search.db                           # Search history registry
    │   ├── MovieSearches                   # Search history
    │   └── BatchJobs                       # Batch processing history
    │
    ├── tv-episodes.db                      # ALL TV episodes (single DB)
    │   ├── Episodes                        # Episode metadata
    │   └── Seasons                         # Season metadata
    │
    └── folder-batch-cache.db               # ALL folder batch results (single DB)
        └── BatchResults                    # Files processed from all folders
```

### Database Hierarchy

| Database | Path | Purpose |
|----------|------|---------|
| Global Settings | `data/gsearch.db` | CLI configuration, seedable config |
| Content Cache | `data/movies-and-tv.db` | All movie/TV show metadata |
| Search Registry | `data/movies/search.db` | Search history, batch jobs |
| Episodes DB | `data/movies/tv-episodes.db` | All episodes across all shows |
| Folder Batch | `data/movies/folder-batch-cache.db` | All folder batch scan results |

### Flow

```
Filename/Query → Normalizer → Content Detector → Check movies-and-tv.db
       ↓                                              ↓
[Cache Hit] ←──────────────────────────────── Return cached data
       ↓ (miss)
API Search → Update movies-and-tv.db → Log to search.db → Response
       ↓
[TV Episode] → Also update tv-episodes.db
       ↓
[Batch Mode] → Update folder-batch-cache.db → Parallel Workers → Rate Limiter
```

---

## Filename Normalization

### Normalization Pipeline

```
Input: "Fallout.2024.S02E03.1080p.x265-ELiTE"
       ↓
Step 1: Replace dots/underscores with spaces
       "Fallout 2024 S02E03 1080p x265-ELiTE"
       ↓
Step 2: Detect content type (TV/Movie)
       Pattern: S\d{1,2}E\d{1,2} → TV Show
       ↓
Step 3: Extract core metadata
       Title: "Fallout", Year: 2024, Season: 2, Episode: 3
       ↓
Step 4: Generate search query
       "Fallout 2024 S02E03" (for display)
       "Fallout" (for API search)
```

### Content Type Detection

| Pattern | Type | Example Input | Extracted |
|---------|------|---------------|-----------|
| `S\d{1,2}E\d{1,2}` | TV Episode | `Fallout.2024.S02E03` | Season 2, Episode 3 |
| `S\d{1,2}` (no episode) | TV Season | `Fuga.S01.ITA.ENG` | Season 1 |
| `Season.\d{1,2}` | TV Season | `Show.Season.01` | Season 1 |
| Year only (4 digits) | Movie | `Movie.2024.1080p` | Year 2024 |
| No patterns | Unknown | `Movie.Title.Only` | Search as both |

### Normalization Rules (Seedable Config)

All normalization tokens are stored in seedable configuration (`config.seed.json`) and loaded into the Root DB at startup. Code accesses these via typed constants.

```go
// Seedable config keys for movie normalization
const (
    MovieKeyQualityTokens    = "Movie.QualityTokens"      // ["1080p", "720p", "480p", ...]
    MovieKeyEncodingTokens   = "Movie.EncodingTokens"     // ["x264", "x265", "HEVC", ...]
    MovieKeySourceTokens     = "Movie.SourceTokens"       // ["BluRay", "WEBRip", ...]
    MovieKeyLanguageCodes    = "Movie.LanguageCodes"      // ["ITA", "ENG", "SPA", ...]
    MovieKeyStripPatterns    = "Movie.StripPatterns"      // Regex patterns
    MovieKeyReleaseKeywords  = "Movie.ReleaseKeywords"    // ["repack", "proper", ...]
)

// NormalizationConfig loaded from seedable settings
type NormalizationConfig struct {
    QualityTokens   []string // From MovieKeyQualityTokens
    EncodingTokens  []string // From MovieKeyEncodingTokens
    SourceTokens    []string // From MovieKeySourceTokens
    LanguageCodes   []string // From MovieKeyLanguageCodes
    StripPatterns   []string // From MovieKeyStripPatterns
    ReleaseKeywords []string // From MovieKeyReleaseKeywords
}

// LoadNormalizationConfig retrieves config from Root DB
func LoadNormalizationConfig(settings SettingsService) apperror.Result[NormalizationConfig] {
    return apperror.Ok(NormalizationConfig{
        QualityTokens:   settings.GetStringArray(MovieKeyQualityTokens),
        EncodingTokens:  settings.GetStringArray(MovieKeyEncodingTokens),
        SourceTokens:    settings.GetStringArray(MovieKeySourceTokens),
        LanguageCodes:   settings.GetStringArray(MovieKeyLanguageCodes),
        StripPatterns:   settings.GetStringArray(MovieKeyStripPatterns),
        ReleaseKeywords: settings.GetStringArray(MovieKeyReleaseKeywords),
    })
}
```

### Seed Configuration (`config.seed.json`)

```json
{
  "Movie.QualityTokens": ["1080p", "720p", "480p", "2160p", "4K", "UHD", "HDR"],
  "Movie.EncodingTokens": ["x264", "x265", "HEVC", "AVC", "H264", "H265", "AAC", "DTS", "AC3"],
  "Movie.SourceTokens": ["BluRay", "BRRip", "WEBRip", "WEB-DL", "HDRip", "DVDRip", "HDTV", "NFRip", "AMZN", "NF", "DSNP", "ATVP", "HMAX"],
  "Movie.LanguageCodes": ["ITA", "ENG", "SPA", "FRA", "GER", "DEU", "JPN", "KOR", "CHI", "RUS", "POR", "DUT", "NLD", "POL", "TUR", "ARA", "HIN", "MULTI"],
  "Movie.StripPatterns": ["-[A-Za-z0-9]+$", "\\[.*?\\]", "\\(.*?\\)", "(?i)(repack|proper|internal|limited|extended|unrated|directors.cut)"],
  "Movie.ReleaseKeywords": ["repack", "proper", "internal", "limited", "extended", "unrated", "directors.cut", "theatrical", "imax"]
}
```

### Normalized Output

```go
// NormalizedMedia represents parsed filename
type NormalizedMedia struct {
    OriginalFilename string
    NormalizedTitle  string
    SearchQuery      string
    Year             int     `json:",omitempty"`
    ContentType      string  // "movie", "tv", "unknown"
    Season           int     `json:",omitempty"`
    Episode          int     `json:",omitempty"`
    DisplayFormat    string
    Confidence       float64
}
```

### Examples

| Input | Output | Type |
|-------|--------|------|
| `Fallout.2024.S02E03.1080p.x265-ELiTE` | `Fallout 2024 S02E03` | TV Episode |
| `Fuga.S01.ITA.ENG.1080p.NFRip.AAC.x265-Pir8` | `Fuga Season 01` | TV Season |
| `The.Batman.2022.1080p.BluRay.x264-GROUP` | `The Batman 2022` | Movie |
| `Breaking.Bad.S05E16.Felina.720p.HDTV` | `Breaking Bad S05E16` | TV Episode |
| `Oppenheimer.2023.IMAX.2160p.UHD.BluRay` | `Oppenheimer 2023` | Movie |

---

## Provider Architecture (Enum-Based)

Following the GSearch CLI Enum Architecture (`58-enum-architecture.md`), movie/TV search uses switchable providers with parallel execution support.

### Provider Enum

```go
// internal/enums/movieprovidertype/variant.go
package movieprovidertype

type Variant string

const (
    Tmdb        Variant = "tmdb"         // Primary - golang-tmdb library
    Omdb        Variant = "omdb"         // Secondary - IMDB ratings
    Trakt       Variant = "trakt"        // Discovery & ID mapping
    ImdbScraper Variant = "imdb_scraper" // Fallback scraper
)

func (v Variant) IsValid() bool {
    switch v {
    case Tmdb, Omdb, Trakt, ImdbScraper:
        return true
    }
    return false
}

func (v Variant) RequiresApiKey() bool {
    return v != ImdbScraper
}

func (v Variant) SupportsEpisodes() bool {
    return v == Tmdb || v == Trakt
}
```

### Search Mode Enum

```go
// internal/enums/moviesearchmodetype/variant.go
package moviesearchmodetype

type Variant string

const (
    Search   Variant = "search"   // Title-based search
    Lookup   Variant = "lookup"   // ID-based lookup (IMDB/TMDB)
    Discover Variant = "discover" // Trending, by genre, etc.
    Batch    Variant = "batch"    // Filename normalization + search
)
```

---

## Golang Library Integration

### Provider Libraries

| Provider | Go Package | API Key | Parallel | Recommended Use |
|----------|-----------|---------|----------|-----------------|
| **TMDB** | `github.com/cyruzin/golang-tmdb` | Yes | Yes | Primary metadata source |
| **OMDB** | `github.com/mohan3d/omdbapi` | Yes | Yes | IMDB/RT/Metacritic ratings |
| **Trakt** | `gitlab.com/ydkn/go-trakt` | Yes | Yes | Discovery, ID mapping |
| **IMDB Scraper** | `github.com/omkarcloud/imdb-scraper` | No | Limited | Fallback only |

### 1. TMDB via golang-tmdb (Primary)

**Package:** `github.com/cyruzin/golang-tmdb`

**Features:**
- Full TMDB API v3 and v4 support
- Movies, TV Shows, Seasons, Episodes, People
- Trending, Upcoming, Genre filtering
- Image URL generation (posters, backdrops, stills)
- Video URL generation (trailers, teasers)
- Actively maintained (last update: Dec 2025)

**Installation:**
```bash
go get github.com/cyruzin/golang-tmdb
```

**Usage Example:**
```go
import tmdb "github.com/cyruzin/golang-tmdb"

// Initialize client
client, err := tmdb.Init(os.Getenv("TMDB_API_KEY"))
if err != nil {
    return err
}

// Search movies
options := map[string]string{"year": "2024"}
results, err := client.GetSearchMovies("Oppenheimer", options)

// Search TV shows
tvResults, err := client.GetSearchTVShow("Fallout", nil)

// Get TV episode details
episode, err := client.GetTVEpisodeDetails(106379, 2, 3, nil)

// Get image URLs
posterUrl := tmdb.GetImageUrl(movie.PosterPath, tmdb.W500)
```

**Key Methods:**
| Method | Purpose |
|--------|---------|
| `GetSearchMovies(query, options)` | Search movies by title |
| `GetSearchTVShow(query, options)` | Search TV shows by title |
| `GetSearchMulti(query, options)` | Search both |
| `GetMovieDetails(id, options)` | Full movie metadata |
| `GetTVDetails(id, options)` | Full TV show metadata |
| `GetTVSeasonDetails(id, season, options)` | Season with episode list |
| `GetTVEpisodeDetails(id, season, ep, options)` | Single episode |
| `GetTrending(mediaType, timeWindow)` | Trending content |
| `GetDiscoverMovie(options)` | Discover by filters |

### 2. OMDB via omdbapi (Secondary)

**Package:** `github.com/mohan3d/omdbapi`

**Features:**
- IMDB data integration
- Aggregated ratings (IMDB, Rotten Tomatoes, Metacritic)
- Simple, lightweight API
- Direct IMDB ID lookups

**Installation:**
```bash
go get github.com/mohan3d/omdbapi
```

**Usage Example:**
```go
import "github.com/mohan3d/omdbapi"

client := omdbapi.New(os.Getenv("OMDB_API_KEY"))

// Search by title
result, err := client.GetByTitle("Oppenheimer", nil)

// Get by IMDB ID
movie, err := client.GetById("tt15398776", nil)

// Get with year filter
opts := &omdbapi.Options{Year: 2023, Type: "movie"}
movie, err := client.GetByTitle("Oppenheimer", opts)

// Access ratings
for _, rating := range movie.Ratings {
    fmt.Printf("%s: %s\n", rating.Source, rating.Value)
}
```

**Alternative:** `github.com/eefret/gomdb` (similar API)

### 3. Trakt via go-trakt (Discovery)

**Package:** `gitlab.com/ydkn/go-trakt`

**Features:**
- Cross-platform ID mapping (IMDB ↔ TMDB ↔ TVDB)
- User watchlists and history
- Popular, anticipated, box office lists
- OAuth2 support for user features

**Installation:**
```bash
go get gitlab.com/ydkn/go-trakt
```

**Usage Example:**
```go
import "gitlab.com/ydkn/go-trakt"

client := trakt.NewClient(
    os.Getenv("TRAKT_CLIENT_ID"),
    trakt.WithAuth(accessToken),
)

// Search across movies and shows
results, err := client.Search.TextQuery("Fallout", trakt.SearchTypeMovie, trakt.SearchTypeTVShow)

// Get trending movies
trending, err := client.Movies.Trending(nil)

// ID lookup (get all IDs for an IMDB ID)
ids, err := client.Search.IDLookup("tt12637874", trakt.IDTypeIMDB)
// Returns: IMDB, TMDB, TVDB, Trakt IDs
```

### 4. IMDB Scraper (Fallback)

**Package:** `github.com/omkarcloud/imdb-scraper` (or use GSearch's Colly-based scraper)

**Features:**
- No API key required
- Actor filmographies
- Detailed ratings breakdown
- Cast information

**Note:** Use only as fallback. IMDB ToS restricts scraping for commercial use.

**Alternative - Custom Colly Scraper:**
```go
import "github.com/gocolly/colly/v2"

func ScrapeImdb(imdbId string) apperror.Result[ImdbData] {
    c := colly.NewCollector()
    
    var data ImdbData
    
    c.OnHtml("[data-testid='hero-rating-bar__aggregate-rating__score']", func(e *colly.HTMLElement) {
        data.Rating = e.ChildText("span")
    })
    
    c.Visit("https://www.imdb.com/title/" + imdbId)
    return apperror.Ok(data)
}
```

---

## Provider Interface

```go
// internal/movie/provider.go
package movie

import "context"

// Provider interface for all movie data sources
type Provider interface {
    Name() string
    Search(context stdctx.Context, query string, opts SearchOptions) apperror.Result[[]MediaResult]
    GetMovie(context stdctx.Context, id string) apperror.Result[*MovieDetails]
    GetTVShow(context stdctx.Context, id string) apperror.Result[*TVShowDetails]
    GetEpisode(context stdctx.Context, showId string, season, episode int) apperror.Result[*EpisodeDetails]
    SupportsFeature(feature ProviderFeature) bool
}

type ProviderFeature int

const (
    FeatureEpisodes ProviderFeature = iota
    FeatureRatings
    FeatureTrailers
    FeatureDiscovery
    FeatureIdMapping
)

// SearchOptions for all providers
type SearchOptions struct {
    Year        int
    ContentType string // "movie", "tv", "both"
    Language    string
    Limit       int
}
```

### Provider Orchestrator

```go
// internal/movie/orchestrator.go
package movie

type Orchestrator struct {
    providers map[movie_provider.Variant]Provider
    mode      movie_search_mode.Variant
    parallel  bool
}

// SearchAll queries multiple providers in parallel
func (o *Orchestrator) SearchAll(context stdctx.Context, query string, opts SearchOptions) apperror.Result[[]MediaResult] {
    if !o.parallel {
        return o.searchSequential(context, query, opts)
    }
    
    var wg sync.WaitGroup
    resultsChan := make(chan []MediaResult, len(o.providers))
    
    for _, provider := range o.providers {
        wg.Add(1)
        go func(p Provider) {
            defer wg.Done()
            searchResult := p.Search(context, query, opts)
            if searchResult.IsSuccess() {
                resultsChan <- searchResult.Value()
            }
        }(provider)
    }
    
    wg.Wait()
    close(resultsChan)
    
    return o.mergeAndDeduplicate(resultsChan)
}
```

---

## Data Sources (API Details)

### 1. TMDB (The Movie Database) - Primary

**Base URL:** `https://api.themoviedb.org/3`

**Rate Limits:** 40 requests/10 seconds (generous)

**Features:**
- Comprehensive movie and TV data
- Images, cast, crew, reviews
- Multiple language support
- Free tier sufficient for most use cases

**Endpoints Used:**

| Endpoint | Purpose |
|----------|---------|
| `/search/movie` | Search movies by title |
| `/search/tv` | Search TV shows by title |
| `/search/multi` | Search both movies and TV |
| `/movie/{id}` | Get movie details |
| `/tv/{id}` | Get TV show details |
| `/tv/{id}/season/{season}` | Get season details |
| `/tv/{id}/season/{season}/episode/{episode}` | Get episode details |

### 2. OMDB API - Secondary

**Base URL:** `http://www.omdbapi.com/`

**Features:**
- IMDB data integration
- Ratings from multiple sources (IMDB, RT, Metacritic)
- Simple API structure

**Parameters:**

| Parameter | Description |
|-----------|-------------|
| `t` | Title search |
| `i` | IMDB ID lookup |
| `y` | Year filter |
| `type` | movie, series, episode |
| `season` | Season number |
| `episode` | Episode number |

### 3. Trakt.tv - Discovery

**Base URL:** `https://api.trakt.tv`

**Features:**
- ID mapping across platforms
- User watchlists/history
- Trending and anticipated content
- OAuth2 for personalization

### 4. IMDB (Scraping Fallback)

When APIs fail or for additional data, use Colly-based scraping via GSearch's extraction pipeline.

---

## Database Schema

### Content Cache DB (`data/movies-and-tv.db`)

```sql
-- Movie metadata cache
CREATE TABLE Movies (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ImdbId TEXT UNIQUE,
    TmdbId INTEGER UNIQUE,
    Title TEXT NOT NULL,
    OriginalTitle TEXT,
    Year INTEGER,
    ReleaseDate TEXT,
    Runtime INTEGER,
    Genres TEXT,                     -- JSON array
    Overview TEXT,
    PosterUrl TEXT,
    BackdropUrl TEXT,
    Rating REAL,
    ImdbRating REAL,
    RottenTomatoesRating INTEGER,
    MetacriticRating INTEGER,
    VoteCount INTEGER,
    Popularity REAL,
    Budget INTEGER,
    Revenue INTEGER,
    Status TEXT,
    Tagline TEXT,
    Director TEXT,
    Cast TEXT,                       -- JSON array
    Keywords TEXT,                   -- JSON array
    ProductionCompanies TEXT,        -- JSON array
    Languages TEXT,                  -- JSON array
    Countries TEXT,                  -- JSON array
    CachedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TV show metadata cache
CREATE TABLE TvShows (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ImdbId TEXT UNIQUE,
    TmdbId INTEGER UNIQUE,
    Title TEXT NOT NULL,
    OriginalTitle TEXT,
    FirstAirDate TEXT,
    LastAirDate TEXT,
    Status TEXT,                     -- "Returning Series", "Ended", etc.
    SeasonCount INTEGER,
    EpisodeCount INTEGER,
    EpisodeRuntime INTEGER,
    Genres TEXT,                     -- JSON array
    Overview TEXT,
    PosterUrl TEXT,
    BackdropUrl TEXT,
    Rating REAL,
    ImdbRating REAL,
    VoteCount INTEGER,
    Popularity REAL,
    Networks TEXT,                   -- JSON array
    Creators TEXT,                   -- JSON array
    Cast TEXT,                       -- JSON array
    Keywords TEXT,                   -- JSON array
    Languages TEXT,                  -- JSON array
    Countries TEXT,                  -- JSON array
    CachedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API key usage tracking for rotation
CREATE TABLE ApiKeyUsage (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Provider TEXT NOT NULL,          -- "tmdb", "omdb"
    KeyIndex INTEGER NOT NULL,       -- Which key in rotation
    UsageDate DATE NOT NULL,
    RequestCount INTEGER DEFAULT 0,
    LastUsedAt DATETIME,
    UNIQUE(Provider, KeyIndex, UsageDate)
);

CREATE INDEX IdxMoviesImdb ON Movies(ImdbId);
CREATE INDEX IdxMoviesTitle ON Movies(Title);
CREATE INDEX IdxTvshowsImdb ON TvShows(ImdbId);
CREATE INDEX IdxTvshowsTitle ON TvShows(Title);
CREATE INDEX IdxApikeyUsage ON ApiKeyUsage(Provider, UsageDate);
```

### Search Registry DB (`data/movies/search.db`)

```sql
-- Search history and results cache
CREATE TABLE MovieSearches (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Query TEXT NOT NULL,
    NormalizedQuery TEXT NOT NULL,
    ContentType TEXT,                -- "movie", "tv", "both"
    Year INTEGER,
    Season INTEGER,
    Episode INTEGER,
    ResultCount INTEGER,
    ResultImdbIds TEXT,              -- JSON array of IMDB IDs
    SearchedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(NormalizedQuery, ContentType, Year)
);

-- Batch processing history
CREATE TABLE BatchJobs (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    JobId TEXT UNIQUE NOT NULL,
    FolderPath TEXT,
    FolderDbPath TEXT,               -- Path to folder-specific DB
    TotalFiles INTEGER,
    ProcessedFiles INTEGER,
    SuccessCount INTEGER,
    FailedCount INTEGER,
    Status TEXT,                     -- "pending", "running", "completed", "failed"
    StartedAt DATETIME,
    CompletedAt DATETIME,
    ErrorLog TEXT                    -- JSON array of errors
);

CREATE INDEX IdxSearchesQuery ON MovieSearches(NormalizedQuery);
CREATE INDEX IdxBatchjobsStatus ON BatchJobs(Status);
```

### TV Episodes DB (`data/movies/tv-episodes.db`)

```sql
-- Season metadata (all shows)
CREATE TABLE Seasons (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    TvShowImdbId TEXT NOT NULL,      -- FK to TvShows in movies-and-tv.db
    TmdbId INTEGER,
    SeasonNumber INTEGER NOT NULL,
    Name TEXT,
    Overview TEXT,
    PosterUrl TEXT,
    AirDate TEXT,
    EpisodeCount INTEGER,
    CachedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(TvShowImdbId, SeasonNumber)
);

-- Episode metadata (all shows)
CREATE TABLE Episodes (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    TvShowImdbId TEXT NOT NULL,      -- FK to TvShows in movies-and-tv.db
    SeasonId INTEGER NOT NULL,
    ImdbId TEXT,
    TmdbId INTEGER,
    SeasonNumber INTEGER NOT NULL,
    EpisodeNumber INTEGER NOT NULL,
    Title TEXT,
    AirDate TEXT,
    Runtime INTEGER,
    Overview TEXT,
    StillUrl TEXT,
    Rating REAL,
    VoteCount INTEGER,
    Director TEXT,
    Writers TEXT,                    -- JSON array
    GuestStars TEXT,                 -- JSON array
    CachedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SeasonId) REFERENCES Seasons(Id),
    UNIQUE(TvShowImdbId, SeasonNumber, EpisodeNumber)
);

CREATE INDEX IdxSeasonsShow ON Seasons(TvShowImdbId);
CREATE INDEX IdxEpisodesShow ON Episodes(TvShowImdbId);
CREATE INDEX IdxEpisodesSeason ON Episodes(SeasonNumber, EpisodeNumber);
```

### Folder Batch Cache DB (`data/movies/folder-batch-cache.db`)

```sql
-- Files processed from all folder batch scans
CREATE TABLE BatchResults (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    BatchJobId TEXT NOT NULL,            -- FK to BatchJobs in search.db
    FolderPath TEXT NOT NULL,            -- Source folder path
    OriginalFilename TEXT NOT NULL,
    NormalizedTitle TEXT,
    ContentType TEXT,                    -- "movie", "tv", "unknown"
    ImdbId TEXT,                         -- Matched IMDB ID (if found)
    TmdbId INTEGER,
    Year INTEGER,
    Season INTEGER,
    Episode INTEGER,
    MatchConfidence REAL,                -- 0.0-1.0
    MatchStatus TEXT,                    -- "matched", "not_found", "ambiguous", "error"
    ErrorMessage TEXT,
    ProcessedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxBatchJob ON BatchResults(BatchJobId);
CREATE INDEX IdxBatchFolder ON BatchResults(FolderPath);
CREATE INDEX IdxBatchStatus ON BatchResults(MatchStatus);
CREATE INDEX IdxBatchImdb ON BatchResults(ImdbId);
```

### Path Helper Functions

```go
package paths

const (
    // Root level databases
    GSearchRootDb      = "data/gsearch.db"
    MoviesAndTvDb      = "data/movies-and-tv.db"
    
    // Movies folder databases
    MovieSearchDb      = "data/movies/search.db"
    TvEpisodesDb       = "data/movies/tv-episodes.db"
    FolderBatchCacheDb = "data/movies/folder-batch-cache.db"
)
```

---

## API Endpoints

### Endpoint Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/movies/search` | Search movies/TV shows |
| GET | `/api/v1/movies/{id}` | Get movie details by ID |
| GET | `/api/v1/movies/imdb/{imdbId}` | Get by IMDB ID |
| GET | `/api/v1/tv/search` | Search TV shows only |
| GET | `/api/v1/tv/{id}` | Get TV show details |
| GET | `/api/v1/tv/{id}/season/{season}` | Get season details |
| GET | `/api/v1/tv/{id}/season/{season}/episode/{episode}` | Get episode |
| POST | `/api/v1/movies/normalize` | Normalize filenames |
| POST | `/api/v1/movies/batch` | Batch search from folder |
| GET | `/api/v1/movies/batch/{jobId}` | Get batch job status |
| DELETE | `/api/v1/movies/cache` | Clear movie cache |

### 1. Search Movies/TV

**GET** `/api/v1/movies/search`

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | required | Search query or filename |
| `type` | string | `both` | `movie`, `tv`, or `both` |
| `year` | int | - | Filter by year |
| `normalize` | bool | `true` | Auto-normalize filename |
| `limit` | int | 10 | Max results |

#### Response

```json
{
  "Success": true,
  "Query": "Fallout.2024.S02E03.1080p",
  "Normalized": {
    "OriginalFilename": "Fallout.2024.S02E03.1080p",
    "NormalizedTitle": "Fallout",
    "SearchQuery": "Fallout 2024 S02E03",
    "Year": 2024,
    "ContentType": "tv",
    "Season": 2,
    "Episode": 3,
    "DisplayFormat": "Fallout 2024 S02E03",
    "Confidence": 0.95
  },
  "Results": [
    {
      "Type": "tv",
      "TmdbId": 106379,
      "ImdbId": "tt12637874",
      "Title": "Fallout",
      "Year": 2024,
      "Overview": "In a future, post-apocalyptic Los Angeles...",
      "PosterUrl": "https://image.tmdb.org/...",
      "Rating": 8.4,
      "SeasonCount": 2,
      "EpisodeCount": 16,
      "Match": {
        "Season": 2,
        "Episode": 3,
        "EpisodeTitle": "The Head",
        "AirDate": "2025-04-10"
      }
    }
  ],
  "Source": "tmdb",
  "Cached": false,
  "SearchedAt": "2026-02-03T10:00:00Z"
}
```

### 2. Normalize Filename

**POST** `/api/v1/movies/normalize`

#### Request Body

```json
{
  "Filenames": [
    "Fallout.2024.S02E03.1080p.x265-ELiTE",
    "Fuga.S01.ITA.ENG.1080p.NFRip.AAC.x265-Pir8",
    "The.Batman.2022.1080p.BluRay.x264-GROUP"
  ]
}
```

#### Response

```json
{
  "Success": true,
  "Results": [
    {
      "OriginalFilename": "Fallout.2024.S02E03.1080p.x265-ELiTE",
      "NormalizedTitle": "Fallout",
      "SearchQuery": "Fallout",
      "DisplayFormat": "Fallout 2024 S02E03",
      "Year": 2024,
      "ContentType": "tv",
      "Season": 2,
      "Episode": 3,
      "Confidence": 0.95
    },
    {
      "OriginalFilename": "Fuga.S01.ITA.ENG.1080p.NFRip.AAC.x265-Pir8",
      "NormalizedTitle": "Fuga",
      "SearchQuery": "Fuga",
      "DisplayFormat": "Fuga Season 01",
      "ContentType": "tv",
      "Season": 1,
      "Confidence": 0.90
    },
    {
      "OriginalFilename": "The.Batman.2022.1080p.BluRay.x264-GROUP",
      "NormalizedTitle": "The Batman",
      "SearchQuery": "The Batman",
      "DisplayFormat": "The Batman 2022",
      "Year": 2022,
      "ContentType": "movie",
      "Confidence": 0.92
    }
  ]
}
```

### 3. Batch Search

**POST** `/api/v1/movies/batch`

Process multiple files or folders with parallel execution and rate limiting.

#### Request Body

```json
{
  "FolderPath": "/media/downloads/movies",
  "Filenames": [
    "file1.mkv",
    "file2.mkv"
  ],
  "Recursive": true,
  "FileExtensions": [".mkv", ".mp4", ".avi"],
  "Workers": 4,
  "RateLimit": {
    "RequestsPerSecond": 3,
    "BurstSize": 5
  },
  "UpdateDb": true
}
```

> **Note:** Either `FolderPath` or `Filenames` is required.

#### Response

```json
{
  "Success": true,
  "JobId": "batch-abc123",
  "Status": "running",
  "TotalFiles": 150,
  "ProcessedFiles": 0,
  "Message": "Batch job started. Poll /api/v1/movies/batch/batch-abc123 for status."
}
```

### 4. Batch Job Status

**GET** `/api/v1/movies/batch/{jobId}`

#### Response

```json
{
  "Success": true,
  "JobId": "batch-abc123",
  "Status": "running",
  "TotalFiles": 150,
  "ProcessedFiles": 75,
  "SuccessCount": 72,
  "FailedCount": 3,
  "Progress": 50.0,
  "EstimatedTimeRemaining": "2m 30s",
  "Errors": [
    {
      "Filename": "unknown.file.mkv",
      "Error": "Could not parse filename"
    }
  ]
}
```

---

## CLI Commands

### Command Structure

```
gsearch movie [command] [flags]

Commands:
  search      Search for movie or TV show
  normalize   Normalize filename(s)
  batch       Batch process folder
  info        Get details by ID
  cache       Manage cache

Flags:
  -q, --query string      Search query or filename
  -t, --type string       Content type: movie, tv, both (default "both")
  -y, --year int          Filter by year
  -n, --normalize         Auto-normalize filename (default true)
  -f, --format string     Output format: json, table, text (default "table")
  -o, --output string     Output file path
      --no-cache          Skip cache lookup
      --force             Force refresh cache
```

### Examples

```bash
# Search by normalized filename
gsearch movie search -q "Fallout.2024.S02E03.1080p.x265-ELiTE"

# Search TV show only
gsearch movie search -q "Fuga" -t tv

# Normalize without searching
gsearch movie normalize -q "The.Batman.2022.1080p.BluRay"

# Batch process folder
gsearch movie batch --folder "/media/movies" --workers 4 --rate-limit 3

# Get details by IMDB ID
gsearch movie info --imdb "tt12637874"

# Clear cache
gsearch movie cache clear

# Export cache to JSON
gsearch movie cache export -o movies-cache.json
```

---

## Configuration

### Seedable Settings

**File:** `config.seed.movie.json`

```json
{
  "Movie": {
    "DefaultSource": "tmdb",
    "FallbackSources": ["omdb", "imdb-scrape"],
    "CacheTtlDays": 30,
    "SearchCacheTtlDays": 7,
    "AutoNormalize": true,
    "BatchWorkers": 4,
    "RateLimitPerSecond": 3,
    "RateLimitBurst": 5,
    "IncludeImages": true,
    "IncludeCast": true,
    "MaxCastMembers": 10,
    "PreferredLanguage": "en",
    "FallbackLanguages": ["en", "original"]
  }
}
```

### API Keys

| Service | Environment Variable | Required |
|---------|---------------------|----------|
| TMDB | `TMDB_API_KEY` | Yes (free) |
| OMDB | `OMDB_API_KEY` | Optional (free tier available) |

---

## Caching Strategy

### Cache TTL

| Data Type | Default TTL | Configurable |
|-----------|-------------|--------------|
| Movie metadata | 30 days | Yes |
| TV show metadata | 30 days | Yes |
| Episode metadata | 30 days | Yes |
| Search results | 7 days | Yes |
| Normalized queries | Permanent | No |

### Cache Behavior

```
Query → Check Cache
          ↓
      [Cache Hit] → Return cached data (if not expired)
          ↓
      [Cache Miss or Expired] → API Request → Update Cache → Return
```

### Force Refresh

Use `--force` flag or `Force: true` in API request to bypass cache.

---

## Rate Limiting

### Default Limits

| Source | Limit | Window |
|--------|-------|--------|
| TMDB | 40 requests | 10 seconds |
| OMDB | 1000 requests | 24 hours |
| IMDB Scrape | 1 request | 2 seconds |

### Batch Processing

For batch operations, a token bucket rate limiter ensures compliance:

```go
type RateLimiter struct {
    RequestsPerSecond float64
    BurstSize         int
    TokenBucket       *rate.Limiter
}

// Default for batch: 3 req/s with burst of 5
limiter := NewRateLimiter(3, 5)
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 7600 | MovieSearchFailed | Search API request failed |
| 7601 | MovieNotFound | No results for query |
| 7602 | NormalizationFailed | Could not parse filename |
| 7603 | InvalidContentType | Unknown content type |
| 7604 | ApiKeyMissing | Required API key not configured |
| 7605 | ApiRateLimited | Rate limit exceeded |
| 7606 | BatchJobNotFound | Batch job ID not found |
| 7607 | BatchJobFailed | Batch processing failed |
| 7608 | CacheWriteFailed | Could not update cache |
| 7609 | InvalidImdbId | Invalid IMDB ID format |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Split DB Architecture | `02-spec/06-split-db-architecture/00-overview.md` |
| Caching System | `10-caching-system.md` |
| Error Codes | `15-error-codes.md` |
| CLI Framework | `01-cli-framework.md` |
| Settings Service | `21-settings-service.md` |
| URL Extraction | `04-html-parser.md` |

---

*GSearch Movie Search provides intelligent media file identification and metadata retrieval with robust caching and batch processing capabilities.*
