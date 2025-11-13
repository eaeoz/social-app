# Profanity Filter Implementation Guide

## Overview

The client-side messaging system now includes automatic profanity filtering using the `bad-words` library. This ensures all messages sent through the chat are automatically cleaned of inappropriate language.

## Library Used

**bad-words** - A lightweight, simple profanity filter for JavaScript
- TypeScript support via `@types/bad-words`
- Client-side filtering (no server requests needed)
- Automatic replacement with asterisks (****)
- Supports English profanity detection

## Implementation

### 1. Installation

```bash
npm install bad-words
npm install --save-dev @types/bad-words
```

### 2. Utility Module

Location: `client/src/utils/profanityFilter.ts`

The utility provides a singleton instance with the following methods:

#### `isProfane(text: string): boolean`
Checks if text contains profanity.

```typescript
if (profanityFilter.isProfane("bad message")) {
  console.log("Profanity detected!");
}
```

#### `clean(text: string): string`
Cleans profanity by replacing with asterisks.

```typescript
const cleaned = profanityFilter.clean("bad message");
// Result: "*** message"
```

#### `getProfaneWords(text: string): string[]`
Returns array of profane words found.

```typescript
const words = profanityFilter.getProfaneWords("bad message here");
// Result: ["bad"]
```

#### `addWords(...words: string[]): void`
Add custom words to filter.

```typescript
profanityFilter.addWords("customBadWord1", "customBadWord2");
```

#### `removeWords(...words: string[]): void`
Remove words from filter.

```typescript
profanityFilter.removeWords("word1", "word2");
```

### 3. Integration in Messaging

Location: `client/src/components/Home/Home.tsx`

The filter is automatically applied in the `sendMessage` function:

```typescript
// Filter profanity from the message
const cleanedContent = profanityFilter.clean(content);

// Optional: Log if profanity was detected
if (cleanedContent !== content) {
  console.log('🚫 Profanity detected and filtered');
}
```

## How It Works

1. **User types message** → Message stored in input state
2. **User sends message** → `sendMessage()` function called
3. **Profanity filtering** → `profanityFilter.clean()` processes the content
4. **Clean message sent** → Filtered content sent to server
5. **Display** → Clean message displayed in chat

## Features

✅ **Automatic filtering** - No user action required
✅ **Real-time** - Filters before sending
✅ **Silent operation** - Users see filtered version
✅ **Transparent** - Works for both private and room chats
✅ **Console logging** - Developers can track filtered messages

## Customization

### Add Custom Words

Edit `client/src/utils/profanityFilter.ts`:

```typescript
constructor() {
  this.filter = new Filter();
  
  // Add custom words to filter
  this.filter.addWords('customWord1', 'customWord2');
}
```

### Whitelist Words

Remove words from the default filter:

```typescript
constructor() {
  this.filter = new Filter();
  
  // Remove words that shouldn't be filtered
  this.filter.removeWords('word1', 'word2');
}
```

## Testing

### Manual Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the chat application
3. Try sending messages with profanity
4. Verify they are automatically replaced with asterisks

### Console Testing

Open browser console and test directly:

```javascript
import { profanityFilter } from './utils/profanityFilter';

// Test detection
console.log(profanityFilter.isProfane("test message")); // false

// Test cleaning
console.log(profanityFilter.clean("bad word here")); // "*** word here"

// Test word extraction
console.log(profanityFilter.getProfaneWords("bad test")); // ["bad"]
```

## Limitations

- **English only** - Default dictionary is English-focused
- **Client-side only** - Can be bypassed by modifying client code
- **Basic obfuscation** - May not catch l33t speak or special characters
- **No context awareness** - Filters words regardless of context

## Future Improvements

Consider these enhancements:

1. **Multi-language support** - Add dictionaries for other languages
2. **Server-side filtering** - Add backup filtering on the backend
3. **Smart filtering** - Use ML/AI for context-aware filtering
4. **User warnings** - Notify users when profanity is detected
5. **Admin controls** - Allow admins to customize filter settings
6. **Bypass detection** - Detect attempts to circumvent filter

## Troubleshooting

### Filter not working?

1. Check browser console for errors
2. Verify `bad-words` is installed: `npm list bad-words`
3. Check import is correct in `Home.tsx`
4. Clear browser cache and rebuild

### TypeScript errors?

1. Verify `@types/bad-words` is installed
2. Check `tsconfig.json` includes proper settings
3. Restart TypeScript server in VS Code

### Filter too aggressive?

1. Use `removeWords()` to whitelist specific words
2. Consider implementing context-aware filtering
3. Review `bad-words` documentation for configuration options

## Resources

- [bad-words GitHub](https://github.com/web-mech/badwords)
- [npm package](https://www.npmjs.com/package/bad-words)
- [TypeScript types](https://www.npmjs.com/package/@types/bad-words)

## Support

For issues or questions:
1. Check browser console for error messages
2. Review this documentation
3. Test with simple examples first
4. Check `bad-words` library documentation

---

**Last Updated:** November 14, 2025
**Version:** 1.0.0
