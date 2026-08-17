// All chromatic notes in order
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Regex to match a valid chord token (e.g. C, Am, F#m7, Bb, Dsus4, G/B)
const CHORD_REGEX = /^[A-G][#b]?(m|maj|min|dim|aug|sus[24]?|add)?[0-9]?[0-9]?(\/[A-G][#b]?)?$/;

/**
 * Parse a chord string into root note and suffix
 * e.g. "Am7" -> { root: "A", suffix: "m7" }
 */
function parseChord(chord: string): { root: string; suffix: string } | null {
  const match = chord.match(/^([A-G][#b]?)(.*)/);
  if (!match) return null;
  return { root: match[1], suffix: match[2] };
}

/**
 * Get the index of a note in the chromatic scale
 */
function getNoteIndex(note: string): number {
  let idx = NOTES.indexOf(note);
  if (idx === -1) idx = FLAT_NOTES.indexOf(note);
  return idx;
}

/**
 * Check if a string looks like a valid chord
 */
export function isChord(token: string): boolean {
  return CHORD_REGEX.test(token.trim());
}

/**
 * Check if a line consists only of chords (and whitespace/separators)
 */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // Split by whitespace
  const tokens = trimmed.split(/\s+/);
  // Must have at least one token and all must be valid chords
  return tokens.length > 0 && tokens.every(t => isChord(t));
}

/**
 * Transpose a single chord by a number of semitones
 */
export function transposeChord(chord: string, semitones: number): string {
  // Handle slash chords like C/G
  if (chord.includes('/')) {
    const parts = chord.split('/');
    const main = transposeChord(parts[0], semitones);
    const bass = transposeChord(parts[1], semitones);
    return `${main}/${bass}`;
  }

  const parsed = parseChord(chord);
  if (!parsed) return chord;

  const noteIndex = getNoteIndex(parsed.root);
  if (noteIndex === -1) return chord;

  // Use flats if the original chord uses flats
  const useFlats = parsed.root.includes('b');
  const noteArray = useFlats ? FLAT_NOTES : NOTES;

  const newIndex = ((noteIndex + semitones) % 12 + 12) % 12;
  return noteArray[newIndex] + parsed.suffix;
}

/**
 * Transpose all chords in a song content string
 * Supports two formats:
 * 1. Bracket format: [Am]Lirik [C]di sini
 * 2. Chord line format: lines that only contain chords (e.g. "Am  C  G  F")
 */
export function transposeSong(content: string, semitones: number): string {
  const lines = content.split('\n');

  const transposedLines = lines.map(line => {
    // First, handle bracket format chords in this line
    let result = line.replace(/\[([^\]]+)\]/g, (_, chord) => {
      return `[${transposeChord(chord, semitones)}]`;
    });

    // Then check if the line (without bracket chords) is a pure chord line
    const withoutBrackets = result.replace(/\[[^\]]*\]/g, '').trim();
    if (withoutBrackets && isChordLine(withoutBrackets)) {
      // Transpose the non-bracket chord tokens
      result = result.replace(/(?<!\[)(\b[A-G][#b]?(?:m|maj|min|dim|aug|sus[24]?|add)?[0-9]?[0-9]?(?:\/[A-G][#b]?)?\b)(?!\])/g, (match) => {
        // Make sure it's not inside brackets (already handled above)
        if (isChord(match)) {
          return transposeChord(match, semitones);
        }
        return match;
      });
    }

    return result;
  });

  return transposedLines.join('\n');
}

/**
 * Extract chord names from content for display
 * Supports both bracket and plain chord line formats
 */
export function extractChords(content: string): string[] {
  const chords: string[] = [];

  // Extract from bracket format
  const bracketMatches = content.match(/\[([^\]]+)\]/g);
  if (bracketMatches) {
    bracketMatches.forEach(m => chords.push(m.slice(1, -1)));
  }

  // Extract from chord lines
  const lines = content.split('\n');
  for (const line of lines) {
    const withoutBrackets = line.replace(/\[[^\]]*\]/g, '').trim();
    if (withoutBrackets && isChordLine(withoutBrackets)) {
      const tokens = withoutBrackets.split(/\s+/);
      tokens.forEach(t => {
        if (isChord(t)) chords.push(t);
      });
    }
  }

  return [...new Set(chords)];
}

/**
 * Get all available keys for display
 */
export function getAllKeys(): string[] {
  return [...NOTES];
}
