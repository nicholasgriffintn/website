import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface Props {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export function StatusMessage({ type, message }: Props) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const Icon = icons[type];

  const alertVariant = {
    success: 'default',
    error: 'destructive',
    info: 'default',
    warning: 'default',
  }[type] as "default" | "destructive" | null | undefined;

  return (
    <Alert variant={alertVariant}>
      <Icon className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
