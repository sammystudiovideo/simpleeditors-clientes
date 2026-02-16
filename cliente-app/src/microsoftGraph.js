import axios from 'axios';

const API_URL = import.meta.env.PROD 
  ? '/api' 
  : 'http://localhost:3001/api';
const SITE_ID = import.meta.env.VITE_MS_SITE_ID;

// Agregar fila al Excel
export async function addRowToExcel(clientData) {
  try {
    const row = [
      clientData.codigo || '',
      clientData.empresa || '',
      clientData.pais || '',
      clientData.telefono || '',
      clientData.contactos?.map(c => `${c.nombre} ${c.apellido} (${c.rol})`).join('; ') || '',
      clientData.emails?.map(e => `${e.email}${e.nota ? ` (${e.nota})` : ''}`).join('; ') || '',
      clientData.tipoTrabajo || '',
      clientData.tipoEstilo || '',
      clientData.status || 'Activo',
      clientData.fechaPrimerContacto || '',
      clientData.creadoPor || '',
      clientData.fechaRegistro || '',
      clientData.editadoPor || '',
      clientData.notas || '',
    ];

    await axios.post(`${API_URL}/add-row`, { siteId: SITE_ID, row });
    console.log('✅ Cliente agregado al Excel');
  } catch (error) {
    console.error('❌ Error agregando al Excel:', error.response?.data || error.message);
  }
}

// Actualizar fila en Excel
export async function updateRowInExcel(codigo, clientData) {
  try {
    const updatedRow = [
      clientData.codigo || '',
      clientData.empresa || '',
      clientData.pais || '',
      clientData.telefono || '',
      clientData.contactos?.map(c => `${c.nombre} ${c.apellido} (${c.rol})`).join('; ') || '',
      clientData.emails?.map(e => `${e.email}${e.nota ? ` (${e.nota})` : ''}`).join('; ') || '',
      clientData.tipoTrabajo || '',
      clientData.tipoEstilo || '',
      clientData.status || 'Activo',
      clientData.fechaPrimerContacto || '',
      clientData.creadoPor || '',
      clientData.fechaRegistro || '',
      clientData.editadoPor || '',
      clientData.notas || '',
    ];

    await axios.patch(`${API_URL}/update-row`, { 
      siteId: SITE_ID, 
      codigo, 
      row: updatedRow 
    });
    console.log('✅ Cliente actualizado en Excel');
  } catch (error) {
    console.error('❌ Error actualizando en Excel:', error.response?.data || error.message);
  }
}

// Eliminar fila del Excel
export async function deleteRowFromExcel(codigo) {
  try {
    await axios.delete(`${API_URL}/delete-row/${codigo}?siteId=${SITE_ID}`);
    console.log('✅ Cliente eliminado del Excel');
  } catch (error) {
    console.error('❌ Error eliminando del Excel:', error.response?.data || error.message);
  }
}