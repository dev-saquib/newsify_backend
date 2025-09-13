function chunkText(text, options = {}) {
  const {
    chunkSize = 500,
    overlap = 50,
    delimiter = '\n'
  } = options;
  
  const segments = text.split(delimiter);
  const chunks = [];
  let currentChunk = '';
  
  for (const segment of segments) {
    if (currentChunk.length + segment.length > chunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }
      
      // Start new chunk with overlap
      const previousChunk = currentChunk;
      currentChunk = previousChunk.slice(
        previousChunk.length - overlap
      );
    }
    
    currentChunk += segment + delimiter;
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

module.exports = { chunkText };