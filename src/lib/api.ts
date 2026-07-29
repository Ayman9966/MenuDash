export async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const text = await res.text();
  
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    if (text.startsWith('<') || text.includes('The page') || text.includes('not found') || text.includes('<!DOCTYPE')) {
      throw new Error(`Server returned HTML page instead of JSON API response. If deployed on Vercel, please ensure vercel.json is configured correctly for backend routing (Endpoint: ${url}).`);
    }
    throw new Error(`Invalid JSON response from server: ${text.slice(0, 100)}`);
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }

  return data;
}
