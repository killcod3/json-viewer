import { useState, useMemo } from 'react';

interface SearchMatch {
  index: number;
  start: number;
  end: number;
  text: string;
  path?: string[];
}

export const useSearch = (content: string, searchTerm: string) => {
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const matches = useMemo(() => {
    if (!searchTerm.trim() || !content) return [];
    
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const foundMatches: SearchMatch[] = [];
    let match;
    let index = 0;

    while ((match = regex.exec(content)) !== null) {
      foundMatches.push({
        index,
        start: match.index,
        end: match.index + match[0].length,
        text: match[0]
      });
      index++;
    }

    return foundMatches;
  }, [content, searchTerm]);

  const goToNextMatch = () => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
    }
  };

  const goToPrevMatch = () => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
    }
  };

  return {
    matches,
    currentMatchIndex,
    totalMatches: matches.length,
    goToNextMatch,
    goToPrevMatch,
    setCurrentMatchIndex
  };
};