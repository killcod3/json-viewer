export interface TypeScriptInterface {
  name: string;
  content: string;
}

export class TypeScriptGenerator {
  private interfaces: Map<string, string> = new Map();
  private interfaceStructures: Map<string, string> = new Map(); // For detecting duplicates
  private usedNames: Set<string> = new Set();
  private structureToNames: Map<string, string[]> = new Map(); // Track all names for each structure

  /**
   * Generate TypeScript interfaces from JSON data
   */
  public generateFromJson(json: unknown, rootName = 'RootInterface'): string {
    this.interfaces.clear();
    this.interfaceStructures.clear();
    this.usedNames.clear();
    this.structureToNames.clear();

    const rootType = this.generateType(json, rootName);
    
    // Build the final output
    let output = '';
    
    // Add all generated interfaces first (in reverse order for better readability)
    const interfaceEntries = Array.from(this.interfaces.entries()).reverse();
    for (const [, content] of interfaceEntries) {
      output += content + '\n\n';
    }
    
    // If the root type is not an interface (e.g., primitive or array), add a type alias
    if (!this.interfaces.has(rootName)) {
      output += `export type ${rootName} = ${rootType};`;
    }
    
    return output.trim();
  }

  /**
   * Generate type for a value with smart inference
   */
  private generateType(value: unknown, suggestedName?: string): string {
    if (value === null) {
      return 'null';
    }
    
    if (value === undefined) {
      return 'undefined';
    }
    
    const type = typeof value;
    
    switch (type) {
      case 'boolean':
        return 'boolean';
      
      case 'number':
        return 'number';
      
      case 'string':
        return 'string';
      
      case 'object':
        if (Array.isArray(value)) {
          return this.generateArrayType(value, suggestedName);
        } else {
          return this.generateObjectType(value as Record<string, unknown>, suggestedName);
        }
      
      default:
        return 'unknown';
    }
  }

  /**
   * Generate type for arrays with comprehensive type analysis
   */
  private generateArrayType(arr: unknown[], suggestedName?: string): string {
    // Don't immediately return unknown[] for empty arrays
    // Continue to analyze the context
    if (arr.length === 0) {
      // We'll handle this case after analyzing the context
      // For now, just note it's empty but continue processing
    }
    
    // Analyze ALL elements to determine types
    const primitiveTypes = new Set<string>();
    const objectShapes: Record<string, unknown>[] = [];
    
    for (const item of arr) {
      if (item === null) {
        primitiveTypes.add('null');
      } else if (item === undefined) {
        primitiveTypes.add('undefined');
      } else if (typeof item === 'object' && !Array.isArray(item)) {
        objectShapes.push(item as Record<string, unknown>);
      } else if (Array.isArray(item)) {
        // Handle nested arrays
        const nestedArrayType = this.generateArrayType(item, suggestedName);
        primitiveTypes.add(nestedArrayType);
      } else {
        // Primitive types
        primitiveTypes.add(typeof item);
      }
    }
    
    const types: string[] = [];
    
    // Add primitive types
    for (const type of primitiveTypes) {
      if (type === 'boolean' || type === 'number' || type === 'string') {
        types.push(type);
      } else if (type === 'null' || type === 'undefined') {
        types.push(type);
      } else {
        // Already processed array types
        types.push(type);
      }
    }
    
    // Process objects if present
    if (objectShapes.length > 0) {
      // First, try to find if all objects can use the same interface
      const itemName = this.generateCleanInterfaceName(suggestedName, false);
      
      // Check if all objects have the same structure
      const firstObj = objectShapes[0];
      const firstStructure = this.generateInterfaceStructure(firstObj);
      let allSame = true;
      
      for (let i = 1; i < objectShapes.length; i++) {
        const objStructure = this.generateInterfaceStructure(objectShapes[i]);
        if (objStructure !== firstStructure) {
          allSame = false;
          break;
        }
      }
      
      if (allSame) {
        // All objects have the same structure, create a single interface
        const objectType = this.generateObjectType(firstObj, itemName);
        types.push(objectType);
      } else {
        // Objects have different structures, merge them
        const mergedShape = this.mergeObjectsWithUnionTypes(objectShapes);
        const objectType = this.generateObjectType(mergedShape.shape, itemName, mergedShape.propertyTypes);
        types.push(objectType);
      }
    }
    
    // Create the final array type
    if (types.length === 0) {
      // Only return unknown[] if we truly have no type information
      // This should only happen for genuinely empty arrays with no context
      return 'unknown[]';
    } else if (types.length === 1) {
      return `${types[0]}[]`;
    } else {
      // Union type for multiple types
      // Filter out unknown if we have other concrete types
      const concreteTypes = types.filter(t => t !== 'unknown');
      if (concreteTypes.length > 0) {
        return concreteTypes.length === 1
          ? `${concreteTypes[0]}[]`
          : `(${concreteTypes.join(' | ')})[]`;
      }
      return `(${types.join(' | ')})[]`;
    }
  }

