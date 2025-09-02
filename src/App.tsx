import { useState, useRef, useEffect } from 'react';
import AceJsonEditor, { AceEditorRef } from './components/AceJsonEditor';
import { TreeView } from './components/TreeView';
import SearchBar from './components/SearchBar';
import { ShareButton } from './components/ShareButton';
import { TypeScriptButton } from './components/TypeScriptButton';
import { useJsonParser } from './hooks/useJsonParser';
import { useSearch } from './hooks/useSearch';
import { UrlService } from './services/urlService';
import { Braces, Search, Code, Minimize2, Github } from 'lucide-react';
import { ActionButton } from './components/ActionButton';

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
  const [jsonInput, setJsonInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const editorRef = useRef<AceEditorRef>(null);
  
  const { parsedData, error, isValid } = useJsonParser(jsonInput);
  const {
    matches,
    currentMatchIndex,
    totalMatches,
    goToNextMatch,
    goToPrevMatch
  } = useSearch(jsonInput, searchQuery);

  // Load JSON from URL on mount
  useEffect(() => {
    const sharedData = UrlService.decodeJsonFromUrl();
    
    if (sharedData) {
      // If we have shared data, use it
      try {
        const jsonString = typeof sharedData === 'string'
          ? sharedData
          : JSON.stringify(sharedData, null, 2);
        setJsonInput(jsonString);
        
        // Clear the URL parameter after loading to keep URL clean
        UrlService.clearUrlData();
        
        // Show a notification that shared data was loaded
        console.log('Loaded shared JSON data from URL');
      } catch (error) {
        console.error('Error loading shared data:', error);
        setJsonInput(SAMPLE_JSON);
      }
    } else {
      // No shared data, use sample JSON
      setJsonInput(SAMPLE_JSON);
    }
    
    setIsInitialized(true);
  }, []);

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
          <div className="flex flex-col items-center space-y-0.5 text-sm text-gray-500">
            <div className="flex items-center space-x-1 h-5">
              <a 
                href="https://github.com/killcod3/json-viewer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors"
                title="View source code on GitHub"
              >
                <Github size={16} />
                <span>Open Source</span>
              </a>
            </div>
            <div className="flex items-center space-x-1 h-5">
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
        </div>
        <p className="text-gray-600 text-sm mt-1">
          Interactive JSON explorer with instant parsing and code generation
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
              <ShareButton
                jsonData={parsedData}
                disabled={!isValid}
              />
              <TypeScriptButton
                jsonData={parsedData}
                disabled={!isValid}
              />
              <ActionButton
                icon={Search}
                label="Search"
                onClick={handleToggleSearch}
                isActive={showSearch}
                title="Search (Ctrl+F)"
              />
              <ActionButton
                icon={Code}
                label="Format"
                onClick={handleFormatJson}
                disabled={!isValid}
                title="Format JSON"
              />
              <ActionButton
                icon={Minimize2}
                label="Minify"
                onClick={handleMinifyJson}
                disabled={!isValid}
                title="Minify JSON"
              />
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
            {isInitialized && (
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
            )}
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
            {parsedData !== null && parsedData !== undefined && (
              <span>
                {Array.isArray(parsedData)
                  ? `Array with ${parsedData.length} items`
                  : typeof parsedData === 'object'
                    ? `Object with ${Object.keys(parsedData as Record<string, unknown>).length} properties`
                    : 'Valid JSON'}
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