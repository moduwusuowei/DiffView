import { describe, it, expect } from 'vitest'
import { shouldWarnLargeFile } from '@/utils/fileCheck'

describe('shouldWarnLargeFile', () => {
  it('returns false for file under 2MB', () => {
    const file = new File(['a'.repeat(1024)], 'small.txt')
    expect(shouldWarnLargeFile(file)).toBe(false)
  })

  it('returns soft for file over 2MB but under 50MB', () => {
    const file = new File(['a'.repeat(2 * 1024 * 1024 + 1)], 'medium.txt')
    expect(shouldWarnLargeFile(file)).toBe('soft')
  })

  it('returns false for file exactly 2MB', () => {
    const file = new File(['a'.repeat(2 * 1024 * 1024)], 'exact.txt')
    expect(shouldWarnLargeFile(file)).toBe(false)
  })

  it('returns hard for file over 50MB', () => {
    const file = new File(['a'.repeat(51 * 1024 * 1024)], 'huge.txt')
    expect(shouldWarnLargeFile(file)).toBe('hard')
  })
})
