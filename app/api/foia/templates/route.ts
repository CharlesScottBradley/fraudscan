import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  // Get all active request templates
  const { data: templates, error } = await supabase
    .from('foia_request_templates')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }

  // Group templates by category
  const templatesByCategory: Record<string, typeof templates> = {};
  templates?.forEach(template => {
    const category = template.category || 'general';
    if (!templatesByCategory[category]) {
      templatesByCategory[category] = [];
    }
    templatesByCategory[category].push(template);
  });

  return NextResponse.json({
    templates: templates || [],
    templatesByCategory,
    categories: Object.keys(templatesByCategory),
  });
}

