import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface StateProgramData {
  programName: string;
  agency: string;
  fiscalYear: number;
  improperPaymentRate: number;
  improperPaymentAmount: number;
  isHighPriority: boolean;
  relevanceReason: string;
}

/**
 * Determines which federal programs are relevant to a state based on:
 * - Programs that operate in all states (Medicare, Medicaid, Unemployment)
 * - Programs linked to entities we have data for (SNAP/CACFP -> childcare providers, etc.)
 */
async function getRelevantPrograms(stateCode: string): Promise<StateProgramData[]> {
  const stateUpper = stateCode.toUpperCase();

  // Check if state has childcare providers
  const { count: providerCount } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true })
    .eq('state', stateUpper);

  const hasProviders = (providerCount || 0) > 0;

  // Check if state has PPP loans
  const { count: pppCount } = await supabase
    .from('ppp_loans')
    .select('*', { count: 'exact', head: true })
    .eq('borrower_state', stateUpper);

  const hasPPP = (pppCount || 0) > 0;

  // Get latest improper payment data for relevant programs
  const { data: allPrograms } = await supabase
    .from('improper_payments')
    .select('program_name, agency, fiscal_year, improper_payment_rate, improper_payment_amount, is_high_priority')
    .gte('fiscal_year', 2023)
    .order('fiscal_year', { ascending: false });

  if (!allPrograms) {
    return [];
  }

  // Group by program name and take the most recent fiscal year
  const programMap = new Map<string, any>();
  for (const program of allPrograms) {
    if (!programMap.has(program.program_name) ||
        program.fiscal_year > programMap.get(program.program_name).fiscal_year) {
      programMap.set(program.program_name, program);
    }
  }

  const relevantPrograms: StateProgramData[] = [];

  programMap.forEach((program) => {
    const name = program.program_name.toLowerCase();
    let relevanceReason = '';
    let isRelevant = false;

    // Medicare, Medicaid - all states
    if (name.includes('medicare') || name.includes('medicaid')) {
      isRelevant = true;
      relevanceReason = 'Healthcare program operating in all states';
    }
    // Unemployment - all states (but exclude pandemic programs)
    else if (name.includes('unemployment') && !name.includes('pandemic')) {
      isRelevant = true;
      relevanceReason = 'Labor program operating in all states';
    }
    // SNAP - all states (but especially relevant if we have providers)
    else if (name.includes('snap')) {
      isRelevant = true;
      relevanceReason = 'Nutrition assistance program operating in all states';
    }
    // Child Care programs - only if state has providers
    else if (name.includes('child care') && hasProviders) {
      isRelevant = true;
      relevanceReason = `${providerCount} childcare providers in this state`;
    }
    // CACFP - only if state has providers
    else if (name.includes('cacfp') && hasProviders) {
      isRelevant = true;
      relevanceReason = `${providerCount} childcare providers in this state`;
    }

    if (isRelevant && program.improper_payment_rate !== null && program.improper_payment_amount !== null) {
      relevantPrograms.push({
        programName: program.program_name,
        agency: program.agency,
        fiscalYear: program.fiscal_year,
        improperPaymentRate: parseFloat(program.improper_payment_rate),
        improperPaymentAmount: parseFloat(program.improper_payment_amount),
        isHighPriority: program.is_high_priority || false,
        relevanceReason,
      });
    }
  });

  // Sort by improper payment amount (descending)
  relevantPrograms.sort((a, b) => b.improperPaymentAmount - a.improperPaymentAmount);

  return relevantPrograms;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ state: string }> }
) {
  try {
    const { state } = await params;
    const programs = await getRelevantPrograms(state);

    return NextResponse.json({
      state: state.toUpperCase(),
      programs,
      total: programs.length,
    });
  } catch (error) {
    console.error('State programs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch state program data' },
      { status: 500 }
    );
  }
}
