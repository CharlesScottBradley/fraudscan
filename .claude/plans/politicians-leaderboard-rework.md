# Plan: Politicians Page & Leaderboard Changes

## Overview
Remove "fraud" framing from politicians page and repurpose leaderboard to show top donation recipients instead of daycares.

---

## 1. Politicians Page (`/politicians/page.tsx`)

### Current State
- Table columns: Name | Party | Office | State | **Fraud Links** | **Fraud Amount**
- Header shows: `fraud_linked` count, `fraud_amount` total
- Bottom section: "Fraud-Connected Politicians" cards
- Filter: "Fraud Links" dropdown

### Proposed Changes

| Location | Current | New |
|----------|---------|-----|
| Table column 5 | "Fraud Links" (count) | "Contributions" (count) |
| Table column 6 | "Fraud Amount" ($) | Remove or change to "Total Raised" |
| Header stats | `fraud_linked`, `fraud_amount` | `total_contributions`, `total_raised` |
| Bottom section | "Fraud-Connected Politicians" | Remove entirely |
| Filter | "Fraud Links" dropdown | Remove |

### API Changes Needed (`/api/politicians/route.ts`)
- Add `contribution_count` and `total_contributions` per politician
- Either join with `fec_contributions` or use the existing RPC function
- Remove fraud-related aggregations from response

---

## 2. Leaderboard Page (`/leaderboard/page.tsx`)

### Current State
- Shows top CCAP-funded daycare providers
- Queries `providers` + `payments` tables
- Columns: # | Provider | City | FY 2025 | FY 2024 | Total

### Proposed Changes

| Aspect | Current | New |
|--------|---------|-----|
| Data source | `providers` + `payments` | `politicians` + `fec_contributions` |
| Title | "Total CCAP funding tracked" | "Top Political Donation Recipients" |
| Columns | Provider, City, FY2025, FY2024, Total | Name, Party, State, Office, Total Raised |
| Rows | Top daycares | Top 10 politicians by donations |

### New Query Logic
```sql
SELECT p.id, p.full_name, p.party, p.state, p.office_title,
       SUM(c.transaction_amt) as total_raised,
       COUNT(c.id) as contribution_count
FROM politicians p
JOIN fec_contributions c ON c.linked_politician_id = p.id
GROUP BY p.id
ORDER BY total_raised DESC
LIMIT 10
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `app/politicians/page.tsx` | Remove fraud columns, add contribution columns, remove fraud filter, remove fraud section |
| `app/api/politicians/route.ts` | Add contribution aggregates per politician |
| `app/leaderboard/page.tsx` | Complete rewrite - politicians instead of daycares |
| (optional) New API | `/api/politicians/top` for leaderboard data |

---

## Implementation Order
1. Create database function/view for politician contribution totals (for performance)
2. Update `/api/politicians/route.ts` to include contribution data
3. Update `/politicians/page.tsx` - remove fraud UI, add contribution columns
4. Rewrite `/leaderboard/page.tsx` for top politicians

---

## Status
- [x] Database function for politician totals
- [x] API updates
- [x] Politicians page UI
- [x] Leaderboard page rewrite
- [x] Testing (build passed)
