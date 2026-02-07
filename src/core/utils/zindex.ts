import { ZIndexInterface } from '@/types'

export class ZIndex implements ZIndexInterface
{
  static instance: ZIndexInterface

  static highestZIndex = 1000

  static init = () => ZIndex.instance ??= new ZIndex()

  private draggable: string[] = []

  value(uid: string): string
  {
    return `${ZIndex.highestZIndex + this.draggable.findIndex(id => id === uid)}`
  }

  push(uid: string): this
  {
    if (!this.draggable.includes(uid)) {
      this.draggable.push(uid)
    }

    return this
  }

  remove(uid: string): this
  {
    this.draggable = this.draggable.filter(id => id !== uid)
    return this
  }

  sort(uid: string): this
  {
    const index = this.draggable.indexOf(uid)

    if (index !== -1) {
      this.draggable.splice(index, 1)
      this.draggable.push(uid)
    }

    return this
  }
}

/**
 * @returns {ZIndex} - Класс вычисляющий z-index позиции контейнеров
 */
export function zIndex(): ZIndexInterface
{
  return ZIndex.init()
}
