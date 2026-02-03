/**
 * Generic event emitter for handling player events
 */
export class EventEmitter<TEvents extends Record<string, any>>
{
  private listeners: Partial<{ [K in keyof TEvents]: ((data: TEvents[K]) => void)[] }> = {}

  /**
   * Subscribe to an event
   */
  on<K extends keyof TEvents>(event: K, callback: (data: TEvents[K]) => void): void
  {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }

    this.listeners[event]!.push(callback)
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof TEvents>(event: K, callback: (data: TEvents[K]) => void): void
  {
    if (!this.listeners[event]) return

    this.listeners[event] = this.listeners[event]!
      .filter(cb => cb !== callback)
  }

  /**
   * Emit an event to all subscribers
   */
  emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void
  {
    if (!this.listeners[event]) return

    this.listeners[event]!.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in event handler for ${String(event)}:`, error)
      }
    })
  }

  /**
   * Remove all event listeners
   */
  destroy(): void
  {
    this.listeners = {}
  }
}
