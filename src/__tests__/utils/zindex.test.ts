import { describe, it, expect, beforeEach } from 'vitest'
import { ZIndex, zIndex } from '@/core/utils'

describe('ZIndex', () => {
  let zIndexInstance: ZIndex

  beforeEach(() => {
    // Reset singleton
    (ZIndex as any).instance = undefined
    zIndexInstance = new ZIndex()
  })

  describe('Singleton pattern', () => {
    it('should return same instance via init', () => {
      const instance1 = ZIndex.init()
      const instance2 = ZIndex.init()

      expect(instance1).toBe(instance2)
    })

    it('should create new instance via constructor', () => {
      const instance1 = new ZIndex()
      const instance2 = new ZIndex()

      expect(instance1).not.toBe(instance2)
    })

    it('should use singleton via zIndex() function', () => {
      const instance1 = zIndex()
      const instance2 = zIndex()

      expect(instance1).toBe(instance2)
    })
  })

  describe('zIndex calculations', () => {
    it('should calculate z-index for UID', () => {
      zIndexInstance.push('panel1')
      zIndexInstance.push('panel2')
      zIndexInstance.push('panel3')

      expect(zIndexInstance.value('panel1')).toBe('1000')
      expect(zIndexInstance.value('panel2')).toBe('1001')
      expect(zIndexInstance.value('panel3')).toBe('1002')
    })

    it('should return base z-index for non-existent UID', () => {
      // Base is 1000, non-existent returns 1000 + (-1) = 999
      expect(zIndexInstance.value('non-existent')).toBe('999')
    })
  })

  describe('UID management', () => {
    it('should add UID only once', () => {
      zIndexInstance.push('panel1')
      zIndexInstance.push('panel1') // Duplicate
      zIndexInstance.push('panel2')

      expect(zIndexInstance.value('panel1')).toBe('1000')
      expect(zIndexInstance.value('panel2')).toBe('1001')
    })

    it('should remove UID', () => {
      zIndexInstance.push('panel1')
      zIndexInstance.push('panel2')

      zIndexInstance.remove('panel1')

      expect(zIndexInstance.value('panel1')).toBe('999') // No longer exists
      expect(zIndexInstance.value('panel2')).toBe('1000') // Now first
    })

    it('should sort UID to front', () => {
      zIndexInstance.push('panel1')
      zIndexInstance.push('panel2')
      zIndexInstance.push('panel3')

      // Initial order
      expect(zIndexInstance.value('panel1')).toBe('1000')
      expect(zIndexInstance.value('panel2')).toBe('1001')
      expect(zIndexInstance.value('panel3')).toBe('1002')

      // Move panel2 to front
      zIndexInstance.sort('panel2')

      // New order should be: panel1, panel3, panel2
      expect(zIndexInstance.value('panel1')).toBe('1000')
      expect(zIndexInstance.value('panel3')).toBe('1001')
      expect(zIndexInstance.value('panel2')).toBe('1002')
    })

    it('should handle sorting non-existent UID', () => {
      zIndexInstance.push('panel1')

      // Should not throw
      expect(() => zIndexInstance.sort('non-existent')).not.toThrow()

      // Order unchanged
      expect(zIndexInstance.value('panel1')).toBe('1000')
    })
  })

  describe('Method chaining', () => {
    it('should support method chaining', () => {
      const result = zIndexInstance
        .push('panel1')
        .push('panel2')
        .sort('panel1')
        .remove('panel3') // Non-existent, should not break

      expect(result).toBe(zIndexInstance)
    })
  })

  describe('Static properties', () => {
    it('should have highestZIndex static property', () => {
      expect(ZIndex.highestZIndex).toBe(1000)
    })
  })
})
