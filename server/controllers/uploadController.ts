import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/upload/status - Check Cloudinary configuration status
router.get('/status', (req, res) => {
  const isCloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_CLOUD_NAME.trim() !== '' &&
    process.env.CLOUDINARY_API_KEY.trim() !== ''
  );

  res.json({
    configured: isCloudinaryConfigured,
    service: 'Cloudinary',
    message: isCloudinaryConfigured
      ? 'Cloudinary CDN is configured.'
      : 'Cloudinary is optional and currently not configured. Direct image URLs or inline images are supported.',
  });
});

// POST /api/upload - Handle upload
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const isCloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_CLOUD_NAME.trim() !== '' &&
    process.env.CLOUDINARY_API_KEY.trim() !== ''
  );

  if (!isCloudinaryConfigured) {
    res.status(503).json({
      configured: false,
      error: 'Cloudinary image service is not configured. Service is optional. You can supply direct image URLs or publish without images.',
    });
    return;
  }

  try {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ error: 'Image data is required.' });
      return;
    }

    // Cloudinary direct REST upload
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';

    // If apiKey and cloudName exist, send to Cloudinary upload API
    const formData = new URLSearchParams();
    formData.append('file', image);
    formData.append('upload_preset', uploadPreset);
    formData.append('api_key', apiKey!);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (uploadRes.ok) {
      const data = await uploadRes.json();
      res.json({
        url: data.secure_url,
        publicId: data.public_id,
        configured: true,
      });
    } else {
      const errText = await uploadRes.text();
      console.warn('Cloudinary upload error response:', errText);
      res.status(502).json({
        error: 'Cloudinary upload failed with current credentials.',
        details: errText,
      });
    }
  } catch (err: any) {
    console.error('Upload processing error:', err);
    res.status(500).json({ error: 'Failed to process image upload.' });
  }
});

export default router;
