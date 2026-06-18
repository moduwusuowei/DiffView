const EXT_MAP: Record<string, string> = {
  '.py': 'python',
  '.md': 'markdown',
  '.txt': 'plaintext'
}

export function detectLanguageFromFilename(filename: string): string {
  if (!filename) return 'plaintext'
  const dotIndex = filename.lastIndexOf('.')
  if (dotIndex === -1) return 'plaintext'
  const ext = filename.slice(dotIndex).toLowerCase()
  return EXT_MAP[ext] ?? 'plaintext'
}

export function isKnownTextExtension(filename: string): boolean {
  if (!filename) return false
  const dotIndex = filename.lastIndexOf('.')
  if (dotIndex === -1) return false
  const ext = filename.slice(dotIndex).toLowerCase()
  return ext in EXT_MAP
}
