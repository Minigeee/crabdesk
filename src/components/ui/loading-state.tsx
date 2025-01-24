import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string
  size?: 'sm' | 'default' | 'lg'
}

const sizeClasses = {
  sm: 'h-4 w-4',
  default: 'h-6 w-6',
  lg: 'h-8 w-8'
}

export function LoadingState({
  text = 'Loading...',
  size = 'default',
  className,
  ...props
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center space-y-2 p-8',
        className
      )}
      {...props}
    >
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
} 