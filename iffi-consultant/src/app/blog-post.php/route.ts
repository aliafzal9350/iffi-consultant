import { NextResponse, type NextRequest } from 'next/server';
import { postBySlug } from '@/content/blog';

/**
 * Old PHP blog links (blog-post.php?slug=...) -> /blog/<slug>. A redirect in next.config.mjs would carry
 * "?slug=" along to the new URL; this one lands on the clean address, or the blog index for unknown slugs.
 */
export function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug') ?? '';
  const target = request.nextUrl.clone();
  target.pathname = postBySlug.has(slug) ? `/blog/${slug}` : '/blog';
  target.search = '';
  return NextResponse.redirect(target, 308);
}
