export default async function handler(req, res) {
  const client_id = "40bd25de70ba4a719e3b4bced256f8bc";
  const client_secret = "d0d7d0548e5846e5b480ae2b97cea9d9";

  const playlist_url = req.query.url;
  if (!playlist_url) {
    return res.status(400).json({ error: 'Falta el parámetro ?url=' });
  }

  const match = playlist_url.match(/playlist\/([a-zA-Z0-9]+)/);
  if (!match) {
    return res.status(400).json({ error: 'URL no válida de playlist' });
  }
  const playlist_id = match[1];

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    return res.status(500).json({ error: 'Error al obtener token', detail: text });
  }

  const tokenData = await tokenResponse.json();
  const access_token = tokenData.access_token;

  // Obtener datos de la playlist
  const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}`, {
    headers: {
      'Authorization': 'Bearer ' + access_token,
    },
  });

  if (!playlistResponse.ok) {
    const text = await playlistResponse.text();
    return res.status(500).json({ error: 'Error al obtener datos de la playlist', detail: text });
  }

  const playlistData = await playlistResponse.json();

  const owner_image = playlistData.owner?.images?.[0]?.url || null;

  // Extraer una fecha aproximada del primer track (no siempre está disponible)
  const tracks = playlistData.tracks.items;
  let release_date = null;

  for (let i = 0; i < Math.min(tracks.length, 10); i++) {
    const added_at = tracks[i]?.added_at;
    if (added_at) {
      if (!release_date || added_at < release_date) {
        release_date = added_at;
      }
    }
  }

  res.status(200).json({
    title: playlistData.name,
    description: playlistData.description,
    owner_name: playlistData.owner.display_name,
    owner_image: owner_image,
    image: playlistData.images?.[0]?.url || null,
    tracks_count: playlistData.tracks.total,
    release_date: release_date,
  });
}
