import { differenceInDays, parseISO } from 'date-fns';

interface Props {
  expiryDate?: string;
}

export default function ExpiryBadge({ expiryDate }: Props) {
  if (!expiryDate) return null;

  const days = differenceInDays(parseISO(expiryDate), new Date());

  let label: string;
  let className: string;

  if (days < 0) {
    label = 'Expired';
    className = 'bg-red-100 text-red-700';
  } else if (days === 0) {
    label = 'Today';
    className = 'bg-red-100 text-red-700';
  } else if (days <= 3) {
    label = `${days}d`;
    className = 'bg-yellow-100 text-yellow-700';
  } else {
    label = `${days}d`;
    className = 'bg-green-100 text-green-700';
  }

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  );
}
