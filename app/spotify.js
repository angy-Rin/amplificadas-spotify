export default async function handler(req, res) {
  const client_id = "40bd25de70ba4a719e3b4bced256f8bc";
  const client_secret = "d0d7d0548e5846e5b480ae2b97cea9d9";

  const episode_url = req.query.url;
  if (!episode_url) {
    return res.status(400).json({ error: 'Falta el parámetro ?url=' });
  }

  // Obtener el token de Spotify
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

  // Extraer el ID del episodio desde la URL
  const match = episode_url.match(/episode\/([a-zA-Z0-9]+)/);
  if (!match) {
    return res.status(400).json({ error: 'URL no válida de episodio' });
  }
  const episode_id = match[1];

  // Hacer la solicitud a la API de Spotify
  const episodeResponse = await fetch(`https://api.spotify.com/v1/episodes/${episode_id}`, {
    headers: {
      'Authorization': 'Bearer ' + access_token,
    },
  });

  if (!episodeResponse.ok) {
    const text = await episodeResponse.text();
    return res.status(500).json({ error: 'Error al obtener datos del episodio', detail: text });
  }

  const episodeData = await episodeResponse.json();
  res.status(200).json({
    title: episodeData.name,
    description: episodeData.description,
    release_date: episodeData.release_date,
  });
}
