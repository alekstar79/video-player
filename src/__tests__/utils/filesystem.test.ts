import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Filesystem } from '@/core/utils/filesystem'

describe('Filesystem', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:test-url')
    global.URL.revokeObjectURL = vi.fn()

    // Mock document.createElement and related methods
    const mockInput = {
      type: '',
      accept: '',
      multiple: false,
      style: {},
      files: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }

    vi.spyOn(document, 'createElement').mockReturnValue(mockInput as any)
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)

    // Mock window events
    window.addEventListener = vi.fn()
    window.removeEventListener = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isPickerSupported', () => {
    it('should return true when File System Access API is supported', () => {
      // Mock showOpenFilePicker
      ;(global as any).showOpenFilePicker = vi.fn()

      expect(Filesystem.isPickerSupported()).toBe(true)
    })

    it('should return false when File System Access API is not supported', () => {
      delete (global as any).showOpenFilePicker

      expect(Filesystem.isPickerSupported()).toBe(false)
    })
  })

  describe('createObjectURL and revokeObjectURL', () => {
    it('should create object URL from file', () => {
      const file = new File(['test'], 'video.mp4', { type: 'video/mp4' })
      const url = Filesystem.createObjectURL(file)

      expect(URL.createObjectURL).toHaveBeenCalledWith(file)
      expect(url).toBe('blob:test-url')
    })

    it('should create object URL from blob', () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' })
      const url = Filesystem.createObjectURL(blob)

      expect(URL.createObjectURL).toHaveBeenCalledWith(blob)

      void url
    })

    it('should revoke object URL', () => {
      const url = 'blob:test-url'
      Filesystem.revokeObjectURL(url)

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(url)
    })
  })

  describe('isVideoFile', () => {
    it('should identify video files', () => {
      const videoFile = new File(['test'], 'video.mp4', { type: 'video/mp4' })
      const imageFile = new File(['test'], 'image.jpg', { type: 'image/jpeg' })

      expect(Filesystem.isVideoFile(videoFile)).toBe(true)
      expect(Filesystem.isVideoFile(imageFile)).toBe(false)
    })

    it('should handle files without type', () => {
      const file = new File(['test'], 'unknown')
      expect(Filesystem.isVideoFile(file)).toBe(false)
    })
  })

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(Filesystem.getFileExtension('video.mp4')).toBe('mp4')
      expect(Filesystem.getFileExtension('document.pdf')).toBe('pdf')
      expect(Filesystem.getFileExtension('noextension')).toBe('')
      expect(Filesystem.getFileExtension('multiple.dots.file.txt')).toBe('txt')
      expect(Filesystem.getFileExtension('')).toBe('')
    })

    it('should return lowercase extension', () => {
      expect(Filesystem.getFileExtension('video.MP4')).toBe('mp4')
      expect(Filesystem.getFileExtension('video.Mp4')).toBe('mp4')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(Filesystem.formatFileSize(0)).toBe('0 B')
      expect(Filesystem.formatFileSize(500, 0)).toBe('500 B')
      expect(Filesystem.formatFileSize(1024)).toBe('1.02 KB')
      expect(Filesystem.formatFileSize(1048576)).toBe('1.05 MB')
      expect(Filesystem.formatFileSize(1073741824)).toBe('1.07 GB')
    })

    it('should format using binary units', () => {
      expect(Filesystem.formatFileSize(1024, 2, true)).toBe('1.00 KiB')
      expect(Filesystem.formatFileSize(1048576, 2, true)).toBe('1.00 MiB')
    })

    it('should respect decimal places', () => {
      expect(Filesystem.formatFileSize(1500, 0)).toBe('2 KB')
      expect(Filesystem.formatFileSize(1500, 4)).toBe('1.5000 KB')
    })

    it('should handle large numbers', () => {
      expect(Filesystem.formatFileSize(1e12, 0)).toBe('1 TB')
      expect(Filesystem.formatFileSize(1e15, 0)).toBe('1 PB')
    })
  })

  describe('saveFile', () => {
    it('should trigger file download', async () => {
      vi.useFakeTimers()
      const blob = new Blob(['test'], { type: 'text/plain' })
      const filename = 'test.txt'

      const mockAnchor = {
        download: '',
        href: '',
        click: vi.fn(),
        dispatchEvent: vi.fn(),
        parentNode: document.body
      }

      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)

      Filesystem.saveFile(blob, filename)

      expect(mockAnchor.download).toBe(filename)
      expect(mockAnchor.href).toBe('blob:test-url')
      expect(document.body.appendChild).toHaveBeenCalledWith(mockAnchor)
      expect(mockAnchor.dispatchEvent).toHaveBeenCalled()

      // Fast-forward timers to trigger the cleanup
      vi.runAllTimers()

      expect(document.body.removeChild).toHaveBeenCalledWith(mockAnchor)
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url')
      vi.useRealTimers()
    })
  })

  describe('open (legacy file dialog)', () => {
    it('should create input element with correct attributes', () => {
      const input = Filesystem.createInput({ accept: 'video/*', multiple: true })

      expect(input.type).toBe('file')
      expect(input.accept).toBe('video/*')
      expect(input.multiple).toBe(true)
      expect(input.style.visibility).toBe('hidden')
    })

    it('should dispatch click event', () => {
      const mockInput = {
        dispatchEvent: vi.fn()
      }

      Filesystem.dispatch(mockInput as any, 'click')

      expect(mockInput.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'click' })
      )
    })

    it('should cleanup element', () => {
      const mockParent = {
        removeChild: vi.fn()
      }
      const mockInput = {
        parentNode: mockParent
      }

      Filesystem.cleanup(mockInput as any)

      expect(mockParent.removeChild).toHaveBeenCalledWith(mockInput)
    })

    it('should handle cleanup without parentNode', () => {
      const mockInput = {
        parentNode: null
      }

      // Should not throw
      expect(() => Filesystem.cleanup(mockInput as any)).not.toThrow()
    })
  })

  describe('selectFileWithPicker', () => {
    beforeEach(() => {
      // Mock File System Access API
      const mockFileHandle = {
        getFile: vi.fn().mockResolvedValue(new File(['test'], 'video.mp4'))
      }

      ;(global as any).showOpenFilePicker = vi.fn().mockResolvedValue([mockFileHandle])
    })

    afterEach(() => {
      delete (global as any).showOpenFilePicker
    })

    it('should use File System Access API when available', async () => {
      const file = await Filesystem.selectFileWithPicker('video/*')

      expect(showOpenFilePicker).toHaveBeenCalled()
      expect(file).toBeInstanceOf(File)
    })

    it('should handle multiple files', async () => {
      const mockFileHandle1 = {
        getFile: vi.fn().mockResolvedValue(new File(['test1'], 'video1.mp4'))
      }
      const mockFileHandle2 = {
        getFile: vi.fn().mockResolvedValue(new File(['test2'], 'video2.mp4'))
      }

      ;(global as any).showOpenFilePicker = vi.fn().mockResolvedValue([mockFileHandle1, mockFileHandle2])

      const files = await Filesystem.selectFileWithPicker('video/*', true)

      expect(Array.isArray(files)).toBe(true)
      expect(files).toHaveLength(2)
    })

    it('should handle AbortError', async () => {
      ;(global as any).showOpenFilePicker = vi.fn().mockRejectedValue({ name: 'AbortError' })

      const result = await Filesystem.selectFileWithPicker('video/*')

      expect(result).toBeNull()
    })

    it('should re-throw other errors', async () => {
      const testError = new Error('Test error')
      ;(global as any).showOpenFilePicker = vi.fn().mockRejectedValue(testError)

      // Per Vitest logs, this await is necessary for future versions
      expect(Filesystem.selectFileWithPicker('video/*')).rejects.toThrow(testError)
    })
  })
})
