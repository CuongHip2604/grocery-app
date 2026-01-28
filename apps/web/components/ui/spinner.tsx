import { cn } from '../../lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function Spinner({ className, size = 'default' }: SpinnerProps) {
  return (
    <svg
      className={cn(
        'animate-spin text-primary',
        {
          'h-4 w-4': size === 'sm',
          'h-6 w-6': size === 'default',
          'h-8 w-8': size === 'lg',
        },
        className,
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        className="opacity-75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        d="M12 2a10 10 0 0 1 10 10"
      />
    </svg>
  );
}
