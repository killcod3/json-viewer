import { LucideIcon } from 'lucide-react';
import React from 'react';

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  isActive?: boolean;
  title?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  isActive = false,
  title,
}) => {
  const baseClasses =
    'flex items-center space-x-1 px-2 py-1 text-xs border rounded transition-colors';
  const activeClasses = 'bg-blue-100 text-blue-700 border-blue-300';
  const inactiveClasses =
    'bg-white text-gray-700 border-gray-200 hover:bg-gray-50';
  const disabledClasses = 'bg-gray-100 text-gray-400 cursor-not-allowed';

  const buttonClasses = `${baseClasses} ${
    disabled
      ? disabledClasses
      : isActive
      ? activeClasses
      : inactiveClasses
  }`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
      title={title || label}
    >
      <Icon size={12} />
      <span>{label}</span>
    </button>
  );
};
