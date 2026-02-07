import { ZIndexInterface } from '@/types'

export class ZIndex implements ZIndexInterface
{
  static inatance: ZIndexInterface

  static highestZIndex = 1000

  static init = () => ZIndex.inatance ??= new ZIndex()

  private draggable: string[] = []

  value(uid: string): string
  {
    return `${ZIndex.highestZIndex + this.draggable.findIndex(id => id === uid)}`
  }

  push(uid: string): this
  {
    this.draggable = [...new Set<string>([...this.draggable, uid])]

    return this
  }

  remove(uid: string): this
  {
    this.draggable = this.draggable.filter(id => id !== uid)

    return this
  }

  sort(uid: string): this
  {
    this.draggable.sort(($1: number | string, $2: number | string) => {
      return $1 === uid ? 1 : $2 === uid ? -1 : 0
    })

    return this
  }
}

/**
 * Check if element is within viewport boundaries
 */
export function isInViewport(element: HTMLElement): boolean
{
  const rect = element.getBoundingClientRect()

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

/**
 * Get viewport dimensions
 */
export function getViewportDimensions(): { width: number; height: number }
{
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight
  }
}

/**
 * @returns {ZIndex} - Класс вычисляющий z-index позиции контейнеров
 */
export function zIndex(): ZIndexInterface
{
  return ZIndex.init()
}
