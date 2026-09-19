# AI Transcribe CLI: Enum Architecture

**Version:** 4.0.0  
**Updated:** 2026-03-09  
**Standard:** `02-spec/02-coding-guidelines/03-golang/01-enum-specification/ v3.0.0`

---

## Overview

All type-differentiating values in AI Transcribe CLI use the `type Variant byte` pattern with `iota`. Each enum resides in its own package under `internal/enums/` with a `type` suffix and no underscores. The zero value is always `Invalid`. Single `variantLabels` table with PascalCase values, `Label()` delegates to `String()`, `Parse()` uses `strings.EqualFold()`.

---

## Directory Structure

```
internal/enums/
├── sttprovidertype/variant.go
├── ttsprovidertype/variant.go
├── audioformattype/variant.go
├── modeltype/variant.go
├── modelstatustype/variant.go
├── healthstatustype/variant.go
├── sessionstatetype/variant.go
├── sessiontype/variant.go
├── sessionstatustype/variant.go
├── sourcetype/variant.go
├── audioeventtype/variant.go
├── voicegendertype/variant.go
├── commandtype/variant.go
├── executionresulttype/variant.go
├── controlactiontype/variant.go
├── logleveltype/variant.go
├── logformattype/variant.go
├── whispermodelsizetype/variant.go
├── computedevicetype/variant.go
├── vadprovidertype/variant.go
├── quotatype/variant.go
├── usageoperationtype/variant.go
├── commitstrategytype/variant.go
├── trainingtiertype/variant.go
└── registry.go
```

---

## Enum Definitions

Each enum follows the v3.0.0 single-table PascalCase `variantLabels` pattern. `Label()` delegates to `String()`, `Parse()` uses `strings.EqualFold()`.

---

### 1. sttprovidertype.Variant

```go
package sttprovidertype

type Variant byte

const (
	Invalid      Variant = iota
	WhisperLocal
	OpenaiWhisper
	ElevenScribe
)

var variantLabels = [...]string{Invalid: "Invalid", WhisperLocal: "WhisperLocal", OpenaiWhisper: "OpenaiWhisper", ElevenScribe: "ElevenScribe"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool      { return v == Invalid }
func (v Variant) IsWhisperLocal() bool  { return v == WhisperLocal }
func (v Variant) IsOpenaiWhisper() bool { return v == OpenaiWhisper }
func (v Variant) IsElevenScribe() bool  { return v == ElevenScribe }

func All() []Variant { return []Variant{WhisperLocal, OpenaiWhisper, ElevenScribe} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid stt provider").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}

// IsLocal returns true for locally-hosted providers
func (v Variant) IsLocal() bool { return v == WhisperLocal }
// RequiresApiKey returns true if provider needs API key
func (v Variant) RequiresApiKey() bool { return v == OpenaiWhisper || v == ElevenScribe }
```

---

### 2. ttsprovidertype.Variant

```go
package ttsprovidertype

type Variant byte

const (
	Invalid    Variant = iota
	XttsLocal
	ElevenLabs
	AzureSpeech
)

var variantLabels = [...]string{Invalid: "Invalid", XttsLocal: "XttsLocal", ElevenLabs: "ElevenLabs", AzureSpeech: "AzureSpeech"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool     { return v == Invalid }
func (v Variant) IsXttsLocal() bool   { return v == XttsLocal }
func (v Variant) IsElevenLabs() bool  { return v == ElevenLabs }
func (v Variant) IsAzureSpeech() bool { return v == AzureSpeech }

func All() []Variant { return []Variant{XttsLocal, ElevenLabs, AzureSpeech} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid tts provider").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}

// IsLocal returns true for locally-hosted providers
func (v Variant) IsLocal() bool { return v == XttsLocal }
// SupportsCloning returns true if provider supports voice cloning
func (v Variant) SupportsCloning() bool { return v == XttsLocal || v == ElevenLabs }
```

---

### 3. audioformattype.Variant

