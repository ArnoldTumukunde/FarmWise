import { Request, Response } from 'express';
import { storageService } from '../services/cloudinary.service';
import { prisma } from '@farmwise/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { v2 as cloudinary } from 'cloudinary';

export const getUploadSignature = async (req: AuthRequest, res: Response) => {
  try {
    const { folder } = req.body;
    if (!folder) return res.status(400).json({ error: 'Folder name is required' });

    // Ensure instructor access
    if (req.user!.role !== 'INSTRUCTOR' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Instructor access required' });
    }

    const signatureData = storageService.generateUploadSignature(folder);
    res.json(signatureData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const handleVideoReadyWebhook = async (req: Request, res: Response) => {
  try {
    const { public_id, asset_id, secure_url, eager } = req.body;
    
    // In production, we should verify the X-Cld-Signature header to ensure the webhook came from Cloudinary.
    const signature = req.headers['x-cld-signature'] as string;
    const timestamp = req.headers['x-cld-timestamp'] as string;
    
    if (!signature || !timestamp) {
      return res.status(401).json({ error: 'Missing Cloudinary signature headers' });
    }
    
    const bodyStr = ((req as any).rawBody as Buffer).toString('utf8');
    const isValid = cloudinary.utils.verifyNotificationSignature(
      bodyStr,
      parseInt(timestamp, 10),
      signature,
      7200 // valid for 2 hours
    );

    if (!isValid) {
      console.error('Invalid Cloudinary Signature');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    if (!public_id) return res.status(400).json({ error: 'Missing public_id' });

    // Update the lecture that matches this videoPublicId
    const lecture = await prisma.lecture.findFirst({
      where: { videoPublicId: public_id }
    });

    if (lecture) {
      // Find the HLS url from the eager transforms
      let hlsUrl = null;
      if (eager && eager.length > 0) {
         const m3u8Transform = eager.find((e: any) => e.format === 'm3u8');
         if (m3u8Transform) hlsUrl = m3u8Transform.secure_url;
      }

      await prisma.lecture.update({
        where: { id: lecture.id },
        data: {
          videoStatus: 'READY',
          hlsUrl: hlsUrl || storageService.getHlsUrl(public_id),
        }
      });
    }

    res.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
};
