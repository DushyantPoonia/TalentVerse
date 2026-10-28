export function parseRetryAfter(value, now = Date.now()) {
  if (typeof value !== 'string' || !value.trim()) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1000);

  const retryAt = Date.parse(value);
  return Number.isNaN(retryAt) ? null : Math.max(0, retryAt - now);
}

export function createHistoryClient(sendRequest) {
  const cache = new Map();
  const inFlight = new Map();

  function get(token, offset = 0, { refresh = false } = {}) {
    let tokenCache = cache.get(token);
    if (!tokenCache) {
      tokenCache = new Map();
      cache.set(token, tokenCache);
    }
    let tokenRequests = inFlight.get(token);
    if (!tokenRequests) {
      tokenRequests = new Map();
      inFlight.set(token, tokenRequests);
    }

    if (!refresh && tokenCache.has(offset)) return Promise.resolve(tokenCache.get(offset));
    if (tokenRequests.has(offset)) return tokenRequests.get(offset);

    const request = Promise.resolve()
      .then(() => sendRequest(token, offset))
      .then((response) => {
        tokenCache.set(offset, response);
        return response;
      })
      .finally(() => {
        tokenRequests.delete(offset);
        if (!tokenRequests.size && inFlight.get(token) === tokenRequests) inFlight.delete(token);
      });
    tokenRequests.set(offset, request);
    return request;
  }

  function invalidate(token) {
    if (token === undefined) {
      cache.clear();
      inFlight.clear();
    } else {
      cache.delete(token);
      inFlight.delete(token);
    }
  }

  return { get, invalidate };
}
