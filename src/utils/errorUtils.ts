/**
 * Utility to identify whether an error is a network/fetch connectivity issue
 * (e.g. Supabase instance offline, paused, or unreachable in sandbox)
 */
export function isNetworkOrFetchError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : error.message || error.details || error.hint || String(error);
  const name = error.name || '';
  return (
    name === 'TypeError' ||
    msg.includes('fetch failed') ||
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('AbortError') ||
    msg.includes('Load failed')
  );
}

export function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : error.message || error.details || error.hint || '';
  const code = error.code || '';
  return (
    code === 'PGRST205' ||
    code === 'PGRST125' ||
    code === '42P01' ||
    msg.includes('Could not find the table') ||
    msg.includes('schema cache') ||
    (msg.includes('relation') && msg.includes('does not exist')) ||
    msg.includes('Invalid path') ||
    msg.includes('404')
  );
}
