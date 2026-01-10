/**
 * Email Fetcher Library
 *
 * Core logic for fetching emails from IMAP and processing with Claude.
 * Used by both the CLI script and API endpoint.
 */

import Imap from 'imap';
import { simpleParser, ParsedMail, AddressObject } from 'mailparser';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Helper to extract first address from potentially array-type address field
function getFirstAddress(addr: AddressObject | AddressObject[] | undefined): { address?: string; name?: string } | undefined {
  if (!addr) return undefined;
  if (Array.isArray(addr)) {
    return addr[0]?.value?.[0];
  }
  return addr.value?.[0];
}

// Types
interface ImapConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  tlsOptions: { rejectUnauthorized: boolean };
}

interface SpamResult {
  isSpam: boolean;
  reason: string | null;
}

interface AIResult {
  category: string;
  summary: string;
  needs_response: boolean;
  draft_response: string | null;
}

interface FetchResult {
  processed: number;
  skipped: number;
  spam: number;
  errors: string[];
}

interface RawEmail {
  seqno: number;
  uid: number;
  buffer: string;
}

// Spam patterns
const SPAM_PATTERNS = [
  /\b(SEO|search engine optimization)\b/i,
  /\b(backlink|link building|guest post)\b/i,
  /\b(crypto|bitcoin|ethereum|token|coin listing|ICO|airdrop)\b/i,
  /\b(web design|website redesign|improve your website)\b/i,
  /\b(lead generation|b2b leads|sales leads)\b/i,
  /\b(offshore|outsourc)/i,
  /\b(VA|virtual assistant) services\b/i,
  /\b(influencer marketing|social media marketing)\b/i,
  /\bunsubscribe\b.*\bclick here\b/i,
  /\b(partnership|collaboration) opportunity\b/i,
  /\bI came across your (website|site|company)\b/i,
  /\bI noticed your (website|site) (could use|needs)\b/i,
];

const SPAM_DOMAINS = [
  'fiverr.com', 'upwork.com', 'freelancer.com',
  'mailchimp.com', 'sendinblue.com', 'constantcontact.com'
];

/**
 * Check if email looks like spam
 */
export function detectSpam(email: ParsedMail): SpamResult {
  const content = `${email.subject || ''} ${email.text || ''} ${email.from?.text || ''}`.toLowerCase();

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      return { isSpam: true, reason: `Matched pattern: ${pattern.source.substring(0, 50)}` };
    }
  }

  const fromAddress = email.from?.value?.[0]?.address;
  const fromDomain = fromAddress?.split('@')[1]?.toLowerCase();
  if (fromDomain && SPAM_DOMAINS.some(d => fromDomain.includes(d))) {
    return { isSpam: true, reason: `From spam-associated domain: ${fromDomain}` };
  }

  return { isSpam: false, reason: null };
}

/**
 * Process email with Claude - categorize, summarize, draft response
 */
export async function processWithClaude(email: ParsedMail, anthropic: Anthropic): Promise<AIResult> {
  // Truncate body to avoid token limits
  const bodyText = (email.text || email.html || '').substring(0, 15000);

  const prompt = `You are processing an email for a government funding transparency website (SomaliScan.com).

EMAIL:
From: ${email.from?.text || 'Unknown'}
Subject: ${email.subject || 'No subject'}
Body:
${bodyText}

---

Respond with a JSON object (no markdown, just raw JSON):
{
  "category": "contact|inquiry|alert|tip|media|legal|other",
  "summary": "2-3 sentence summary of what this email is about and what they want",
  "needs_response": true/false,
  "draft_response": "Your draft response here, or null if no response needed"
}

CATEGORY DEFINITIONS:
- contact: General contact form submissions, hello messages
- inquiry: Questions about the data, requests for information
- alert: Automated alerts, system notifications
- tip: Tips about fraud, corruption, or data leads
- media: Press/journalist inquiries
- legal: Legal notices, takedown requests, lawyer letters
- other: Anything else

DRAFT RESPONSE RULES (critical):
- Write like a real person, not AI
- NO emojis ever
- NO em dashes (use commas or periods instead)
- NO phrases like "I'd be happy to" or "Thank you for reaching out"
- NO "It's not X, it's Y" constructions
- Keep it short and direct
- Use contractions naturally (don't, won't, can't)
- Sign off with just "- SomaliScan Team" (no "Best regards" or "Sincerely")
- If it's spam or doesn't need a response, set draft_response to null`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch (error) {
    console.error('Claude processing error:', error instanceof Error ? error.message : error);
    return {
      category: 'other',
      summary: 'Failed to process with AI',
      needs_response: false,
      draft_response: null
    };
  }
}

/**
 * Connect to IMAP server
 */
export function connectImap(config: ImapConfig): Promise<Imap> {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);
    imap.once('ready', () => resolve(imap));
    imap.once('error', reject);
    imap.connect();
  });
}

/**
 * Fetch emails from IMAP mailbox
 */
