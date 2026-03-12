import sanitizeHtml from 'sanitize-html';

export const sanitizeRichText = (html: string | undefined | null): string => {
  if (!html) return '';
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'span']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'width', 'height'],
      span: ['style'],
      '*': ['class', 'style'] // Often TipTap uses style/class
    }
  });
};
