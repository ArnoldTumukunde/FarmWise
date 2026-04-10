"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncProgress = exports.recordDownloadDeletion = exports.recordDownload = exports.getDownloadUrl = void 0;
const progress_service_1 = require("../services/progress.service");
const getDownloadUrl = async (req, res) => {
    try {
        const { lectureId } = req.params;
        const result = await progress_service_1.ProgressService.getDownloadUrl(req.user.id, lectureId);
        res.json(result);
    }
    catch (e) {
        res.status(403).json({ error: e.message });
    }
};
exports.getDownloadUrl = getDownloadUrl;
const recordDownload = async (req, res) => {
    try {
        const { lectureId } = req.body;
        await progress_service_1.ProgressService.recordDownload(req.user.id, lectureId);
        res.json({ success: true });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.recordDownload = recordDownload;
const recordDownloadDeletion = async (req, res) => {
    try {
        const { lectureId } = req.params;
        await progress_service_1.ProgressService.recordDownloadDeletion(req.user.id, lectureId);
        res.json({ success: true });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.recordDownloadDeletion = recordDownloadDeletion;
const syncProgress = async (req, res) => {
    try {
        const { records } = req.body;
        if (!Array.isArray(records)) {
            return res.status(400).json({ error: 'Records must be an array' });
        }
        await progress_service_1.ProgressService.syncProgress(req.user.id, records);
        res.json({ success: true, syncedCount: records.length });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.syncProgress = syncProgress;
