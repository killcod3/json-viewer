import LZString from 'lz-string';

export class UrlService {
  private static readonly PARAM_NAME = 'data';
  private static readonly MAX_URL_LENGTH = 2048; // Safe URL length limit

  /**
   * Encodes JSON data into a shareable URL
   */
  static encodeJsonToUrl(json: unknown): string {
    try {
      const jsonString = JSON.stringify(json);
      const compressed = LZString.compressToEncodedURIComponent(jsonString);
      
      const url = new URL(window.location.href);
      url.searchParams.set(this.PARAM_NAME, compressed);
      
      // Check if URL is too long
      if (url.toString().length > this.MAX_URL_LENGTH * 2) {
        // For very large JSON, we might want to warn the user
        console.warn('Generated URL is very long and might not work in all browsers');
      }
      
      return url.toString();
    } catch (error) {
      console.error('Error encoding JSON to URL:', error);
      throw new Error('Failed to generate shareable link');
    }
  }

  /**
   * Decodes JSON data from URL parameters
   */
  static decodeJsonFromUrl(): unknown | null {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const compressedData = urlParams.get(this.PARAM_NAME);
      
      if (!compressedData) {
        return null;
      }
      
      const decompressed = LZString.decompressFromEncodedURIComponent(compressedData);
      
      if (!decompressed) {
        console.error('Failed to decompress data from URL');
        return null;
      }
      
      return JSON.parse(decompressed);
    } catch (error) {
      console.error('Error decoding JSON from URL:', error);
      return null;
    }
  }

  /**
   * Copies text to clipboard
   */
  static async copyToClipboard(text: string): Promise<void> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } finally {
          textArea.remove();
        }
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      throw new Error('Failed to copy link to clipboard');
    }
  }

  /**
   * Clears the data parameter from the URL without reloading
   */
  static clearUrlData(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete(this.PARAM_NAME);
    window.history.replaceState({}, '', url.toString());
  }
}