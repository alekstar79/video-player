import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventEmitter } from '@/core/events/EventEmitter'

type TestEvents = {
  'play': void;
  'pause': void;
  'data': { value: number };
  'error': Error;
}

describe('EventEmitter', () => {
  let emitter: EventEmitter<TestEvents>
  
  beforeEach(() => {
    emitter = new EventEmitter<TestEvents>()
  })
  
  describe('Subscription', () => {
    it('should subscribe to events', () => {
      const callback = vi.fn()
      
      emitter.on('play', callback)
      emitter.emit('play', undefined)
      
      expect(callback).toHaveBeenCalledWith(undefined)
    })
    
    it('should handle multiple subscribers', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      emitter.on('play', callback1)
      emitter.on('play', callback2)
      
      emitter.emit('play', undefined)
      
      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })
    
    it('should unsubscribe from events', () => {
      const callback = vi.fn()
      
      emitter.on('pause', callback)
      emitter.off('pause', callback)
      emitter.emit('pause', undefined)
      
      expect(callback).not.toHaveBeenCalled()
    })
    
    it('should unsubscribe specific callback only', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      emitter.on('play', callback1)
      emitter.on('play', callback2)
      emitter.off('play', callback1)
      
      emitter.emit('play', undefined)
      
      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })
    
    it('should handle unsubscribe for non-existent event', () => {
      const callback = vi.fn()
      
      // Should not throw
      expect(() => emitter.off('play', callback)).not.toThrow()
    })
    
    it('should handle unsubscribe for non-existent callback', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      emitter.on('play', callback1)
      emitter.off('play', callback2) // Different callback
      
      emitter.emit('play', undefined)
      
      expect(callback1).toHaveBeenCalled()
    })
  })
  
  describe('Emission', () => {
    it('should emit events with data', () => {
      const callback = vi.fn()
      const testData = { value: 42 }
      
      emitter.on('data', callback)
      emitter.emit('data', testData)
      
      expect(callback).toHaveBeenCalledWith(testData)
    })
    
    it('should emit events without data', () => {
      const callback = vi.fn()
      
      emitter.on('play', callback)
      emitter.emit('play', undefined)
      
      expect(callback).toHaveBeenCalledWith(undefined)
    })
    
    it('should handle events with Error data', () => {
      const callback = vi.fn()
      const testError = new Error('Test error')
      
      emitter.on('error', callback)
      emitter.emit('error', testError)
      
      expect(callback).toHaveBeenCalledWith(testError)
    })
    
    it('should do nothing when emitting to non-existent event', () => {
      const callback = vi.fn()
      
      // Should not throw
      expect(() => emitter.emit('nonexistent' as any, undefined)).not.toThrow()
      
      // No callbacks should be called
      expect(callback).not.toHaveBeenCalled()
    })
    
    it('should handle errors in event handlers', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const errorCallback = vi.fn(() => {
        throw new Error('Handler error')
      })
      const safeCallback = vi.fn()
      
      emitter.on('play', errorCallback)
      emitter.on('play', safeCallback)
      
      // Should not throw
      expect(() => emitter.emit('play', undefined)).not.toThrow()
      
      // Both callbacks should have been called
      expect(errorCallback).toHaveBeenCalled()
      expect(safeCallback).toHaveBeenCalled()
      
      // Error should be logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in event handler for play:',
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })
  })
  
  describe('Cleanup', () => {
    it('should destroy all listeners', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      emitter.on('play', callback1)
      emitter.on('pause', callback2)
      
      emitter.destroy()
      
      emitter.emit('play', undefined)
      emitter.emit('pause', undefined)
      
      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
    })
    
    it('should allow re-subscription after destroy', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      emitter.on('play', callback1)
      emitter.destroy()
      
      // Should be able to subscribe again
      emitter.on('play', callback2)
      emitter.emit('play', undefined)
      
      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })
  })
})