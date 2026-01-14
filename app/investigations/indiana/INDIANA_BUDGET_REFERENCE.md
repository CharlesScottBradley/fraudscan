# Indiana Social Services Budget Reference

Last Updated: January 2026

---

## FSSA: The $1.3 Billion IBM Failure (2005-2009)

### The Mitch Roob Story
- **2005**: Mitch Roob (ex-ACS executive) appointed FSSA Secretary by Gov. Daniels
- **2006**: Roob awards $1.3B contract to IBM (with ACS as subcontractor)
- **2007-2009**: System fails - lost records, denied benefits, at least one death
- **Oct 2009**: Daniels cancels contract, admits "I was wrong"
- **2009**: ACS gets NEW $638M contract despite being blamed
- **2009**: Roob promoted to Economic Development Secretary
- **2020**: Court orders IBM to pay $78M back to Indiana
- **Jan 2025**: Gov. Braun appoints Roob back as FSSA Secretary

### The $1 Billion Medicaid Shortfall (2023)
- **April 2023**: Milliman forecasts $570M surplus
- **December 2023**: Actual = $1B SHORT (a $1.57B swing)
- **Cause**: Attendant care program tripled from $557M to $1.4B
- **Response**: State fires Milliman, hires Deloitte
- **Note**: Deloitte faces FTC complaint for faulty Medicaid software in 20+ states

