import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { findPlaceholders, replacePlaceholders } from './utils';

interface PlaceholderEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  userName: string;
  className?: string;
}

export function PlaceholderEditor({
  content,
  onContentChange,
  userName,
  className,
}: PlaceholderEditorProps) {
  const placeholders = React.useMemo(
    () => findPlaceholders(content),
    [content]
  );
  const [values, setValues] = React.useState<Record<string, string>>(() => ({
    'Your Name': userName,
    'agent name': userName,
  }));

  // Expose values through a ref for parent components
  const valuesRef = React.useRef(values);
  React.useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  // Expose apply function through ref
  const applyRef = React.useRef({
    apply: () => {
      const newContent = replacePlaceholders(content, valuesRef.current);
      onContentChange(newContent);
      return newContent;
    },
  });

  const handleValueChange = (placeholder: string, value: string) => {
    setValues((prev) => ({ ...prev, [placeholder]: value }));
  };

  const handleApplyAll = () => {
    applyRef.current.apply();
  };

  // Expose refs through a static property
  if (PlaceholderEditor.refs) {
    PlaceholderEditor.refs.values = valuesRef;
    PlaceholderEditor.refs.apply = applyRef;
  }

  if (placeholders.length === 0) return null;

  return (
    <div
      className={cn('space-y-4 rounded-md border bg-muted/50 p-4', className)}
    >
      <div className='flex items-center justify-between'>
        <h4 className='text-sm font-medium'>Fill in Placeholders</h4>
        <Button size='sm' onClick={handleApplyAll}>
          Apply All
        </Button>
      </div>
      <ScrollArea className='max-h-[200px]'>
        <div className='space-y-3 pr-4'>
          {placeholders.map((placeholder, index) => (
            <div key={index} className='flex items-center gap-2'>
              <div className='text-sm font-medium text-muted-foreground'>
                [{placeholder.text}]
              </div>
              <Input
                value={values[placeholder.text] || ''}
                onChange={(e) =>
                  handleValueChange(placeholder.text, e.target.value)
                }
                className='h-8'
                placeholder={`Enter ${placeholder.text.toLowerCase()}`}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Add static property for refs
PlaceholderEditor.refs = {
  values: null as React.MutableRefObject<Record<string, string>> | null,
  apply: null as React.MutableRefObject<{ apply: () => string }> | null,
};
