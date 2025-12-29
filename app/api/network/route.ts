import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface NetworkNode {
  id: string;
  label: string;
  type: 'person' | 'company' | 'politician' | 'committee' | 'provider';
  group?: string;
  metadata?: Record<string, unknown>;
}

interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  type: 'donation' | 'employment' | 'ppp_loan' | 'ownership' | 'other';
  amount?: number;
  metadata?: Record<string, unknown>;
}

// Search for entities
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const type = searchParams.get('type'); // 'donor', 'recipient', 'provider', 'ppp'
  const expand = searchParams.get('expand'); // entity ID to get connections for

  try {
    // If expanding an entity, get its connections
    if (expand) {
      const result = await getConnections(expand);
      return NextResponse.json(result);
    }

    // Otherwise, search for entities
    if (!query || query.length < 2) {
      return NextResponse.json({ nodes: [], edges: [] });
    }

    const results = await searchEntities(query, type);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Network API error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

async function searchEntities(query: string, type: string | null) {
  const nodes: NetworkNode[] = [];
  const seen = new Set<string>();

  // Search political donation recipients
  if (!type || type === 'recipient') {
    const { data: recipients } = await supabase
      .from('political_donations')
      .select('recipient_name, recipient_type')
      .ilike('recipient_name', `%${query}%`)
      .limit(10);

    recipients?.forEach(r => {
      const id = `recipient:${r.recipient_name}`;
      if (!seen.has(id)) {
        seen.add(id);
        nodes.push({
          id,
          label: r.recipient_name,
          type: r.recipient_type === 'PCC' ? 'politician' : 'committee',
          metadata: { recipient_type: r.recipient_type },
        });
      }
    });
  }

  // Search donors/contributors
  if (!type || type === 'donor') {
    const { data: donors } = await supabase
      .from('political_donations')
      .select('contributor_name, contributor_employer, contributor_type')
      .ilike('contributor_name', `%${query}%`)
      .not('contributor_name', 'is', null)
      .limit(10);

    donors?.forEach(d => {
      const id = `donor:${d.contributor_name}`;
      if (!seen.has(id) && d.contributor_name) {
        seen.add(id);
        nodes.push({
          id,
          label: d.contributor_name,
          type: 'person',
          metadata: {
            employer: d.contributor_employer,
            contributor_type: d.contributor_type,
          },
        });
      }
    });

    // Also search by employer
    const { data: employers } = await supabase
      .from('political_donations')
      .select('contributor_employer')
      .ilike('contributor_employer', `%${query}%`)
      .not('contributor_employer', 'is', null)
      .limit(10);

    employers?.forEach(e => {
      const id = `company:${e.contributor_employer}`;
      if (!seen.has(id) && e.contributor_employer) {
        seen.add(id);
        nodes.push({
          id,
          label: e.contributor_employer,
          type: 'company',
        });
      }
    });
  }

  // Search childcare providers
  if (!type || type === 'provider') {
    const { data: providers } = await supabase
      .from('providers')
      .select('id, name, license_number, city, state')
      .ilike('name', `%${query}%`)
      .limit(10);

    providers?.forEach(p => {
      const id = `provider:${p.license_number}`;
      if (!seen.has(id)) {
        seen.add(id);
        nodes.push({
          id,
          label: p.name,
          type: 'provider',
          metadata: {
            license: p.license_number,
            city: p.city,
            state: p.state,
          },
        });
      }
    });
  }

  // Search PPP loan recipients
  if (!type || type === 'ppp') {
    const { data: pppLoans } = await supabase
      .from('ppp_loans')
      .select('borrower_name, current_approval_amount, forgiveness_amount, jobs_reported')
      .ilike('borrower_name', `%${query}%`)
      .limit(10);

    pppLoans?.forEach(p => {
      const id = `ppp:${p.borrower_name}`;
      if (!seen.has(id)) {
        seen.add(id);
        nodes.push({
          id,
          label: p.borrower_name,
          type: 'company',
          group: 'ppp',
          metadata: {
            ppp_amount: p.current_approval_amount,
            forgiven: p.forgiveness_amount,
            jobs: p.jobs_reported,
          },
        });
      }
    });
  }

  return { nodes, edges: [] };
}

async function getConnections(entityId: string) {
  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];
  const seen = new Set<string>();

  const [entityType, ...nameParts] = entityId.split(':');
  const entityName = nameParts.join(':');

  seen.add(entityId);

  if (entityType === 'recipient') {
    // Get all donations TO this recipient
    const { data: donations } = await supabase
      .from('political_donations')
      .select('id, contributor_name, contributor_employer, amount, receipt_date')
      .eq('recipient_name', entityName)
      .order('amount', { ascending: false })
      .limit(50);

    donations?.forEach(d => {
      if (d.contributor_name) {
        const donorId = `donor:${d.contributor_name}`;
        if (!seen.has(donorId)) {
          seen.add(donorId);
          nodes.push({
            id: donorId,
            label: d.contributor_name,
            type: 'person',
            metadata: { employer: d.contributor_employer },
          });
        }
        edges.push({
          id: `edge:${d.id}`,
          from: donorId,
          to: entityId,
          type: 'donation',
          amount: d.amount,
          metadata: { date: d.receipt_date },
        });
      }
    });
  }

  if (entityType === 'donor') {
    // Get all donations FROM this person
    const { data: donations } = await supabase
      .from('political_donations')
      .select('id, recipient_name, recipient_type, amount, receipt_date, contributor_employer')
      .eq('contributor_name', entityName)
      .order('amount', { ascending: false })
      .limit(50);

    let employer: string | null = null;

    donations?.forEach(d => {
      employer = employer || d.contributor_employer;

      const recipientId = `recipient:${d.recipient_name}`;
      if (!seen.has(recipientId)) {
        seen.add(recipientId);
        nodes.push({
          id: recipientId,
          label: d.recipient_name,
          type: d.recipient_type === 'PCC' ? 'politician' : 'committee',
        });
      }
      edges.push({
        id: `edge:${d.id}`,
        from: entityId,
        to: recipientId,
        type: 'donation',
        amount: d.amount,
      });
    });

    // If they have an employer, add that connection
    if (employer) {
      const employerId = `company:${employer}`;
      if (!seen.has(employerId)) {
        seen.add(employerId);
        nodes.push({
          id: employerId,
          label: employer,
          type: 'company',
        });
      }
      edges.push({
        id: `employment:${entityName}:${employer}`,
        from: entityId,
        to: employerId,
        type: 'employment',
        label: 'works at',
      });
    }
  }

  if (entityType === 'company') {
    // Get employees who donated
    const { data: employees } = await supabase
      .from('political_donations')
      .select('contributor_name, recipient_name, recipient_type, amount, id')
      .eq('contributor_employer', entityName)
      .order('amount', { ascending: false })
      .limit(50);

    const employeeDonations = new Map<string, { recipients: Map<string, number>, total: number }>();

    employees?.forEach(e => {
      if (!e.contributor_name) return;

      if (!employeeDonations.has(e.contributor_name)) {
        employeeDonations.set(e.contributor_name, { recipients: new Map(), total: 0 });
      }
      const emp = employeeDonations.get(e.contributor_name)!;
      emp.total += e.amount;
      emp.recipients.set(e.recipient_name, (emp.recipients.get(e.recipient_name) || 0) + e.amount);
    });

    employeeDonations.forEach((data, name) => {
      const empId = `donor:${name}`;
      if (!seen.has(empId)) {
        seen.add(empId);
        nodes.push({
          id: empId,
          label: name,
          type: 'person',
          metadata: { totalDonated: data.total },
        });
      }
      edges.push({
        id: `employment:${name}:${entityName}`,
        from: empId,
        to: entityId,
        type: 'employment',
        label: 'works at',
      });

      // Add recipient connections
      data.recipients.forEach((amount, recipientName) => {
        const recipientId = `recipient:${recipientName}`;
        if (!seen.has(recipientId)) {
          seen.add(recipientId);
          const recipientType = employees?.find(e => e.recipient_name === recipientName)?.recipient_type;
          nodes.push({
            id: recipientId,
            label: recipientName,
            type: recipientType === 'PCC' ? 'politician' : 'committee',
          });
        }
        edges.push({
          id: `donation:${name}:${recipientName}`,
          from: empId,
          to: recipientId,
          type: 'donation',
          amount,
        });
      });
    });

    // Check if this company has PPP loans
    const { data: pppLoans } = await supabase
      .from('ppp_loans')
      .select('loan_number, borrower_name, current_approval_amount, forgiveness_amount')
      .ilike('borrower_name', `%${entityName.split(' ')[0]}%`)
      .limit(5);

    pppLoans?.forEach(p => {
      const pppId = `ppp:${p.loan_number}`;
      if (!seen.has(pppId)) {
        seen.add(pppId);
        nodes.push({
          id: pppId,
          label: `PPP: ${p.borrower_name}`,
          type: 'company',
          group: 'ppp',
          metadata: { amount: p.current_approval_amount, forgiven: p.forgiveness_amount },
        });
      }
      edges.push({
        id: `ppp:${p.loan_number}`,
        from: pppId,
        to: entityId,
        type: 'ppp_loan',
        amount: p.current_approval_amount,
        label: 'PPP Loan',
      });
    });
  }

  if (entityType === 'ppp') {
    // This is a PPP loan - find related donations
    const { data: pppData } = await supabase
      .from('ppp_loans')
      .select('*')
      .eq('borrower_name', entityName)
      .single();

    if (pppData) {
      // Search for donations from this company's employees
      const companyId = `company:${entityName}`;
      if (!seen.has(companyId)) {
        seen.add(companyId);
        nodes.push({
          id: companyId,
          label: entityName,
          type: 'company',
        });
        edges.push({
          id: `ppp:link:${entityName}`,
          from: entityId,
          to: companyId,
          type: 'ppp_loan',
          amount: pppData.current_approval_amount,
        });
      }
    }
  }

  return { nodes, edges };
}
