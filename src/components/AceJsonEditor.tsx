import React, { useEffect, useRef, useState } from 'react';
import ace from 'ace-builds';

// Import ACE Editor modes and themes
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/ext-searchbox';

interface AceJsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  searchQuery?: string;
  searchMatches?: Array<{ line: number; column: number; length: number }>;
  currentMatchIndex?: number;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  height?: string;
  darkMode?: boolean;
}

export interface AceEditorRef {
  focus: () => void;
  formatJson: () => void;
  minifyJson: () => void;
  validateJson: () => { isValid: boolean; error: string | null };
  getValue: () => string;
  setValue: (val: string) => void;
  getEditor: () => ace.Ace.Editor | null;
}

const AceJsonEditor = React.forwardRef<any, AceJsonEditorProps>(({
  value,
  onChange,
  searchQuery = '',
  searchMatches = [],
  currentMatchIndex = -1,
  placeholder = 'Enter JSON here...',
  readOnly = false,
  className = '',
  height = '400px',
  darkMode = false
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const aceEditorRef = useRef<ace.Ace.Editor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    // Add a small delay to ensure the container is properly rendered
    const initializeEditor = () => {
      if (!editorRef.current) {
        return;
      }

      try {
        // Initialize ACE Editor
        const editor = ace.edit(editorRef.current!);
        aceEditorRef.current = editor;

        // Configure editor
        editor.setTheme(darkMode ? 'ace/theme/monokai' : 'ace/theme/github');
        editor.session.setMode('ace/mode/json');
        editor.setOptions({
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
          showLineNumbers: true,
          tabSize: 2,
          fontSize: 14,
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          wrap: true,
          autoScrollEditorIntoView: true,
          readOnly: readOnly,
          highlightActiveLine: true,
          highlightSelectedWord: true,
          showPrintMargin: false,
          displayIndentGuides: true,
          showFoldWidgets: true
        });

        // Set placeholder
        editor.setOption('placeholder', placeholder);

        // Set initial value
        editor.setValue(value, -1);

        // Listen for changes
        editor.on('change', () => {
          const newValue = editor.getValue();
          onChange(newValue);
        });

        // Enable search functionality
        editor.commands.addCommand({
          name: 'find',
          bindKey: { win: 'Ctrl-F', mac: 'Cmd-F' },
          exec: () => {
            editor.execCommand('find');
          }
        });

        // Resize the editor
        editor.resize();
        
        setIsEditorReady(true);
      } catch (error) {
        console.error('Error initializing ACE Editor:', error);
      }
    };

    // Initialize editor with a small delay
    const timeoutId = setTimeout(initializeEditor, 100);

    return () => {
      clearTimeout(timeoutId);
      if (aceEditorRef.current) {
        aceEditorRef.current.destroy();
        aceEditorRef.current = null;
      }
    };
  }, []);

  // Update theme when darkMode changes
  useEffect(() => {
    if (aceEditorRef.current) {
      aceEditorRef.current.setTheme(darkMode ? 'ace/theme/monokai' : 'ace/theme/github');
    }
  }, [darkMode]);

  // Handle editor resize
  useEffect(() => {
    if (aceEditorRef.current && isEditorReady) {
      const resizeEditor = () => {
        aceEditorRef.current?.resize();
      };
      
      // Resize immediately
      resizeEditor();
      
      // Add window resize listener
      window.addEventListener('resize', resizeEditor);
      
      return () => {
        window.removeEventListener('resize', resizeEditor);
      };
    }
  }, [isEditorReady]);

  // Update value when prop changes (external updates)
  useEffect(() => {
    if (aceEditorRef.current && isEditorReady) {
      const currentValue = aceEditorRef.current.getValue();
      if (currentValue !== value) {
        const cursorPosition = aceEditorRef.current.getCursorPosition();
        aceEditorRef.current.setValue(value, -1);
        aceEditorRef.current.moveCursorToPosition(cursorPosition);
      }
    }
  }, [value, isEditorReady]);

  // Update readOnly state
  useEffect(() => {
    if (aceEditorRef.current) {
      aceEditorRef.current.setReadOnly(readOnly);
    }
  }, [readOnly]);

  // Handle search highlighting
  useEffect(() => {
    if (!aceEditorRef.current || !searchQuery) return;

    const editor = aceEditorRef.current;
    const Range = ace.require('ace/range').Range;

    // Clear previous markers
    const session = editor.getSession();
    const markers = session.getMarkers();
    Object.keys(markers).forEach(markerId => {
      const marker = (markers as any)[markerId];
      if (marker.clazz === 'ace_selection' || 
          marker.clazz === 'ace_selected-word') {
        session.removeMarker(parseInt(markerId));
      }
    });

    // Add new search markers
    searchMatches.forEach((match, index) => {
      const range = new Range(
        match.line,
        match.column,
        match.line,
        match.column + match.length
      );
      
      const className = index === currentMatchIndex ? 'ace_selection' : 'ace_selected-word';
      session.addMarker(range, className, 'text');
    });

    // Scroll to current match
    if (currentMatchIndex >= 0 && searchMatches[currentMatchIndex]) {
      const match = searchMatches[currentMatchIndex];
      editor.gotoLine(match.line + 1, match.column, true);
    }
  }, [searchQuery, searchMatches, currentMatchIndex]);

  // Method to focus the editor
  const focus = () => {
    if (aceEditorRef.current) {
      aceEditorRef.current.focus();
    }
  };

  // Method to format JSON
  const formatJson = () => {
    if (!aceEditorRef.current) return;
    
    try {
      const currentValue = aceEditorRef.current.getValue();
      const parsed = JSON.parse(currentValue);
      const formatted = JSON.stringify(parsed, null, 2);
      aceEditorRef.current.setValue(formatted, -1);
    } catch (error) {
      console.warn('Cannot format invalid JSON');
    }
  };

  // Method to minify JSON
  const minifyJson = () => {
    if (!aceEditorRef.current) return;
    
    try {
      const currentValue = aceEditorRef.current.getValue();
      const parsed = JSON.parse(currentValue);
      const minified = JSON.stringify(parsed);
      aceEditorRef.current.setValue(minified, -1);
    } catch (error) {
      console.warn('Cannot minify invalid JSON');
    }
  };

  // Method to validate JSON
  const validateJson = () => {
    if (!aceEditorRef.current) return { isValid: false, error: null };
    
    try {
      const currentValue = aceEditorRef.current.getValue();
      JSON.parse(currentValue);
      return { isValid: true, error: null };
    } catch (error) {
      return { isValid: false, error: (error as Error).message };
    }
  };

  // Expose methods through ref
  React.useImperativeHandle(ref, () => ({
    focus,
    formatJson,
    minifyJson,
    validateJson,
    getValue: () => aceEditorRef.current?.getValue() || '',
    setValue: (val: string) => aceEditorRef.current?.setValue(val, -1),
    getEditor: () => aceEditorRef.current
  }));

  return (
    <div className={`ace-editor-container ${className}`} style={{ height: '100%', width: '100%' }}>
      <div
        ref={editorRef}
        style={{ 
          height: height === '100%' ? '100%' : height,
          minHeight: '300px',
          width: '100%',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px'
        }}
        className="ace-editor"
      />
    </div>
  );
});

AceJsonEditor.displayName = 'AceJsonEditor';

export default AceJsonEditor;
