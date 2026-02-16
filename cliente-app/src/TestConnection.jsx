import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.PROD 
  ? '/api' 
  : 'http://localhost:3001/api';

export default function TestConnection() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    let log = '';

    try {
      log += '🔐 Step 1: Conectando con el servidor...\n';
      setResult(log);

      log += '🌐 Step 2: Obteniendo Site ID...\n';
      setResult(log);

      const siteResponse = await axios.get(`${API_URL}/get-site-id`);
      const siteId = siteResponse.data.siteId;

      log += '✅ Site ID obtenido\n\n';
      log += '═══════════════════════════════════════════════════\n';
      log += '📋 COPIA ESTA LÍNEA EN TU ARCHIVO .env:\n';
      log += '═══════════════════════════════════════════════════\n';
      log += `VITE_MS_SITE_ID=${siteId}\n`;
      log += '═══════════════════════════════════════════════════\n\n';
      setResult(log);

      log += '📄 Step 3: Verificando acceso al archivo Excel...\n';
      setResult(log);

      const fileResponse = await axios.get(`${API_URL}/verify-file?siteId=${siteId}`);

      log += `✅ Archivo encontrado: "${fileResponse.data.fileName}"\n\n`;
      setResult(log);

      log += '📊 Step 4: Verificando tabla TablaClientes...\n';
      setResult(log);

      const tableResponse = await axios.get(`${API_URL}/verify-table?siteId=${siteId}`);

      log += `✅ Tabla encontrada: "${tableResponse.data.tableName}"\n\n`;
      log += '🎉 ¡TODO FUNCIONA CORRECTAMENTE!\n';
      log += 'Ahora copia el VITE_MS_SITE_ID de arriba y pégalo en tu archivo .env\n';
      setResult(log);

    } catch (error) {
      log += '\n❌ ERROR ENCONTRADO:\n';
      log += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      log += `Status: ${error.response?.status || 'No status'}\n`;
      log += `Mensaje: ${error.response?.data?.error?.message || error.message}\n\n`;
      log += 'Detalles completos:\n';
      log += JSON.stringify(error.response?.data, null, 2) || 'No hay detalles';
      log += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      setResult(log);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: 'monospace', backgroundColor: '#1e1e1e', color: '#fff', minHeight: '100vh' }}>
      <h1>🔍 Test de Conexión SharePoint</h1>
      <button 
        onClick={testConnection} 
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: 16,
          backgroundColor: loading ? '#555' : '#007acc',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: 20
        }}
      >
        {loading ? 'Probando...' : '▶️ Ejecutar Test'}
      </button>
      <pre style={{ 
        backgroundColor: '#2d2d2d', 
        padding: 20, 
        borderRadius: 8,
        whiteSpace: 'pre-wrap',
        fontSize: 14,
        lineHeight: 1.6
      }}>
        {result || 'Haz clic en "Ejecutar Test" para comenzar...'}
      </pre>
    </div>
  );
}