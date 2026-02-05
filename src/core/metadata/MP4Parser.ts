/**
 * Describes the format of the embedded image (cover)
 */
export interface IPicture {
  format: string;
  data: Uint8Array;
  description?: string;
}

/**
 * Describes media tags (title, artist, etc.)
 */
export interface IMediaMetadata {
  title?: string;
  artist?: string;
  album?: string;
  picture?: IPicture;
}

/**
 * Parser for extracting metadata from MP4 files.
 * It implements basic navigation through ISO BMFF boxes.
 */
export class MP4Parser
{
  /**
   * Main method for parsing a Blob object.
   * @param {Blob} blob - The file or Blob to be analyzed.
   * @returns {Promise<IMediaMetadata>}
   */
  public static async parse(blob: Blob): Promise<IMediaMetadata> {
    try {
      const buffer = await blob.arrayBuffer()

      const moovBox = this.findBox(buffer, 'moov')
      if (!moovBox) return {}

      const udtaBox = this.findBox(moovBox, 'udta')
      if (!udtaBox) return {}

      const metaBox = this.findBox(udtaBox, 'meta')
      if (!metaBox) return {}

      const ilstBox = this.findBox(metaBox.slice(4), 'ilst')
      if (!ilstBox) return {}

      return this.parseIlst(ilstBox)
    } catch (error) {
      console.warn('Failed to parse MP4 metadata:', error)
      return {}
    }
  }

  /**
   * Finds a child box by type inside the parent buffer.
   */
  private static findBox(buffer: ArrayBuffer, type: string): ArrayBuffer | null
  {
    const view = new DataView(buffer)
    let offset = 0

    while (offset < view.byteLength) {
      const size = view.getUint32(offset)
      const currentType = this.bytesToString(buffer, offset + 4, 4)

      if (currentType === type) {
        return buffer.slice(offset + 8, offset + size)
      }

      if (size === 0) break
      offset += size
    }

    return null
  }

  /**
   * Parses a 'ilst' box containing a list of tags.
   */
  private static parseIlst(ilstBuffer: ArrayBuffer): IMediaMetadata
  {
    const metadata: IMediaMetadata = {}
    const view = new DataView(ilstBuffer)
    let offset = 0

    const metadataTags: { [key: string]: keyof IMediaMetadata } = {
      '\u00A9nam': 'title',
      '\u00A9art': 'artist',
      '\u00A9alb': 'album',
      'covr': 'picture',
    }

    while (offset < ilstBuffer.byteLength) {
      const size = view.getUint32(offset)
      const type = this.bytesToString(ilstBuffer, offset + 4, 4)

      if (metadataTags[type]) {
        const dataBox = this.findBox(ilstBuffer.slice(offset + 8, offset + size), 'data')

        if (dataBox) {
          const payload = dataBox.slice(8)

          if (type === 'covr') {
            const imageTypeIndicator = new DataView(dataBox).getUint32(0)
            let mimeType = 'image/jpeg'
            if (imageTypeIndicator === 13) mimeType = 'image/jpeg'
            if (imageTypeIndicator === 14) mimeType = 'image/png'

            metadata.picture = {
              format: mimeType,
              data: new Uint8Array(payload),
              description: 'Cover Art'
            }
          } else {
            metadata[metadataTags[type] as 'title' | 'artist' | 'album'] = new TextDecoder('utf-8').decode(payload)
          }
        }
      }

      if (size === 0) break
      offset += size
    }

    return metadata
  }

  /**
   * An auxiliary function for converting bytes to a string.
   */
  private static bytesToString(
    buffer: ArrayBuffer,
    start: number,
    length: number
  ): string {
    const a = new Uint8Array(buffer, start, length)
    return String.fromCharCode.apply(null, a as unknown as number[])
  }
}
