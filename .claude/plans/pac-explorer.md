# PAC/Committee Explorer - Implementation Plan

## Overview
Create a comprehensive PAC/Committee explorer that lets users browse political committees, see their donors, linked candidates, and money flow.

---

## Data Available

### Tables
- `fec_contributions` - 58M+ donations with `cmte_id` (9,278 unique committees)
- `fec_committees` - 39 manually-added committees with names/types
- `fec_committee_candidate_links` - 8,594 links between committees and candidates
- `fec_candidates` - Candidate info (cand_id, cand_name, party, office)
- `fec_disbursements` - 310 committee spending records (limited data)

### Key Committees (by donations received)
| Committee | Total Received | Donations | Type |
|-----------|---------------|-----------|------|
| C00401224 (ActBlue) | $1.59B | 10.2M | PAC |
| C00744946 (Harris Victory Fund) | $952M | 2.5M | Joint Fundraising |
| C00694323 (WinRed) | $629M | 2.8M | Hybrid PAC |
| C00669259 | $564M | 569 | Super PAC (large donors) |
| C00703975 (Fight For The People) | $399M | 3.1M | PAC |

---

## New Pages

### 1. `/pacs` - PAC Leaderboard
**Purpose**: Browse all committees sorted by total raised

**Features**:
- Hero stat: Total money flowing through tracked PACs
- Table with columns: Rank, Name, Type, Party, Total Raised, # Donations, Avg Donation
- Filters: Party (D/R/I), Type (PAC, Super PAC, Party, Joint Fundraising)
- Search by committee name
- Click to view detail page

**Data Source**: Aggregate from `fec_contributions` grouped by `cmte_id`, join with `fec_committees` for names

### 2. `/pac/[cmte_id]` - Committee Detail Page
**Purpose**: Deep dive into a single PAC/committee

**Sections**:

#### Header
- Committee name, type, party affiliation
- Total raised, # donations, avg donation
- Link to FEC.gov page

#### Top Donors (table)
- Name, Employer, Occupation, City/State, Total Given, # Donations
- Paginated, sortable
- Link to `/donations/contributor/[name]`

#### Linked Candidates
- Politicians this committee supports (from `fec_committee_candidate_links`)
- Show candidate name, office, party, relationship type
- Link to `/politician/[id]`

#### Donation Timeline
- Simple bar chart showing donations by month/quarter
- Identify spikes around elections

#### Geographic Breakdown
- Top states by donation volume
- Optional: small map

### 3. Integration Points

#### From `/politicians` page
- Add "Top PACs Supporting" section on politician detail page
- Show which committees have donated to this politician

#### From `/politician/[id]` page
- Link to the politician's principal campaign committee
- Show PAC contributions breakdown

#### Navigation
- Add "PACs" to main navigation
- Add quick links from donations pages

---

## Database Work

### 1. Materialized View: `pac_stats`
Pre-compute PAC statistics for fast queries:
```sql
CREATE MATERIALIZED VIEW pac_stats AS
SELECT
  cmte_id,
  COUNT(*) as donation_count,
  SUM(transaction_amt) as total_received,
  AVG(transaction_amt) as avg_donation,
  MIN(transaction_dt) as first_donation,
  MAX(transaction_dt) as last_donation,
  COUNT(DISTINCT state) as states_count
FROM fec_contributions
WHERE cmte_id IS NOT NULL
GROUP BY cmte_id;
```

### 2. Enrich `fec_committees` Table
Need to import FEC committee master file to get names for all 9,278 committees:
- Download from: https://www.fec.gov/files/bulk-downloads/
- File: `cm.txt` (Committee Master)
- Contains: cmte_id, cmte_nm, tres_nm, cmte_st1, cmte_city, cmte_st, cmte_zip, cmte_dsgn, cmte_tp, cmte_pty_affiliation, etc.

### 3. Index Optimization
```sql
CREATE INDEX IF NOT EXISTS idx_fec_contributions_cmte_id ON fec_contributions(cmte_id);
CREATE INDEX IF NOT EXISTS idx_fec_contributions_cmte_amt ON fec_contributions(cmte_id, transaction_amt);
```

---

## API Routes

### `/api/pacs`
- GET: List PACs with stats, filtering, pagination
- Query params: party, type, search, sortBy, page, pageSize

### `/api/pacs/[cmte_id]`
- GET: Single PAC detail with stats

### `/api/pacs/[cmte_id]/donors`
- GET: Top donors for a PAC, paginated

### `/api/pacs/[cmte_id]/candidates`
- GET: Linked candidates for a PAC

---

## Implementation Order

### Phase 1: Foundation
1. Create `pac_stats` materialized view
2. Import FEC committee master file (get names for all committees)
3. Create `/api/pacs` endpoint
4. Create `/pacs` leaderboard page

### Phase 2: Detail Pages
5. Create `/api/pacs/[cmte_id]` endpoint
6. Create `/pac/[cmte_id]` detail page with donors table
7. Add linked candidates section

