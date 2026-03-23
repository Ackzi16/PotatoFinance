self.onmessage = (event) => {
  const { buffer } = event.data;
  try {
    const bytes = new Uint8Array(buffer);
    let text = '';

    for (const value of bytes) {
      if (value === 9 || value === 10 || value === 13 || (value >= 32 && value <= 126)) {
        text += String.fromCharCode(value);
      } else {
        text += ' ';
      }
    }

    const chunks = [];
    const parenMatches = text.match(/\(([^\)]{2,})\)/g) || [];
    parenMatches.forEach((match) => chunks.push(match.slice(1, -1)));

    if (!chunks.length) {
      chunks.push(...text.split(/\s{2,}/).filter((line) => /\d/.test(line)));
    }

    const lines = chunks.map((line) => line.replace(/\s+/g, ' ').trim()).filter((line) => line.length > 5);
    self.postMessage({ ok: true, lines });
  } catch (error) {
    self.postMessage({ ok: false, error: error.message || 'Failed to parse PDF content.' });
  }
};
