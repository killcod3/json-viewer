import { useState, useRef } from 'react';
import AceJsonEditor, { AceEditorRef } from './components/AceJsonEditor';
import { TreeView } from './components/TreeView';
import SearchBar from './components/SearchBar';
import { useJsonParser } from './hooks/useJsonParser';
import { useSearch } from './hooks/useSearch';
import { Braces, Search, Code, Minimize2 } from 'lucide-react';

const SAMPLE_JSON = `{
  "name": "John Doe",
  "age": 30,
  "isActive": true,
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zipCode": "10001",
    "coordinates": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  },
  "hobbies": ["reading", "swimming", "coding"],
  "scores": [85, 92, 78, 96],
  "metadata": null,
  "settings": {
    "theme": "dark",
    "notifications": {
      "email": true,
      "push": false,
      "sms": true
    }
  }
}`;

function App() {
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const editorRef = useRef<AceEditorRef>(null);
  
  const { parsedData, error, isValid } = useJsonParser(jsonInput);
  const {
    matches,
    currentMatchIndex,
    totalMatches,
    goToNextMatch,
    goToPrevMatch
  } = useSearch(jsonInput, searchQuery);

  // Convert matches to format expected by ACE Editor
  const aceMatches = matches.map(match => ({
    line: jsonInput.substring(0, match.start).split('\n').length - 1,
    column: match.start - jsonInput.lastIndexOf('\n', match.start - 1) - 1,
    length: match.end - match.start
  }));

  const handleToggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      // Focus search when opening
      setTimeout(() => {
        const searchInput = document.querySelector('input[placeholder="Search in JSON..."]') as HTMLInputElement;
        searchInput?.focus();
      }, 100);
    } else {
      // Clear search when closing
      setSearchQuery('');
      editorRef.current?.focus();
    }
  };

  const handleFormatJson = () => {
    editorRef.current?.formatJson();
  };

  const handleMinifyJson = () => {
    editorRef.current?.minifyJson();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Braces size={24} className="text-gray-800" />
            <h1 className="text-2xl font-bold text-gray-800">JSON Viewer</h1>
          </div>
          
          {/* Credits */}
          <div className="flex items-center space-x-1 text-base text-gray-500">
            <span>Built with</span>
            <span className="text-red-500">♥</span>
            <span>by</span>
            <a 
              href="https://github.com/killcod3" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              Jawad
            </a>
          </div>
        </div>
        <p className="text-gray-600 text-sm mt-1">
          Parse, format, and explore your JSON data with an interactive tree view
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 px-6 py-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 rounded-full bg-red-400 flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <span className="font-medium">JSON Parse Error:</span> {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - JSON Input */}
        <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
          {/* Panel Header with Toolbar */}
          <div className="bg-gray-50 border-b px-4 py-2 text-sm font-medium text-gray-700 flex justify-between items-center">
            JSON Input
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
                onClick={handleFormatJson}
                disabled={!isValid}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Format JSON"
              >
                <Code size={12} />
                <span>Format</span>
              </button>
              <button
                onClick={handleMinifyJson}
                disabled={!isValid}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Minify JSON"
              >
                <Minimize2 size={12} />
                <span>Minify</span>
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          {showSearch && (
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              currentMatchIndex={currentMatchIndex}
              totalMatches={totalMatches}
              onPrevious={goToPrevMatch}
              onNext={goToNextMatch}
              onClose={handleToggleSearch}
            />
          )}
          
          {/* ACE Editor */}
          <div className="flex-1">
            <AceJsonEditor
              ref={editorRef}
              value={jsonInput}
              onChange={setJsonInput}
              searchQuery={searchQuery}
              searchMatches={aceMatches}
              currentMatchIndex={currentMatchIndex}
              placeholder="Enter JSON here..."
              height="100%"
            />
          </div>
        </div>

        {/* Right Panel - Tree View */}
        <div className="w-1/2 bg-white">
          <TreeView data={parsedData} title="Tree View" />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t px-6 py-2">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <span className={`flex items-center space-x-1 ${isValid ? 'text-green-600' : error ? 'text-red-600' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-green-500' : error ? 'bg-red-500' : 'bg-gray-400'}`}></div>
              <span>{isValid ? 'Valid JSON' : error ? 'Invalid JSON' : 'No input'}</span>
            </span>
          </div>
          
          {/* Data Info - Center */}
          <div>
            {parsedData && (
              <span>
                {Array.isArray(parsedData) 
                  ? `Array with ${parsedData.length} items` 
                  : `Object with ${Object.keys(parsedData).length} properties`}
              </span>
            )}
          </div>
          
          <div>
            Characters: {jsonInput.length}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;