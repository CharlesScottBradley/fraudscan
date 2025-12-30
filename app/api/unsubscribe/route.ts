import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Encode email to token (base64)
export function encodeUnsubscribeToken(email: string): string {
  return Buffer.from(email.toLowerCase()).toString('base64url');
}

// Decode token back to email
export function decodeUnsubscribeToken(token: string): string | null {
  try {
    return Buffer.from(token, 'base64url').toString('utf-8');
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing unsubscribe token' },
        { status: 400 }
      );
    }

    const email = decodeUnsubscribeToken(token);

    if (!email) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe token' },
        { status: 400 }
      );
    }

    // Find the subscriber
    const { data: subscriber, error: findError } = await supabase
      .from('email_subscribers')
      .select('id, unsubscribed_at')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (findError) {
      console.error('Error finding subscriber:', findError);
      return NextResponse.json(
        { error: 'Failed to process unsubscribe' },
        { status: 500 }
      );
    }

    if (!subscriber) {
      // Email not found - might already be unsubscribed or never subscribed
      return NextResponse.json({
        success: true,
        message: 'Unsubscribed',
        not_found: true,
      });
    }

    if (subscriber.unsubscribed_at) {
      // Already unsubscribed
      return NextResponse.json({
        success: true,
        message: 'Already unsubscribed',
        already_unsubscribed: true,
      });
    }

    // Mark as unsubscribed
    const { error: updateError } = await supabase
      .from('email_subscribers')
      .update({
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('id', subscriber.id);

    if (updateError) {
      console.error('Error unsubscribing:', updateError);
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed successfully',
    });
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support POST for form submissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find the subscriber
    const { data: subscriber, error: findError } = await supabase
      .from('email_subscribers')
      .select('id, unsubscribed_at')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (findError) {
      console.error('Error finding subscriber:', findError);
      return NextResponse.json(
        { error: 'Failed to process unsubscribe' },
        { status: 500 }
      );
    }

    if (!subscriber) {
      return NextResponse.json({
        success: true,
        message: 'Unsubscribed',
        not_found: true,
      });
    }

    if (subscriber.unsubscribed_at) {
      return NextResponse.json({
        success: true,
        message: 'Already unsubscribed',
        already_unsubscribed: true,
      });
    }

    // Mark as unsubscribed
    const { error: updateError } = await supabase
      .from('email_subscribers')
      .update({
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('id', subscriber.id);

    if (updateError) {
      console.error('Error unsubscribing:', updateError);
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed successfully',
    });
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

