import axios from 'axios';

export default async function handler(req, res) {
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
    // 1. Obtener Token
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
    console.log('✅ Token obtenido');

    // 2. Primero obtener el Site ID real usando la ruta
    const siteUrl = `https://graph.microsoft.com/v1.0/sites/${process.env.MS_SITE_ID}`;
    console.log('🔍 Obteniendo Site ID desde:', siteUrl);
    
    const siteRes = await axios.get(siteUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const realSiteId = siteRes.data.id;
    console.log('✅ Site ID real obtenido:', realSiteId);

    // 3. Ahora usar el Site ID real para agregar la fila
    const url = `https://graph.microsoft.com/v1.0/sites/${realSiteId}/drive/items/${process.env.MS_FILE_ID}/workbook/tables/TablaClientes/rows`;
    console.log('📤 Agregando fila a:', url);
    
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

    console.log('✅ Fila agregada exitosamente');
    return res.status(200).json({ success: true, data: graphRes.data });
    
  } catch (error) {
    const errorDetail = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      requestData: error.config?.data
    };
    
    console.error("❌ Error completo:", JSON.stringify(errorDetail, null, 2));
    
    return res.status(error.response?.status || 500).json({ 
      error: errorDetail.data || errorDetail.message,
      details: errorDetail
    });
  }
}