```go
package audioformattype

type Variant byte

const (
	Invalid Variant = iota
	Wav; Mp3; Ogg; Flac; Pcm
)

var variantLabels = [...]string{Invalid: "Invalid", Wav: "Wav", Mp3: "Mp3", Ogg: "Ogg", Flac: "Flac", Pcm: "Pcm"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsWav() bool     { return v == Wav }
func (v Variant) IsMp3() bool     { return v == Mp3 }
func (v Variant) IsOgg() bool     { return v == Ogg }
func (v Variant) IsFlac() bool    { return v == Flac }
func (v Variant) IsPcm() bool     { return v == Pcm }

func All() []Variant { return []Variant{Wav, Mp3, Ogg, Flac, Pcm} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid audio format").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}

// MimeType returns the MIME type for this format
func (v Variant) MimeType() string {
	switch v {
	case Wav: return "audio/wav"
	case Mp3: return "audio/mpeg"
	case Ogg: return "audio/ogg"
	case Flac: return "audio/flac"
	case Pcm: return "audio/pcm"
	default: return "application/octet-stream"
	}
}
// FileExtension returns file extension
func (v Variant) FileExtension() string {
	switch v {
	case Wav: return ".wav"
	case Mp3: return ".mp3"
	case Ogg: return ".ogg"
	case Flac: return ".flac"
	case Pcm: return ".pcm"
	default: return ""
	}
}
```

---

### 4. modeltype.Variant

```go
package modeltype

type Variant byte

const (Invalid Variant = iota; Stt; Tts)

var variantLabels = [...]string{Invalid: "Invalid", Stt: "Stt", Tts: "Tts"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsStt() bool     { return v == Stt }
func (v Variant) IsTts() bool     { return v == Tts }

func All() []Variant { return []Variant{Stt, Tts} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid model type").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}
```

---

### 5. modelstatustype.Variant

```go
package modelstatustype

type Variant byte

const (Invalid Variant = iota; Downloading; Ready; Loading; Loaded; Error)

var variantLabels = [...]string{Invalid: "Invalid", Downloading: "Downloading", Ready: "Ready", Loading: "Loading", Loaded: "Loaded", Error: "Error"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool     { return v == Invalid }
func (v Variant) IsDownloading() bool { return v == Downloading }
func (v Variant) IsReady() bool       { return v == Ready }
func (v Variant) IsLoading() bool     { return v == Loading }
func (v Variant) IsLoaded() bool      { return v == Loaded }
func (v Variant) IsError() bool       { return v == Error }

func All() []Variant { return []Variant{Downloading, Ready, Loading, Loaded, Error} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid model status").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}

// IsUsable returns true if model can handle requests
func (v Variant) IsUsable() bool { return v == Loaded }
```

---

### 6. healthstatustype.Variant

```go
package healthstatustype

type Variant byte

const (Invalid Variant = iota; Healthy; Degraded; Unhealthy)

var variantLabels = [...]string{Invalid: "Invalid", Healthy: "Healthy", Degraded: "Degraded", Unhealthy: "Unhealthy"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool   { return v == Invalid }
func (v Variant) IsHealthy() bool   { return v == Healthy }
func (v Variant) IsDegraded() bool  { return v == Degraded }
func (v Variant) IsUnhealthy() bool { return v == Unhealthy }

func All() []Variant { return []Variant{Healthy, Degraded, Unhealthy} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid health status").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}
```

---

### 7. sessionstatetype.Variant

```go
package sessionstatetype

type Variant byte

const (Invalid Variant = iota; Idle; Listening; Processing; Speaking)

var variantLabels = [...]string{Invalid: "Invalid", Idle: "Idle", Listening: "Listening", Processing: "Processing", Speaking: "Speaking"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool    { return v == Invalid }
func (v Variant) IsIdle() bool       { return v == Idle }
func (v Variant) IsListening() bool  { return v == Listening }
func (v Variant) IsProcessing() bool { return v == Processing }
func (v Variant) IsSpeaking() bool   { return v == Speaking }

func All() []Variant { return []Variant{Idle, Listening, Processing, Speaking} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid session state").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}

// IsActive returns true if session is actively processing audio
func (v Variant) IsActive() bool { return v == Listening || v == Processing || v == Speaking }
```

---

### 8. sessiontype.Variant

