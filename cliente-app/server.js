import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = 'd7774683-764b-47f3-b7b1-9a6918e3b29c';
const TENANT_ID = '5ce365c6-c562-498a-8045-4f67646ae538';
const CLIENT_SECRET = 'Kov8Q~HH4vmnZfsWyuTcJKnhi5TaweHHfK03Ea37';
const FILE_ID = 'ddb13b89-2187-4ff2-bdcd-80391122624c';

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

// Endpoint para obtener Site ID
app.get('/api/get-site-id', async (req, res) => {
  try {
    const token = await getAccessToken();
    
    const siteResponse = await axios.get(
      'https://graph.microsoft.com/v1.0/sites/simpleeditors.sharepoint.com:/sites/Admin',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    res.json({ siteId: siteResponse.data.id });
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Endpoint para verificar archivo
app.get('/api/verify-file', async (req, res) => {
  try {
    const token = await getAccessToken();
    const { siteId } = req.query;

    const fileResponse = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/items/${FILE_ID}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    res.json({ fileName: fileResponse.data.name });
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Endpoint para verificar tabla
app.get('/api/verify-table', async (req, res) => {
  try {
    const token = await getAccessToken();
    const { siteId } = req.query;

    const tableResponse = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/items/${FILE_ID}/workbook/tables/TablaClientes`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    res.json({ tableName: tableResponse.data.name });
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Endpoint para agregar fila
app.post('/api/add-row', async (req, res) => {
  try {
    const token = await getAccessToken();
    const { siteId, row } = req.body;

    await axios.post(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/items/${FILE_ID}/workbook/tables/TablaClientes/rows`,
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
});

// Endpoint para actualizar fila
app.patch('/api/update-row', async (req, res) => {
  try {
    const token = await getAccessToken();
    const { siteId, codigo, row } = req.body;

    // Buscar la fila
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
});

// Endpoint para eliminar fila
app.delete('/api/delete-row/:codigo', async (req, res) => {
  try {
    const token = await getAccessToken();
    const { siteId } = req.query;
    const { codigo } = req.params;

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

    await axios.delete(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/items/${FILE_ID}/workbook/tables/TablaClientes/rows/itemAt(index=${rowId})`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor proxy corriendo en http://localhost:${PORT}`);
});