export function scrollToHash(hash, documentRef) {
  if (!hash || hash === '#' || !documentRef) return false;

  const target = documentRef.getElementById(hash.slice(1));
  if (!target) return false;

  target.scrollIntoView();
  return true;
}
