import { describe, it, expect } from 'vitest'
import { detectLanguageFromFilename, isKnownTextExtension } from '@/utils/detectLanguage'

describe('detectLanguageFromFilename', () => {
  it('returns python for .py', () => {
    expect(detectLanguageFromFilename('main.py')).toBe('python')
  })

  it('returns markdown for .md', () => {
    expect(detectLanguageFromFilename('readme.md')).toBe('markdown')
  })

  it('returns plaintext for .txt', () => {
    expect(detectLanguageFromFilename('notes.txt')).toBe('plaintext')
  })

  it('returns plaintext for unknown extension', () => {
    expect(detectLanguageFromFilename('data.xyz')).toBe('plaintext')
  })

  it('returns plaintext for empty string', () => {
    expect(detectLanguageFromFilename('')).toBe('plaintext')
  })

  it('returns plaintext for filename without extension', () => {
    expect(detectLanguageFromFilename('Makefile')).toBe('plaintext')
  })
})

describe('isKnownTextExtension', () => {
  it('returns true for .py', () => {
    expect(isKnownTextExtension('main.py')).toBe(true)
  })

  it('returns true for .txt', () => {
    expect(isKnownTextExtension('notes.txt')).toBe(true)
  })

  it('returns false for unknown extension', () => {
    expect(isKnownTextExtension('data.bin')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isKnownTextExtension('')).toBe(false)
  })

  it('returns false for filename without extension', () => {
    expect(isKnownTextExtension('Makefile')).toBe(false)
  })
})
