interface Chunk {
  content: string;
  metadata: {
    headings: string[];
    startLine: number;
    endLine: number;
  };
}

/**
 * Chunks a markdown document into semantically meaningful pieces.
 * The algorithm tries to:
 * 1. Keep headings with their content
 * 2. Preserve code blocks
 * 3. Keep lists together
 * 4. Split on natural boundaries (## headings)
 * 5. Respect max token limits
 */
export function chunkMarkdown(markdown: string, maxTokens = 1000): Chunk[] {
  const lines = markdown.split('\n');
  const chunks: Chunk[] = [];
  let currentChunk: string[] = [];
  let currentHeadings: string[] = [];
  let chunkStartLine = 0;
  let inCodeBlock = false;
  let inList = false;
  let estimatedTokens = 0;

  // Rough token estimation (this is approximate)
  function estimateTokens(text: string): number {
    return Math.ceil(text.split(/\s+/).length * 1.5);
  }

  function shouldStartNewChunk(line: string): boolean {
    // Always keep code blocks together
    if (line.startsWith('```')) return false;
    
    // Start new chunk on h2 if current chunk isn't empty
    if (line.startsWith('## ') && currentChunk.length > 0) return true;
    
    // Start new chunk if we'd exceed token limit
    const newTokens = estimateTokens(line);
    if (estimatedTokens + newTokens > maxTokens && currentChunk.length > 0) return true;

    return false;
  }

  function saveCurrentChunk() {
    if (currentChunk.length === 0) return;

    chunks.push({
      content: currentChunk.join('\n'),
      metadata: {
        headings: [...currentHeadings],
        startLine: chunkStartLine,
        endLine: chunkStartLine + currentChunk.length - 1,
      },
    });

    currentChunk = [];
    estimatedTokens = 0;
    // Keep the current headings for context in next chunk
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code blocks
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }

    // Track lists
    if (!inCodeBlock) {
      if (line.match(/^[\s]*[-*+]\s/)) {
        inList = true;
      } else if (line.trim() === '') {
        inList = false;
      }
    }

    // Track headings for context
    if (!inCodeBlock && line.startsWith('#')) {
      const level = line.match(/^#+/)?.[0].length ?? 1;
      const text = line.replace(/^#+\s*/, '');
      
      // Update headings stack based on level
      currentHeadings = currentHeadings.filter(h => h.split('|')[0].length < level);
      currentHeadings.push(`${'#'.repeat(level)}|${text}`);
    }

    // Check if we should start a new chunk
    if (!inCodeBlock && !inList && shouldStartNewChunk(line)) {
      saveCurrentChunk();
      chunkStartLine = i;
    }

    // Add line to current chunk
    currentChunk.push(line);
    estimatedTokens += estimateTokens(line);
  }

  // Save the last chunk
  if (currentChunk.length > 0) {
    saveCurrentChunk();
  }

  return chunks;
} 