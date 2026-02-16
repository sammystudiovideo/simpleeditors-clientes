import axios from 'axios';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    // 2. Obtener información del archivo
    const siteId = process.env.MS_SITE_ID;
    const fileId = process.env.MS_FILE_ID;
    
    // Verificar que el archivo existe
    const fileInfo = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/items/${fileId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Listar las tablas en el workbook
    const tablesResponse = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/items/${fileId}/workbook/tables`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return res.json({ 
      success: true,
      fileInfo: {
        name: fileInfo.data.name,
        id: fileInfo.data.id,
        webUrl: fileInfo.data.webUrl
      },
      tables: tablesResponse.data.value.map(t => ({
        name: t.name,
        id: t.id
      })),
      urlUsed: `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/items/${fileId}/workbook/tables/TablaClientes/rows`
    });
    
  } catch (error) {
    const errorDetail = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
    };
    
    console.error("❌ Error:", JSON.stringify(errorDetail, null, 2));
    
    return res.status(error.response?.status || 500).json({ 
      error: errorDetail 
    });
  }
}

