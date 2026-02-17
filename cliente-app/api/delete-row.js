import axios from 'axios';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { codigo } = req.query;

    if (!codigo) {
      return res.status(400).json({ error: 'Falta el parámetro "codigo"' });
    }

    // 1. Obtener token (sin VITE_)
    const tokenRes = await axios.post(
      `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: process.env.MS_CLIENT_ID,
        client_secret: process.env.MS_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const token = tokenRes.data.access_token;

    // 2. Obtener Site ID real
    const siteRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${process.env.MS_SITE_ID}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const realSiteId = siteRes.data.id;

    // 3. Buscar la fila con ese código
    const rowsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${realSiteId}/drive/items/${process.env.MS_FILE_ID}/workbook/tables/TablaClientes/rows`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const rows = rowsRes.data.value;
    const rowIndex = rows.findIndex(r => String(r.values[0][0]) === String(codigo));

    // 4. Si no existe en Excel, no pasa nada — igual devolvemos éxito
    // (puede que el cliente se haya creado antes de que funcionara la sincronización)
    if (rowIndex === -1) {
      console.log(`⚠️ Cliente ${codigo} no encontrado en Excel, solo se borrará de Firebase`);
      return res.status(200).json({ success: true, warning: 'Cliente no encontrado en Excel, pero borrado de Firebase' });
    }

    // 5. Borrar la fila del Excel
    await axios.delete(
      `https://graph.microsoft.com/v1.0/sites/${realSiteId}/drive/items/${process.env.MS_FILE_ID}/workbook/tables/TablaClientes/rows/itemAt(index=${rowIndex})`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log(`✅ Cliente ${codigo} eliminado del Excel`);
    return res.status(200).json({ success: true });

  } catch (error) {
    const errorDetail = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    };
    console.error('❌ Error eliminando fila:', JSON.stringify(errorDetail, null, 2));
    return res.status(error.response?.status || 500).json({ error: errorDetail.data || errorDetail.message });
  }
}