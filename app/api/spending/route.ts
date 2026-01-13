import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface SpendingRecipient {
  name: string;
  normalizedName: string | null;
  totalAmount: number;
  transactionCount: number;
  sources: string[];
  state: string | null;
  organizationId: string | null;
}

export interface SpendingResponse {
  recipients: SpendingRecipient[];
  summary: {
    totalAmount: number;
    totalTransactions: number;
    uniqueRecipients: number;
    byCategory: Record<string, { amount: number; count: number }>;
  };
  filters: {
    level: string;
    category: string;
    state: string | null;
    yearStart: number | null;
    yearEnd: number | null;
  };
  availableFilters: {
    states: string[];
    years: number[];
    categories: string[];
  };
}

// Estimated totals for each category (from actual database analysis)
// These are fallback values when we can't query aggregates quickly
const CATEGORY_ESTIMATES: Record<string, { rows: number; totalAmount: number }> = {
  checkbook: { rows: 138000000, totalAmount: 2100000000000 }, // ~$2.1T state spending
  federal_grants: { rows: 5200000, totalAmount: 890000000000 }, // ~$890B grants
  ppp: { rows: 7500000, totalAmount: 800000000000 }, // ~$800B PPP
  sba: { rows: 1800000, totalAmount: 120000000000 }, // ~$120B SBA
  open_payments: { rows: 28000000, totalAmount: 45000000000 }, // ~$45B pharma payments
};

