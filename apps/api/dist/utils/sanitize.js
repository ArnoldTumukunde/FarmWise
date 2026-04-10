"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeRichText = void 0;
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const sanitizeRichText = (html) => {
    if (!html)
        return '';
    return (0, sanitize_html_1.default)(html, {
        allowedTags: sanitize_html_1.default.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'span']),
        allowedAttributes: {
            ...sanitize_html_1.default.defaults.allowedAttributes,
            img: ['src', 'alt', 'width', 'height'],
            span: ['style'],
            '*': ['class', 'style'] // Often TipTap uses style/class
        }
    });
};
exports.sanitizeRichText = sanitizeRichText;