export function fetchEmails(imap: Imap, onlyNew: boolean = true): Promise<RawEmail[]> {
  return new Promise((resolve, reject) => {
    imap.openBox('INBOX', false, (err, box) => {
      if (err) return reject(err);

      const searchCriteria = onlyNew ? ['UNSEEN'] : ['ALL'];

      imap.search(searchCriteria, (err, results) => {
        if (err) return reject(err);

        if (!results || results.length === 0) {
          return resolve([]);
        }

        const fetch = imap.fetch(results, {
          bodies: '',
          struct: true,
          markSeen: true
        });

        const emails: RawEmail[] = [];

        fetch.on('message', (msg, seqno) => {
          let buffer = '';

          msg.on('body', (stream) => {
            stream.on('data', (chunk: Buffer) => {
              buffer += chunk.toString('utf8');
            });
          });

          msg.once('attributes', (attrs) => {
            emails.push({
              seqno,
              uid: attrs.uid,
              buffer
            });
          });
        });

        fetch.once('error', reject);
        fetch.once('end', () => resolve(emails));
      });
    });
  });
}

/**
 * Parse raw email buffer
 */
export async function parseEmail(rawEmail: RawEmail): Promise<ParsedMail> {
  return simpleParser(rawEmail.buffer);
}

/**
 * Main email fetching function
 */
export async function fetchAndProcessEmails(options: {
  fetchAll?: boolean;
  dryRun?: boolean;
  onProgress?: (message: string) => void;
}): Promise<FetchResult> {
  const { fetchAll = false, dryRun = false, onProgress = console.log } = options;

  const config: ImapConfig = {
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    host: process.env.EMAIL_IMAP_HOST || 'mail.privateemail.com',
    port: parseInt(process.env.EMAIL_IMAP_PORT || '993'),
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  };

  if (!config.user || !config.password) {
    throw new Error('Missing EMAIL_USER or EMAIL_PASSWORD in environment');
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Missing ANTHROPIC_API_KEY in environment');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const result: FetchResult = {
    processed: 0,
    skipped: 0,
    spam: 0,
    errors: []
  };

  let imap: Imap | null = null;

  try {
    onProgress(`Connecting to ${config.host}...`);
    imap = await connectImap(config);
    onProgress('Connected to IMAP server');

    const rawEmails = await fetchEmails(imap, !fetchAll);
    onProgress(`Found ${rawEmails.length} emails to process`);

    if (rawEmails.length === 0) {
      return result;
    }

    for (const raw of rawEmails) {
      try {
        const email = await parseEmail(raw);
        onProgress(`Processing: ${email.subject || '(no subject)'}`);

        // Check for duplicates
        const messageId = email.messageId || `${email.date}-${email.from?.text}`;
        if (!dryRun) {
          const { data: existing } = await supabase
            .from('email_inbox')
            .select('id')
            .eq('message_id', messageId)
            .single();

          if (existing) {
            onProgress('  SKIPPED: Already in database');
            result.skipped++;
            continue;
          }
        }

        // Detect spam
        const spamInfo = detectSpam(email);
        if (spamInfo.isSpam) {
          onProgress(`  SPAM: ${spamInfo.reason}`);
          result.spam++;
        }

        // Process with Claude (skip for obvious spam)
        let aiResult: AIResult = {
          category: 'spam',
          summary: spamInfo.reason || 'Detected as spam',
          needs_response: false,
          draft_response: null
        };

        if (!spamInfo.isSpam) {
          onProgress('  Processing with Claude...');
          aiResult = await processWithClaude(email, anthropic);
          onProgress(`  Category: ${aiResult.category}`);
        }

        // Save to database
        if (!dryRun) {
          const toAddr = getFirstAddress(email.to);
          const record = {
            message_id: messageId,
            from_address: email.from?.value?.[0]?.address || email.from?.text || 'unknown',
            from_name: email.from?.value?.[0]?.name || null,
            to_address: toAddr?.address || null,
            subject: email.subject || null,
            body_text: email.text || null,
            body_html: email.html || null,
            received_at: email.date || new Date().toISOString(),
            is_spam: spamInfo.isSpam,
            spam_reason: spamInfo.reason,
            category: spamInfo.isSpam ? 'spam' : aiResult.category,
            summary: aiResult.summary,
            draft_response: aiResult.draft_response,
            status: 'new'
          };

          const { error } = await supabase
            .from('email_inbox')
            .insert(record);

          if (error) {
            result.errors.push(`Failed to save ${email.subject}: ${error.message}`);
            continue;
          }

          onProgress('  SAVED');
        }

        result.processed++;
      } catch (emailError) {
        const errorMsg = emailError instanceof Error ? emailError.message : 'Unknown error';
        result.errors.push(errorMsg);
        onProgress(`  ERROR: ${errorMsg}`);
      }
    }

    return result;
  } finally {
    if (imap) {
      imap.end();
    }
  }
}