  /**
   * Generate type for objects (creates interfaces)
   */
  private generateObjectType(
    obj: Record<string, unknown>,
    suggestedName?: string,
    propertyTypes?: Record<string, Set<string>>
  ): string {
    const interfaceName = suggestedName || this.generateCleanInterfaceName('Interface', true);
    
    // Generate interface structure for duplicate detection
    const structure = this.generateInterfaceStructure(obj, propertyTypes);
    
    // Step 1: Check if an interface with the EXACT same structure already exists
    const existingName = this.findExistingInterface(structure);
    if (existingName) {
      return existingName; // Reuse the existing interface
    }
    
    // Step 2: Check if a SIMILAR interface exists (same keys, different types)
    const similarInterface = this.findSimilarInterface(structure, interfaceName);
    if (similarInterface) {
      // Merge the structures instead of creating a duplicate
      return this.mergeInterfaces(similarInterface, obj, propertyTypes);
    }
    
    // Step 3: No existing or similar interface found, create a new one
    const uniqueName = this.ensureUniqueName(interfaceName);
    
    let interfaceContent = `export interface ${uniqueName} {\n`;
    
    const entries = Object.entries(obj);
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i];
      const propertyName = this.escapePropertyName(key);
      
      // Determine if property is optional and its type(s)
      let propertyType: string;
      let isOptional = false;
      
      if (propertyTypes && propertyTypes[key]) {
        const types = Array.from(propertyTypes[key]);
        
        // Check if property is optional (doesn't appear in all objects)
        isOptional = types.includes('undefined') || types.includes('missing');
        
        // Filter out 'missing' marker
        const actualTypes = types.filter(t => t !== 'missing' && t !== 'undefined');
        
        // Filter out 'unknown[]' if we have a more specific array type
        const arrayTypes = actualTypes.filter(t => t.endsWith('[]'));
        if (arrayTypes.length > 1 && arrayTypes.includes('unknown[]')) {
          const idx = actualTypes.indexOf('unknown[]');
          if (idx > -1) actualTypes.splice(idx, 1);
        }
        
        if (actualTypes.length === 0) {
          propertyType = 'unknown';
        } else if (actualTypes.length === 1) {
          propertyType = actualTypes[0];
        } else {
          // Create union type
          propertyType = actualTypes.join(' | ');
        }
        
        // If we have both null and a real type, make it required with type | null
        const hasNull = actualTypes.includes('null');
        const hasRealType = actualTypes.some(t => t !== 'null' && t !== 'undefined');
        if (hasNull && hasRealType) {
          isOptional = false;
        } else if (isOptional && !actualTypes.includes('undefined')) {
          // Add undefined to union if optional but not already included
          propertyType = propertyType + ' | undefined';
        }
      } else {
        // Fallback to single value analysis
        isOptional = value === null || value === undefined;
        const childName = this.generateCleanChildName(key);
        propertyType = this.generateType(value, childName);
      }
      
