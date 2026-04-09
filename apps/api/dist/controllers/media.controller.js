import { storageService } from '../services/cloudinary.service';
import { prisma } from '@farmwise/db';
import { v2 as cloudinary } from 'cloudinary';
export const getUploadSignature = async (req, res) => {
    try {
        // Support both GET query params and POST body
        const folder = req.query.folder || req.body?.folder;
        if (!folder)
            return res.status(400).json({ error: 'Folder name is required' });
        const resourceType = (req.query.type || req.body?.type || 'image');
        // Avatar uploads are open to all authenticated users; course media needs instructor/admin
        const openFolders = ['avatars'];
        if (!openFolders.includes(folder) && req.user.role !== 'INSTRUCTOR' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Instructor access required' });
        }
        const signatureData = storageService.generateUploadSignature(folder, resourceType);
        res.json({
            ...signatureData,
            apiKey: signatureData.api_key,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const handleVideoReadyWebhook = async (req, res) => {
    try {
        const { public_id, asset_id, secure_url, eager } = req.body;
        // In production, we should verify the X-Cld-Signature header to ensure the webhook came from Cloudinary.
        const signature = req.headers['x-cld-signature'];
        const timestamp = req.headers['x-cld-timestamp'];
        if (!signature || !timestamp) {
            return res.status(401).json({ error: 'Missing Cloudinary signature headers' });
        }
        const bodyStr = req.rawBody.toString('utf8');
        const isValid = cloudinary.utils.verifyNotificationSignature(bodyStr, parseInt(timestamp, 10), signature, 7200 // valid for 2 hours
        );
        if (!isValid) {
            console.error('Invalid Cloudinary Signature');
            return res.status(401).json({ error: 'Invalid webhook signature' });
        }
        if (!public_id)
            return res.status(400).json({ error: 'Missing public_id' });
        // Update the lecture that matches this videoPublicId
        const lecture = await prisma.lecture.findFirst({
            where: { videoPublicId: public_id }
        });
        if (lecture) {
            // Find the HLS url from the eager transforms
            let hlsUrl = null;
            if (eager && eager.length > 0) {
                const m3u8Transform = eager.find((e) => e.format === 'm3u8');
                if (m3u8Transform)
                    hlsUrl = m3u8Transform.secure_url;
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
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: error.message });
    }
};
