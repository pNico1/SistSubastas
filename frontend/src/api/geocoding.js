// Busca direcciones con Nominatim (OpenStreetMap). Gratis, sin API key.
// Politica de uso: maximo ~1 request por segundo y un User-Agent identificable.
// Por eso la pantalla hace debounce antes de llamar.

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

export async function buscarDirecciones(query) {
  const q = (query || '').trim();
  if (q.length < 3) return [];

  const url =
    `${NOMINATIM}?format=json&addressdetails=1&limit=5&accept-language=es&q=${encodeURIComponent(q)}`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'BidsterApp/1.0 (TPO Desarrollo de Aplicaciones)',
    },
  });
  if (!res.ok) throw new Error('No se pudo buscar la direccion');

  const data = await res.json();
  return (data || []).map((item) => {
    const a = item.address || {};
    const calleNum = [a.road, a.house_number].filter(Boolean).join(' ');
    return {
      id: item.place_id,
      label: item.display_name,
      calle: calleNum || a.road || '',
      ciudad: a.city || a.town || a.village || a.suburb || a.county || '',
      provincia: a.state || a.region || '',
      zip: a.postcode || '',
    };
  });
}