```go
package sessiontype

type Variant byte

const (Invalid Variant = iota; Transcribe; Synthesize; Realtime)

var variantLabels = [...]string{Invalid: "Invalid", Transcribe: "Transcribe", Synthesize: "Synthesize", Realtime: "Realtime"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool    { return v == Invalid }
func (v Variant) IsTranscribe() bool { return v == Transcribe }
func (v Variant) IsSynthesize() bool { return v == Synthesize }
func (v Variant) IsRealtime() bool   { return v == Realtime }

func All() []Variant { return []Variant{Transcribe, Synthesize, Realtime} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid session type").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}

// RequiresWebSocket returns true if session type needs WebSocket
func (v Variant) RequiresWebSocket() bool { return v == Realtime }
```

---

### 9. sessionstatustype.Variant

```go
package sessionstatustype

type Variant byte

const (Invalid Variant = iota; Active; Closed; Error)

var variantLabels = [...]string{Invalid: "Invalid", Active: "Active", Closed: "Closed", Error: "Error"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsActive() bool  { return v == Active }
func (v Variant) IsClosed() bool  { return v == Closed }
func (v Variant) IsError() bool   { return v == Error }

func All() []Variant { return []Variant{Active, Closed, Error} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid session status").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}
```

---

### 10. sourcetype.Variant

```go
package sourcetype

type Variant byte

const (Invalid Variant = iota; File; Stream; Url)

var variantLabels = [...]string{Invalid: "Invalid", File: "File", Stream: "Stream", Url: "Url"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsFile() bool    { return v == File }
func (v Variant) IsStream() bool  { return v == Stream }
func (v Variant) IsUrl() bool     { return v == Url }

func All() []Variant { return []Variant{File, Stream, Url} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid source type").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}
```

---

### 11. audioeventtype.Variant

```go
package audioeventtype

type Variant byte

const (Invalid Variant = iota; SpeechStart; SpeechEnd; Transcription; Error)

var variantLabels = [...]string{Invalid: "Invalid", SpeechStart: "SpeechStart", SpeechEnd: "SpeechEnd", Transcription: "Transcription", Error: "Error"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool       { return v == Invalid }
func (v Variant) IsSpeechStart() bool   { return v == SpeechStart }
func (v Variant) IsSpeechEnd() bool     { return v == SpeechEnd }
func (v Variant) IsTranscription() bool { return v == Transcription }
func (v Variant) IsError() bool         { return v == Error }

func All() []Variant { return []Variant{SpeechStart, SpeechEnd, Transcription, Error} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid audio event type").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}
```

---

### 12. voicegendertype.Variant

```go
package voicegendertype

type Variant byte

const (Invalid Variant = iota; Male; Female; Neutral)

var variantLabels = [...]string{Invalid: "Invalid", Male: "Male", Female: "Female", Neutral: "Neutral"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsMale() bool    { return v == Male }
func (v Variant) IsFemale() bool  { return v == Female }
func (v Variant) IsNeutral() bool { return v == Neutral }

func All() []Variant { return []Variant{Male, Female, Neutral} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid voice gender").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}
```

---

### 13. commandtype.Variant

```go
package commandtype

type Variant byte

const (Invalid Variant = iota; Transcribe; Synthesize; ListModels; ModelInfo; Health)

var variantLabels = [...]string{Invalid: "Invalid", Transcribe: "Transcribe", Synthesize: "Synthesize", ListModels: "ListModels", ModelInfo: "ModelInfo", Health: "Health"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool    { return v == Invalid }
func (v Variant) IsTranscribe() bool { return v == Transcribe }
func (v Variant) IsSynthesize() bool { return v == Synthesize }
func (v Variant) IsListModels() bool { return v == ListModels }
func (v Variant) IsModelInfo() bool  { return v == ModelInfo }
func (v Variant) IsHealth() bool     { return v == Health }

func All() []Variant { return []Variant{Transcribe, Synthesize, ListModels, ModelInfo, Health} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid command type").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}
```

---

### 14. executionresulttype.Variant

