export function extractQueryParams(urlOrSearch: string | URLSearchParams): { id: string | null; sig: string | null } {
  const params = typeof urlOrSearch === 'string'
    ? new URLSearchParams(urlOrSearch.startsWith('?') ? urlOrSearch.slice(1) : urlOrSearch)
    : urlOrSearch;
  return {
    id: params.get('id')?.trim() || null,
    sig: params.get('sig')?.trim() || null,
  };
}
