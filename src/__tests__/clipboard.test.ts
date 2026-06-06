import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { copyToClipboard } from '@/utils/clipboard'

describe('copyToClipboard', () => {
  const originalClipboard = navigator.clipboard
  const originalExecCommand = document.execCommand

  beforeEach(() => {
    vi.stubGlobal('window', { ...window, isSecureContext: true })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    })
    document.execCommand = originalExecCommand
    vi.restoreAllMocks()
  })

  it('uses Clipboard API when available and secure context', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    const result = await copyToClipboard('test text')
    expect(result).toBe(true)
    expect(writeText).toHaveBeenCalledWith('test text')
  })

  it('falls back to execCommand when Clipboard API fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard error'))
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    let execCommandCalled = false
    document.execCommand = vi.fn(() => {
      execCommandCalled = true
      return true
    })

    const result = await copyToClipboard('fallback text')
    expect(result).toBe(true)
    expect(execCommandCalled).toBe(true)
  })

  it('returns false when both methods fail', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard error'))
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    document.execCommand = vi.fn(() => false)

    const result = await copyToClipboard('fail text')
    expect(result).toBe(false)
  })

  it('returns false when clipboard is not available and execCommand fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    })

    document.execCommand = vi.fn(() => false)

    const result = await copyToClipboard('test')
    expect(result).toBe(false)
  })
})
