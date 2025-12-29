#!/usr/bin/env python3
"""Import MN childcare PPP loans into Supabase."""

import csv
import os
from supabase import create_client

SUPABASE_URL = 'https://powsedjqwgniermriadb.supabase.co'
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# If no env var, try to read from .env.local
if not SUPABASE_KEY:
    try:
        with open('.env.local', 'r') as f:
            for line in f:
                if line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
                    SUPABASE_KEY = line.split('=', 1)[1].strip()
                    break
    except:
        pass

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def parse_date(date_str):
    """Parse MM/DD/YYYY to YYYY-MM-DD."""
    if not date_str or date_str.strip() == '':
        return None
    try:
        parts = date_str.split('/')
        if len(parts) == 3:
            return f"{parts[2]}-{parts[0].zfill(2)}-{parts[1].zfill(2)}"
    except:
        pass
    return None

def parse_float(val):
    """Parse numeric value."""
    if not val or val.strip() == '':
        return None
    try:
        return float(val.replace(',', ''))
    except:
        return None

def parse_int(val):
    """Parse integer value."""
    if not val or val.strip() == '':
        return None
    try:
        return int(float(val))
    except:
        return None

def main():
    csv_file = 'ppp_150k_plus.csv'

    # Read MN childcare records (NAICS 624410)
    records = []
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Filter for MN and childcare NAICS code
            if row.get('BorrowerState') == 'MN' and row.get('NAICSCode') == '624410':
                records.append({
                    'loan_number': row.get('LoanNumber'),
                    'date_approved': parse_date(row.get('DateApproved')),
                    'borrower_name': row.get('BorrowerName'),
                    'borrower_address': row.get('BorrowerAddress'),
                    'borrower_city': row.get('BorrowerCity'),
                    'borrower_state': row.get('BorrowerState'),
                    'borrower_zip': row.get('BorrowerZip'),
                    'initial_approval_amount': parse_float(row.get('InitialApprovalAmount')),
                    'current_approval_amount': parse_float(row.get('CurrentApprovalAmount')),
                    'forgiveness_amount': parse_float(row.get('ForgivenessAmount')),
                    'forgiveness_date': parse_date(row.get('ForgivenessDate')),
                    'loan_status': row.get('LoanStatus'),
                    'jobs_reported': parse_int(row.get('JobsReported')),
                    'naics_code': row.get('NAICSCode'),
                    'business_type': row.get('BusinessType'),
                    'lender_name': row.get('OriginatingLender'),
                    'payroll_proceed': parse_float(row.get('PAYROLL_PROCEED')),
                    'rent_proceed': parse_float(row.get('RENT_PROCEED')),
                    'utilities_proceed': parse_float(row.get('UTILITIES_PROCEED')),
                    'is_nonprofit': row.get('NonProfit', '').upper() == 'Y',
                })

    print(f"Found {len(records)} MN childcare PPP loans")

    # Insert in batches
    batch_size = 50
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        try:
            result = supabase.table('ppp_loans').upsert(batch, on_conflict='loan_number').execute()
            print(f"Inserted batch {i//batch_size + 1}: {len(batch)} records")
        except Exception as e:
            print(f"Error inserting batch: {e}")
            # Try one by one
            for record in batch:
                try:
                    supabase.table('ppp_loans').upsert(record, on_conflict='loan_number').execute()
                except Exception as e2:
                    print(f"Error inserting {record['borrower_name']}: {e2}")

    print("Done!")

if __name__ == '__main__':
    main()
