import React, { useState } from 'react';
import { Share2, Check, AlertCircle } from 'lucide-react';
import { UrlService } from '../services/urlService';
import { ActionButton } from './ActionButton';

interface ShareButtonProps {
  jsonData: unknown;
  disabled?: boolean;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ jsonData, disabled = false }) => {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleShare = async () => {
    if (!jsonData || disabled) return;

    try {
      // Generate the shareable URL
      const shareableUrl = UrlService.encodeJsonToUrl(jsonData);
      
      // Copy to clipboard
      await UrlService.copyToClipboard(shareableUrl);
      
      // Show success state
      setStatus('success');
      
      // Reset status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      // Show error state
      setStatus('error');
      
      // Reset status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'success':
        return Check;
      case 'error':
        return AlertCircle;
      default:
        return Share2;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'success':
        return 'Copied!';
      case 'error':
        return 'Error';
      default:
        return 'Share';
    }
  };

  return (
    <ActionButton
      icon={getIcon()}
      label={getLabel()}
      onClick={handleShare}
      disabled={disabled || status !== 'idle'}
      title="Share JSON via URL"
    />
  );
};