import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, Clock, Inbox, Shield } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className='flex min-h-screen flex-col'>
      <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='container mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4'>
          <div className='flex items-center'>
            <Link href='/' className='flex items-center space-x-2'>
              <span className='bg-gradient-to-r from-secondary to-primary bg-clip-text text-xl font-bold text-transparent'>
                CrabDesk
              </span>
            </Link>
          </div>
          <nav className='flex items-center space-x-6'>
            <Link
              href='/login'
              className='text-sm font-medium text-muted-foreground transition-colors hover:text-primary'
            >
              Login
            </Link>
            <Link href='/dashboard'>
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className='flex-1'>
        {/* Hero Section */}
        <section className='relative overflow-hidden bg-gradient-to-b from-background to-secondary/5 pb-16 pt-24 md:pb-24 md:pt-32 lg:pb-32 lg:pt-40'>
          <div className='bg-grid-slate-50/[0.05] absolute inset-0 bg-[center_top_-1px] [mask-image:linear-gradient(0deg,transparent,black)]' />
          <div className='container relative mx-auto flex max-w-screen-xl px-4'>
            <div className='mx-auto flex max-w-[64rem] flex-col items-center gap-4 text-center'>
              <div className='inline-flex items-center rounded-2xl bg-gradient-to-r from-secondary/20 via-primary/20 to-secondary/20 px-6 py-2 text-sm font-medium'>
                🦀 Modern Email Support for Modern Teams
              </div>
              <h1 className='font-heading bg-gradient-to-r from-secondary via-primary to-secondary bg-clip-text text-4xl font-bold text-transparent sm:text-5xl md:text-6xl lg:text-7xl'>
                Navigate Customer Support with Ease
              </h1>
              <p className='max-w-[42rem] text-center leading-normal text-muted-foreground sm:text-xl sm:leading-8'>
                Transform your email inbox into a powerful customer support hub.
                Streamline communications, automate responses, and delight your
                customers with CrabDesk.
              </p>
              <div className='mt-4'>
                <Link href='/dashboard'>
                  <Button size='lg' className='gap-2'>
                    Get Started <ArrowRight className='h-4 w-4' />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className='relative bg-secondary/[0.02] py-16 md:py-24 lg:py-32'>
          <div className='container mx-auto max-w-screen-xl px-4'>
            <div className='mx-auto grid justify-center gap-8 sm:grid-cols-2 md:max-w-[64rem] lg:grid-cols-4'>
              <div className='relative overflow-hidden rounded-lg border bg-background p-2'>
                <div className='flex h-[180px] flex-col justify-between rounded-md p-6'>
                  <Inbox className='h-12 w-12 text-secondary' />
                  <div className='space-y-2'>
                    <h3 className='font-bold'>Smart Inbox</h3>
                    <p className='text-sm text-muted-foreground'>
                      Unified inbox with intelligent ticket routing and
                      prioritization
                    </p>
                  </div>
                </div>
              </div>
              <div className='relative overflow-hidden rounded-lg border bg-background p-2'>
                <div className='flex h-[180px] flex-col justify-between rounded-md p-6'>
                  <Clock className='h-12 w-12 text-secondary' />
                  <div className='space-y-2'>
                    <h3 className='font-bold'>Quick Response</h3>
                    <p className='text-sm text-muted-foreground'>
                      AI-powered templates and response suggestions
                    </p>
                  </div>
                </div>
              </div>
              <div className='relative overflow-hidden rounded-lg border bg-background p-2'>
                <div className='flex h-[180px] flex-col justify-between rounded-md p-6'>
                  <Bot className='h-12 w-12 text-secondary' />
                  <div className='space-y-2'>
                    <h3 className='font-bold'>AI Assistant</h3>
                    <p className='text-sm text-muted-foreground'>
                      Automated ticket categorization and routing
                    </p>
                  </div>
                </div>
              </div>
              <div className='relative overflow-hidden rounded-lg border bg-background p-2'>
                <div className='flex h-[180px] flex-col justify-between rounded-md p-6'>
                  <Shield className='h-12 w-12 text-secondary' />
                  <div className='space-y-2'>
                    <h3 className='font-bold'>Enterprise Ready</h3>
                    <p className='text-sm text-muted-foreground'>
                      Secure, scalable, and compliant email management
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className='relative overflow-hidden bg-gradient-to-b from-secondary/5 to-background py-16 md:py-24 lg:py-32'>
          <div className='bg-grid-slate-50/[0.05] absolute inset-0 bg-[center_top_-1px] [mask-image:linear-gradient(180deg,transparent,black,transparent)]' />
          <div className='container relative mx-auto max-w-screen-xl px-4'>
            <div className='mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center'>
              <h2 className='font-heading text-3xl font-bold leading-[1.1] sm:text-4xl md:text-5xl lg:text-6xl'>
                Ready to dive in?
              </h2>
              <p className='max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7'>
                Join thousands of teams using CrabDesk to deliver exceptional
                customer support.
              </p>
              <div className='mt-4'>
                <Link href='/dashboard'>
                  <Button size='lg' className='gap-2'>
                    Get Started <ArrowRight className='h-4 w-4' />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className='border-t py-8 md:py-12'>
        <div className='container mx-auto max-w-screen-xl px-4'>
          <div className='flex flex-col items-center justify-between gap-4 md:flex-row'>
            <p className='text-center text-sm leading-loose text-muted-foreground md:text-left'>
              Built with ❤️ for customer support teams everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
