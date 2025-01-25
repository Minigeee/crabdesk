import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';

interface OrganizationBrandingProps {
  orgId: string;
}

interface BrandingData {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

export async function OrganizationBranding({
  orgId,
}: OrganizationBrandingProps) {
  const supabase = await createClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('name, branding')
    .eq('id', orgId)
    .single();

  if (!org) {
    return null;
  }

  const branding = org.branding as BrandingData;
  const logoUrl = branding?.logo_url;

  return (
    <div className='flex items-center gap-2'>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`${org.name} logo`}
          width={32}
          height={32}
          className='object-contain'
        />
      ) : null}
      <span className='text-lg font-semibold'>{org.name}</span>
    </div>
  );
}
