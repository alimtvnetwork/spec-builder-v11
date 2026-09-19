# WP SEO Publish CLI: Connection Wizard

**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Overview

The Connection Wizard provides a step-by-step flow for connecting WordPress sites using Application Password authentication.

---

## Wizard Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CONNECTION WIZARD FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   Step 1: Site URL          Step 2: Generate       Step 3: Enter          Step 4:  │
│   ─────────────────         ─────────────────      ─────────────          ───────  │
│   Enter WordPress URL       Open WP admin to       Paste Application      Verify   │
│   and validate REST API     generate password      Password here          Success  │
│                                                                                      │
│   [example.com    ]         [Open WP Admin ↗]      [xxxx xxxx xxxx]       ✓ Done   │
│                                                                                      │
│   ✓ REST API detected       Instructions shown     Username auto-filled            │
│   ✓ WP version: 6.4                                                                 │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Step Components

### Step 1: Site URL Entry

```tsx
interface SiteUrlStepProps {
  onValidated: (siteInfo: SiteValidationResult) => void;
}

interface SiteValidationResult {
  Url: string;
  Name: string;
  Description: string;
  WpVersion: string;
  RestApiUrl: string;
  AuthMethods: string[];
  UsernameHint: string;
}

const SiteUrlStep: React.FC<SiteUrlStepProps> = ({ onValidated }) => {
  const [url, setUrl] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SiteValidationResult | null>(null);

  const validateSite = async () => {
    setValidating(true);
    setError(null);
    
    try {
      const resp = await fetch(`/api/v1/sites/validate`, {
        method: HttpMethod.Post,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Url: url }),
      });
      
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.Message || "Validation failed");
      }
      
      const data: SiteValidationResult = await resp.json();
      setResult(data);
      onValidated(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Connect WordPress Site</h2>
        <p className="text-muted-foreground">
          Enter your WordPress site URL to begin
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="site-url">WordPress Site URL</Label>
          <Input
            id="site-url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {result && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Site Validated</AlertTitle>
            <AlertDescription>
              {result.Name} (WordPress {result.WpVersion})
            </AlertDescription>
          </Alert>
        )}
        
        <Button onClick={validateSite} disabled={validating || !url}>
          {validating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            "Validate Site"
          )}
        </Button>
      </div>
    </div>
  );
};
```

### Step 2: Application Password Instructions

```tsx
interface AppPasswordStepProps {
  siteInfo: SiteValidationResult;
  onContinue: () => void;
}

const AppPasswordStep: React.FC<AppPasswordStepProps> = ({ siteInfo, onContinue }) => {
  const adminUrl = `${siteInfo.Url}/wp-admin/profile.php#application-passwords`;
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Generate Application Password</h2>
        <p className="text-muted-foreground">
          Create an Application Password in your WordPress admin
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Follow These Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-3">
            <li>Click the button below to open your WordPress admin</li>
            <li>Scroll down to "Application Passwords" section</li>
            <li>Enter a name like "WP SEO Publish CLI"</li>
            <li>Click "Add New Application Password"</li>
            <li>Copy the generated password (it won't be shown again)</li>
          </ol>
          
          <div className="pt-4">
            <Button variant="outline" asChild>
              <a href={adminUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open WordPress Admin
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-semibold mb-2">💡 Tips</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• You must be logged in as an Administrator</li>
          <li>• The password will look like: xxxx xxxx xxxx xxxx xxxx xxxx</li>
          <li>• Each password can only be viewed once after creation</li>
        </ul>
      </div>
      
      <Button onClick={onContinue}>
        I've Created the Password
      </Button>
    </div>
  );
};
```

### Step 3: Credentials Entry

```tsx
interface CredentialsStepProps {
  siteInfo: SiteValidationResult;
  onConnected: (connection: ConnectionResult) => void;
}

interface ConnectionResult {
  WebsiteId: string;
  Slug: string;
  Connected: boolean;
}

