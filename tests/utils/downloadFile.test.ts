import { describe, it, expect } from 'vitest'
import { buildDownloadFilename } from '@/utils/downloadFile'

describe('buildDownloadFilename', () => {
  it('prepends merged- to filename with extension', () => {
    expect(buildDownloadFilename('left', 'main.py')).toBe('merged-main.py')
  })

  it('returns merged-left.txt when no filename on left', () => {
    expect(buildDownloadFilename('left', undefined)).toBe('merged-left.txt')
  })

  it('returns merged-right.txt when no filename on right', () => {
    expect(buildDownloadFilename('right', undefined)).toBe('merged-right.txt')
  })

  it('returns merged-left.txt for empty string', () => {
    expect(buildDownloadFilename('left', '')).toBe('merged-left.txt')
  })
})
