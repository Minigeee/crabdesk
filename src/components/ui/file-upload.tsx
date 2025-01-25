import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxSize?: number;
  accept?: Record<string, string[]>;
  maxFiles?: number;
}

export function FileUpload({
  onFilesSelected,
  maxSize = 10 * 1024 * 1024, // 10MB default
  accept,
  maxFiles = 10,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach((file) => {
          const error = file.errors[0];
          let message = 'File upload failed';

          if (error.code === 'file-too-large') {
            message = `File is too large. Max size is ${maxSize / 1024 / 1024}MB`;
          } else if (error.code === 'file-invalid-type') {
            message = 'File type not supported';
          } else if (error.code === 'too-many-files') {
            message = `Too many files. Max ${maxFiles} files allowed`;
          }

          toast({
            title: 'Error',
            description: message,
            variant: 'destructive',
          });
        });
        return;
      }

      onFilesSelected(acceptedFiles);
    },
    [maxSize, maxFiles, onFilesSelected, toast]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    maxSize,
    accept,
    maxFiles,
    noClick: true,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center hover:bg-muted',
        isDragging || isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25'
      )}
      onClick={open}
    >
      <input {...getInputProps()} />
      <Upload className='mx-auto h-8 w-8 text-muted-foreground/50' />
      <p className='mt-2 text-sm text-muted-foreground'>
        Drag files here or click to select files
      </p>
      <p className='text-xs text-muted-foreground/75'>
        Max file size: {maxSize / 1024 / 1024}MB
      </p>
    </div>
  );
}
