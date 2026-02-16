import axios from 'axios';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Obtener Token (SIN el prefijo VITE_)
    const tokenRes = await axios.post(
      `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: process.env.MS_CLIENT_ID,
        client_secret: process.env.MS_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
    
    const token = tokenRes.data.access_token;

    // 2. Agregar fila a la tabla de Excel
    const url = `https://graph.microsoft.com/v1.0/sites/${process.env.MS_SITE_ID}/drive/items/${process.env.MS_FILE_ID}/workbook/tables/TablaClientes/rows`;
    
    const graphRes = await axios.post(
      url, 
      { values: [req.body.row] }, 
      { 
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        } 
      }
    );

    return res.status(200).json({ success: true, data: graphRes.data });
    
  } catch (error) {
    // Log detallado del error
    const errorDetail = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    };
    
    console.error("❌ Error al agregar fila:", JSON.stringify(errorDetail, null, 2));
    
    return res.status(error.response?.status || 500).json({ 
      error: errorDetail.data || errorDetail.message 
    });
  }
}