import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ProgressService } from '../services/progress.service';

export const getDownloadUrl = async (req: AuthRequest, res: Response) => {
    try {
        const { lectureId } = req.params;
        const result = await ProgressService.getDownloadUrl(req.user!.id, lectureId);
        res.json(result);
    } catch (e: any) {
        res.status(403).json({ error: e.message });
    }
};

export const getPdfUrl = async (req: AuthRequest, res: Response) => {
    try {
        const { lectureId } = req.params;
        const result = await ProgressService.getPdfUrl(req.user!.id, lectureId);
        res.json(result);
    } catch (e: any) {
        res.status(403).json({ error: e.message });
    }
};

export const recordDownload = async (req: AuthRequest, res: Response) => {
    try {
        const { lectureId } = req.body;
        await ProgressService.recordDownload(req.user!.id, lectureId);
        res.json({ success: true });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
};

export const recordDownloadDeletion = async (req: AuthRequest, res: Response) => {
    try {
        const { lectureId } = req.params;
        await ProgressService.recordDownloadDeletion(req.user!.id, lectureId);
        res.json({ success: true });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
};

export const syncProgress = async (req: AuthRequest, res: Response) => {
    try {
        const { records } = req.body;
        if (!Array.isArray(records)) {
            return res.status(400).json({ error: 'Records must be an array' });
        }
        await ProgressService.syncProgress(req.user!.id, records);
        res.json({ success: true, syncedCount: records.length });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};
