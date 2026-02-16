import axios from 'axios';

const CLIENT_ID = process.env.VITE_MS_CLIENT_ID;
const TENANT_ID = process.env.VITE_MS_TENANT_ID;
const CLIENT_SECRET = process.env.VITE_MS_CLIENT_SECRET;
const FILE_ID = process.env.VITE_MS_FILE_ID;

let accessToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const response = await axios.post(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );

  accessToken = response.data.access_token;
  tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;
  return accessToken;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const token = await getAccessToken();
    const { siteId, codigo, row } = req.body;

    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/items/${FILE_ID}/workbook/tables/TablaClientes/rows`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const rows = response.data.value;
    const rowIndex = rows.findIndex(r => r.values[0][0] === codigo);

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Row not found' });
    }

    const rowId = rows[rowIndex].index;

    await axios.patch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/items/${FILE_ID}/workbook/tables/TablaClientes/rows/itemAt(index=${rowId})`,
      { values: [row] },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
}