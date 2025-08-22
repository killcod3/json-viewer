import { useState, type FC } from 'react';
import { ChevronRight, ChevronDown, Copy, Expand, Minimize2, Search, Code2 } from 'lucide-react';
import SearchBar from './SearchBar';
import { HighlightedText } from './HighlightedText';
import { useSearch } from '../hooks/useSearch';
import CodeModal from './CodeModal';
import { CodeGenerator } from '../services/codeGenerator';

interface TreeNodeProps {
  data: any;
  keyName?: string;
  level?: number;
  path?: string[];
  onSelectPath?: (path: string[], value: any) => void;
  selectedPath?: string[];
  expandedState?: { [key: string]: boolean };
  onToggleExpand?: (path: string[], expanded: boolean) => void;
  searchTerm?: string;
  currentMatchIndex?: number;
  onGenerateCode?: (path: string[], value: any) => void;
}

export const TreeNode: FC<TreeNodeProps> = ({ 
  data, 
  keyName, 
  level = 0, 
  path = [], 
  onSelectPath,
  selectedPath = [],
  expandedState = {},
  onToggleExpand,
  searchTerm = '',
  currentMatchIndex = 0,
  onGenerateCode
}) => {
  const currentPath = keyName ? [...path, keyName] : path;
  const pathKey = currentPath.join('.');
  const isExpanded = expandedState[pathKey] !== false; // Default to expanded
  const isSelected = JSON.stringify(currentPath) === JSON.stringify(selectedPath);
  
  const getDataType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getValueColor = (value: any): string => {
    const type = getDataType(value);
    switch (type) {
      case 'string': return 'text-green-600';
      case 'number': return 'text-blue-600';
      case 'boolean': return 'text-purple-600';
      case 'null': return 'text-gray-500';
      default: return 'text-gray-800';
    }
  };

  const renderValue = (value: any) => {
    const type = getDataType(value);
    if (type === 'string') {
      return `"${value}"`;
    }
    if (type === 'null') {
      return 'null';
    }
    return String(value);
  };

  const isExpandable = (value: any) => {
    return typeof value === 'object' && value !== null;
  };

  const copyToClipboard = (value: any) => {
    navigator.clipboard.writeText(JSON.stringify(value, null, 2));
  };

  const handleSelect = () => {
    if (onSelectPath) {
      onSelectPath(currentPath, data);
    }
  };

  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand(currentPath, !isExpanded);
    }
  };

  if (!isExpandable(data)) {
    return (
      <div 
        className={`flex items-center group cursor-pointer ${level > 0 ? 'ml-4' : ''} ${
          isSelected ? 'bg-yellow-100 border border-yellow-300 rounded px-1' : ''
        }`}
        onClick={handleSelect}
      >
        <div className="flex items-center space-x-2 py-1">
          {keyName && (
            <>
              <span className="text-blue-800 font-medium">
                <HighlightedText 
                  text={keyName} 
                  searchTerm={searchTerm} 
                />:
              </span>
            </>
          )}
          <span className={`${getValueColor(data)} font-mono text-sm`}>
            <HighlightedText 
              text={renderValue(data)} 
              searchTerm={searchTerm} 
              currentMatchIndex={currentMatchIndex}
            />
          </span>
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGenerateCode?.(currentPath, data);
              }}
              className="p-1.5 hover:bg-blue-100 hover:shadow-md hover:shadow-blue-200/50 rounded transition-all duration-200"
              title="Generate code snippet to access this value"
            >
              <Code2 size={15} className="text-blue-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(data);
              }}
              className="p-1.5 hover:bg-gray-100 hover:shadow-md hover:shadow-gray-300/50 rounded transition-all duration-200"
              title="Copy this value to clipboard"
            >
              <Copy size={15} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const entries = Array.isArray(data) 
    ? data.map((item, index) => [index, item])
    : Object.entries(data);

  return (
    <div className={level > 0 ? 'ml-4' : ''}>
      <div 
        className={`flex items-center group py-1 cursor-pointer ${
          isSelected ? 'bg-yellow-100 border border-yellow-300 rounded px-1' : ''
        }`}
        onClick={handleSelect}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          className="flex items-center space-x-1 hover:bg-gray-100 rounded p-1 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown size={16} className="text-gray-600" />
          ) : (
            <ChevronRight size={16} className="text-gray-600" />
          )}
          {keyName && (
            <span className="text-blue-800 font-medium">
              <HighlightedText 
                text={keyName} 
                searchTerm={searchTerm} 
              />:
            </span>
          )}
          <span className="text-gray-600 text-sm">
            {Array.isArray(data) ? `[${data.length}]` : `{${entries.length}}`}
          </span>
        </button>
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGenerateCode?.(currentPath, data);
            }}
            className="p-1.5 hover:bg-blue-100 hover:shadow-md hover:shadow-blue-200/50 rounded transition-all duration-200"
            title="Generate code snippet to access this object/array"
          >
            <Code2 size={15} className="text-blue-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(data);
            }}
            className="p-1.5 hover:bg-gray-100 hover:shadow-md hover:shadow-gray-300/50 rounded transition-all duration-200"
            title="Copy this entire object/array to clipboard"
          >
            <Copy size={15} className="text-gray-600" />
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-l-2 border-gray-200 ml-2">
          {entries.map(([key, value]) => (
            <TreeNode
              key={key}
              data={value}
              keyName={String(key)}
              level={level + 1}
              path={currentPath}
              onSelectPath={onSelectPath}
              selectedPath={selectedPath}
              expandedState={expandedState}
              onToggleExpand={onToggleExpand}
              searchTerm={searchTerm}
              currentMatchIndex={currentMatchIndex}
              onGenerateCode={onGenerateCode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface TreeViewProps {
  data: any;
  title: string;
}

export const TreeView: FC<TreeViewProps> = ({ data, title }) => {
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [selectedValue, setSelectedValue] = useState<any>(null);
  const [expandedState, setExpandedState] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeSnippets, setCodeSnippets] = useState<any[]>([]);
  
  const jsonString = data ? JSON.stringify(data, null, 2) : '';
  const { currentMatchIndex, totalMatches, goToNextMatch, goToPrevMatch } = useSearch(jsonString, searchTerm);

  const handleSelectPath = (path: string[], value: any) => {
    setSelectedPath(path);
    setSelectedValue(value);
  };

  const handleToggleExpand = (path: string[], expanded: boolean) => {
    const pathKey = path.join('.');
    setExpandedState(prev => ({
      ...prev,
      [pathKey]: expanded
    }));
  };

  const handleGenerateCode = (path: string[], value: any) => {
    const snippets = CodeGenerator.generateAllSnippets(path, value, {
      includeComments: true,
      includeErrorHandling: true
    });
    setCodeSnippets(snippets);
    setSelectedPath(path);
    setSelectedValue(value);
    setShowCodeModal(true);
  };

  const handleToggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchTerm(''); // Clear search when hiding
    }
  };

  const expandAll = () => {
    const getAllPaths = (obj: any, currentPath: string[] = []): string[] => {
      const paths: string[] = [];
      
      if (typeof obj === 'object' && obj !== null) {
        const entries = Array.isArray(obj) 
          ? obj.map((item, index) => [index, item])
          : Object.entries(obj);
        for (const [key, value] of entries) {
          const newPath = [...currentPath, String(key)];
          if (typeof value === 'object' && value !== null) {
            paths.push(newPath.join('.'));
            paths.push(...getAllPaths(value, newPath));
          }
        }
      }
      
      return paths;
    };

    const allPaths = getAllPaths(data);
    const newExpandedState: { [key: string]: boolean } = {};
    allPaths.forEach(path => {
      newExpandedState[path] = true;
    });
    setExpandedState(newExpandedState);
  };

  const collapseAll = () => {
    const getAllPaths = (obj: any, currentPath: string[] = []): string[] => {
      const paths: string[] = [];
      
      if (typeof obj === 'object' && obj !== null) {
        const entries = Array.isArray(obj) 
          ? obj.map((item, index) => [index, item])
          : Object.entries(obj);
        for (const [key, value] of entries) {
          const newPath = [...currentPath, String(key)];
          if (typeof value === 'object' && value !== null) {
            paths.push(newPath.join('.'));
            paths.push(...getAllPaths(value, newPath));
          }
        }
      }
      
      return paths;
    };

    const allPaths = getAllPaths(data);
    const newExpandedState: { [key: string]: boolean } = {};
    allPaths.forEach(path => {
      newExpandedState[path] = false;
    });
    setExpandedState(newExpandedState);
  };

  if (!data) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-gray-50 border-b px-4 py-2 text-sm font-medium text-gray-700 flex justify-between items-center">
          {title}
          <div className="flex space-x-2">
            <button
              onClick={handleToggleSearch}
              className={`flex items-center space-x-1 px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 transition-colors ${
                showSearch 
                  ? 'bg-blue-100 text-blue-700 border-blue-300' 
                  : 'bg-white text-gray-700'
              }`}
              title="Search (Ctrl+F)"
            >
              <Search size={12} />
              <span>Search</span>
            </button>
          </div>
        </div>
        {showSearch && (
          <SearchBar
            searchQuery={searchTerm}
            onSearchChange={setSearchTerm}
            currentMatchIndex={currentMatchIndex}
            totalMatches={totalMatches}
            onPrevious={goToPrevMatch}
            onNext={goToNextMatch}
            onClose={handleToggleSearch}
          />
        )}
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No valid JSON to display
        </div>
        
        {/* Code Generation Modal */}
        <CodeModal
          isOpen={showCodeModal}
          onClose={() => setShowCodeModal(false)}
          snippets={codeSnippets}
          selectedPath={selectedPath}
          selectedValue={selectedValue}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-50 border-b px-4 py-2 text-sm font-medium text-gray-700 flex justify-between items-center">
        {title}
        <div className="flex space-x-2">
          <button
            onClick={handleToggleSearch}
            className={`flex items-center space-x-1 px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 transition-colors ${
              showSearch 
                ? 'bg-blue-100 text-blue-700 border-blue-300' 
                : 'bg-white text-gray-700'
            }`}
            title="Search (Ctrl+F)"
          >
            <Search size={12} />
            <span>Search</span>
          </button>
          <button
            onClick={expandAll}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            title="Expand All"
          >
            <Expand size={12} />
            <span>Expand All</span>
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            title="Collapse All"
          >
            <Minimize2 size={12} />
            <span>Collapse All</span>
          </button>
        </div>
      </div>
      
      {showSearch && (
        <SearchBar
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          currentMatchIndex={currentMatchIndex}
          totalMatches={totalMatches}
          onPrevious={goToPrevMatch}
          onNext={goToNextMatch}
          onClose={handleToggleSearch}
        />
      )}

      {/* Path Breadcrumb */}
      {selectedPath.length > 0 && (
        <div className="bg-blue-50 border-b px-4 py-2 text-sm">
          <div className="flex items-center space-x-1 text-gray-700">
            <span className="font-medium">Path:</span>
            <span className="text-blue-800 font-mono">
              {selectedPath.length === 0 ? 'root' : selectedPath.join(' ► ')}
            </span>
            {selectedValue !== null && (
              <span className="ml-2 px-2 py-1 bg-yellow-200 rounded text-xs">
                {typeof selectedValue === 'string' ? `"${selectedValue}"` : String(selectedValue)}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 p-4 overflow-auto">
        <TreeNode 
          data={data}
          onSelectPath={handleSelectPath}
          selectedPath={selectedPath}
          expandedState={expandedState}
          onToggleExpand={handleToggleExpand}
          searchTerm={searchTerm}
          currentMatchIndex={currentMatchIndex}
          onGenerateCode={handleGenerateCode}
        />
      </div>

      {/* Code Generation Modal */}
      <CodeModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        snippets={codeSnippets}
        selectedPath={selectedPath}
        selectedValue={selectedValue}
      />
    </div>
  );
};