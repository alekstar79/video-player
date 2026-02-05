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
    if (!isFinite(seconds) || seconds < 0) return '0:00'

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

  /**
   * Format bytes into a human-readable string
   */
  static formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Captures a frame from a video element and returns it as a Blob.
   */
  static captureFrame(video: HTMLVideoElement, quality: number = 0.8): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(null);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      } catch (error) {
        reject(error);
      }
    });
  }
}
