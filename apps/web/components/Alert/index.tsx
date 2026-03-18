import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileWarning, AlertTriangle, Info } from "lucide-react";

type AlertVariant = "default" | "warning" | "error";

interface CustomAlertProps {
  variant?: AlertVariant;
  title: string;
  description: string;
}

export function AlertMessage({ variant = "default", title, description }: CustomAlertProps) {
  const getIcon = (variant: AlertVariant) => {
    switch (variant) {
      case "warning":
        return <FileWarning className="h-4 w-4" />;
      case "error":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getBackgroundColor = (variant: AlertVariant) => {
    switch (variant) {
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900";
      case "error":
        return "bg-red-50 dark:bg-red-900";
      default:
        return "bg-blue-50 dark:bg-blue-900";
    }
  };

  const getBorderColor = (variant: AlertVariant) => {
    switch (variant) {
      case "warning":
        return "border-yellow-400 dark:border-yellow-600";
      case "error":
        return "border-red-400 dark:border-red-600";
      default:
        return "border-blue-400 dark:border-blue-600";
    }
  };

  const getTextColor = (variant: AlertVariant) => {
    switch (variant) {
      case "warning":
        return "text-yellow-800 dark:text-yellow-100";
      case "error":
        return "text-red-800 dark:text-red-100";
      default:
        return "text-blue-800 dark:text-blue-100";
    }
  };

  return (
    <Alert
      variant="default"
      className={`max-w-2xl w-full ${getBackgroundColor(
        variant,
      )} ${getBorderColor(variant)} ${getTextColor(variant)} border`}
    >
      {getIcon(variant)}
      <AlertTitle className="font-semibold">{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
