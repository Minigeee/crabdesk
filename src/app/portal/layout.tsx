import { ErrorBoundary } from '@/components/error-boundary';
import { PortalAuthProvider } from '@/lib/auth/portal/provider';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalAuthProvider>
      <ErrorBoundary>{children}</ErrorBoundary>
    </PortalAuthProvider>
  );
}
