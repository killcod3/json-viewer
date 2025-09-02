import React, { useState } from 'react';
import { FileType2 } from 'lucide-react';
import TypeScriptModal from './TypeScriptModal';
import { typeScriptGenerator } from '../services/typeScriptGenerator';
import { ActionButton } from './ActionButton';

interface TypeScriptButtonProps {
  jsonData: unknown;
  disabled?: boolean;
}

export const TypeScriptButton: React.FC<TypeScriptButtonProps> = ({ jsonData, disabled = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const handleGenerateTypeScript = () => {
    if (!jsonData || disabled) return;

    try {
      const code = typeScriptGenerator.generateFromJson(jsonData, 'RootInterface');
      setGeneratedCode(code);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to generate TypeScript:', error);
    }
  };

  return (
    <>
      <ActionButton
        icon={FileType2}
        label="TypeScript"
        onClick={handleGenerateTypeScript}
        disabled={disabled}
        title={disabled ? 'Enter valid JSON data to generate TypeScript' : 'Generate TypeScript interfaces'}
      />

      <TypeScriptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        code={generatedCode}
      />
    </>
  );
};

export default TypeScriptButton;