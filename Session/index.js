const sessions = new Map();

export const has = (sessionId) => sessions.has(sessionId);
export const get = (sessionId) => sessions.get(sessionId);
export const save = (sessionId, userData) => sessions.set(sessionId, userData);
export const deleteSession = (sessionId) => sessions.delete(sessionId);
