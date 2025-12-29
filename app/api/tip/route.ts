import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      tip_type,
      fraud_types,
      state,
      subject,
      description,
      related_entity_name,
      related_address,
      evidence_description,
      contact_email,
    } = body;

    // Validate required fields
    if (!tip_type || !subject || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: tip_type, subject, and description are required' },
        { status: 400 }
      );
    }

    // Validate tip_type
    const validTipTypes = ['fraud_report', 'correction', 'document', 'lead', 'other'];
    if (!validTipTypes.includes(tip_type)) {
      return NextResponse.json(
        { error: 'Invalid tip_type' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Insert tip
    const { data, error } = await supabase
      .from('tips')
      .insert({
        tip_type,
        fraud_types: fraud_types || [],
        state: state || null,
        subject: subject.substring(0, 500),
        description: description.substring(0, 10000),
        related_entity_name: related_entity_name?.substring(0, 500) || null,
        related_address: related_address?.substring(0, 500) || null,
        evidence_description: evidence_description?.substring(0, 2000) || null,
        contact_email: contact_email || null,
        status: 'pending',
        priority: 'normal',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting tip:', error);
      return NextResponse.json(
        { error: 'Failed to submit tip' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tip submitted successfully',
      tip_id: data.id,
    });
  } catch (error) {
    console.error('Error processing tip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
