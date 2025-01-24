import { LoginForm } from './_components/login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; token?: string }>;
}) {
  const params = await searchParams;
  const next = params.next || '/';
  const token = params.token;

  return (
    <div className='flex h-screen flex-col items-center justify-center'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]'>
        <div className='flex flex-col space-y-2 text-center'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Sign in to CrabDesk
          </h1>
          <p className='text-sm text-muted-foreground'>
            Enter your email below to continue
          </p>
        </div>

        <LoginForm next={next} token={token} />
      </div>
    </div>
  );
}
