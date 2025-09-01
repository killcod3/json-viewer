export interface CodeSnippet {
  language: string;
  code: string;
  description: string;
}

export interface CodeGeneratorOptions {
  variableName?: string;
  includeErrorHandling?: boolean;
  includeComments?: boolean;
}

export class CodeGenerator {
  private static escapeKey(key: string): { needsBrackets: boolean; escaped: string } {
    // Check if key needs bracket notation
    const needsBrackets = 
      !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) || // Not a valid identifier
      key.includes(' ') ||                        // Contains spaces
      key.includes('.') ||                        // Contains dots
      /^\d/.test(key);                           // Starts with number

    if (needsBrackets) {
      return {
        needsBrackets: true,
        escaped: JSON.stringify(key)
      };
    }

    return {
      needsBrackets: false,
      escaped: key
    };
  }

  private static buildJavaScriptPath(path: string[]): { dotNotation: string; bracketNotation: string } {
    let dotNotation = 'data';
    let bracketNotation = 'data';

    for (const key of path) {
      const { needsBrackets, escaped } = this.escapeKey(key);
      
      if (/^\d+$/.test(key)) {
        // Array index - use number directly
        dotNotation += `[${key}]`;
        bracketNotation += `[${key}]`;
      } else if (needsBrackets) {
        // Key that needs brackets (special characters, spaces, etc.)
        dotNotation += `[${escaped}]`;
        bracketNotation += `[${escaped}]`;
      } else {
        // Regular property
        dotNotation += `.${escaped}`;
        bracketNotation += `[${JSON.stringify(key)}]`;
      }
    }

    return { dotNotation, bracketNotation };
  }

  private static buildPythonPath(path: string[]): string {
    let result = 'data';
    
    for (const key of path) {
      if (/^\d+$/.test(key)) {
        // Array index
        result += `[${key}]`;
      } else {
        // Dictionary key
        result += `[${JSON.stringify(key)}]`;
      }
    }
    
    return result;
  }

  private static getValueComment(value: unknown): string {
    if (typeof value === 'string') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  private static getPathDescription(path: string[]): string {
    if (path.length === 0) return 'root value';
    if (path.length === 1) return `'${path[0]}' property`;
    
    const pathStr = path.join(' → ');
    return `nested '${path[path.length - 1]}' value from path: ${pathStr}`;
  }

  public static generateJavaScript(
    path: string[], 
    _value: unknown,
    options: CodeGeneratorOptions = {}
  ): CodeSnippet {
    const {
      variableName = 'jsonString',
      includeErrorHandling = true,
      includeComments = true
    } = options;

    const { dotNotation } = this.buildJavaScriptPath(path);
    const pathDescription = this.getPathDescription(path);
    
    // Create a safe variable name
    let variableNameCamel = 'value';
    if (path.length > 0) {
      const lastKey = path[path.length - 1];
      if (/^\d+$/.test(lastKey)) {
        // If it's an array index, use descriptive name
        variableNameCamel = `item${lastKey}`;
      } else {
        // Sanitize the key name for use as variable
        const sanitized = lastKey.replace(/[^a-zA-Z0-9]/g, '');
        if (sanitized) {
          variableNameCamel = sanitized.replace(/^./, c => c.toLowerCase()) + 'Value';
        } else {
          variableNameCamel = 'extractedValue';
        }
      }
    }

    let code = '';
    
    if (includeComments) {
      code += `// Parse the JSON string\n`;
    }
    
    if (includeErrorHandling) {
      code += `try {\n`;
      code += `  const data = JSON.parse(${variableName});\n\n`;
      
      if (includeComments) {
        code += `  // Access the ${pathDescription}\n`;
      }
      code += `  const ${variableNameCamel} = ${dotNotation};\n\n`;
      
      // Create meaningful output label
      const outputLabel = path.length > 0 ? 
        (path.join(' → ')) : 'Root Value';
      
      code += `  console.log(\`${outputLabel}:\`, JSON.stringify(${variableNameCamel}, null, 2));\n`;
      
      if (includeComments) {
        code += `  // This will output the value at path: ${pathDescription}\n`;
      }
      
      code += `} catch (error) {\n`;
      code += `  console.error('Error parsing JSON:', error.message);\n`;
      code += `}`;
    } else {
      code += `const data = JSON.parse(${variableName});\n\n`;
      
      if (includeComments) {
        code += `// Access the ${pathDescription}\n`;
      }
      code += `const ${variableNameCamel} = ${dotNotation};\n\n`;
      
      // Create meaningful output label
      const outputLabel = path.length > 0 ? 
        (path.join(' → ')) : 'Root Value';
      
      code += `console.log(\`${outputLabel}:\`, JSON.stringify(${variableNameCamel}, null, 2));\n`;
      
      if (includeComments) {
        code += `// This will output the value at path: ${pathDescription}`;
      }
    }

    return {
      language: 'javascript',
      code,
      description: `JavaScript code to access ${pathDescription}`
    };
  }

  public static generatePython(
    path: string[], 
    _value: unknown,
    options: CodeGeneratorOptions = {}
  ): CodeSnippet {
    const {
      variableName = 'json_string',
      includeErrorHandling = true,
      includeComments = true
    } = options;

    const pythonPath = this.buildPythonPath(path);
    const pathDescription = this.getPathDescription(path);
    
    // Create a safe variable name for Python
    let variableName_snake = 'value';
    if (path.length > 0) {
      const lastKey = path[path.length - 1];
      if (/^\d+$/.test(lastKey)) {
        // If it's an array index, use descriptive name
        variableName_snake = `item_${lastKey}`;
      } else {
        // Sanitize the key name for use as variable
        const sanitized = lastKey.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        if (sanitized && !sanitized.match(/^_+$/)) {
          variableName_snake = sanitized + '_value';
        } else {
          variableName_snake = 'extracted_value';
        }
      }
    }

    let code = '';
    
    code += `import json\n\n`;
    
    if (includeComments) {
      code += `# Parse the JSON string\n`;
    }
    
    if (includeErrorHandling) {
      code += `try:\n`;
      code += `    data = json.loads(${variableName})\n\n`;
      
      if (includeComments) {
        code += `    # Access the ${pathDescription}\n`;
      }
      code += `    ${variableName_snake} = ${pythonPath}\n\n`;
      
      // Create meaningful output label
      const outputLabel = path.length > 0 ? 
        (path.join(' → ')) : 'Root Value';
      
      code += `    print(f"${outputLabel}: {${variableName_snake}}")\n`;
      
      if (includeComments) {
        code += `    # This will output the value at path: ${pathDescription}\n`;
      }
      
      code += `except json.JSONDecodeError as e:\n`;
      code += `    print(f"Error parsing JSON: {e}")\n`;
      code += `except KeyError as e:\n`;
      code += `    print(f"Key not found: {e}")`;
    } else {
      code += `data = json.loads(${variableName})\n\n`;
      
      if (includeComments) {
        code += `# Access the ${pathDescription}\n`;
      }
      code += `${variableName_snake} = ${pythonPath}\n\n`;
      
      // Create meaningful output label
      const outputLabel = path.length > 0 ? 
        (path.join(' → ')) : 'Root Value';
      
      code += `print(f"${outputLabel}: {${variableName_snake}}")\n`;
      
      if (includeComments) {
        code += `# This will output the value at path: ${pathDescription}`;
      }
    }

    return {
      language: 'python',
      code,
      description: `Python code to access ${pathDescription}`
    };
  }

  public static generateJava(
    path: string[], 
    value: unknown,
    options: CodeGeneratorOptions = {}
  ): CodeSnippet {
    const {
      includeComments = true
    } = options;

    const pathDescription = this.getPathDescription(path);
    const valueComment = this.getValueComment(value);
    const className = 'JsonParser';
    
    let code = '';
    
    code += `import com.fasterxml.jackson.databind.JsonNode;\n`;
    code += `import com.fasterxml.jackson.databind.ObjectMapper;\n\n`;
    
    if (includeComments) {
      code += `// Parse the JSON string using Jackson\n`;
    }
    
    code += `public class ${className} {\n`;
    code += `    public static void main(String[] args) {\n`;
    code += `        try {\n`;
    code += `            ObjectMapper mapper = new ObjectMapper();\n`;
    code += `            JsonNode data = mapper.readTree(jsonString);\n\n`;
    
    if (includeComments) {
      code += `            // Access the ${pathDescription}\n`;
    }
    
    // Build Jackson path
    let jacksonPath = 'data';
    for (const key of path) {
      if (/^\d+$/.test(key)) {
        jacksonPath += `.get(${key})`;
      } else {
        jacksonPath += `.get("${key}")`;
      }
    }
    
    const javaVariableName = path.length > 0 ? 
      path[path.length - 1].replace(/[^a-zA-Z0-9]/g, '') + 'Value' :
      'rootValue';
    
    code += `            JsonNode ${javaVariableName} = ${jacksonPath};\n`;
    code += `            System.out.println("${path.length > 0 ? path[path.length - 1].charAt(0).toUpperCase() + path[path.length - 1].slice(1) : 'Value'}: " + ${javaVariableName});\n\n`;
    
    if (includeComments) {
      code += `            // Expected Output: ${path.length > 0 ? path[path.length - 1].charAt(0).toUpperCase() + path[path.length - 1].slice(1) : 'Value'}: ${valueComment}\n`;
    }
    
    code += `        } catch (Exception e) {\n`;
    code += `            System.err.println("Error parsing JSON: " + e.getMessage());\n`;
    code += `        }\n`;
    code += `    }\n`;
    code += `}`;

    return {
      language: 'java',
      code,
      description: `Java code to access ${pathDescription}`
    };
  }

  public static generateJSONPath(path: string[], value: unknown): CodeSnippet {
    let jsonPath = '$';
    
    for (const key of path) {
      if (/^\d+$/.test(key)) {
        // Array index
        jsonPath += `[${key}]`;
      } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
        // Simple property name
        jsonPath += `.${key}`;
      } else {
        // Property name with special characters
        jsonPath += `['${key}']`;
      }
    }
    
    const valueType = Array.isArray(value) ? 'array' : typeof value;
    const valuePreview = typeof value === 'string' ? `"${value}"` : String(value);
    
    return {
      language: 'jsonpath',
      code: jsonPath,
      description: `JSONPath expression to access ${path.length > 0 ? path.join(' → ') : 'root'} (${valueType}: ${valuePreview})`
    };
  }

  public static generateAllSnippets(
    path: string[], 
    value: unknown, 
    options: CodeGeneratorOptions = {}
  ): CodeSnippet[] {
    return [
      this.generateJavaScript(path, value, options),
      this.generatePython(path, value, options),
      this.generateJava(path, value, options),
      this.generateJSONPath(path, value)
    ];
  }
}
