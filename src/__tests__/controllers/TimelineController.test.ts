import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TimelineController } from '@/modules/controls/TimelineController'

describe('TimelineController', () => {
  let mockComponent: any
  let seekCallback: (time: number) => void
  let hoverCallback: (time: number) => void
  let controller: TimelineController

  beforeEach(() => {
    mockComponent = {
      addEventListener: vi.fn(),
      updateProgress: vi.fn(),
      setDuration: vi.fn()
    }

    seekCallback = vi.fn<(time: number) => void>()
    hoverCallback = vi.fn<(time: number) => void>()
  })

  describe('With hover callback', () => {
    beforeEach(() => {
      controller = new TimelineController(
        mockComponent,
        seekCallback,
        hoverCallback
      )
    })

    it('should bind both event listeners', () => {
      expect(mockComponent.addEventListener).toHaveBeenCalledWith(
        'seek',
        expect.any(Function)
      )
      expect(mockComponent.addEventListener).toHaveBeenCalledWith(
        'hover',
        expect.any(Function)
      )
    })

    it('should handle seek events', () => {
      const seekHandler = mockComponent.addEventListener.mock.calls
        .find((call: any[]) => call[0] === 'seek')[1]

      const mockEvent = { detail: { time: 30 } }
      seekHandler(mockEvent)

      expect(seekCallback).toHaveBeenCalledWith(30)
    })

    it('should handle hover events', () => {
      const hoverHandler = mockComponent.addEventListener.mock.calls
        .find((call: any[]) => call[0] === 'hover')[1]

      const mockEvent = { detail: { time: 15 } }
      hoverHandler(mockEvent)

      expect(hoverCallback).toHaveBeenCalledWith(15)
    })
  })

  describe('Without hover callback', () => {
    beforeEach(() => {
      controller = new TimelineController(
        mockComponent,
        seekCallback
      )
    })

    it('should only bind seek event listener', () => {
      expect(mockComponent.addEventListener).toHaveBeenCalledWith(
        'seek',
        expect.any(Function)
      )
      expect(mockComponent.addEventListener).not.toHaveBeenCalledWith(
        'hover',
        expect.any(Function)
      )
    })
  })

  describe('Progress updates', () => {
    beforeEach(() => {
      controller = new TimelineController(
        mockComponent,
        seekCallback
      )
    })

    it('should update progress', () => {
      controller.updateProgress(30, 100)

      expect(mockComponent.updateProgress).toHaveBeenCalledWith(30, 100)
    })

    it('should set duration', () => {
      controller.setDuration(120)

      expect(mockComponent.setDuration).toHaveBeenCalledWith(120)
    })

    it('should handle zero duration', () => {
      controller.updateProgress(0, 0)

      expect(mockComponent.updateProgress).toHaveBeenCalledWith(0, 0)
    })
  })

  describe('Cleanup', () => {
    it('should have destroy method (no-op in this implementation)', () => {
      controller = new TimelineController(
        mockComponent,
        seekCallback
      )

      expect(() => controller.destroy()).not.toThrow()
    })
  })
})
