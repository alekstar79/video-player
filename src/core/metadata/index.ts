import type { ITechnicalMetadata, IThumbnail, IThumbnailGenOptions } from './ThumbnailGenerator'
import type { IMediaMetadata, IPicture } from './MP4Parser'

import { ThumbnailGenerator } from './ThumbnailGenerator'
import { MP4Parser } from './MP4Parser'

/**
 * A unified interface that includes all types of metadata.
 */
export type IMetadata = ITechnicalMetadata & IMediaMetadata;

// Exporting interfaces for external use
export type {
  IPicture,
  IMediaMetadata,
  ITechnicalMetadata,
  IThumbnail,
  IThumbnailGenOptions
}

/**
 * A coordinator class for obtaining all types of metadata.
 */
class MetadataReader
{
  /**
   * Reads all metadata from a Blob object.
   * @param {Blob} blob - A file or Blob to analyze.
   * @returns {Promise<IMetadata>} A promise that resolves with a full metadata object.
   */
  public static async read(blob: Blob): Promise<IMetadata> {
    // To obtain technical data, creating an instance of the generator
    const generator = new ThumbnailGenerator(blob)

    // Simultaneously starting receiving technical data and parsing media tags
    const [technicalMetadata, mediaMetadata] = await Promise.all([
      generator.getTechnicalMetadata(),
      MP4Parser.parse(blob)
    ])

    // Combining the results
    return {
      ...technicalMetadata,
      ...mediaMetadata,
    }
  }
}

/**
 * Main function for getting a full set of metadata from a file.
 * @param {Blob} blob - The file or Blob to analyze.
 */
export async function getMetadata(blob: Blob): Promise<IMetadata>
{
  return MetadataReader.read(blob)
}

/**
 * Generates and returns a series of thumbnails from a video file.
 * @param {Blob} blob - The file or Blob to analyze.
 * @param {IThumbnailGenOptions} options - Options for generating thumbnails.
 */
export async function getThumbnails(
  blob: Blob,
  options: IThumbnailGenOptions
): Promise<IThumbnail[]> {
  const generator = new ThumbnailGenerator(blob)
  return generator.getThumbnails(options)
}
