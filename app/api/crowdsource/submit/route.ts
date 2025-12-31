import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Route segment config for large file uploads
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for large uploads

// Turnstile verification
async function verifyTurnstile(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  // Skip verification in development if no key configured
  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY not configured - skipping verification');
    return true;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valid US state codes
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

// Valid submission types
const SUBMISSION_TYPES = ['file_upload', 'tip', 'lead', 'connection', 'document'];

// Valid data types
const DATA_TYPES = [
  'childcare_providers', 'doj_fraud_cases', 'state_vendors',
  'campaign_finance', 'business_registry', 'covid_relief',
  'medicaid_providers', 'ccap_payments', 'state_vendor_payments',
  'hcbs_payments', 'covid_relief_recipients', 'other'
];

// Valid tip categories
const TIP_CATEGORIES = ['fraud_report', 'data_source', 'connection', 'pattern', 'document', 'other'];

// Max file size: 50MB (Vercel/platform limit)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Max tip content: 50,000 characters
const MAX_TIP_LENGTH = 50000;

// Accepted file types
const ACCEPTED_FILE_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/pdf',
  'application/zip',
  'application/json',
  'text/plain',
  'text/tab-separated-values',
];

interface SubmitRequest {
  state_code: string;
  data_type: string;
  submission_type: string;
  gap_ids?: string[];
  title: string;
  description?: string;
  tip_content?: string;
  tip_category?: string;
  related_entities?: Array<{ type: string; name: string; role?: string }>;
  source_url?: string;
  source_description?: string;
  submitter_email: string;
  username?: string;
}

// Points for different submission types (pending review)
const SUBMISSION_POINTS: Record<string, number> = {
  file_upload: 5,
  tip: 3,
  lead: 3,
  connection: 3,
  document: 5,
};

