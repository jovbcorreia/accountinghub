import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-brand-orange text-white',
        secondary:   'border-brand-grey bg-brand-grey text-brand-charcoal/60',
        destructive: 'border-transparent bg-red-100 text-red-700',
        outline:     'border-brand-grey bg-white text-brand-charcoal/50',
        /* Status variants */
        success:     'border-transparent bg-green-100 text-green-700',
        warning:     'border-brand-peach/60 bg-orange-50 text-orange-800',
        info:        'border-brand-orange/30 bg-orange-50 text-brand-orange',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
