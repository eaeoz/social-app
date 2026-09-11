require('dotenv').config();

const CHANNEL = (process.env.TWITCH_USERNAME || '').trim().toLowerCase();
const CLIENT_ID = (process.env.TWITCH_KEY || '').trim();
const CLIENT_SECRET = (process.env.TWITCH_SECRET || '').trim();

const GQL_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

async function getToken() {
  const url =
    'https://id.twitch.tv/oauth2/token' +
    '?client_id=' + encodeURIComponent(CLIENT_ID) +
    '&client_secret=' + encodeURIComponent(CLIENT_SECRET) +
    '&grant_type=client_credentials';

  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error('Token request failed: ' + res.status);
  const data = await res.json();
  if (!data.access_token) throw new Error('No access_token in token response');
  return data.access_token;
}

async function helix(path, token) {
  const res = await fetch('https://api.twitch.tv/helix' + path, {
    headers: {
      'Client-ID': CLIENT_ID,
      'Authorization': 'Bearer ' + token
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('Helix ' + path + ' failed (' + res.status + '): ' + text.slice(0, 200));
  }
  return res.json();
}

async function fetchBitrate() {
  try {
    const res = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: {
        'Client-ID': GQL_CLIENT_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query:
          '{ user(login: "' + CHANNEL + '") { stream { bitrate } } }'
      })
    });
    const json = await res.json();
    const stream = json && json.data && json.data.user && json.data.user.stream;
    return stream && stream.bitrate ? stream.bitrate : null;
  } catch (err) {
    return null;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'OPTIONS') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!CHANNEL || !CLIENT_ID || !CLIENT_SECRET) {
    return {
      statusCode: 503,
      body: JSON.stringify({ error: 'Twitch environment is not configured' })
    };
  }

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }

  try {
    const token = await getToken();

    const [streamsJson, usersJson] = await Promise.all([
      helix('/streams?user_login=' + encodeURIComponent(CHANNEL), token),
      helix('/users?login=' + encodeURIComponent(CHANNEL), token)
    ]);

    const user = usersJson.data && usersJson.data[0];
    const stream = streamsJson.data && streamsJson.data[0];
    const live = !!stream;

    let followers = 0;
    if (user && user.id) {
      try {
        const fJson = await helix('/channels/followers?broadcaster_id=' + user.id, token);
        followers = fJson.total !== undefined ? fJson.total : 0;
      } catch (err) {
        followers = 0;
      }
    }

    const bitrate = live ? await fetchBitrate() : null;

    let thumbnail = stream ? stream.thumbnail_url : null;
    if (thumbnail) {
      thumbnail = thumbnail
        .replace('{width}', '1920')
        .replace('{height}', '1080');
    }

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        live,
        channel: CHANNEL,
        displayName: user ? user.display_name : CHANNEL,
        avatar: user ? user.profile_image_url : null,
        title: stream ? stream.title : null,
        game: stream ? stream.game_name : null,
        viewers: live ? stream.viewer_count : 0,
        startedAt: stream ? stream.started_at : null,
        thumbnail,
        followers,
        bitrate,
        updatedAt: new Date().toISOString()
      })
    };
  } catch (err) {
    console.error('twitch-status error:', err.message);
    return {
      statusCode: 502,
      headers: cors,
      body: JSON.stringify({ error: 'Failed to fetch Twitch status' })
    };
  }
};