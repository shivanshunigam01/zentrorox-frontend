import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand-yellow/15 text-brand-charcoal',
        secondary: 'bg-brand-grey text-brand-muted',
        success: 'bg-green-100 text-brand-success',
        warning: 'bg-amber-100 text-brand-warning',
        danger: 'bg-red-100 text-brand-danger',
        info: 'bg-blue-100 text-brand-info',
        dark: 'bg-brand-charcoal text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
