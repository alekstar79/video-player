import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VolumeController } from '@/modules/controls/VolumeController'

describe('VolumeController', () => {
  let mockComponent: any
  let volumeChangeCallback: (volume: number) => void
  let muteToggleCallback: () => void
  let controller: VolumeController

  beforeEach(() => {
    // Create mock component
    mockComponent = {
      addEventListener: vi.fn(),
      setVolume: vi.fn(),
      getVolume: vi.fn(() => 0.5),
      updateIcon: vi.fn()
    }

    volumeChangeCallback = vi.fn<(volume: number) => void>()
    muteToggleCallback = vi.fn<() => void>()

    controller = new VolumeController(
      mockComponent,
      {
        onVolumeChange: volumeChangeCallback,
        onMuteToggle: muteToggleCallback
      }
    )
  })

  it('should bind event listeners on construction', () => {
    expect(mockComponent.addEventListener).toHaveBeenCalledWith('volumechange', expect.any(Function))
    expect(mockComponent.addEventListener).toHaveBeenCalledWith('mutetoggle', expect.any(Function))
  })

  describe('Volume management', () => {
    it('should set volume on component', () => {
      controller.setVolume(0.7)
      expect(mockComponent.setVolume).toHaveBeenCalledWith(0.7)
    })

    it('should get volume from component', () => {
      mockComponent.getVolume.mockReturnValue(0.3)
      expect(controller.getVolume()).toBe(0.3)
    })

    it('should update volume icon', () => {
      controller.updateIcon(0.6, true)
      expect(mockComponent.updateIcon).toHaveBeenCalledWith(0.6, true)
    })

    it('should adjust volume by delta', () => {
      mockComponent.getVolume.mockReturnValue(0.4)

      controller.adjustVolume(0.2)

      expect(mockComponent.setVolume).toHaveBeenCalledWith(expect.closeTo(0.6))
      expect(volumeChangeCallback).toHaveBeenCalledWith(expect.closeTo(0.6))
    })

    it('should clamp adjusted volume to 0-1 range', () => {
      // Test overflow
      mockComponent.getVolume.mockReturnValue(0.9)
      controller.adjustVolume(0.2)
      expect(mockComponent.setVolume).toHaveBeenCalledWith(1.0)

      // Test underflow
      mockComponent.getVolume.mockReturnValue(0.1)
      controller.adjustVolume(-0.2)
      expect(mockComponent.setVolume).toHaveBeenCalledWith(0.0)
    })

    it('should handle volume change events', () => {
      // Get the event handler
      const volumeChangeHandler = mockComponent.addEventListener.mock.calls
        .find((call: any[]) => call[0] === 'volumechange')[1]

      // Simulate volume change event
      const mockEvent = { detail: { volume: 0.8 } }
      volumeChangeHandler(mockEvent)

      expect(volumeChangeCallback).toHaveBeenCalledWith(0.8)
    })

    it('should handle mute toggle events', () => {
      // Get the event handler
      const muteToggleHandler = mockComponent.addEventListener.mock.calls
        .find((call: any[]) => call[0] === 'mutetoggle')[1]

      // Simulate mute toggle event
      muteToggleHandler()

      expect(muteToggleCallback).toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    it('should have destroy method (no-op in this implementation)', () => {
      expect(() => controller.destroy()).not.toThrow()
    })
  })
})
