import React, { useState } from 'react';
import { X, Copy, Check, Code2, FileText } from 'lucide-react';
import { CodeSnippet } from '../services/codeGenerator';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  snippets: CodeSnippet[];
  selectedPath: string[];
  selectedValue: unknown;
}

const CodeModal: React.FC<CodeModalProps> = ({
  isOpen,
  onClose,
  snippets,
  selectedPath,
  selectedValue
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [copiedStates, setCopiedStates] = useState<{ [key: number]: boolean }>({});

  if (!isOpen) return null;

  const handleCopy = async (code: string, tabIndex: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedStates(prev => ({ ...prev, [tabIndex]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [tabIndex]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const getLanguageIcon = (language: string) => {
    switch (language.toLowerCase()) {
      case 'javascript':
        return '🟨';
      case 'python':
        return '🐍';
      case 'java':
        return '☕';
      case 'jsonpath':
        return '🔍';
      default:
        return '📄';
    }
  };

  const getLanguageDisplayName = (language: string) => {
    switch (language.toLowerCase()) {
      case 'javascript':
        return 'JavaScript';
      case 'python':
        return 'Python';
      case 'java':
        return 'Java';
      case 'jsonpath':
        return 'JSONPath';
      default:
        return language.charAt(0).toUpperCase() + language.slice(1);
    }
  };

  const pathString = selectedPath.length > 0 ? selectedPath.join(' → ') : 'root';
  const valueDisplay = typeof selectedValue === 'string' ? `"${selectedValue}"` : String(selectedValue);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Code2 className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Generate Code Snippet</h2>
              <p className="text-sm text-gray-600 mt-1">
                Access code for: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{pathString}</span>
                {selectedValue !== undefined && (
                  <span className="ml-2">
                    → <span className="font-mono text-blue-600">{valueDisplay}</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Language Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {snippets.map((snippet, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === index
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{getLanguageIcon(snippet.language)}</span>
              <span>{getLanguageDisplayName(snippet.language)}</span>
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="flex-1 p-6 overflow-auto">
          {snippets[activeTab] && (
            <div className="space-y-4">
              {/* Description */}
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Code Description</p>
                  <p className="text-sm text-blue-700 mt-1">{snippets[activeTab].description}</p>
                </div>
              </div>

              {/* Code Block */}
              <div className="relative">
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={() => handleCopy(snippets[activeTab].code, activeTab)}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                      copiedStates[activeTab]
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    {copiedStates[activeTab] ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed">
                  <code>{snippets[activeTab].code}</code>
                </pre>
              </div>

              {/* Usage Notes */}
              <div className="text-xs text-gray-600 space-y-2">
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="font-medium text-gray-800 mb-2">📝 Usage Notes:</p>
                  <ul className="space-y-1 text-gray-600">
                    {snippets[activeTab].language === 'javascript' && (
                      <>
                        <li>• Make sure to handle potential JSON parsing errors in production code</li>
                        <li>• Consider using optional chaining (?.) for safer property access</li>
                        <li>• This code works in both Node.js and browser environments</li>
                      </>
                    )}
                    {snippets[activeTab].language === 'python' && (
                      <>
                        <li>• The <code className="bg-gray-200 px-1 rounded">json</code> module is part of Python's standard library</li>
                        <li>• Consider using <code className="bg-gray-200 px-1 rounded">get()</code> method for safer dictionary access</li>
                        <li>• Handle both JSONDecodeError and KeyError for robust error handling</li>
                      </>
                    )}
                    {snippets[activeTab].language === 'java' && (
                      <>
                        <li>• Requires Jackson library dependency in your project</li>
                        <li>• Add to Maven: <code className="bg-gray-200 px-1 rounded">com.fasterxml.jackson.core:jackson-databind</code></li>
                        <li>• Consider using <code className="bg-gray-200 px-1 rounded">.has()</code> to check if keys exist before accessing</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            💡 Tip: Choose the language tab that matches your project and copy the code snippet
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeModal;
