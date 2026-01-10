import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminAuth, unauthorizedResponse } from '@/lib/adminAuth';
import nodemailer from 'nodemailer';
import Imap from 'imap';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// SMTP transporter for sending emails
const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Save email to Sent folder via IMAP
 */
async function saveToSentFolder(rawEmail: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: process.env.EMAIL_USER!,
      password: process.env.EMAIL_PASSWORD!,
      host: 'mail.privateemail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', () => {
      imap.openBox('Sent', false, (err) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        imap.append(rawEmail, { mailbox: 'Sent', flags: ['\\Seen'] }, (appendErr) => {
          imap.end();
          if (appendErr) {
            reject(appendErr);
          } else {
            resolve();
          }
        });
      });
    });

    imap.once('error', (err: Error) => {
      reject(err);
    });

    imap.connect();
  });
}

/**
 * Build raw email string for IMAP append
 */
function buildRawEmail(to: string, subject: string, body: string, messageId: string, originalMessageId?: string): string {
  const date = new Date().toUTCString();
  const from = `"SomaliScan" <${process.env.EMAIL_USER}>`;

  let headers = `From: ${from}\r\n`;
  headers += `To: ${to}\r\n`;
  headers += `Subject: ${subject.startsWith('Re:') ? subject : `Re: ${subject}`}\r\n`;
  headers += `Date: ${date}\r\n`;
  headers += `Message-ID: ${messageId}\r\n`;
  if (originalMessageId) {
    headers += `In-Reply-To: ${originalMessageId}\r\n`;
    headers += `References: ${originalMessageId}\r\n`;
  }
  headers += `MIME-Version: 1.0\r\n`;
  headers += `Content-Type: text/plain; charset=utf-8\r\n`;
  headers += `\r\n`;

  return headers + body;
}

/**
 * Send an email response and save to Sent folder
 */
async function sendEmailResponse(to: string, subject: string, body: string, originalMessageId?: string) {
  const mailOptions: nodemailer.SendMailOptions = {
    from: `"SomaliScan" <${process.env.EMAIL_USER}>`,
    to,
    subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
    text: body,
    ...(originalMessageId && {
      inReplyTo: originalMessageId,
      references: originalMessageId
    })
  };

  const info = await transporter.sendMail(mailOptions);

  // Save to Sent folder
  try {
    const rawEmail = buildRawEmail(to, subject, body, info.messageId, originalMessageId);
    await saveToSentFolder(rawEmail);
  } catch (err) {
    console.error('Failed to save to Sent folder:', err);
    // Don't fail the whole operation if Sent folder save fails
  }

  return info;
}

/**
 * GET /api/admin/emails/[id]
 * Get a single email with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth);
  }

  const { id } = await params;

  try {
    const { data: email, error } = await supabase
      .from('email_inbox')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Email not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(email);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/emails/[id]
 * Update email status, draft response, etc.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth);
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    // Allowed fields to update
    const allowedFields = [
      'status', 'draft_response', 'is_spam', 'spam_reason',
      'category', 'summary'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Set responded_at if marking as responded
    if (body.status === 'responded') {
      updateData.responded_at = new Date().toISOString();
    }

    const { data: email, error } = await supabase
      .from('email_inbox')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Email not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/emails/[id]
 * Delete an email from the inbox
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth);
  }

  const { id } = await params;

  try {
    const { error } = await supabase
      .from('email_inbox')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Email deleted' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/emails/[id]
 * Send the draft response as an actual email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth);
  }

  const { id } = await params;

  try {
    // Get the email record
    const { data: email, error: fetchError } = await supabase
      .from('email_inbox')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Email not found' }, { status: 404 });
      }
      throw fetchError;
    }

    // Validate we can send
    if (!email.draft_response) {
      return NextResponse.json({ error: 'No draft response to send' }, { status: 400 });
    }

    if (!email.from_address) {
      return NextResponse.json({ error: 'No recipient address' }, { status: 400 });
    }

    if (email.is_spam) {
      return NextResponse.json({ error: 'Cannot send to spam emails' }, { status: 400 });
    }

    // Send the email
    const sendResult = await sendEmailResponse(
      email.from_address,
      email.subject || 'Your inquiry',
      email.draft_response,
      email.message_id
    );

    // Update the record
    const { error: updateError } = await supabase
      .from('email_inbox')
      .update({
        status: 'responded',
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update email status after sending:', updateError);
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: sendResult.messageId,
      to: email.from_address
    });
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json({
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
