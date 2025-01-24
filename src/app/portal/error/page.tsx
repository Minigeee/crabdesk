import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Props {
  searchParams: {
    code?: string;
  };
}

const errorMessages = {
  invalid_link: {
    title: 'Invalid or Expired Link',
    description:
      'The portal access link you used is either invalid or has expired. Please contact support to get a new link.',
  },
  default: {
    title: 'Error',
    description: 'An unexpected error occurred. Please try again later.',
  },
};

export default function ErrorPage({ searchParams }: Props) {
  const { code } = searchParams;
  const error = code
    ? errorMessages[code as keyof typeof errorMessages]
    : errorMessages.default;

  return (
    <div className='container relative grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-1 lg:px-0'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription>{error.description}</AlertDescription>
        </Alert>
        <Button asChild>
          <Link href='/portal'>Return to Portal</Link>
        </Button>
      </div>
    </div>
  );
}
