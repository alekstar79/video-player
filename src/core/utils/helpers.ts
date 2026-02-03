/**
 * Utility functions for the video player
 */
export class Helpers
{
  /**
   * Format seconds into MM:SS or HH:MM:SS format for video duration
   */
  static formatTime(seconds: number): string
  {
    if (!isFinite(seconds) || seconds < 0) {
      return '0:00'
    }

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    // Format seconds always as 2 digits
    const formattedSeconds = secs.toString().padStart(2, '0')

    if (hours > 0) {
      // Format as HH:MM:SS
      const formattedMinutes = minutes.toString().padStart(2, '0')
      return `${hours}:${formattedMinutes}:${formattedSeconds}`
    } else {
      // Format as MM:SS (no leading zero for minutes under 10)
      return `${minutes}:${formattedSeconds}`
    }
  }

  /**
   * Clamp a value between min and max
   */
  static clamp(value: number, min: number, max: number): number
  {
    return Math.min(Math.max(value, min), max)
  }
}
