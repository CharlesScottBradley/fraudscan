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
- [ ] Phase 1: Foundation
- [ ] Phase 2: Detail Pages
- [ ] Phase 3: Integration
- [ ] Phase 4: Enhancements
