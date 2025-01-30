'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Article } from '@/lib/articles/article-service';
import { useAuth } from '@/lib/auth/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  createArticle,
  deleteArticle,
  getArticles,
  updateArticle,
} from '../_actions/article-actions';

export function ArticlesSettings({ orgId }: { orgId: string | undefined }) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Query for fetching articles
  const { data: articles = [] } = useQuery({
    queryKey: ['articles', orgId],
    queryFn: () => (orgId ? getArticles(orgId) : Promise.resolve([])),
    enabled: !!orgId,
  });

  // Mutation for creating articles
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization ID');
      if (!user?.id) throw new Error('No user ID');
      return createArticle(orgId, {
        title,
        content,
        authorId: user.id,
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setTitle('');
      setContent('');
      toast({
        title: 'Article created',
        description: 'Successfully created new article.',
      });
    },
    onError: () => {
      toast({
        title: 'Error creating article',
        description: 'Failed to create new article.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for updating articles
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !selectedArticle) throw new Error('No article selected');
      return updateArticle(orgId, selectedArticle.id, {
        title,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast({
        title: 'Article updated',
        description: 'Successfully updated article.',
      });
    },
    onError: () => {
      toast({
        title: 'Error updating article',
        description: 'Failed to update article.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for deleting articles
  const deleteMutation = useMutation({
    mutationFn: async (articleId: string) => {
      if (!orgId) throw new Error('No organization ID');
      return deleteArticle(orgId, articleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      if (selectedArticle) {
        setSelectedArticle(null);
        setTitle('');
        setContent('');
      }
      toast({
        title: 'Article deleted',
        description: 'Successfully deleted article.',
      });
    },
    onError: () => {
      toast({
        title: 'Error deleting article',
        description: 'Failed to delete article.',
        variant: 'destructive',
      });
    },
  });

  const handleCreate = () => {
    createMutation.mutate();
  };

  const handleUpdate = () => {
    updateMutation.mutate();
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <h2 className='text-lg font-medium'>Knowledge Base Articles</h2>
        <p className='text-sm text-muted-foreground'>
          Create and manage your knowledge base articles.
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {/* Article Editor */}
        <Card className='space-y-4 p-4'>
          <div className='space-y-2'>
            <Label htmlFor='title'>Title</Label>
            <Input
              id='title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Article title'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='content'>Content (Markdown)</Label>
            <Textarea
              id='content'
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder='Write your article in markdown...'
              className='min-h-[300px] font-mono'
            />
          </div>

          <div className='flex justify-end space-x-2'>
            {selectedArticle ? (
              <>
                <Button
                  variant='outline'
                  onClick={() => {
                    setSelectedArticle(null);
                    setTitle('');
                    setContent('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update Article'}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Article'}
              </Button>
            )}
          </div>
        </Card>

        {/* Article List */}
        <Card className='p-4'>
          <div className='space-y-4'>
            <h3 className='font-medium'>Existing Articles</h3>
            <div className='space-y-2'>
              {articles.map((article) => (
                <div
                  key={article.id}
                  className='flex items-center justify-between rounded-md p-2 hover:bg-muted'
                >
                  <button
                    className='flex-1 text-left'
                    onClick={() => {
                      setSelectedArticle(article);
                      setTitle(article.title);
                      setContent(article.content);
                    }}
                  >
                    {article.title}
                  </button>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => handleDelete(article.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
