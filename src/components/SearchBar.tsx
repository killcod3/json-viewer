import React from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentMatchIndex: number;
  totalMatches: number;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  currentMatchIndex,
  totalMatches,
  onPrevious,
  onNext,
  onClose,
  className = ''
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevious();
      } else {
        onNext();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className={`flex items-center gap-2 p-2 bg-gray-100 border-b ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search in JSON..."
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
      </div>
      
      {totalMatches > 0 && (
        <div className="text-sm text-gray-600 whitespace-nowrap">
          {currentMatchIndex + 1} of {totalMatches}
        </div>
      )}
      
      <div className="flex items-center gap-1">
        <button
          onClick={onPrevious}
          disabled={totalMatches === 0}
          className="p-1 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          title="Previous match (Shift+Enter)"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={onNext}
          disabled={totalMatches === 0}
          className="p-1 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          title="Next match (Enter)"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="p-1 text-gray-600 hover:text-gray-800 ml-2"
          title="Close search (Escape)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;