import axios from 'axios';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 1. Obtener Token
    const tokenRes = await axios.post(
      `https://login.microsoftonline.com/${process.env.VITE_MS_TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: process.env.VITE_MS_CLIENT_ID,
        client_secret: process.env.VITE_MS_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      })
    );
    
    const token = tokenRes.data.access_token;

    // 2. Intentar escribir en la tabla
    const url = `https://graph.microsoft.com/v1.0/sites/${process.env.VITE_MS_SITE_ID}/drive/items/${process.env.VITE_MS_FILE_ID}/workbook/tables/TablaClientes/rows`;
    
    const graphRes = await axios.post(url, 
      { values: [req.body.row] }, 
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    res.json({ success: true, data: graphRes.data });
  } catch (error) {
    // ESTO ES LO MÁS IMPORTANTE: Ver qué dice Microsoft
    const errorDetail = error.response?.data || error.message;
    console.error("LOG DE ERROR CRÍTICO:", JSON.stringify(errorDetail, null, 2));
    res.status(500).json({ error: errorDetail });
  }
}