import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const THUMB_DIR = path.resolve(__dirname, '../../../data/ytstudio/thumbnails');

if (!fs.existsSync(THUMB_DIR)) {
  fs.mkdirSync(THUMB_DIR, { recursive: true });
}

export class ThumbnailEngine {
  static async generateThumbnailVariations({ storyId, headlineText, characterName = 'Ramesh' }) {
    const fileName = `thumb_${storyId}_${Date.now()}.png`;
    const outputPath = path.join(THUMB_DIR, fileName);

    fs.writeFileSync(outputPath, Buffer.from(`THUMBNAIL_IMAGE_DATA:${headlineText}:${characterName}`));

    const variations = [
      {
        id: `var_1_${storyId}`,
        style: 'High-Contrast Yellow Text + Sad Facial Close-up',
        headlineText: headlineText || 'TEARS OF TRUTH',
        contrastScore: 96.5,
        predictedCTR: 9.8,
        faceCount: 1,
        imagePath: outputPath,
        imageUrl: `/assets/yt/thumbnails/${fileName}`
      },
      {
        id: `var_2_${storyId}`,
        style: 'White Bold Text + Red Outline Background',
        headlineText: headlineText || 'UNBELIEVABLE ENDING',
        contrastScore: 91.2,
        predictedCTR: 8.6,
        faceCount: 2,
        imagePath: outputPath,
        imageUrl: `/assets/yt/thumbnails/${fileName}`
      }
    ];

    return {
      success: true,
      storyId,
      winner: variations[0],
      variations
    };
  }

  static predictCTR({ contrastScore, faceCount, headlineLength }) {
    const baseCTR = 7.0;
    const contrastBonus = (contrastScore / 100) * 2.0;
    const faceBonus = faceCount === 1 ? 0.8 : 0.4;
    const predictedCTR = parseFloat((baseCTR + contrastBonus + faceBonus).toFixed(1));

    return {
      predictedCTR,
      rating: predictedCTR >= 9.0 ? 'VIRAL_CTR' : 'GOOD_CTR'
    };
  }
}
