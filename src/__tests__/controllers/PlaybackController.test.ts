import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PlaybackController } from '@/modules/controls/PlaybackController'

describe('PlaybackController', () => {
  let mockComponent: any
  let speedChangeCallback: (speed: number) => void
  let controller: PlaybackController

  beforeEach(() => {
    mockComponent = {
      addEventListener: vi.fn(),
      updateActiveOption: vi.fn()
    }

    speedChangeCallback = vi.fn<(speed: number) => void>()

    controller = new PlaybackController(
      mockComponent,
      speedChangeCallback,
      {
        speeds: [0.5, 1, 1.5, 2],
        defaultSpeed: 1
      }
    )
  })

  it('should bind event listeners on construction', () => {
    expect(mockComponent.addEventListener).toHaveBeenCalledWith(
      'speedchange',
      expect.any(Function)
    )
  })

  it('should use default config when none provided', () => {
    const defaultController = new PlaybackController(
      mockComponent,
      speedChangeCallback
    )

    // Should have default speeds
    expect((defaultController as any).config.speeds).toEqual([0.5, 0.75, 1, 1.25, 1.5, 2])
    expect((defaultController as any).config.defaultSpeed).toBe(1)
  })

  describe('Speed management', () => {
    it('should set valid speed', () => {
      controller.setSpeed(1.5)

      expect(speedChangeCallback).toHaveBeenCalledWith(1.5)
      expect(mockComponent.updateActiveOption).toHaveBeenCalledWith(1.5)
    })

    it('should use default speed when invalid', () => {
      controller.setSpeed(3) // Not in speeds array

      expect(speedChangeCallback).toHaveBeenCalledWith(1) // defaultSpeed
      expect(mockComponent.updateActiveOption).toHaveBeenCalledWith(1)
    })

    it('should handle speed change events', () => {
      // Get the event handler
      const speedChangeHandler = mockComponent.addEventListener.mock.calls
        .find((call: any[]) => call[0] === 'speedchange')[1]

      // Simulate speed change event
      const mockEvent = { detail: { speed: 2 } }
      speedChangeHandler(mockEvent)

      expect(speedChangeCallback).toHaveBeenCalledWith(2)
      expect(mockComponent.updateActiveOption).toHaveBeenCalledWith(2)
    })

    it('should handle fractional speeds', () => {
      controller.setSpeed(0.5)
      expect(speedChangeCallback).toHaveBeenCalledWith(0.5)
    })
  })

  describe('Cleanup', () => {
    it('should have destroy method (no-op in this implementation)', () => {
      expect(() => controller.destroy()).not.toThrow()
    })
  })
})
