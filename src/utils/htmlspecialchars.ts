export const htmlspecialchars = (text: string): string => {
    const map: { [name: string]: string }  = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };

      return text.replace(/[&<>"']/g, (m) => { return map[m]; });
}; 