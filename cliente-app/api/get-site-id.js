import axios from 'axios';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Obtener Token
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

    // Obtener Site ID
    const siteResponse = await axios.get(
      'https://graph.microsoft.com/v1.0/sites/simpleeditors.sharepoint.com:/sites/Admin',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return res.json({ 
      siteId: siteResponse.data.id,
      siteName: siteResponse.data.name,
      webUrl: siteResponse.data.webUrl
    });
    
  } catch (error) {
    const errorDetail = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    };
    
    console.error("❌ Error:", JSON.stringify(errorDetail, null, 2));
    
    return res.status(error.response?.status || 500).json({ 
      error: errorDetail 
    });
  }
}