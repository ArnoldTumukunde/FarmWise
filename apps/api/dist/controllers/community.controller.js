"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCertificate = exports.upvoteAnswer = exports.createAnswer = exports.createQuestion = exports.getQuestions = exports.deleteNote = exports.createNote = exports.getNotes = void 0;
const community_service_1 = require("../services/community.service");
const getNotes = async (req, res) => {
    try {
        const notes = await community_service_1.CommunityService.getNotes(req.user.id, req.params.lectureId);
        res.json({ notes });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getNotes = getNotes;
const createNote = async (req, res) => {
    try {
        const { content, timestamp } = req.body;
        const note = await community_service_1.CommunityService.createNote(req.user.id, req.params.lectureId, content, timestamp);
        res.json({ note });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.createNote = createNote;
const deleteNote = async (req, res) => {
    try {
        await community_service_1.CommunityService.deleteNote(req.user.id, req.params.noteId);
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.deleteNote = deleteNote;
const getQuestions = async (req, res) => {
    try {
        const questions = await community_service_1.CommunityService.getQuestions(req.params.lectureId);
        res.json({ questions });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getQuestions = getQuestions;
const createQuestion = async (req, res) => {
    try {
        const question = await community_service_1.CommunityService.createQuestion(req.user.id, req.params.lectureId, req.body.content);
        res.json({ question });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.createQuestion = createQuestion;
const createAnswer = async (req, res) => {
    try {
        const answer = await community_service_1.CommunityService.createAnswer(req.user.id, req.params.questionId, req.body.content);
        res.json({ answer });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.createAnswer = createAnswer;
const upvoteAnswer = async (req, res) => {
    try {
        const result = await community_service_1.CommunityService.upvoteAnswer(req.user.id, req.params.answerId);
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.upvoteAnswer = upvoteAnswer;
const checkCertificate = async (req, res) => {
    try {
        const result = await community_service_1.CommunityService.checkCertificateEligibility(req.user.id, req.params.courseId);
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.checkCertificate = checkCertificate;
