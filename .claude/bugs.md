# Bug Log

Track bugs, errors, and issues encountered during development.

---

## Template

```
### [DATE] - Brief description
**Status:** Open | Fixed | Won't Fix
**File(s):** path/to/file.ts
**Error:** Error message or description
**Root Cause:** Why it happened
**Fix:** What was done to resolve it
```

---

## Bugs

### 2025-01-04 - useRef TypeScript error on Vercel build
**Status:** Fixed
**File(s):** app/daycareslots/page.tsx
**Error:** `Expected 1 arguments, but got 0` for `useRef<number>()`
**Root Cause:** Vercel's stricter TypeScript config requires initial value for useRef
**Fix:** Changed `useRef<number>()` to `useRef<number | null>(null)`

---

<!-- Add new bugs above this line -->
