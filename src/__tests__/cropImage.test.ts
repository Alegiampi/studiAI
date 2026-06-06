import { describe, it, expect } from 'vitest'
import { getRadianAngle, rotateSize } from '@/utils/cropImage'

describe('getRadianAngle', () => {
  it('converts 0 degrees to 0 radians', () => {
    expect(getRadianAngle(0)).toBe(0)
  })

  it('converts 90 degrees to π/2 radians', () => {
    expect(getRadianAngle(90)).toBe(Math.PI / 2)
  })

  it('converts 180 degrees to π radians', () => {
    expect(getRadianAngle(180)).toBe(Math.PI)
  })

  it('converts 360 degrees to 2π radians', () => {
    expect(getRadianAngle(360)).toBe(2 * Math.PI)
  })
})

describe('rotateSize', () => {
  it('returns same dimensions for 0 rotation', () => {
    const result = rotateSize(100, 200, 0)
    expect(result.width).toBeCloseTo(100)
    expect(result.height).toBeCloseTo(200)
  })

  it('swaps dimensions for 90 degree rotation', () => {
    const result = rotateSize(100, 200, 90)
    expect(result.width).toBeCloseTo(200, 0)
    expect(result.height).toBeCloseTo(100, 0)
  })

  it('returns same dimensions for 180 degree rotation', () => {
    const result = rotateSize(100, 200, 180)
    expect(result.width).toBeCloseTo(100, 0)
    expect(result.height).toBeCloseTo(200, 0)
  })

  it('handles square images', () => {
    const result = rotateSize(100, 100, 45)
    expect(result.width).toBeCloseTo(141.42, 0)
    expect(result.height).toBeCloseTo(141.42, 0)
  })
})
