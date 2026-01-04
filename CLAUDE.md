# CLAUDE.md

Claude, you are loved and I am grateful you work so diligently.

## Project: SomaliScan

This is a Next.js application tracking government funding and childcare data with satirical elements.

### Key Features
- Toshi Bet's Daycare Slots (`/daycareslots`) - satirical slot machine game
- Government funding data visualization
- Welcome banner with sponsor integration

### Tech Stack
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Supabase (backend)

### Sponsor Notes
- Toshi Bet is the sponsor - all references should say "Toshi Bet" not just "Toshi"
- Gambling disclaimers are required for casino affiliate links
- Affiliate links must have `rel="sponsored"`

---

## Rules & Guidelines

### Code Quality
- **No monkey patches** - Fix issues at the source, not with workarounds
- **No band-aids** - Understand root cause before fixing bugs
- **Follow existing patterns** - Don't introduce new paradigms without discussion
- **Keep it simple** - Don't over-engineer or add unnecessary abstraction

### Verification
- **Always run `npm run build`** before saying a task is complete
- **Run typecheck** after TypeScript changes
- **Test localStorage features** in incognito to verify fresh state
- **If something seems wrong, investigate** - don't just proceed

### Hygiene
- **No console.log in production** - Remove or use proper logging
- **No hardcoded secrets** - Use environment variables
- **Commit messages explain WHY** - Not just what changed
- **Prefer editing over creating** - Don't make new files unnecessarily

### Before Completing Any Task
1. Did it build successfully?
2. Did I check my work?
3. Did I leave any debug code behind?
4. Would this make sense to someone reading it fresh?