### Sources
- [Indianapolis Recorder - Daniels admits "I was wrong"](https://indianapolisrecorder.com/a23e802f-4199-5c1f-ab3e-a10f046da89f/)
- [WFYI - Indiana replaces Milliman with Deloitte](https://www.wfyi.org/news/articles/indiana-moves-to-replace-medicaid-consulting-firm-after-1-billion-forecasting-error)
- [WISH-TV - FSSA officials can't explain shortfall](https://www.wishtv.com/news/politics/fssa-officials-still-unable-to-fully-explain-billion-dollar-shortfall/)

---

## DCS (Department of Child Services) Budget

### State Appropriations (Verified)
| Fiscal Year | State Appropriation | Source |
|-------------|---------------------|--------|
| FY2018 | $629M | Indiana Lawyer |
| FY2019 | $679M | Indiana Lawyer |
| FY2024 | $976.8M | State Budget Agency |
| FY2025 | $952.2M | State Budget Agency |

**Source**: [The Indiana Lawyer - DCS budget could grow significantly](https://www.theindianalawyer.com/articles/48931-dcs-budget-could-grow-significantly-next-year)

### Federal Matching (Title IV-E)
- **Indiana FMAP Rate (2024)**: 65.62%
- Meaning: Feds pay 65.62%, state pays 34.38% of eligible costs
- **Not all DCS costs are Title IV-E eligible** - only maintenance payments for eligible children

**Eligible for federal match**:
- Foster care maintenance payments (~66% federal)
- Adoption assistance (~66% federal)
- Administrative costs (~50% federal)
- Training (~75% federal)

**NOT federally matched**:
- Investigations
- Prevention services (some exceptions)
- Services for non-eligible children

### Estimated Total Spending (State + Federal)
If ~$500M of $977M state appropriation is Title IV-E eligible:
- Federal reimbursement: ~$330M
- **Total DCS spending: ~$1.3B/year**

This reconciles with the ~$1.4B figures seen in news reports.

### Cost Per Child in Care
- Children in foster care (2024): **11,547**
- State appropriation: $977M → **$84,600/child/year**
- Est. total (with federal): $1.3B → **$112,600/child/year**

---

## FSSA (Family and Social Services Administration) Budget

### Total Agency Budget
| Fiscal Year | Total Budget | State Portion | Federal Portion |
|-------------|--------------|---------------|-----------------|
| FY2023 | ~$18B | ~$3B (16%) | ~$15B |
| FY2024 | ~$20B | ~$4.1B (21%) | ~$16B |
| FY2025 | ~$20B | ~$4.4B (21%) | ~$16B |

**Source**: [Indiana Capital Chronicle - Medicaid expenses](https://indianacapitalchronicle.com/2024/07/08/breaking-down-budgets-why-medicaid-expenses-are-growing/)

### FSSA Divisions
FSSA is the umbrella agency containing:
- **Medicaid** (~$19-26B/year, 70% federal) - LARGEST
- Division of Aging (DA)
- Division of Disability and Rehabilitative Services (DDRS)
- Division of Mental Health and Addiction (DMHA)
- Office of Early Childhood and Out-of-School Learning (OECOSL) - childcare vouchers
- Division of Family Resources (DFR) - SNAP, TANF

**Note**: DCS is a SEPARATE department, not part of FSSA.

### Medicaid Specifics
- FY2024 Medicaid spending: ~$19B total
- Federal share: ~$13.5B (70%)
- State share: ~$5.5B (30%)
- **$1B shortfall discovered in 2023** - still unexplained

---

## State Checkbook Data (Our Database)

What our `state_checkbook` table contains:
- **Vendor payments** from state funds
- Does NOT include federal pass-through
- Does NOT include benefit payments to recipients
- FY2022-2025 cumulative data

### Our Figures (4-year cumulative, FY2022-2025)
| Agency | Checkbook Total | Annual Avg |
|--------|-----------------|------------|
| Family & Social Services Admin | $9.2B | ~$2.3B/year |
| Child Services | $4.29B | ~$1.07B/year |

**Important**: These are vendor payments, not total agency budgets.

---

## Foster Care Payment Rates

### What Foster Families Receive
| Placement Type | Daily Rate | Annual Equivalent |
|----------------|------------|-------------------|
| Foster Family (Basic) | $24.11 | $8,800 |
| Foster Family (Enhanced) | $37.00 | $13,500 |
| Foster Family (Intensive) | $50.00 | $18,250 |
| Relative Caregiver | $18-24 | $6,500-$8,800 |

**Source**: Indiana DCS Rate Letters, WFYI News

### What Residential Facilities Receive
| Facility Type | Daily Rate | Annual Equivalent |
|---------------|------------|-------------------|
| Residential Treatment | $480+ | $175,200+ |
| Group Home | $150-300 | $55,000-$110,000 |
| Psychiatric Residential | $600+ | $219,000+ |

**Source**: WFYI investigation, 2024

---

## The Money Gap

### Per-Child Comparison
| Metric | Amount |
|--------|--------|
| Foster family receives (basic) | $8,800/year |
| Foster family receives (intensive) | $18,250/year |
| System cost per child (state only) | $84,600/year |
| System cost per child (with federal) | $112,600/year |

### Where Does the Other ~$95,000 Go?
1. **Caseworker salaries** - ~2,000 case managers + support staff
2. **Residential facilities** - High-cost placements
3. **Administrative overhead** - Management, offices, IT
4. **Consultant contracts** - Deloitte, Casebook, etc.
5. **Legal/court costs** - CHINS proceedings
6. **Service providers** - Therapy, transportation, etc.

---

## Consultant Payments (From Checkbook)

### Top DCS Vendors (FY2022-2025)
| Vendor | Total | Contracts |
|--------|-------|-----------|
| Deloitte Consulting LLP | $70.6M (DCS only) | 66 |
| Casebook PBC | $27.3M | 12 |
| Gainwell Technologies | ~$20M | ~15 |

### All FSSA/DCS Consulting
| Vendor | Total (All Agencies) |
|--------|---------------------|
| Deloitte Consulting LLP | $187.6M |
| Accenture LLP | $89.4M |
| Carahsoft Technology | $31.5M (FBI investigation) |
| KPMG LLP | $17.2M |

**Note**: These figures need verification from checkbook queries.

---

## Key Dates & Events

| Year | Event |
|------|-------|
| 2005 | DCS created as separate agency |
| 2013 | Pence becomes Governor |
| 2016 | CCWIS federal mandate enacted |
| 2017 | Pence becomes VP; Holcomb becomes Governor |
| 2018 | Seema Verma runs CMS (controls federal matching) |
| 2022 | Heather Neal (ex-Pence staff) joins Deloitte |
| 2023 | FSSA discovers $1B Medicaid shortfall |
| 2024 | Randy Head resigns as GOP Chair to lobby for Deloitte |

---

## Sources

1. [The Indiana Lawyer - DCS Budget](https://www.theindianalawyer.com/articles/48931-dcs-budget-could-grow-significantly-next-year)
2. [Indiana Capital Chronicle - Medicaid Expenses](https://indianacapitalchronicle.com/2024/07/08/breaking-down-budgets-why-medicaid-expenses-are-growing/)
3. [MACPAC - FMAP Rates](https://www.macpac.gov/publication/federal-medical-assistance-percentages-fmaps-and-enhanced-fmaps-e-fmaps-by-state-selected-periods/)
4. [Indiana Transparency Portal](https://www.in.gov/itp/)
5. [ACF - Title IV-E Foster Care](https://acf.gov/cb/grant-funding/title-iv-e-foster-care)

---

## Notes & Caveats

1. **State appropriation ≠ Total spending** - Federal matching adds 50-66% more
2. **Checkbook data ≠ Agency budget** - Checkbook only shows vendor payments
3. **DCS ≠ FSSA** - They are separate agencies in Indiana
4. **Fiscal year runs July 1 - June 30** in Indiana
5. **Federal fiscal year runs Oct 1 - Sept 30**
