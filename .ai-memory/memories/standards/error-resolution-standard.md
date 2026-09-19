# Memory: standards/error-resolution-standard


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

All projects (React, CLI, WordPress) MUST follow the Error Resolution specification at `02-spec/04-error-resolution/`. Key requirements:

1. **Frontend-Backend Sync**: Always verify BOTH directions before claiming an endpoint works
2. **Response Format**: Backend must return `{success:true, data:{...}}` envelope
3. **Detection Logic**: Use HTTP status codes (2xx) as primary indicator, not response body fields
4. **Diagnostics**: Show raw env vars vs resolved values, include UI origin
5. **Never Assume**: Check actual handler code, not just spec
6. **Endpoint Existence**: Verify frontend endpoints exist in backend before implementation

Cross-References:
- Error Resolution: `02-spec/04-error-resolution/00-overview.md`
- Verification Patterns: `02-spec/04-error-resolution/02-verification-patterns/01-frontend-backend-sync.md`
- PHP Debugging: `02-spec/04-error-resolution/03-debugging-guides/01-debugging-php.md`
- Go Debugging: `02-spec/04-error-resolution/03-debugging-guides/02-debugging-go.md`
- TypeScript Debugging: `02-spec/04-error-resolution/03-debugging-guides/03-debugging-typescript.md`
- PHP Coding Guidelines: `02-spec/11-spec-management-software/12-prompts/01-coding-guideline/04-backend-php.md`
- React Guidelines: `02-spec/11-spec-management-software/12-prompts/01-coding-guideline/03-frontend-react.md`