```go
package executionresulttype

type Variant byte

const (Invalid Variant = iota; Success; Failure; Timeout)

var variantLabels = [...]string{Invalid: "Invalid", Success: "Success", Failure: "Failure", Timeout: "Timeout"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsSuccess() bool { return v == Success }
func (v Variant) IsFailure() bool { return v == Failure }
func (v Variant) IsTimeout() bool { return v == Timeout }

func All() []Variant { return []Variant{Success, Failure, Timeout} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid execution result").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}

// ShouldRetry returns true if operation should be retried
func (v Variant) ShouldRetry() bool { return v == Timeout }
```

---

### 15. controlactiontype.Variant

```go
package controlactiontype

type Variant byte

const (Invalid Variant = iota; Pause; Resume; Stop; Restart)

var variantLabels = [...]string{Invalid: "Invalid", Pause: "Pause", Resume: "Resume", Stop: "Stop", Restart: "Restart"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsPause() bool   { return v == Pause }
func (v Variant) IsResume() bool  { return v == Resume }
func (v Variant) IsStop() bool    { return v == Stop }
func (v Variant) IsRestart() bool { return v == Restart }

func All() []Variant { return []Variant{Pause, Resume, Stop, Restart} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid control action").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}
```

---

### 16. logleveltype.Variant

```go
package logleveltype

type Variant byte

const (Invalid Variant = iota; Debug; Info; Warn; Error)

var variantLabels = [...]string{Invalid: "Invalid", Debug: "Debug", Info: "Info", Warn: "Warn", Error: "Error"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsDebug() bool   { return v == Debug }
func (v Variant) IsInfo() bool    { return v == Info }
func (v Variant) IsWarn() bool    { return v == Warn }
func (v Variant) IsError() bool   { return v == Error }

func All() []Variant { return []Variant{Debug, Info, Warn, Error} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid log level").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}
```

---

### 17. logformattype.Variant

```go
package logformattype

type Variant byte

const (Invalid Variant = iota; Json; Text)

var variantLabels = [...]string{Invalid: "Invalid", Json: "Json", Text: "Text"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsJson() bool    { return v == Json }
func (v Variant) IsText() bool    { return v == Text }

func All() []Variant { return []Variant{Json, Text} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid log format").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}
```

---

### 18. whispermodelsizetype.Variant

```go
package whispermodelsizetype

type Variant byte

const (Invalid Variant = iota; Tiny; Base; Small; Medium; Large)

var variantLabels = [...]string{Invalid: "Invalid", Tiny: "Tiny", Base: "Base", Small: "Small", Medium: "Medium", Large: "Large"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsTiny() bool    { return v == Tiny }
func (v Variant) IsBase() bool    { return v == Base }
func (v Variant) IsSmall() bool   { return v == Small }
func (v Variant) IsMedium() bool  { return v == Medium }
func (v Variant) IsLarge() bool   { return v == Large }

func All() []Variant { return []Variant{Tiny, Base, Small, Medium, Large} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid whisper model size").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}

// EstimatedVramGb returns approximate VRAM requirement
func (v Variant) EstimatedVramGb() int {
	switch v {
	case Tiny, Base: return 1
	case Small: return 2
	case Medium: return 5
	case Large: return 10
	default: return 0
	}
}
```

---

### 19. computedevicetype.Variant

```go
package computedevicetype

type Variant byte

const (Invalid Variant = iota; Cpu; Cuda; Metal; Auto)

var variantLabels = [...]string{Invalid: "Invalid", Cpu: "Cpu", Cuda: "Cuda", Metal: "Metal", Auto: "Auto"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsCpu() bool     { return v == Cpu }
func (v Variant) IsCuda() bool    { return v == Cuda }
func (v Variant) IsMetal() bool   { return v == Metal }
func (v Variant) IsAuto() bool    { return v == Auto }

func All() []Variant { return []Variant{Cpu, Cuda, Metal, Auto} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid compute device").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}

// IsGpu returns true for GPU-accelerated devices
func (v Variant) IsGpu() bool { return v == Cuda || v == Metal }
```

---

### 20. vadprovidertype.Variant

```go
package vadprovidertype

type Variant byte

const (Invalid Variant = iota; Silero; Webrtc; Energy)

var variantLabels = [...]string{Invalid: "Invalid", Silero: "Silero", Webrtc: "Webrtc", Energy: "Energy"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsSilero() bool  { return v == Silero }
func (v Variant) IsWebrtc() bool  { return v == Webrtc }
func (v Variant) IsEnergy() bool  { return v == Energy }

func All() []Variant { return []Variant{Silero, Webrtc, Energy} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid vad provider").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}

// RequiresModel returns true if VAD needs a model file
func (v Variant) RequiresModel() bool { return v == Silero }
```