### Phase 3: Integration
8. Add "PACs" to navigation
9. Add PAC section to politician detail pages
10. Link donation search to PAC pages

### Phase 4: Enhancements
11. Donation timeline chart
12. Geographic breakdown
13. Compare PACs feature

---

## Questions to Resolve

1. **Committee names**: Import full FEC committee master or fetch on-demand?
2. **Disbursements**: We only have 310 records - import more or skip spending section?
3. **Scope**: Include all 9,278 committees or focus on top 500?
4. **ActBlue/WinRed**: These are conduits - should we trace through to final recipients?

---

## Status
- [x] Phase 1: Foundation (COMPLETE)
- [ ] Phase 2: Detail Pages
- [ ] Phase 3: Integration
- [ ] Phase 4: Enhancements

---

## Phase 2: PAC Detail Pages

### `/pac/[cmte_id]` - Committee Detail Page

**Purpose**: Deep dive into a single PAC/committee

#### Data Sources
- `fec_committees` - Committee name, type, party, state
- `pac_stats` - Aggregated stats (total received, donation count, avg)
- `fec_contributions` - Individual donations to this committee
- `fec_committee_candidate_links` - Politicians supported by this PAC

#### Sections

**1. Header**
- Committee name, ID, type, party affiliation
- Total raised, # donations, avg donation, donor states count
- Link to FEC.gov page

**2. Top Donors Table**
| Donor | Employer | Occupation | Location | Amount | # Donations |
|-------|----------|------------|----------|--------|-------------|
Paginated, sortable by amount

**3. Linked Politicians Section**
Query `fec_committee_candidate_links` where `cmte_id` matches:
- Show candidates this PAC supports
- Designation type (P=Principal, A=Authorized, J=Joint)
- Link to politician detail page if we have them

**4. Donation Timeline**
- Bar chart by month/quarter
- Show election cycle spikes

**5. Geographic Breakdown**
- Top states by donation volume
- Simple table, no map needed initially

### API Endpoints Needed

**`/api/pacs/[cmte_id]`**
```typescript
// Returns committee details + stats
{
  committee: { cmte_id, name, type, party, state, fec_url },
  stats: { total_received, donation_count, avg_donation, donor_states_count },
  topDonors: [...], // paginated
  linkedCandidates: [...] // from fec_committee_candidate_links
}
```

**`/api/pacs/[cmte_id]/donors`**
- Paginated top donors for this committee
- Query params: page, pageSize, sortBy

---

## Phase 3: Politician-PAC Integration

### Goal
Show PAC relationships on politician detail pages

### Data Flow
```
politicians.fec_candidate_id
  → fec_committee_candidate_links.cand_id
  → cmte_id
  → fec_committees (names)
  → fec_contributions (amounts)
```

### Changes to `/politician/[id]` Page

**Add new section: "Campaign Committees"**

Show committees linked to this politician via `fec_committee_candidate_links`:

| Committee | Type | Designation | Total Raised | Link |
|-----------|------|-------------|--------------|------|
| SCHIFF FOR CONGRESS | Principal Campaign | P | $26.8M | → |
| DCCC | Party | A | - | → |

**Designation codes:**
- P = Principal Campaign Committee (their main committee)
- A = Authorized Committee
- J = Joint Fundraising Committee

### API Changes

**`/api/politicians/[id]/committees`** (new endpoint)
```typescript
// Returns committees linked to this politician
{
  committees: [
    {
      cmte_id: "C00401224",
      name: "SCHIFF FOR CONGRESS",
      committee_type: "Principal Campaign",
      designation: "P",
      total_raised: 26800000,
      link_type: "principal" | "authorized" | "joint"
    }
  ]
}
```

### Database Query
```sql
SELECT
  ccl.cmte_id,
  fc.name as committee_name,
  fc.committee_type,
  ccl.cmte_dsgn as designation,
  COALESCE(ps.total_received, 0) as total_raised
FROM fec_committee_candidate_links ccl
JOIN fec_committees fc ON fc.cmte_id = ccl.cmte_id
LEFT JOIN pac_stats ps ON ps.cmte_id = ccl.cmte_id
WHERE ccl.cand_id = :fec_candidate_id
ORDER BY ps.total_received DESC NULLS LAST;
```

---

## Implementation Order

### Phase 2 Tasks
1. Create `/api/pacs/[cmte_id]/route.ts` - committee detail endpoint
2. Create `/api/pacs/[cmte_id]/donors/route.ts` - paginated donors
3. Create `/app/pac/[cmte_id]/page.tsx` - detail page UI
4. Add linked candidates section to PAC detail page

### Phase 3 Tasks
5. Create `/api/politicians/[id]/committees/route.ts`
6. Add "Campaign Committees" section to politician detail page
7. Link PAC names to `/pac/[cmte_id]` pages

### Phase 4 Tasks (Future)
8. Donation timeline chart on PAC pages
9. Geographic heatmap
10. Compare PACs feature
11. "Money flow" visualization (donor → PAC → politician)