export async function POST(request: NextRequest) {
  try {
    // Check if it's a multipart form (file upload) or JSON (tip/lead)
    const contentType = request.headers.get('content-type') || '';
    
    let body: SubmitRequest;
    let file: File | null = null;
    let turnstileToken: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      
      // Extract Turnstile token
      turnstileToken = formData.get('cf-turnstile-response') as string;
      
      // Extract file
      const uploadedFile = formData.get('file');
      if (uploadedFile && uploadedFile instanceof File) {
        file = uploadedFile;
      }

      // Extract other fields
      body = {
        state_code: formData.get('state_code') as string,
        data_type: formData.get('data_type') as string,
        submission_type: formData.get('submission_type') as string || 'file_upload',
        gap_ids: formData.get('gap_ids') ? JSON.parse(formData.get('gap_ids') as string) : [],
        title: formData.get('title') as string,
        description: formData.get('description') as string || undefined,
        source_url: formData.get('source_url') as string || undefined,
        source_description: formData.get('source_description') as string || undefined,
        submitter_email: formData.get('submitter_email') as string,
        username: formData.get('username') as string || undefined,
      };
    } else {
      // Handle JSON body (tips/leads/connections)
      const jsonBody = await request.json();
      turnstileToken = jsonBody['cf-turnstile-response'];
      body = jsonBody;
    }

    // Verify Turnstile CAPTCHA
    if (!turnstileToken) {
      return NextResponse.json(
        { error: 'CAPTCHA verification required' },
        { status: 400 }
      );
    }

    const isValidCaptcha = await verifyTurnstile(turnstileToken);
    if (!isValidCaptcha) {
      return NextResponse.json(
        { error: 'CAPTCHA verification failed. Please try again.' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.state_code || !body.data_type || !body.title || !body.submitter_email) {
      return NextResponse.json(
        { error: 'Missing required fields: state_code, data_type, title, and submitter_email are required' },
        { status: 400 }
      );
    }

    // Validate state code
    const stateCode = body.state_code.toUpperCase();
    if (!US_STATES.includes(stateCode)) {
      return NextResponse.json(
        { error: 'Invalid state code' },
        { status: 400 }
      );
    }

    // Validate submission type
    const submissionType = body.submission_type || 'file_upload';
    if (!SUBMISSION_TYPES.includes(submissionType)) {
      return NextResponse.json(
        { error: 'Invalid submission type' },
        { status: 400 }
      );
    }

    // Validate data type
    if (!DATA_TYPES.includes(body.data_type)) {
      return NextResponse.json(
        { error: 'Invalid data type' },
        { status: 400 }
      );
    }

    // Validate email
    const email = body.submitter_email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate tip category if tip/lead/connection
    if (['tip', 'lead', 'connection'].includes(submissionType)) {
      if (body.tip_category && !TIP_CATEGORIES.includes(body.tip_category)) {
        return NextResponse.json(
          { error: 'Invalid tip category' },
          { status: 400 }
        );
      }

      // Require tip content for non-file submissions
      if (!body.tip_content) {
        return NextResponse.json(
          { error: 'Tip content is required for tips, leads, and connections' },
          { status: 400 }
        );
      }

      if (body.tip_content.length > MAX_TIP_LENGTH) {
        return NextResponse.json(
          { error: `Tip content exceeds maximum length of ${MAX_TIP_LENGTH} characters` },
          { status: 400 }
        );
      }
    }

    // Validate file for file_upload/document types
    if (['file_upload', 'document'].includes(submissionType)) {
      if (!file) {
        return NextResponse.json(
          { error: 'File is required for file uploads and documents' },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File exceeds maximum size of 50MB. For larger files, please contact us.' },
          { status: 400 }
        );
      }

      // Check file type
      const fileType = file.type || 'application/octet-stream';
      const isAcceptedType = ACCEPTED_FILE_TYPES.some(t => fileType.includes(t)) ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls') ||
        file.name.endsWith('.pdf') ||
        file.name.endsWith('.zip') ||
        file.name.endsWith('.json');

      if (!isAcceptedType) {
        return NextResponse.json(
          { error: 'Invalid file type. Accepted: CSV, Excel, PDF, ZIP, JSON' },
          { status: 400 }
        );
      }
    }

    // Get or create contributor
    let contributorId: string | null = null;
    
    // Check if contributor exists with this email
    const { data: existingContributor } = await supabase
      .from('crowdsource_contributors')
      .select('id, username')
      .eq('email', email)
      .maybeSingle();

    if (existingContributor) {
      contributorId = existingContributor.id;
      
      // Update username if provided and different
      if (body.username && body.username !== existingContributor.username) {
        // Check if username is taken by another user
        const { data: usernameCheck } = await supabase
          .from('crowdsource_contributors')
          .select('id')
          .eq('username', body.username)
          .neq('id', contributorId)
          .maybeSingle();

        if (!usernameCheck) {
          await supabase
            .from('crowdsource_contributors')
            .update({ username: body.username })
            .eq('id', contributorId);
        }
      }
    } else {
      // Create new contributor
      const newContributor: Record<string, unknown> = {
        email,
        first_submission_at: new Date().toISOString(),
      };

      // Check if username is available
      if (body.username) {
        const { data: usernameCheck } = await supabase
          .from('crowdsource_contributors')
          .select('id')
          .eq('username', body.username)
          .maybeSingle();

        if (!usernameCheck) {
          newContributor.username = body.username;
        }
      }

      const { data: newContrib, error: contribError } = await supabase
        .from('crowdsource_contributors')
        .insert(newContributor)
        .select('id')
        .single();

      if (contribError) {
        console.error('Error creating contributor:', contribError);
        // Continue without contributor ID - submission will still work
      } else {
        contributorId = newContrib.id;
      }
    }

    // Upload file to Supabase Storage if present
    let filePath: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;
    let fileType: string | null = null;

    if (file) {
      const submissionId = crypto.randomUUID();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      filePath = `submissions/${submissionId}/original/${sanitizedFileName}`;
      fileName = file.name;
      fileSize = file.size;
      fileType = file.type;

      const { error: uploadError } = await supabase.storage
        .from('crowdsource')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload file' },
          { status: 500 }
        );
      }
    }

    // Get client IP for spam detection
    const forwarded = request.headers.get('x-forwarded-for');
    const submitterIp = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || null;

    // Create submission
    const submissionData: Record<string, unknown> = {
      state_code: stateCode,
      data_type: body.data_type,
      gap_ids: body.gap_ids || [],
      submission_type: submissionType,
      title: body.title.substring(0, 255),
      description: body.description?.substring(0, 5000) || null,
      source_url: body.source_url?.substring(0, 2000) || null,
      source_description: body.source_description?.substring(0, 2000) || null,
      submitter_email: email,
      submitter_ip: submitterIp,
      contributor_id: contributorId,
      status: 'pending',
      is_public: true,
    };

    // Add file-specific fields
    if (file) {
      submissionData.file_path = filePath;
      submissionData.file_name = fileName;
      submissionData.file_size = fileSize;
      submissionData.file_type = fileType;
    }

    // Add tip-specific fields
    if (body.tip_content) {
      submissionData.tip_content = body.tip_content.substring(0, MAX_TIP_LENGTH);
      submissionData.tip_category = body.tip_category || 'other';
    }

    if (body.related_entities && Array.isArray(body.related_entities)) {
      submissionData.related_entities = body.related_entities;
    }

    const { data: submission, error: submitError } = await supabase
      .from('crowdsource_submissions')
      .insert(submissionData)
      .select('id')
      .single();

    if (submitError) {
      console.error('Error creating submission:', submitError);
      // Clean up uploaded file if submission failed
      if (filePath) {
        await supabase.storage.from('crowdsource').remove([filePath]);
      }
      return NextResponse.json(
        { error: 'Failed to submit data' },
        { status: 500 }
      );
    }

    // Update contributor stats
    if (contributorId) {
      const points = SUBMISSION_POINTS[submissionType] || 3;
      
      await supabase.rpc('increment_contributor_stats', {
        p_contributor_id: contributorId,
        p_state_code: stateCode,
        p_data_type: body.data_type,
        p_points: points,
      });
    }

    // Add to email subscribers list if not already subscribed
    const { data: existingSubscriber } = await supabase
      .from('email_subscribers')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!existingSubscriber) {
      await supabase
        .from('email_subscribers')
        .insert({
          email,
          source: 'crowdsource',
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Submission received successfully',
      submission_id: submission.id,
      status: 'pending',
    });
  } catch (error) {
    console.error('Submit API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to submit data.' },
    { status: 405 }
  );
}

