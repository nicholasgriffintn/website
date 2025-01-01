interface Props {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export function StatusMessage({ type, message }: Props) {
  const bgColor = {
    success: 'bg-green-100 dark:bg-green-900',
    error: 'bg-red-100 dark:bg-red-900',
    info: 'bg-blue-100 dark:bg-blue-900',
    warning: 'bg-yellow-100 dark:bg-yellow-900',
  }[type];

  const textColor = {
    success: 'text-green-800 dark:text-green-200',
    error: 'text-red-800 dark:text-red-200',
    info: 'text-blue-800 dark:text-blue-200',
    warning: 'text-yellow-800 dark:text-yellow-200',
  }[type];

  return (
    <div className={`${bgColor} ${textColor} p-4 rounded-lg mb-4`}>
      {message}
    </div>
  );
}