---

### 21. quotatype.Variant

```go
package quotatype

type Variant byte

const (Invalid Variant = iota; Characters; Minutes; Requests)

var variantLabels = [...]string{Invalid: "Invalid", Characters: "Characters", Minutes: "Minutes", Requests: "Requests"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool    { return v == Invalid }
func (v Variant) IsCharacters() bool { return v == Characters }
func (v Variant) IsMinutes() bool    { return v == Minutes }
func (v Variant) IsRequests() bool   { return v == Requests }

func All() []Variant { return []Variant{Characters, Minutes, Requests} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid quota type").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}
```

---

### 22. usageoperationtype.Variant

```go
package usageoperationtype

type Variant byte

const (Invalid Variant = iota; Transcribe; Synthesize; Clone)

var variantLabels = [...]string{Invalid: "Invalid", Transcribe: "Transcribe", Synthesize: "Synthesize", Clone: "Clone"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool    { return v == Invalid }
func (v Variant) IsTranscribe() bool { return v == Transcribe }
func (v Variant) IsSynthesize() bool { return v == Synthesize }
func (v Variant) IsClone() bool      { return v == Clone }

func All() []Variant { return []Variant{Transcribe, Synthesize, Clone} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid usage operation").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}
```

---

### 23. commitstrategytype.Variant

```go
package commitstrategytype

type Variant byte

const (Invalid Variant = iota; Vad; Manual)

var variantLabels = [...]string{Invalid: "Invalid", Vad: "Vad", Manual: "Manual"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsVad() bool     { return v == Vad }
func (v Variant) IsManual() bool  { return v == Manual }

func All() []Variant { return []Variant{Vad, Manual} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid commit strategy").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}
```

---

### 24. trainingtiertype.Variant

```go
package trainingtiertype

type Variant byte

const (Invalid Variant = iota; Basic; Standard; Premium)

var variantLabels = [...]string{Invalid: "Invalid", Basic: "Basic", Standard: "Standard", Premium: "Premium"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool  { return v == Invalid }
func (v Variant) IsBasic() bool    { return v == Basic }
func (v Variant) IsStandard() bool { return v == Standard }
func (v Variant) IsPremium() bool  { return v == Premium }

func All() []Variant { return []Variant{Basic, Standard, Premium} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { trimmed := strings.TrimSpace(s); for i, str := range variantLabels { if strings.EqualFold(str, trimmed) { return appfault.Ok(Variant(i)) } }; return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, "invalid training tier").WithContext("value", s)) }
func Values() []string {
	result := make([]string, 0, len(variantLabels)-1)
	for _, s := range variantLabels[1:] {
		result = append(result, s)
	}

	return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	p, err := Parse(s)
	if err != nil {
		return err
	}

	*v = p

	return nil
}

// MinSamples returns minimum audio samples required
func (v Variant) MinSamples() int {
	switch v {
	case Basic: return 1
	case Standard: return 5
	case Premium: return 20
	default: return 0
	}
}
```

---

## Central Registry

