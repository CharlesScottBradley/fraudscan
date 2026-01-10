#!/usr/bin/env node
/**
 * Send Pending Email Responses
 *
 * Sends all emails that have draft_response but haven't been actually sent.
 *
 * Usage:
 *   node scripts/send-pending-responses.js           # Send all pending
 *   node scripts/send-pending-responses.js --dry-run # Preview without sending
 *   node scripts/send-pending-responses.js --limit 5 # Send only first 5
 */

const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function sendEmail(to, subject, body, originalMessageId) {
  const mailOptions = {
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
  return info;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : null;

  log('=== Send Pending Email Responses ===');
  log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}${limit ? ` (limit: ${limit})` : ''}`);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    log('ERROR: Missing EMAIL_USER or EMAIL_PASSWORD');
    process.exit(1);
  }

  try {
    // Get emails that need to be sent:
    // - Have draft_response
    // - Not spam
    // - Status is 'responded' (marked for sending) OR status is 'new'/'reviewed' with draft
    let query = supabase
      .from('email_inbox')
      .select('*')
      .eq('status', 'responded')
      .eq('is_spam', false)
      .not('draft_response', 'is', null)
      .order('received_at', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data: emails, error } = await query;

    if (error) {
      log(`ERROR: ${error.message}`);
      process.exit(1);
    }

    log(`Found ${emails.length} emails to send`);

    if (emails.length === 0) {
      log('No pending emails to send');
      return;
    }

    let sent = 0;
    let failed = 0;
    const results = [];

    for (const email of emails) {
      log(`\n--- Processing: ${email.subject || '(no subject)'}`);
      log(`    To: ${email.from_address}`);
      log(`    Category: ${email.category}`);

      if (!email.draft_response || email.draft_response === 'None') {
        log('    SKIP: No valid draft response');
        continue;
      }

      if (dryRun) {
        log('    DRY RUN: Would send:');
        log(`    Response preview: ${email.draft_response.substring(0, 100)}...`);
        sent++;
        continue;
      }

      try {
        const result = await sendEmail(
          email.from_address,
          email.subject || 'Your inquiry',
          email.draft_response,
          email.message_id
        );

        log(`    SENT: ${result.messageId}`);

        // Update the record to mark as sent (update responded_at to now)
        await supabase
          .from('email_inbox')
          .update({
            responded_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id);

        sent++;
        results.push({ id: email.id, to: email.from_address, success: true, messageId: result.messageId });

        // Delay between sends to avoid rate limiting
        await new Promise(r => setTimeout(r, 2000));

      } catch (err) {
        log(`    FAILED: ${err.message}`);
        failed++;
        results.push({ id: email.id, to: email.from_address, success: false, error: err.message });
      }
    }

    log('\n' + '='.repeat(50));
    log('Summary:');
    log(`  Sent: ${sent}`);
    log(`  Failed: ${failed}`);
    log('='.repeat(50));

    if (!dryRun && results.length > 0) {
      log('\nResults:');
      results.forEach(r => {
        if (r.success) {
          log(`  ✓ ${r.to} - ${r.messageId}`);
        } else {
          log(`  ✗ ${r.to} - ${r.error}`);
        }
      });
    }

  } catch (error) {
    log(`ERROR: ${error.message}`);
    process.exit(1);
  }
}

main();
