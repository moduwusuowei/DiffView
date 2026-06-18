const SIZE_LIMIT = 2 * 1024 * 1024
const HARD_SIZE_LIMIT = 50 * 1024 * 1024

export function shouldWarnLargeFile(file: File): 'soft' | 'hard' | false {
  if (file.size > HARD_SIZE_LIMIT) return 'hard'
  if (file.size > SIZE_LIMIT) return 'soft'
  return false
}