const CredentialsStep: React.FC<CredentialsStepProps> = ({ siteInfo, onConnected }) => {
  const [username, setUsername] = useState(siteInfo.UsernameHint || "");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      const resp = await fetch(`/api/v1/sites/connect`, {
        method: HttpMethod.Post,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Url: siteInfo.Url,
          Username: username,
          Password: password.replace(/\s+/g, ""), // Remove spaces
          Nickname: nickname || undefined,
        }),
      });
      
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.Message || "Connection failed");
      }
      
      const data: ConnectionResult = await resp.json();
      onConnected(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Enter Credentials</h2>
        <p className="text-muted-foreground">
          Paste your Application Password to connect
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">WordPress Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="app-password">Application Password</Label>
          <Input
            id="app-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
          />
          <p className="text-xs text-muted-foreground">
            Paste the full password including spaces
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="nickname">Nickname (Optional)</Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="My Blog"
          />
          <p className="text-xs text-muted-foreground">
            A friendly name to identify this site
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Button 
          onClick={connect} 
          disabled={connecting || !username || !password}
          className="w-full"
        >
          {connecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            "Connect Site"
          )}
        </Button>
      </div>
    </div>
  );
};
```

### Step 4: Success

```tsx
interface SuccessStepProps {
  connection: ConnectionResult;
  onFinish: () => void;
}

const SuccessStep: React.FC<SuccessStepProps> = ({ connection, onFinish }) => {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold">Site Connected!</h2>
        <p className="text-muted-foreground">
          Your WordPress site is now ready for publishing
        </p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Website ID</dt>
              <dd className="font-mono text-sm">{connection.WebsiteId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Slug</dt>
              <dd>{connection.Slug}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      
      <div className="space-y-2">
        <Button onClick={onFinish} className="w-full">
          Go to Site Dashboard
        </Button>
        <Button variant="outline" className="w-full" asChild>
          <Link to="/sites/new">Connect Another Site</Link>
        </Button>
      </div>
    </div>
  );
};
```

---

## Complete Wizard Component

```tsx
const ConnectionWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [siteInfo, setSiteInfo] = useState<SiteValidationResult | null>(null);
  const [connection, setConnection] = useState<ConnectionResult | null>(null);

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 4 && (
                <div className={cn(
                  "w-20 h-1 mx-2",
                  step > s ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Site URL</span>
          <span>Generate Password</span>
          <span>Enter Credentials</span>
          <span>Done</span>
        </div>
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          {step === 1 && (
            <SiteUrlStep 
              onValidated={(info) => {
                setSiteInfo(info);
                setStep(2);
              }} 
            />
          )}
          {step === 2 && siteInfo && (
            <AppPasswordStep 
              siteInfo={siteInfo}
              onContinue={() => setStep(3)} 
            />
          )}
          {step === 3 && siteInfo && (
            <CredentialsStep 
              siteInfo={siteInfo}
              onConnected={(conn) => {
                setConnection(conn);
                setStep(4);
              }} 
            />
          )}
          {step === 4 && connection && (
            <SuccessStep 
              connection={connection}
              onFinish={() => navigate(`/sites/${connection.WebsiteId}`)} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## API Integration

```typescript
// api/sites.ts

interface ValidateSiteRequest {
  Url: string;
}

interface ConnectSiteRequest {
  Url: string;
  Username: string;
  Password: string;
  Nickname?: string;
}

export async function validateSite(url: string): Promise<SiteValidationResult> {
  const resp = await fetch("/api/v1/sites/validate", {
    method: HttpMethod.Post,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Url: url }),
  });
  
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.Message);
  }
  
  return resp.json();
}

export async function connectSite(req: ConnectSiteRequest): Promise<ConnectionResult> {
  const resp = await fetch("/api/v1/sites/connect", {
    method: HttpMethod.Post,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.Message);
  }
  
  return resp.json();
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Backend API | `../01-backend/07-api-endpoints.md` |
| WordPress Connector | `../01-backend/02-wordpress-connector.md` |
| Content Manager | `02-content-manager.md` |
