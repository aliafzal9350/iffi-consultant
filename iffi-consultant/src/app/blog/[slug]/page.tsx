import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { site } from '@/data/content';
import { routeKeywords } from '@/data/keywords';
import { BLOG_POSTS, postBySlug } from '@/content/blog';
import { pageMetadata } from '@/lib/metadata';
import BlogPost from '@/views/BlogPost';

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = postBySlug.get((await params).slug);
  if (!post) return {};
  return pageMetadata({
    title: `${post.title} | ${site.brand.name}`,
    description: post.description,
    path: `/blog/${post.slug}`,
    keywords: routeKeywords('/blog'),
    type: 'article',
    publishedTime: post.date,
  });
}

export default async function Page({ params }: Props) {
  const post = postBySlug.get((await params).slug);
  if (!post) notFound();
  return <BlogPost post={post} />;
}
