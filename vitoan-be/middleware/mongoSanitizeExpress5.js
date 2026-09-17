function isObjectLike(value) {
  return value && typeof value === "object";
}

function sanitizeDeep(input, replaceWith = "_", onTouch) {
  if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i += 1) {
      if (isObjectLike(input[i])) sanitizeDeep(input[i], replaceWith, onTouch);
    }
    return input;
  }
  if (!isObjectLike(input)) return input;

  Object.keys(input).forEach((key) => {
    const value = input[key];
    const shouldSanitize = key.startsWith("$") || key.includes(".");
    if (shouldSanitize) {
      const nextKey = key.replace(/\$/g, replaceWith).replace(/\./g, replaceWith);
      if (!Object.prototype.hasOwnProperty.call(input, nextKey)) {
        input[nextKey] = value;
      }
      delete input[key];
      if (typeof onTouch === "function") onTouch();
      if (isObjectLike(input[nextKey])) sanitizeDeep(input[nextKey], replaceWith, onTouch);
      return;
    }
    if (isObjectLike(value)) sanitizeDeep(value, replaceWith, onTouch);
  });
  return input;
}

function cloneForSanitize(value) {
  if (!isObjectLike(value)) return value;
  try {
    return structuredClone(value);
  } catch {
    return Array.isArray(value) ? [...value] : { ...value };
  }
}

function safeSetRequestProp(req, key, value) {
  try {
    req[key] = value;
  } catch {
    Object.defineProperty(req, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
}

function mongoSanitizeExpress5(options = {}) {
  const replaceWith = typeof options.replaceWith === "string" ? options.replaceWith : "_";

  return function mongoSanitizeExpress5Middleware(req, _res, next) {
    ["body", "params", "query"].forEach((key) => {
      const raw = req[key];
      if (!isObjectLike(raw)) return;
      const cloned = cloneForSanitize(raw);
      sanitizeDeep(cloned, replaceWith);
      safeSetRequestProp(req, key, cloned);
    });
    next();
  };
}

module.exports = mongoSanitizeExpress5;
