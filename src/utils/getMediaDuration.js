import ffmpeg from 'fluent-ffmpeg';

/**
 * Get the duration of a media file (video/audio)
 * @param {string} filePath - The path to the media file
 * @returns {Promise<number>} - Duration in seconds
 */
export const getMediaDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        return reject(err);
      }
      const duration = metadata.format.duration; // Duration in seconds
      resolve(duration);
    });
  });
};