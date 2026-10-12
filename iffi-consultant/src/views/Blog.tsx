import { Link } from '@/lib/router';
import { BLOG_POSTS, readingMinutes } from '@/content/blog';
import { site } from '@/data/content';
import { SITE_URL } from '@/lib/seo';
import { fmtDate } from '@/lib/format';
import { JsonLd } from '@/components/ui/Seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/ui/primitives';
import { BlogCover } from '@/components/blog/BlogCover';

const crumbs = [{ name: 'Blog', path: '/blog' }];

export default function Blog() {
  const [lead, ...rest] = BLOG_POSTS;
  return (
    <>
      <JsonLd crumbs={crumbs} data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: `${site.brand.name} study in China guides`,
            url: `${SITE_URL}/blog`,
            blogPost: BLOG_POSTS.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE_URL}/blog/${p.slug}`, datePublished: p.date })),
          },
        ]} />
      <PageHeader crumbs={crumbs} title="Study in China guides" lede="Plain answers on CSC scholarships, costs, student visas and choosing a university, written for students and parents." />

      <Section tone="paper" compact>
        <Link to={`/blog/${lead.slug}`} className="group grid overflow-hidden rounded-card border border-line bg-white shadow-soft transition-shadow hover:shadow-lift md:grid-cols-2">
          <BlogCover slug={lead.slug} className="aspect-[16/9] h-full w-full md:aspect-auto" />
          <div className="flex flex-col justify-center p-7 sm:p-10">
            <p className="text-sm text-muted">
              <time dateTime={lead.date}>{fmtDate(lead.date)}</time>, {readingMinutes(lead)} min read
            </p>
            <h2 className="text-h2 mt-3 group-hover:text-navy-3">{lead.title}</h2>
            <p className="mt-4 text-muted">{lead.description}</p>
            <span className="mt-6 font-medium text-navy underline decoration-gold underline-offset-4">Read the guide</span>
          </div>
        </Link>

        <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <li key={p.slug}>
              <Link to={`/blog/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-soft transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-lift">
                <BlogCover slug={p.slug} className="aspect-[16/9] w-full" />
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-[13px] text-muted">
                    <time dateTime={p.date}>{fmtDate(p.date)}</time>, {readingMinutes(p)} min read
                  </p>
                  <h2 className="mt-2 font-display text-[1.3rem] font-semibold leading-snug text-navy group-hover:text-navy-3">{p.title}</h2>
                  <p className="mt-3 line-clamp-3 text-[15px] text-muted">{p.description}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
