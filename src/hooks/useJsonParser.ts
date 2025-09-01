import { useMemo } from 'react';

interface JsonParserResult {
  parsedData: unknown;
  error: string | null;
  isValid: boolean;
}

export const useJsonParser = (jsonString: string): JsonParserResult => {
  return useMemo(() => {
    if (!jsonString.trim()) {
      return {
        parsedData: null,
        error: null,
        isValid: false
      };
    }

    try {
      const parsed = JSON.parse(jsonString);
      return {
        parsedData: parsed,
        error: null,
        isValid: true
      };
    } catch (error) {
      let errorMessage = 'Invalid JSON';
      
      if (error instanceof SyntaxError) {
        // Extract more detailed information from the error message
        const message = error.message;
        
        // Try to extract position information
        const positionMatch = message.match(/position (\d+)/i);
        const lineMatch = message.match(/line (\d+)/i);
        const columnMatch = message.match(/column (\d+)/i);
        
        if (positionMatch) {
          const position = parseInt(positionMatch[1]);
          const lines = jsonString.substring(0, position).split('\n');
          const line = lines.length;
          const column = lines[lines.length - 1].length + 1;
          errorMessage = `${message} (Line ${line}, Column ${column})`;
        } else if (lineMatch && columnMatch) {
          errorMessage = `${message}`;
        } else {
          errorMessage = message;
        }
      } else {
        errorMessage = error instanceof Error ? error.message : 'Invalid JSON';
      }
      
      return {
        parsedData: null,
        error: errorMessage,
        isValid: false
      };
    }
  }, [jsonString]);
};