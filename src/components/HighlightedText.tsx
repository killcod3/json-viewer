import { type FC } from 'react';

interface HighlightedTextProps {
  text: string;
  searchTerm: string;
  currentMatchIndex?: number;
  className?: string;
}

export const HighlightedText: FC<HighlightedTextProps> = ({
  text,
  searchTerm,
  currentMatchIndex = 0,
  className = ''
}) => {
  if (!searchTerm.trim()) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  let matchIndex = 0;

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = regex.test(part);
        if (isMatch) {
          const isCurrent = matchIndex === currentMatchIndex;
          matchIndex++;
          return (
            <span
              key={index}
              className={`${isCurrent ? 'bg-yellow-300' : 'bg-yellow-200'} font-semibold`}
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
};