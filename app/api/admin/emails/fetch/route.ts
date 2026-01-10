import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth, unauthorizedResponse } from '@/lib/adminAuth';
import { fetchAndProcessEmails } from '@/lib/emailFetcher';

/**
 * POST /api/admin/emails/fetch
 * Manually trigger email fetching
 */
export async function POST(request: NextRequest) {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const fetchAll = body.fetchAll === true;
    const dryRun = body.dryRun === true;

    const logs: string[] = [];
    const onProgress = (message: string) => {
      logs.push(message);
    };

    const result = await fetchAndProcessEmails({
      fetchAll,
      dryRun,
      onProgress
    });

    return NextResponse.json({
      success: true,
      result,
      logs,
      options: { fetchAll, dryRun }
    });
  } catch (error) {
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
