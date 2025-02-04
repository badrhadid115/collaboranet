function trimWhitespace(req, res, next) {
  const trimStrings = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/[\s\u200B\u00A0\u2002\u2003\u2007]+/g, ' ').trim();
      } else if (Array.isArray(obj[key])) {
        obj[key] = obj[key].map((item) =>
          typeof item === 'string' ? item.replace(/[\s\u200B\u00A0\u2002\u2003\u2007]+/g, ' ').trim() : item
        );
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        trimStrings(obj[key]);
      }
    }
  };
  if (req.body) trimStrings(req.body);
  next();
}

module.exports = trimWhitespace;