      interfaceContent += `  ${propertyName}${isOptional ? '?' : ''}: ${propertyType};`;
      
      if (i < entries.length - 1) {
        interfaceContent += '\n';
      }
    }
    
    interfaceContent += '\n}';
    
    this.interfaces.set(uniqueName, interfaceContent);
    this.interfaceStructures.set(uniqueName, structure);
    this.usedNames.add(uniqueName);
    
    // Track this structure for potential merging
    if (!this.structureToNames.has(structure)) {
      this.structureToNames.set(structure, []);
    }
    this.structureToNames.get(structure)!.push(uniqueName);
    
    return uniqueName;
  }

  /**
   * Find a similar interface that can be merged with
   * Similar means: same property names but potentially different types
   */
  private findSimilarInterface(structure: string, suggestedName: string): string | null {
    // Extract base name without numbers
    const baseName = suggestedName.replace(/\d+$/, '');
    
    // Parse the new structure to get property names
    const newProps = this.parseStructure(structure);
    const newPropNames = new Set(Object.keys(newProps));
    
    // Look for interfaces with the same property names
    for (const [existingName, existingStructure] of this.interfaceStructures.entries()) {
      const existingBaseName = existingName.replace(/\d+$/, '');
      
      // Only consider interfaces with the same base name
      if (existingBaseName === baseName) {
        const existingProps = this.parseStructure(existingStructure);
        const existingPropNames = new Set(Object.keys(existingProps));
        
        // Check if they have exactly the same property names
        if (this.haveSamePropertyNames(newPropNames, existingPropNames)) {
          // If structures are identical, we should have caught it in findExistingInterface
          // So here we know they have the same props but different types
          return existingName;
        }
      }
    }
    
    return null;
  }

  /**
   * Check if two sets of property names are identical
   */
  private haveSamePropertyNames(set1: Set<string>, set2: Set<string>): boolean {
    if (set1.size !== set2.size) return false;
    for (const prop of set1) {
      if (!set2.has(prop)) return false;
    }
    return true;
  }


  /**
   * Parse a structure string into a property map
   */
  private parseStructure(structure: string): Record<string, string> {
    const props: Record<string, string> = {};
    const parts = structure.split(';');
    
    for (const part of parts) {
      const [key, type] = part.split(':');
      if (key && type) {
        props[key] = type;
      }
    }
    
    return props;
  }

  /**
   * Merge an existing interface with new properties by updating union types
   */
  private mergeInterfaces(
    existingName: string,
    newObj: Record<string, unknown>,
    newPropertyTypes?: Record<string, Set<string>>
  ): string {
    const existingContent = this.interfaces.get(existingName);
    if (!existingContent) return existingName;
    
    // Parse existing interface
    const existingProps = this.parseInterfaceContent(existingContent);
    
    // Generate new properties with union types
    const mergedProps: Record<string, { type: string; optional: boolean }> = { ...existingProps };
    
    for (const [key, value] of Object.entries(newObj)) {
      let newType: string;
      let isOptional = false;
      
      if (newPropertyTypes && newPropertyTypes[key]) {
        const types = Array.from(newPropertyTypes[key]);
        isOptional = types.includes('undefined') || types.includes('missing');
        const actualTypes = types.filter(t => t !== 'missing' && t !== 'undefined');
        
        // Process each type to handle nested objects/arrays
        const processedTypes: string[] = [];
        for (const t of actualTypes) {
          processedTypes.push(t);
        }
        newType = processedTypes.length === 0 ? 'unknown' : processedTypes.join(' | ');
      } else {
        isOptional = value === null || value === undefined;
        const childName = this.generateCleanChildName(key);
        newType = this.generateType(value, childName);
      }
      
      if (mergedProps[key]) {
        // Property exists, merge types
        const existingType = mergedProps[key].type;
        const existingTypes = this.parseUnionType(existingType);
        const newTypes = this.parseUnionType(newType);
        
        // Combine and deduplicate types
        const allTypes = new Set([...existingTypes, ...newTypes]);
        
        // Filter out 'unknown[]' if we have a more specific array type
        const arrayTypes = Array.from(allTypes).filter(t => t.endsWith('[]'));
        if (arrayTypes.length > 1 && arrayTypes.includes('unknown[]')) {
          allTypes.delete('unknown[]');
        }
        
        // Sort types for consistency (null and undefined at the end)
        const sortedTypes = Array.from(allTypes).sort((a, b) => {
          if (a === 'null' || a === 'undefined') return 1;
          if (b === 'null' || b === 'undefined') return -1;
          return a.localeCompare(b);
        });
        
        mergedProps[key].type = sortedTypes.join(' | ');
        
        // If we have both null and a real type, the property should not be optional
        // It should be required with type | null
        const hasNull = sortedTypes.includes('null');
        const hasRealType = sortedTypes.some(t => t !== 'null' && t !== 'undefined');
        if (hasNull && hasRealType) {
          mergedProps[key].optional = false;
        } else {
          mergedProps[key].optional = mergedProps[key].optional && isOptional;
        }
      } else {
        // New property (shouldn't happen if we're merging similar interfaces)
        mergedProps[key] = { type: newType, optional: isOptional };
      }
    }
    
    // Rebuild interface content
    let newContent = `export interface ${existingName} {\n`;
    const entries = Object.entries(mergedProps);
    for (let i = 0; i < entries.length; i++) {
      const [key, { type, optional }] = entries[i];
      const propertyName = this.escapePropertyName(key);
      newContent += `  ${propertyName}${optional ? '?' : ''}: ${type};`;
      if (i < entries.length - 1) {
        newContent += '\n';
      }
    }
    newContent += '\n}';
    
    // Update the interface
    this.interfaces.set(existingName, newContent);
    
    // Update structure with the new merged types
    const newStructure = this.generateInterfaceStructureFromProps(mergedProps);
    this.interfaceStructures.set(existingName, newStructure);
    
    return existingName;
  }

  /**
   * Parse interface content to extract properties
   */
  private parseInterfaceContent(content: string): Record<string, { type: string; optional: boolean }> {
    const props: Record<string, { type: string; optional: boolean }> = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^\s*"?([^"?:]+)"?(\?)?\s*:\s*(.+);?\s*$/);
      if (match) {
        const [, name, optional, type] = match;
        props[name] = {
          type: type.replace(/;$/, '').trim(),
          optional: !!optional
        };
      }
    }
    
    return props;
  }

  /**
   * Parse a union type string into individual types
   */
  private parseUnionType(type: string): string[] {
    // Handle parentheses
    type = type.replace(/^\(|\)$/g, '');
    
    // Split by | but be careful with nested types
    const types: string[] = [];
    let current = '';
    let depth = 0;
    
    for (let i = 0; i < type.length; i++) {
      const char = type[i];
      if (char === '(' || char === '[') depth++;
      else if (char === ')' || char === ']') depth--;
      else if (char === '|' && depth === 0) {
        if (current.trim()) types.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }
    
    if (current.trim()) types.push(current.trim());
    
    return types;
  }

  /**
   * Generate structure string from parsed properties
   */
  private generateInterfaceStructureFromProps(
    props: Record<string, { type: string; optional: boolean }>
  ): string {
    const parts: string[] = [];
    
    for (const [key, { type }] of Object.entries(props)) {
      parts.push(`${key}:${type}`);
    }
    
    return parts.sort().join(';');
  }

  /**
   * Merge multiple objects and track all type variations for union types
   */
  private mergeObjectsWithUnionTypes(objects: Record<string, unknown>[]): {
    shape: Record<string, unknown>;
    propertyTypes: Record<string, Set<string>>;
  } {
    const shape: Record<string, unknown> = {};
    const propertyTypes: Record<string, Set<string>> = {};
    const propertyOccurrences: Record<string, number> = {};
    
    // Track all properties and their types across all objects
    for (const obj of objects) {
      const seenKeys = new Set<string>();
      
      for (const [key, value] of Object.entries(obj)) {
        seenKeys.add(key);
        
        if (!propertyTypes[key]) {
          propertyTypes[key] = new Set();
          propertyOccurrences[key] = 0;
        }
        
        propertyOccurrences[key]++;
        
        // Generate the type for this value
        let valueType: string;
        if (value === null) {
          valueType = 'null';
        } else if (value === undefined) {
          valueType = 'undefined';
        } else if (typeof value === 'object') {
          if (Array.isArray(value)) {
            // For arrays, we need to analyze them separately
            const childName = this.generateCleanChildName(key);
            valueType = this.generateArrayType(value, childName);
          } else {
            // For nested objects, generate the interface
            const childName = this.generateCleanChildName(key);
            valueType = this.generateObjectType(value as Record<string, unknown>, childName);
          }
        } else {
          valueType = typeof value;
        }
        
        propertyTypes[key].add(valueType);
        
        // Store a representative value (prefer non-null, non-empty values)
        if (shape[key] === undefined || shape[key] === null ||
            (Array.isArray(shape[key]) && (shape[key] as unknown[]).length === 0 &&
             Array.isArray(value) && value.length > 0)) {
          shape[key] = value;
        }
      }
      
      // Mark properties that don't exist in this object
      for (const key of Object.keys(propertyTypes)) {
        if (!seenKeys.has(key)) {
          propertyTypes[key].add('missing');
        }
      }
    }
    
    // Mark properties as optional if they don't appear in all objects
    for (const key of Object.keys(propertyTypes)) {
      if (propertyOccurrences[key] < objects.length) {
        propertyTypes[key].add('missing');
      }
    }
    
    // Clean up array types - remove unknown[] if we have more specific types
    for (const key of Object.keys(propertyTypes)) {
      const types = Array.from(propertyTypes[key]);
      const arrayTypes = types.filter(t => t.endsWith('[]'));
      if (arrayTypes.length > 1 && arrayTypes.includes('unknown[]')) {
        propertyTypes[key].delete('unknown[]');
      }
    }
    
    return { shape, propertyTypes };
  }

  /**
   * Generate a clean interface name based on context
   */
  private generateCleanInterfaceName(suggestedName?: string, isGeneric?: boolean): string {
    if (!suggestedName) {
      return isGeneric ? 'Item' : 'Interface';
    }
    
    // Remove common prefixes and suffixes
    let cleanName = suggestedName
      .replace(/^Root/, '')
      .replace(/Interface$/, '')
      .replace(/Item$/, '')
      .replace(/Type$/, '');
    
    // Handle array-related names - singularize
    if (cleanName.endsWith('s') && cleanName.length > 1) {
      // Simple singularization
      if (cleanName.endsWith('ies')) {
        cleanName = cleanName.slice(0, -3) + 'y';
      } else if (cleanName.endsWith('ouses')) {
        // Handle special case for words ending in "ouses" (houses, warehouses, etc.)
        cleanName = cleanName.slice(0, -1);
      } else if (cleanName.endsWith('ses') || cleanName.endsWith('xes') || cleanName.endsWith('zes')) {
        cleanName = cleanName.slice(0, -2);
      } else if (cleanName.endsWith('ches') || cleanName.endsWith('shes')) {
        cleanName = cleanName.slice(0, -2);
      } else if (!cleanName.endsWith('ss')) {
        cleanName = cleanName.slice(0, -1);
      }
    }
    
    // Ensure first letter is capitalized
    if (cleanName.length > 0) {
      cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    }
    
    return cleanName || 'Item';
  }

  /**
   * Generate a clean child interface name based on property name
   */
  private generateCleanChildName(propertyName: string): string {
    // Capitalize first letter
    let cleanName = propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
    
    // Handle common patterns
    const commonMappings: Record<string, string> = {
      'address': 'Address',
      'location': 'Location',
      'user': 'User',
      'users': 'User',
      'author': 'Author',
      'authors': 'Author',
      'owner': 'Owner',
      'owners': 'Owner',
      'settings': 'Settings',
      'config': 'Config',
      'configuration': 'Configuration',
      'metadata': 'Metadata',
      'meta': 'Meta',
      'item': 'Item',
      'items': 'Item',
      'product': 'Product',
      'products': 'Product',
      'order': 'Order',
      'orders': 'Order',
      'payment': 'Payment',
      'payments': 'Payment',
      'customer': 'Customer',
      'customers': 'Customer',
      'contact': 'Contact',
      'contacts': 'Contact',
      'contactInfo': 'ContactInfo',
      'apiEndpoint': 'ApiEndpoint',
      'apiEndpoints': 'ApiEndpoint',
    };
    
    const lowerProp = propertyName.toLowerCase();
    if (commonMappings[lowerProp]) {
      return commonMappings[lowerProp];
    }
    
    // Singularize if plural
    if (cleanName.endsWith('s') && cleanName.length > 1) {
      if (cleanName.endsWith('ies')) {
        cleanName = cleanName.slice(0, -3) + 'y';
      } else if (cleanName.endsWith('ouses')) {
        // Handle special case for words ending in "ouses" (houses, warehouses, etc.)
        cleanName = cleanName.slice(0, -1);
      } else if (cleanName.endsWith('ses') || cleanName.endsWith('xes') || cleanName.endsWith('zes')) {
        cleanName = cleanName.slice(0, -2);
      } else if (cleanName.endsWith('ches') || cleanName.endsWith('shes')) {
        cleanName = cleanName.slice(0, -2);
      } else if (!cleanName.endsWith('ss')) {
        cleanName = cleanName.slice(0, -1);
      }
    }
    
    return cleanName;
  }

  /**
   * Generate a structural signature for an interface to detect duplicates
   */
  private generateInterfaceStructure(
    obj: Record<string, unknown>,
    propertyTypes?: Record<string, Set<string>>
  ): string {
    const props: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      let type: string;
      
      if (propertyTypes && propertyTypes[key]) {
        const types = Array.from(propertyTypes[key])
          .filter(t => t !== 'missing' && t !== 'undefined')
          .sort();
        type = types.length > 1 ? `(${types.join('|')})` : types[0] || 'unknown';
      } else {
        type = this.getSimpleType(value);
      }
      
      props.push(`${key}:${type}`);
    }
    
    return props.sort().join(';');
  }

  /**
   * Get a simple type representation for structural comparison
   */
  private getSimpleType(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    const type = typeof value;
    if (type !== 'object') return type;
    
    if (Array.isArray(value)) {
      if (value.length === 0) return 'array';
      const firstType = this.getSimpleType(value[0]);
      return `${firstType}[]`;
    }
    
    return 'object';
  }

  /**
   * Find an existing interface with the same structure
   */
  private findExistingInterface(structure: string): string | null {
    for (const [name, existingStructure] of this.interfaceStructures.entries()) {
      if (existingStructure === structure) {
        return name;
      }
    }
    return null;
  }

  /**
   * Ensure the interface name is unique
   */
  private ensureUniqueName(baseName: string): string {
    if (!this.usedNames.has(baseName)) {
      return baseName;
    }
    
    let counter = 2;
    let uniqueName = `${baseName}${counter}`;
    while (this.usedNames.has(uniqueName)) {
      counter++;
      uniqueName = `${baseName}${counter}`;
    }
    
    return uniqueName;
  }

  /**
   * Escape property names that need quotes
   */
  private escapePropertyName(name: string): string {
    // Check if the property name needs quotes
    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
      return `"${name}"`;
    }
    return name;
  }

  /**
   * Format the generated TypeScript code with proper indentation
   */
  public static formatCode(code: string): string {
    // This is a simple formatter - in production, you might want to use a proper formatter
    return code
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n');
  }
}

// Export a singleton instance for convenience
export const typeScriptGenerator = new TypeScriptGenerator();