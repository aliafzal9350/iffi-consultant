import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BLOG_POSTS, postBySlug } from '@/content/blog';
import { clampDescription } from '@/lib/seo';
import BlogPost from '@/views/BlogPost';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = postBySlug.get(slug);
  if (!post) {
    return {
      title: 'Article Not Found | IFFI Global',
    };
  }

  const title = `${post.title} | IFFI Global`;
  const description = clampDescription(post.description);
  const path = `/blog/${post.slug}`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `https://www.iffiglobal.com${path}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.iffiglobal.com${path}`,
      siteName: 'IFFI Global Education Consultants',
      type: 'article',
      publishedTime: post.date,
    },
  };
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] bg-paper" aria-busy="true" />}>
      <BlogPost />
    </Suspense>
  );
}