```go
// internal/enums/registry.go
package enums

import (
	"internal/enums/sttprovidertype"
	"internal/enums/ttsprovidertype"
	"internal/enums/audioformattype"
	"internal/enums/modeltype"
	"internal/enums/modelstatustype"
	"internal/enums/healthstatustype"
	"internal/enums/sessionstatetype"
	"internal/enums/sessiontype"
	"internal/enums/sessionstatustype"
	"internal/enums/sourcetype"
	"internal/enums/audioeventtype"
	"internal/enums/voicegendertype"
	"internal/enums/commandtype"
	"internal/enums/executionresulttype"
	"internal/enums/controlactiontype"
	"internal/enums/logleveltype"
	"internal/enums/logformattype"
	"internal/enums/whispermodelsizetype"
	"internal/enums/computedevicetype"
	"internal/enums/vadprovidertype"
	"internal/enums/quotatype"
	"internal/enums/usageoperationtype"
	"internal/enums/commitstrategytype"
	"internal/enums/trainingtiertype"
)

// EnumInfo describes a registered enum
type EnumInfo struct {
	Package  string
	Name     string
	Count    int
	Values   []string
}

// Registry returns all registered enums
func Registry() []EnumInfo {
	return []EnumInfo{
		{Package: "sttprovidertype", Name: "STT Provider", Count: len(sttprovidertype.All()), Values: sttprovidertype.Values()},
		{Package: "ttsprovidertype", Name: "TTS Provider", Count: len(ttsprovidertype.All()), Values: ttsprovidertype.Values()},
		{Package: "audioformattype", Name: "Audio Format", Count: len(audioformattype.All()), Values: audioformattype.Values()},
		{Package: "modeltype", Name: "Model Type", Count: len(modeltype.All()), Values: modeltype.Values()},
		{Package: "modelstatustype", Name: "Model Status", Count: len(modelstatustype.All()), Values: modelstatustype.Values()},
		{Package: "healthstatustype", Name: "Health Status", Count: len(healthstatustype.All()), Values: healthstatustype.Values()},
		{Package: "sessionstatetype", Name: "Session State", Count: len(sessionstatetype.All()), Values: sessionstatetype.Values()},
		{Package: "sessiontype", Name: "Session Type", Count: len(sessiontype.All()), Values: sessiontype.Values()},
		{Package: "sessionstatustype", Name: "Session Status", Count: len(sessionstatustype.All()), Values: sessionstatustype.Values()},
		{Package: "sourcetype", Name: "Source Type", Count: len(sourcetype.All()), Values: sourcetype.Values()},
		{Package: "audioeventtype", Name: "Audio Event Type", Count: len(audioeventtype.All()), Values: audioeventtype.Values()},
		{Package: "voicegendertype", Name: "Voice Gender", Count: len(voicegendertype.All()), Values: voicegendertype.Values()},
		{Package: "commandtype", Name: "Command Type", Count: len(commandtype.All()), Values: commandtype.Values()},
		{Package: "executionresulttype", Name: "Execution Result", Count: len(executionresulttype.All()), Values: executionresulttype.Values()},
		{Package: "controlactiontype", Name: "Control Action", Count: len(controlactiontype.All()), Values: controlactiontype.Values()},
		{Package: "logleveltype", Name: "Log Level", Count: len(logleveltype.All()), Values: logleveltype.Values()},
		{Package: "logformattype", Name: "Log Format", Count: len(logformattype.All()), Values: logformattype.Values()},
		{Package: "whispermodelsizetype", Name: "Whisper Model Size", Count: len(whispermodelsizetype.All()), Values: whispermodelsizetype.Values()},
		{Package: "computedevicetype", Name: "Compute Device", Count: len(computedevicetype.All()), Values: computedevicetype.Values()},
		{Package: "vadprovidertype", Name: "VAD Provider", Count: len(vadprovidertype.All()), Values: vadprovidertype.Values()},
		{Package: "quotatype", Name: "Quota Type", Count: len(quotatype.All()), Values: quotatype.Values()},
		{Package: "usageoperationtype", Name: "Usage Operation", Count: len(usageoperationtype.All()), Values: usageoperationtype.Values()},
		{Package: "commitstrategytype", Name: "Commit Strategy", Count: len(commitstrategytype.All()), Values: commitstrategytype.Values()},
		{Package: "trainingtiertype", Name: "Training Tier", Count: len(trainingtiertype.All()), Values: trainingtiertype.Values()},
	}
}
```

---

## Cross-References

| Resource | Location |
|----------|----------|
| Enum Specification | `02-spec/02-coding-guidelines/03-golang/01-enum-specification/` |
| Backend Overview | `02-spec/31-ai-transcribe-cli/01-backend/01-overview.md` |
| STT Service | `02-spec/31-ai-transcribe-cli/01-backend/02-stt-service.md` |
| TTS Service | `02-spec/31-ai-transcribe-cli/01-backend/03-tts-service.md` |

---

*AI Transcribe CLI enum architecture v3.0.0 — 24 compliant enums following 02-spec/02-coding-guidelines/03-golang/01-enum-specification/.*
