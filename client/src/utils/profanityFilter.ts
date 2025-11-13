import { Filter } from 'bad-words';

class ProfanityFilter {
  private filter: Filter;

  constructor() {
    this.filter = new Filter();
    
    // You can add custom words or remove words if needed
    // this.filter.addWords('customBadWord1', 'customBadWord2');
    // this.filter.removeWords('word1', 'word2');
  }

  /**
   * Check if text contains profanity
   */
  isProfane(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    return this.filter.isProfane(text);
  }

  /**
   * Clean profanity from text by replacing with asterisks
   */
  clean(text: string): string {
    if (!text || typeof text !== 'string') return text;
    return this.filter.clean(text);
  }

  /**
   * Add custom words to the filter
   */
  addWords(...words: string[]): void {
    this.filter.addWords(...words);
  }

  /**
   * Remove words from the filter
   */
  removeWords(...words: string[]): void {
    this.filter.removeWords(...words);
  }

  /**
   * Get list of profane words found in text
   */
  getProfaneWords(text: string): string[] {
    if (!text || typeof text !== 'string') return [];
    
    const words = text.toLowerCase().split(/\s+/);
    const profaneWords: string[] = [];
    
    words.forEach(word => {
      // Remove punctuation for checking
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord && this.filter.isProfane(cleanWord)) {
        profaneWords.push(word);
      }
    });
    
    return profaneWords;
  }
}

// Export a singleton instance
export const profanityFilter = new ProfanityFilter();
