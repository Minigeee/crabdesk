import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarProps } from '@radix-ui/react-avatar';

interface UserAvatarProps extends AvatarProps {
  user: { name: string; avatar_url?: string | null; email?: string };
}

export function UserAvatar({ user, ...props }: UserAvatarProps) {
  return (
    <Avatar {...props}>
      {user.avatar_url && <AvatarImage src={user.avatar_url} />}
      <AvatarFallback>
        {user.name?.[0].toLocaleUpperCase() ||
          user.email?.[0].toLocaleUpperCase() ||
          '?'}
      </AvatarFallback>
    </Avatar>
  );
}
