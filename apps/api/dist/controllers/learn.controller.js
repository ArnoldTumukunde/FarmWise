import { ProgressService } from '../services/progress.service';
export const getDownloadUrl = async (req, res) => {
    try {
        const { lectureId } = req.params;
        const result = await ProgressService.getDownloadUrl(req.user.id, lectureId);
        res.json(result);
    }
    catch (e) {
        res.status(403).json({ error: e.message });
    }
};
export const recordDownload = async (req, res) => {
    try {
        const { lectureId } = req.body;
        await ProgressService.recordDownload(req.user.id, lectureId);
        res.json({ success: true });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
export const recordDownloadDeletion = async (req, res) => {
    try {
        const { lectureId } = req.params;
        await ProgressService.recordDownloadDeletion(req.user.id, lectureId);
        res.json({ success: true });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
export const syncProgress = async (req, res) => {
    try {
        const { records } = req.body;
        if (!Array.isArray(records)) {
            return res.status(400).json({ error: 'Records must be an array' });
        }
        await ProgressService.syncProgress(req.user.id, records);
        res.json({ success: true, syncedCount: records.length });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
