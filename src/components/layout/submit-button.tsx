
'use client';

import { Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';

interface SubmitButtonCustomProps extends ButtonProps {
  isPending: boolean;
}

export function SubmitButton({ children, isPending, ...props }: SubmitButtonCustomProps) {

  return (
    <Button type="submit" disabled={isPending} {...props}>
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isPending ? 'Procesando...' : children}
    </Button>
  );
}
