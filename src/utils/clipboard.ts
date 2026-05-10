/**
 * Robustly copies text to the clipboard.
 * Works even after asynchronous operations (like fetch) where the Clipboard API 
 * might fail due to "user activation" timeout in some browsers (e.g. Safari).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try modern Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("Clipboard API failed, falling back to execCommand:", err);
    }
  }

  // 2. Fallback to older execCommand('copy') with a hidden textarea
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Position fixed and off-screen
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    
    // execCommand is deprecated but still the most reliable fallback for async copy
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) return true;
  } catch (err) {
    console.error("Fallback copy failed:", err);
  }

  return false;
}
