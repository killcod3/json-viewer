import React, { useState, useEffect } from 'react';
import { X, Copy, Check, FileType2 } from 'lucide-react';

interface TypeScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
}

const TypeScriptModal: React.FC<TypeScriptModalProps> = ({
  isOpen,
  onClose,
  code
}) => {
  const [copied, setCopied] = useState(false);

  // Reset copied state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileType2 className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">TypeScript Interfaces</h2>
              <p className="text-sm text-gray-600 mt-1">
                Generated TypeScript interfaces from your JSON data
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

        {/* Code Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="space-y-4">
            {/* Copy Button */}
            <div className="flex justify-end">
              <button
                onClick={handleCopy}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  copied
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                {copied ? (
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

            {/* Code Display */}
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed">
                <code className="language-typescript">{code}</code>
              </pre>
            </div>

            {/* Usage Notes */}
            <div className="text-xs text-gray-600 space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="font-medium text-gray-800 mb-2">📝 Usage Notes:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• The generated interfaces are based on the structure of your JSON data</li>
                  <li>• Optional properties are marked with <code className="bg-gray-200 px-1 rounded">?</code> when values are null or undefined</li>
                  <li>• Arrays with mixed types will generate union types</li>
                  <li>• Nested objects are extracted into separate interfaces for better organization</li>
                  <li>• You can rename the interfaces to match your domain model</li>
                  <li>• Consider adding JSDoc comments to document the interfaces</li>
                </ul>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-800 mb-2">💡 Pro Tips:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Save this as a <code className="bg-blue-100 px-1 rounded">.d.ts</code> file for type definitions</li>
                  <li>• Use these interfaces with <code className="bg-blue-100 px-1 rounded">JSON.parse()</code> for type-safe parsing</li>
                  <li>• Combine with validation libraries like Zod or Yup for runtime type checking</li>
                  <li>• Export interfaces to share types across your TypeScript project</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            💡 Tip: Copy the generated interfaces and customize them to fit your needs
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

export default TypeScriptModal;