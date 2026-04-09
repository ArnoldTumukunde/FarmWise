import { CommunityService } from '../services/community.service';
export const getNotes = async (req, res) => {
    try {
        const notes = await CommunityService.getNotes(req.user.id, req.params.lectureId);
        res.json({ notes });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
export const createNote = async (req, res) => {
    try {
        const { content, timestamp } = req.body;
        const note = await CommunityService.createNote(req.user.id, req.params.lectureId, content, timestamp);
        res.json({ note });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
export const deleteNote = async (req, res) => {
    try {
        await CommunityService.deleteNote(req.user.id, req.params.noteId);
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
export const getQuestions = async (req, res) => {
    try {
        const questions = await CommunityService.getQuestions(req.params.lectureId);
        res.json({ questions });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
export const createQuestion = async (req, res) => {
    try {
        const question = await CommunityService.createQuestion(req.user.id, req.params.lectureId, req.body.content);
        res.json({ question });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
export const createAnswer = async (req, res) => {
    try {
        const answer = await CommunityService.createAnswer(req.user.id, req.params.questionId, req.body.content);
        res.json({ answer });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
export const upvoteAnswer = async (req, res) => {
    try {
        const result = await CommunityService.upvoteAnswer(req.user.id, req.params.answerId);
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
export const checkCertificate = async (req, res) => {
    try {
        const result = await CommunityService.checkCertificateEligibility(req.user.id, req.params.courseId);
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
