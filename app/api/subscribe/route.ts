import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valid source prefixes
const VALID_SOURCE_PREFIXES = ['footer', 'homepage', 'about', 'case:', 'state:'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      );
    }

    // Validate source if provided
    let validatedSource = source || 'unknown';
    if (source) {
      const isValidSource = VALID_SOURCE_PREFIXES.some(prefix => 
        source === prefix || source.startsWith(prefix)
      );
      if (!isValidSource) {
        validatedSource = 'unknown';
      }
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('email_subscribers')
      .select('id, unsubscribed_at')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existing) {
      // If they unsubscribed before, resubscribe them
      if (existing.unsubscribed_at) {
        const { error: updateError } = await supabase
          .from('email_subscribers')
          .update({
            unsubscribed_at: null,
            subscribed_at: new Date().toISOString(),
            source: validatedSource,
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error resubscribing:', updateError);
          return NextResponse.json(
            { error: 'Failed to subscribe' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Resubscribed',
          resubscribed: true,
        });
      }

      // Already subscribed and active
      return NextResponse.json({
        success: true,
        message: 'Already subscribed',
        already_subscribed: true,
      });
    }

    // Insert new subscriber
    const { error: insertError } = await supabase
      .from('email_subscribers')
      .insert({
        email: normalizedEmail,
        source: validatedSource,
      });

    if (insertError) {
      // Handle unique constraint violation (race condition)
      if (insertError.code === '23505') {
        return NextResponse.json({
          success: true,
          message: 'Already subscribed',
          already_subscribed: true,
        });
      }

      console.error('Error inserting subscriber:', insertError);
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscribed',
    });
  } catch (error) {
    console.error('Error processing subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}

