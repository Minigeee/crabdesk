'use server';

import { createClient } from '@/lib/supabase/server';
import { ArticleService } from '@/lib/articles/article-service';
import { revalidatePath } from 'next/cache';

export async function createArticle(orgId: string, data: {
  title: string;
  content: string;
  authorId: string;
}) {
  const supabase = await createClient();
  const articleService = new ArticleService(supabase, orgId);

  const article = await articleService.createArticle({
    title: data.title,
    content: data.content,
    slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    status: 'published',
    author_id: data.authorId,
    locale: 'en',
    seo_metadata: {},
    org_id: orgId,
    published_at: null,
  });

  revalidatePath('/dashboard/settings');
  return article;
}

export async function updateArticle(orgId: string, articleId: string, data: {
  title: string;
  content: string;
}) {
  const supabase = await createClient();
  const articleService = new ArticleService(supabase, orgId);

  const article = await articleService.updateArticle(articleId, {
    title: data.title,
    content: data.content,
  });

  revalidatePath('/dashboard/settings');
  return article;
}

export async function deleteArticle(orgId: string, articleId: string) {
  const supabase = await createClient();
  const articleService = new ArticleService(supabase, orgId);

  await articleService.deleteArticle(articleId);
  revalidatePath('/dashboard/settings');
}

export async function getArticles(orgId: string) {
  const supabase = await createClient();
  const articleService = new ArticleService(supabase, orgId);

  return articleService.getArticles();
} 