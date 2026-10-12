'use client';
import { Link, useParams } from '@/lib/router';
import { BLOG_POSTS, postBySlug, readingMinutes, wordCount } from '@/content/blog';
import { fmtDate } from '@/lib/format';
import { articleLd, clampDescription } from '@/lib/seo';
import { TOOLS } from '@/lib/toolsMeta';
import { IS_DEV } from '@/lib/env';
import { Seo } from '@/components/ui/Seo';
import { Breadcrumbs } from '@/components/layout/PageHeader';
import { Container, IconTile } from '@/components/ui/primitives';
import { Button, WhatsAppButton } from '@/components/ui/Button';
import { BlogCover } from '@/components/blog/BlogCover';
import { RichBlocks } from '@/components/blog/RichText';
import NotFound from './NotFound';

export default function BlogPost() {
  const { slug = '' } = useParams();
  const post = postBySlug.get(slug);
  if (!post) return <NotFound />;

  const path = `/blog/${post.slug}`;
  const crumbs = [
    { name: 'Blog', path: '/blog' },
    { name: post.title, path },
  ];
  const tool = TOOLS.find((t) => t.id === post.related)!;
  const more = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);
  const words = wordCount(post);

  return (
    <>
      <Seo title={`${post.title} | IFFI Global`} description={clampDescription(post.description)} path={path} type="article" breadcrumbs={crumbs} jsonLd={[articleLd({ title: post.title, description: post.description, path, date: post.date })]} />

      <header className="relative overflow-hidden bg-navy text-mist">
        <BlogCover slug={post.slug} className="absolute inset-0 h-full w-full opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/40" aria-hidden="true" />
        <Container narrow className="relative pb-14 pt-8 md:pb-20 md:pt-10">
          <Breadcrumbs items={crumbs} />
          <h1 className="mt-10 text-[clamp(2rem,4vw,3.2rem)] leading-[1.1] text-white">{post.title}</h1>
          <p className="text-lede mt-5 max-w-2xl text-mist">{post.description}</p>
          <p className="mt-5 text-sm text-mist/80">
            <time dateTime={post.date}>{fmtDate(post.date)}</time>, {readingMinutes(post)} min read, by IFFI Global Education Consultants
          </p>
        </Container>
      </header>

      <Container narrow className="py-12 md:py-16">
        {IS_DEV && words < 500 && (
          <p className="mb-8 rounded-lg border border-amber-400 bg-amber-100 px-4 py-2 text-sm text-amber-900">Draft note: {words} words. Consider expanding before relaunch.</p>
        )}
        <article className="prose-gj">
          <RichBlocks blocks={post.body} />
        </article>

        <aside aria-label="Related tool" className="mt-14 flex flex-col gap-5 rounded-card border border-line bg-white p-6 sm:flex-row sm:items-center">
          <IconTile>
            <tool.icon size={20} />
          </IconTile>
          <div className="flex-1">
            <p className="font-display text-xl font-semibold text-navy">{tool.name}</p>
            <p className="mt-1 text-[15px] text-muted">{tool.benefit}</p>
          </div>
          <Button to={tool.path} variant="navy">
            Open the tool
          </Button>
        </aside>

        <div className="mt-6 rounded-card bg-navy p-6 text-mist sm:p-8">
          <p className="font-display text-2xl text-white">Want advice for your own case?</p>
          <p className="mt-2">Send us your marks and goals. We usually reply within minutes.</p>
          <WhatsAppButton messageKey="blogGuidance" variant="gold" className="mt-5">
            Ask on WhatsApp
          </WhatsAppButton>
        </div>

        <nav aria-labelledby="more-guides" className="mt-16">
          <h2 id="more-guides" className="text-h3">
            More guides
          </h2>
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {more.map((p) => (
              <li key={p.slug}>
                <Link to={`/blog/${p.slug}`} className="block py-4 font-medium text-navy hover:text-navy-3 hover:underline">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </>
  );
}