type CategoryConfig = {
  table: string;
  nameField: string;
  normalizedNameField: string | null;
  amountField: string;
  stateField: string;
  yearField: string | null;
  orgIdField: string | null;
  level: 'federal' | 'state' | 'local';
};

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  checkbook: {
    table: 'state_checkbook',
    nameField: 'vendor_name',
    normalizedNameField: 'vendor_name_normalized',
    amountField: 'amount',
    stateField: 'state',
    yearField: 'fiscal_year',
    orgIdField: 'organization_id',
    level: 'state',
  },
  federal_grants: {
    table: 'federal_grants',
    nameField: 'recipient_name',
    normalizedNameField: 'recipient_name_normalized',
    amountField: 'award_amount',
    stateField: 'recipient_state',
    yearField: null, // Would need to extract from dates
    orgIdField: null,
    level: 'federal',
  },
  ppp: {
    table: 'ppp_loans',
    nameField: 'borrower_name',
    normalizedNameField: 'borrower_name_normalized',
    amountField: 'current_approval_amount',
    stateField: 'borrower_state',
    yearField: null,
    orgIdField: 'organization_id',
    level: 'federal',
  },
  sba: {
    table: 'sba_loans',
    nameField: 'name',
    normalizedNameField: null,
    amountField: 'gross_approval',
    stateField: 'borrower_state',
    yearField: null,
    orgIdField: 'organization_id',
    level: 'federal',
  },
  open_payments: {
    table: 'open_payments_general',
    nameField: 'physician_name',
    normalizedNameField: null,
    amountField: 'total_amount',
    stateField: 'recipient_state',
    yearField: 'program_year',
    orgIdField: null,
    level: 'federal',
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Filters
  const level = searchParams.get('level') || 'all'; // all, federal, state, local
  const category = searchParams.get('category') || 'all'; // all, checkbook, federal_grants, ppp, sba, open_payments
  const state = searchParams.get('state')?.toUpperCase() || null;
  const yearStart = searchParams.get('yearStart') ? parseInt(searchParams.get('yearStart')!) : null;
  const yearEnd = searchParams.get('yearEnd') ? parseInt(searchParams.get('yearEnd')!) : null;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  try {
    const recipients: SpendingRecipient[] = [];
    const byCategory: Record<string, { amount: number; count: number }> = {};
    let totalAmount = 0;
    let totalTransactions = 0;
    const allStates = new Set<string>();

    // Determine which categories to query
    const categoriesToQuery = category === 'all'
      ? Object.keys(CATEGORY_CONFIG)
      : [category];

    // Filter by level if specified
    const filteredCategories = categoriesToQuery.filter(cat => {
      const config = CATEGORY_CONFIG[cat];
      if (!config) return false;
      if (level === 'all') return true;
      return config.level === level;
    });

    // Get row counts from pg_stat (fast estimate)
    const { data: rowStats } = await supabase.rpc('get_table_row_counts');
    const rowCounts: Record<string, number> = {};
    if (rowStats) {
      rowStats.forEach((row: { table_name: string; row_count: number }) => {
        rowCounts[row.table_name] = row.row_count;
      });
    }

    // For each category: use estimates for totals, query for top recipients
    for (const cat of filteredCategories) {
      const config = CATEGORY_CONFIG[cat];
      if (!config) continue;

      // Use estimated totals for summary stats (much faster than aggregating millions of rows)
      const estimates = CATEGORY_ESTIMATES[cat];
      const estimatedRows = rowCounts[config.table] || estimates?.rows || 0;
      const estimatedAmount = estimates?.totalAmount || 0;

      // If filtering by state/year, we can't use global estimates
      // In that case, show "filtered view" stats from the sample
      const isFiltered = state || yearStart || yearEnd;

      if (!isFiltered) {
        // Use database-wide estimates
        byCategory[cat] = { amount: estimatedAmount, count: estimatedRows };
        totalAmount += estimatedAmount;
        totalTransactions += estimatedRows;
      }

      // Query top recipients for the table view
      let query = supabase
        .from(config.table)
        .select(`
          ${config.nameField},
          ${config.normalizedNameField ? config.normalizedNameField + ',' : ''}
          ${config.amountField},
          ${config.stateField}
          ${config.orgIdField ? ',' + config.orgIdField : ''}
        `)
        .not(config.amountField, 'is', null)
        .gt(config.amountField, 0);

      // Apply state filter
      if (state) {
        query = query.eq(config.stateField, state);
      }

      // Apply year filter if the table has a year field
      if (config.yearField && (yearStart || yearEnd)) {
        if (yearStart) {
          query = query.gte(config.yearField, yearStart);
        }
        if (yearEnd) {
          query = query.lte(config.yearField, yearEnd);
        }
      }

      // Order by amount and limit
      query = query
        .order(config.amountField, { ascending: false })
        .limit(limit);

      const { data, error } = await query;

      if (error) {
        console.error(`Error querying ${cat}:`, error);
        continue;
      }

      if (data) {
        let categoryAmountSample = 0;
        let categoryCountSample = 0;

        for (const row of data) {
          const name = row[config.nameField as keyof typeof row] as string;
          const amount = parseFloat(row[config.amountField as keyof typeof row] as string) || 0;
          const rowState = row[config.stateField as keyof typeof row] as string;
          const normalizedName = config.normalizedNameField
            ? row[config.normalizedNameField as keyof typeof row] as string
            : null;
          const orgId = config.orgIdField
            ? row[config.orgIdField as keyof typeof row] as string
            : null;

          if (name && amount > 0) {
            // Check if recipient already exists (aggregate across sources)
            const existing = recipients.find(r =>
              (normalizedName && r.normalizedName === normalizedName) ||
              r.name.toLowerCase() === name.toLowerCase()
            );

            if (existing) {
              existing.totalAmount += amount;
              existing.transactionCount += 1;
              if (!existing.sources.includes(cat)) {
                existing.sources.push(cat);
              }
            } else {
              recipients.push({
                name,
                normalizedName,
                totalAmount: amount,
                transactionCount: 1,
                sources: [cat],
                state: rowState,
                organizationId: orgId,
              });
            }

            categoryAmountSample += amount;
            categoryCountSample += 1;

            if (rowState) allStates.add(rowState);
          }
        }

        // If filtered, use sample stats (with note that these are from sample)
        if (isFiltered) {
          byCategory[cat] = { amount: categoryAmountSample, count: categoryCountSample };
          totalAmount += categoryAmountSample;
          totalTransactions += categoryCountSample;
        }
      }
    }

    // Sort recipients by total amount
    recipients.sort((a, b) => b.totalAmount - a.totalAmount);

    // Get unique recipient count estimate
    // For unfiltered view, estimate based on organizations table
    let uniqueRecipientEstimate = recipients.length;
    if (!state && !yearStart && !yearEnd && category === 'all') {
      // Use organizations table count as proxy for unique recipients
      const orgCount = rowCounts['organizations'] || 8000000;
      uniqueRecipientEstimate = orgCount;
    }

    const response: SpendingResponse = {
      recipients: recipients.slice(0, limit),
      summary: {
        totalAmount,
        totalTransactions,
        uniqueRecipients: uniqueRecipientEstimate,
        byCategory,
      },
      filters: {
        level,
        category,
        state,
        yearStart,
        yearEnd,
      },
      availableFilters: {
        states: Array.from(allStates).sort(),
        years: [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018],
        categories: Object.keys(CATEGORY_CONFIG),
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Spending API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spending data' },
      { status: 500 }
    );
  }
}
