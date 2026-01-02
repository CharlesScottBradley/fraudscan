import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface NetworkNode {
  id: string;
  label: string;
  type: 'person' | 'company' | 'politician' | 'committee' | 'provider' | 'organization' | 'vendor' | 'fraud_case';
  group?: string;
  metadata?: Record<string, unknown>;
}

interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  type: 'donation' | 'employment' | 'ppp_loan' | 'eidl_loan' | 'state_grant' | 'defendant' | 'ownership' | 'other';
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

  // Search EIDL loan recipients
  if (!type || type === 'eidl') {
    const { data: eidlLoans } = await supabase
      .from('eidl_loans')
      .select('borrower_name, loan_amount, borrower_state, borrower_city')
      .ilike('borrower_name', `%${query}%`)
      .limit(10);

    eidlLoans?.forEach(e => {
      const id = `eidl:${e.borrower_name}`;
      if (!seen.has(id)) {
        seen.add(id);
        nodes.push({
          id,
          label: e.borrower_name,
          type: 'company',
          group: 'eidl',
          metadata: {
            eidl_amount: e.loan_amount,
            state: e.borrower_state,
            city: e.borrower_city,
          },
        });
      }
    });
  }

  // Search state grant vendors
  if (!type || type === 'vendor') {
    const { data: vendors } = await supabase
      .from('state_grants')
      .select('recipient_name, payment_amount, source_state, agency, fiscal_year')
      .ilike('recipient_name', `%${query}%`)
      .order('payment_amount', { ascending: false })
      .limit(10);

    vendors?.forEach(v => {
      const id = `vendor:${v.recipient_name}`;
      if (!seen.has(id)) {
        seen.add(id);
        nodes.push({
          id,
          label: v.recipient_name,
          type: 'vendor',
          metadata: {
            state: v.source_state,
            agency: v.agency,
            sample_amount: v.payment_amount,
          },
        });
      }
    });
  }

  // Search organizations (unified entity registry)
  if (!type || type === 'org') {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, legal_name, dba_name, state, city, total_government_funding, is_fraud_prone_industry, fraud_score')
      .or(`legal_name.ilike.%${query}%,dba_name.ilike.%${query}%`)
      .order('total_government_funding', { ascending: false })
      .limit(10);

    orgs?.forEach(o => {
      const id = `org:${o.id}`;
      if (!seen.has(id)) {
        seen.add(id);
        nodes.push({
          id,
          label: o.dba_name || o.legal_name,
          type: 'organization',
          group: o.is_fraud_prone_industry ? 'fraud_prone' : undefined,
          metadata: {
            legal_name: o.legal_name,
            state: o.state,
            city: o.city,
            total_funding: o.total_government_funding,
            fraud_score: o.fraud_score,
          },
        });
      }
    });
  }

  // Search fraud cases
  if (!type || type === 'case') {
    const { data: cases } = await supabase
      .from('cases')
      .select('id, case_name, case_number, state, fraud_type, total_fraud_amount, status, summary')
      .or(`case_name.ilike.%${query}%,summary.ilike.%${query}%`)
      .order('total_fraud_amount', { ascending: false })
      .limit(10);

    cases?.forEach(c => {
      const id = `case:${c.id}`;
      if (!seen.has(id)) {
        seen.add(id);
        nodes.push({
          id,
          label: c.case_name,
          type: 'fraud_case',
          metadata: {
            case_number: c.case_number,
            state: c.state,
            fraud_type: c.fraud_type,
            amount: c.total_fraud_amount,
            status: c.status,
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

  if (entityType === 'eidl') {
    // EIDL loan - find related PPP loans and company connections
    const { data: eidlData } = await supabase
      .from('eidl_loans')
      .select('*, ppp_loan_id')
      .eq('borrower_name', entityName)
      .limit(1)
      .single();

    if (eidlData) {
      // Link to company
      const companyId = `company:${entityName}`;
      if (!seen.has(companyId)) {
        seen.add(companyId);
        nodes.push({
          id: companyId,
          label: entityName,
          type: 'company',
        });
        edges.push({
          id: `eidl:link:${entityName}`,
          from: entityId,
          to: companyId,
          type: 'eidl_loan',
          amount: eidlData.loan_amount,
        });
      }

      // If linked to PPP loan, show that connection
      if (eidlData.ppp_loan_id) {
        const { data: linkedPpp } = await supabase
          .from('ppp_loans')
          .select('borrower_name, current_approval_amount')
          .eq('id', eidlData.ppp_loan_id)
          .single();

        if (linkedPpp) {
          const pppId = `ppp:${linkedPpp.borrower_name}`;
          if (!seen.has(pppId)) {
            seen.add(pppId);
            nodes.push({
              id: pppId,
              label: `PPP: ${linkedPpp.borrower_name}`,
              type: 'company',
              group: 'ppp',
              metadata: { amount: linkedPpp.current_approval_amount },
            });
          }
          edges.push({
            id: `double-dip:${entityName}`,
            from: entityId,
            to: pppId,
            type: 'other',
            label: 'Double Dip',
          });
        }
      }
    }
  }

  if (entityType === 'vendor') {
    // State grant vendor - find all grants and connect to agencies
    const { data: grants } = await supabase
      .from('state_grants')
      .select('id, payment_amount, agency, fiscal_year, source_state')
      .eq('recipient_name', entityName)
      .order('payment_amount', { ascending: false })
      .limit(30);

    // Group by agency
    const agencyTotals = new Map<string, { amount: number; count: number; state: string }>();
    grants?.forEach(g => {
      if (g.agency) {
        const existing = agencyTotals.get(g.agency) || { amount: 0, count: 0, state: g.source_state };
        existing.amount += g.payment_amount || 0;
        existing.count++;
        agencyTotals.set(g.agency, existing);
      }
    });

    // Create agency nodes and edges
    agencyTotals.forEach((data, agency) => {
      const agencyId = `agency:${agency}`;
      if (!seen.has(agencyId)) {
        seen.add(agencyId);
        nodes.push({
          id: agencyId,
          label: agency,
          type: 'committee', // Using committee style for agencies
          metadata: { state: data.state },
        });
      }
      edges.push({
        id: `grant:${entityName}:${agency}`,
        from: agencyId,
        to: entityId,
        type: 'state_grant',
        amount: data.amount,
        label: `${data.count} payments`,
      });
    });

    // Check if vendor has PPP loans
    const { data: pppLoans } = await supabase
      .from('ppp_loans')
      .select('loan_number, borrower_name, current_approval_amount')
      .ilike('borrower_name', `%${entityName.split(' ')[0]}%`)
      .limit(3);

    pppLoans?.forEach(p => {
      const pppId = `ppp:${p.loan_number}`;
      if (!seen.has(pppId)) {
        seen.add(pppId);
        nodes.push({
          id: pppId,
          label: `PPP: ${p.borrower_name}`,
          type: 'company',
          group: 'ppp',
          metadata: { amount: p.current_approval_amount },
        });
      }
      edges.push({
        id: `ppp:${p.loan_number}:${entityName}`,
        from: pppId,
        to: entityId,
        type: 'ppp_loan',
        amount: p.current_approval_amount,
      });
    });
  }

  if (entityType === 'provider') {
    // Childcare provider - find political donations and PPP loans
    const licenseNumber = entityName;

    const { data: provider } = await supabase
      .from('providers')
      .select('*')
      .eq('license_number', licenseNumber)
      .single();

    if (provider) {
      const providerState = provider.state || 'MN';

      // Search for donations from employees of this provider (filter by state)
      const { data: employerDonations } = await supabase
        .from('political_donations')
        .select('id, contributor_name, recipient_name, recipient_type, amount')
        .eq('state', providerState)
        .ilike('contributor_employer', `%${provider.name}%`)
        .order('amount', { ascending: false })
        .limit(30);

      if (employerDonations && employerDonations.length > 0) {
        // Group donations by recipient
        const recipientTotals = new Map<string, { amount: number; type: string; donors: Set<string> }>();
        employerDonations.forEach(d => {
          const existing = recipientTotals.get(d.recipient_name) || { amount: 0, type: d.recipient_type, donors: new Set() };
          existing.amount += d.amount;
          if (d.contributor_name) existing.donors.add(d.contributor_name);
          recipientTotals.set(d.recipient_name, existing);
        });

        // Add politician/committee nodes and donation edges
        recipientTotals.forEach((data, recipientName) => {
          const recipientId = `recipient:${recipientName}`;
          if (!seen.has(recipientId)) {
            seen.add(recipientId);
            nodes.push({
              id: recipientId,
              label: recipientName,
              type: data.type === 'PCC' ? 'politician' : 'committee',
              metadata: { donor_count: data.donors.size },
            });
          }
          edges.push({
            id: `provider-donation:${licenseNumber}:${recipientName}`,
            from: entityId,
            to: recipientId,
            type: 'donation',
            amount: data.amount,
            label: `${data.donors.size} employees`,
          });
        });
      }

      // Check for PPP loans matching this provider
      const { data: pppLoans } = await supabase
        .from('ppp_loans')
        .select('loan_number, borrower_name, current_approval_amount, forgiveness_amount, borrower_state')
        .eq('borrower_state', providerState)
        .ilike('borrower_name', `%${provider.name.split(' ')[0]}%`)
        .limit(5);

      pppLoans?.forEach(p => {
        // Only include if name is a close match
        if (p.borrower_name.toLowerCase().includes(provider.name.toLowerCase().split(' ')[0])) {
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
            id: `provider-ppp:${p.loan_number}`,
            from: pppId,
            to: entityId,
            type: 'ppp_loan',
            amount: p.current_approval_amount,
          });
        }
      });

      // Check for state grants
      const { data: grants } = await supabase
        .from('state_grants')
        .select('id, payment_amount, agency, source_state')
        .eq('source_state', providerState)
        .ilike('recipient_name', `%${provider.name}%`)
        .order('payment_amount', { ascending: false })
        .limit(10);

      if (grants && grants.length > 0) {
        const totalGrants = grants.reduce((sum, g) => sum + (g.payment_amount || 0), 0);
        const grantNodeId = `grants:${licenseNumber}`;
        if (!seen.has(grantNodeId)) {
          seen.add(grantNodeId);
          nodes.push({
            id: grantNodeId,
            label: `State Grants: $${(totalGrants / 1000).toFixed(0)}K`,
            type: 'vendor',
            metadata: { count: grants.length, total: totalGrants },
          });
        }
        edges.push({
          id: `provider-grants:${licenseNumber}`,
          from: grantNodeId,
          to: entityId,
          type: 'state_grant',
          amount: totalGrants,
        });
      }
    }
  }

  if (entityType === 'org') {
    // Organization from unified registry - find all linked funding
    const orgId = entityName; // This is the UUID

    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (org) {
      // Find PPP loans linked to this org
      const { data: pppLoans } = await supabase
        .from('ppp_loans')
        .select('id, loan_number, borrower_name, current_approval_amount, forgiveness_amount')
        .eq('organization_id', orgId)
        .limit(10);

      pppLoans?.forEach(p => {
        const pppNodeId = `ppp:${p.loan_number}`;
        if (!seen.has(pppNodeId)) {
          seen.add(pppNodeId);
          nodes.push({
            id: pppNodeId,
            label: `PPP: $${(p.current_approval_amount / 1000).toFixed(0)}K`,
            type: 'company',
            group: 'ppp',
            metadata: { amount: p.current_approval_amount, forgiven: p.forgiveness_amount },
          });
        }
        edges.push({
          id: `ppp:org:${p.loan_number}`,
          from: pppNodeId,
          to: entityId,
          type: 'ppp_loan',
          amount: p.current_approval_amount,
        });
      });

      // Find EIDL loans linked to this org
      const { data: eidlLoans } = await supabase
        .from('eidl_loans')
        .select('id, sba_loan_number, borrower_name, loan_amount')
        .eq('organization_id', orgId)
        .limit(10);

      eidlLoans?.forEach(e => {
        const eidlNodeId = `eidl:${e.sba_loan_number}`;
        if (!seen.has(eidlNodeId)) {
          seen.add(eidlNodeId);
          nodes.push({
            id: eidlNodeId,
            label: `EIDL: $${(e.loan_amount / 1000).toFixed(0)}K`,
            type: 'company',
            group: 'eidl',
            metadata: { amount: e.loan_amount },
          });
        }
        edges.push({
          id: `eidl:org:${e.sba_loan_number}`,
          from: eidlNodeId,
          to: entityId,
          type: 'eidl_loan',
          amount: e.loan_amount,
        });
      });

      // Find state grants matching org name
      const { data: grants } = await supabase
        .from('state_grants')
        .select('id, recipient_name, payment_amount, agency, source_state')
        .ilike('recipient_name', `%${org.legal_name}%`)
        .order('payment_amount', { ascending: false })
        .limit(10);

      if (grants && grants.length > 0) {
        const totalGrants = grants.reduce((sum, g) => sum + (g.payment_amount || 0), 0);
        const grantNodeId = `grants:${orgId}`;
        if (!seen.has(grantNodeId)) {
          seen.add(grantNodeId);
          nodes.push({
            id: grantNodeId,
            label: `State Grants: $${(totalGrants / 1000000).toFixed(1)}M`,
            type: 'vendor',
            metadata: { count: grants.length, total: totalGrants },
          });
        }
        edges.push({
          id: `grants:org:${orgId}`,
          from: grantNodeId,
          to: entityId,
          type: 'state_grant',
          amount: totalGrants,
        });
      }
    }
  }

  if (entityType === 'case') {
    // Fraud case - find org name, donations, grants, and defendants
    const caseId = entityName; // UUID

    const { data: caseData } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (caseData) {
      // Extract organization name from case_name
      // Format: "United States v. Name et al. (Organization Name)" or just "Organization Name Fraud"
      let orgSearchTerms: string[] = [];

      // Try to extract from parentheses first
      const parenMatch = caseData.case_name.match(/\(([^)]+)\)/);
      if (parenMatch) {
        orgSearchTerms.push(parenMatch[1]);
      }

      // Also try the case summary for organization names
      if (caseData.summary) {
        // Extract quoted organization names from summary
        const quotedMatches = caseData.summary.match(/"([^"]+)"/g);
        quotedMatches?.forEach((m: string) => orgSearchTerms.push(m.replace(/"/g, '')));
      }

      // Use fraud type keywords if available
      if (caseData.fraud_type) {
        orgSearchTerms.push(caseData.fraud_type);
      }

      // Fallback: use first meaningful words from case name
      if (orgSearchTerms.length === 0) {
        const cleanName = caseData.case_name
          .replace(/United States v\./i, '')
          .replace(/et al\.?/gi, '')
          .replace(/\([^)]*\)/g, '')
          .trim();
        if (cleanName.length > 3) {
          orgSearchTerms.push(cleanName.split(' ')[0]);
        }
      }

      // Search for donations FROM organizations matching the case
      for (const searchTerm of orgSearchTerms.slice(0, 3)) { // Limit searches
        // Search by employer name
        const { data: employerDonations } = await supabase
          .from('political_donations')
          .select('id, contributor_name, contributor_employer, recipient_name, recipient_type, amount, receipt_date')
          .ilike('contributor_employer', `%${searchTerm}%`)
          .order('amount', { ascending: false })
          .limit(20);

        // Create organization node
        if (employerDonations && employerDonations.length > 0) {
          const orgNodeId = `company:${searchTerm}`;
          if (!seen.has(orgNodeId)) {
            seen.add(orgNodeId);
            nodes.push({
              id: orgNodeId,
              label: searchTerm,
              type: 'company',
              metadata: { linked_case: caseData.case_name },
            });
            edges.push({
              id: `case-org:${caseId}:${searchTerm}`,
              from: entityId,
              to: orgNodeId,
              type: 'defendant',
              label: 'implicated org',
            });
          }

          // Group donations by recipient
          const recipientTotals = new Map<string, { amount: number; type: string; donors: Set<string> }>();
          employerDonations.forEach(d => {
            const existing = recipientTotals.get(d.recipient_name) || { amount: 0, type: d.recipient_type, donors: new Set() };
            existing.amount += d.amount;
            if (d.contributor_name) existing.donors.add(d.contributor_name);
            recipientTotals.set(d.recipient_name, existing);
          });

          // Add politician/committee nodes and edges
          recipientTotals.forEach((data, recipientName) => {
            const recipientId = `recipient:${recipientName}`;
            if (!seen.has(recipientId)) {
              seen.add(recipientId);
              nodes.push({
                id: recipientId,
                label: recipientName,
                type: data.type === 'PCC' ? 'politician' : 'committee',
                metadata: { donor_count: data.donors.size },
              });
            }
            edges.push({
              id: `case-donation:${searchTerm}:${recipientName}`,
              from: orgNodeId,
              to: recipientId,
              type: 'donation',
              amount: data.amount,
              label: `${data.donors.size} donors`,
            });
          });
        }

        // Also search for contributor NAME matching (for orgs that donate directly)
        const { data: directDonations } = await supabase
          .from('political_donations')
          .select('id, contributor_name, recipient_name, recipient_type, amount')
          .ilike('contributor_name', `%${searchTerm}%`)
          .order('amount', { ascending: false })
          .limit(20);

        if (directDonations && directDonations.length > 0) {
          directDonations.forEach(d => {
            // Add the donating entity
            const donorId = `donor:${d.contributor_name}`;
            if (!seen.has(donorId)) {
              seen.add(donorId);
              nodes.push({
                id: donorId,
                label: d.contributor_name,
                type: 'company', // Organizations donating directly
                metadata: { linked_case: caseData.case_name },
              });
              edges.push({
                id: `case-donor:${caseId}:${d.contributor_name}`,
                from: entityId,
                to: donorId,
                type: 'defendant',
                label: 'related entity',
              });
            }

            // Add recipient
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
              id: `direct-donation:${d.id}`,
              from: donorId,
              to: recipientId,
              type: 'donation',
              amount: d.amount,
            });
          });
        }

        // Search for state grants to this organization
        const { data: grants } = await supabase
          .from('state_grants')
          .select('id, recipient_name, payment_amount, agency, source_state')
          .ilike('recipient_name', `%${searchTerm}%`)
          .order('payment_amount', { ascending: false })
          .limit(10);

        if (grants && grants.length > 0) {
          const totalGrants = grants.reduce((sum, g) => sum + (g.payment_amount || 0), 0);
          const grantNodeId = `grants:${searchTerm}`;
          if (!seen.has(grantNodeId)) {
            seen.add(grantNodeId);
            nodes.push({
              id: grantNodeId,
              label: `State Grants: $${(totalGrants / 1000000).toFixed(1)}M`,
              type: 'vendor',
              metadata: { count: grants.length, total: totalGrants },
            });
            edges.push({
              id: `case-grants:${caseId}:${searchTerm}`,
              from: grantNodeId,
              to: entityId,
              type: 'state_grant',
              amount: totalGrants,
              label: `${grants.length} payments`,
            });
          }
        }

        // Search for PPP loans
        const { data: pppLoans } = await supabase
          .from('ppp_loans')
          .select('loan_number, borrower_name, current_approval_amount, forgiveness_amount')
          .ilike('borrower_name', `%${searchTerm}%`)
          .limit(10);

        pppLoans?.forEach(p => {
          const pppId = `ppp:${p.loan_number}`;
          if (!seen.has(pppId)) {
            seen.add(pppId);
            nodes.push({
              id: pppId,
              label: p.borrower_name,
              type: 'company',
              group: 'ppp',
              metadata: { amount: p.current_approval_amount, forgiven: p.forgiveness_amount },
            });
          }
          edges.push({
            id: `case-ppp:${p.loan_number}`,
            from: pppId,
            to: entityId,
            type: 'ppp_loan',
            amount: p.current_approval_amount,
            label: 'PPP loan',
          });
        });
      }

      // Also get defendants if any exist
      const { data: defendants } = await supabase
        .from('defendants')
        .select('id, name, role, sentence, restitution_amount')
        .eq('case_id', caseId);

      defendants?.forEach(d => {
        const defId = `defendant:${d.id}`;
        if (!seen.has(defId)) {
          seen.add(defId);
          nodes.push({
            id: defId,
            label: d.name,
            type: 'person',
            metadata: {
              role: d.role,
              sentence: d.sentence,
              restitution: d.restitution_amount,
            },
          });
        }
        edges.push({
          id: `defendant:${d.id}:${caseId}`,
          from: defId,
          to: entityId,
          type: 'defendant',
          label: d.role || 'defendant',
        });
      });
    }
  }

  return { nodes, edges };
}
