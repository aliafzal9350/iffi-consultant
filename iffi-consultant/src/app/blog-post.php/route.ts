import { NextResponse, type NextRequest } from 'next/server';
import { postBySlug } from '@/content/blog';
import { siteUrl } from '@/lib/auth/redirects';

/**
 * Old PHP blog links (blog-post.php?slug=...) -> /blog/<slug>. A redirect in next.config.mjs would carry
 * "?slug=" along to the new URL; this one lands on the clean address, or the blog index for unknown slugs.
 */
export function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug') ?? '';
  return NextResponse.redirect(siteUrl(postBySlug.has(slug) ? `/blog/${slug}` : '/blog', request), 308);
}
