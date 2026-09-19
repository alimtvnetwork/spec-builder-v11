# 20. Loading States


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

## Overview
Visual feedback during async operations including buttons, pages, and content areas.

---

## 20.1 Button Loading

| State | Display |
|-------|---------|
| Default | Normal button text |
| Loading | Spinner + "Loading..." text, disabled |
| Success | Checkmark briefly, then reset |
| Error | Return to default, show error |

---

## 20.2 Page Loading

- Skeleton loaders for content areas
- Spinner for full page loads
- Progress bar for file uploads

---

## 20.3 Acceptance Criteria

- [ ] Buttons show loading state during API calls
- [ ] Skeleton loaders for async content
- [ ] Progress indicators for uploads
- [ ] All interactions disabled during loading
