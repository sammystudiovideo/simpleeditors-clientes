import axios from 'axios';

const API_URL = import.meta.env.PROD 
  ? '/api' 
  : 'http://localhost:3001/api';

// Agregar fila al Excel
export async function addRowToExcel(clientData) {
  try {
    const row = [
      clientData.codigo || '',                    // A - Código
      clientData.empresa || '',                   // B - Empresa
      clientData.pais || '',                      // C - País
      clientData.telefono || '',                  // D - Teléfono
      clientData.contactos?.map(c => `${c.nombre} ${c.apellido}${c.rol ? ` (${c.rol})` : ''}`).join('; ') || '', // E - Contactos
      clientData.emails?.map(e => `${e.email}${e.nota ? ` (${e.nota})` : ''}`).join('; ') || '',  // F - Emails
      '',                                         // G - Columna1 (vacía)
      clientData.tipoTrabajo || '',               // H - Tipo Trabajo
      clientData.tipoEstilo || '',                // I - Estilo
      clientData.status || 'Activo',              // J - Status
      clientData.fechaPrimerContacto || '',       // K - Fecha 1er Contacto
      clientData.creadoPor || '',                 // L - Creado Por
      clientData.fechaRegistro || '',             // M - Fecha Registro
      clientData.editadoPor || '',                // N - Editado Por
      clientData.notas || ''                      // O - Notas
    ];

    console.log('📤 Enviando al Excel:', row);
    console.log('📏 Número de columnas:', row.length);
    
    const response = await axios.post(`${API_URL}/add-row`, { row });
    console.log('✅ Cliente agregado al Excel:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error agregando al Excel:', error.response?.data || error.message);
    throw error;
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
      clientData.contactos?.map(c => `${c.nombre} ${c.apellido}${c.rol ? ` (${c.rol})` : ''}`).join('; ') || '',
      clientData.emails?.map(e => `${e.email}${e.nota ? ` (${e.nota})` : ''}`).join('; ') || '',
      '',                                         // G - Columna1 (vacía)
      clientData.tipoTrabajo || '',
      clientData.tipoEstilo || '',
      clientData.status || 'Activo',
      clientData.fechaPrimerContacto || '',
      clientData.creadoPor || '',
      clientData.fechaRegistro || '',
      clientData.editadoPor || '',
      clientData.notas || ''
    ];

    console.log('📤 Actualizando Excel:', { codigo, row: updatedRow });
    console.log('📏 Número de columnas:', updatedRow.length);
    
    const response = await axios.patch(`${API_URL}/update-row`, { 
      codigo, 
      row: updatedRow 
    });
    console.log('✅ Cliente actualizado en Excel:', response.data);
    return response.data;
  } catch (error) {
    // ⚠️ Si no está en Excel, no bloqueamos la actualización en Firebase
    console.warn('⚠️ No se pudo actualizar en Excel:', error.response?.data || error.message);
    return null;
  }
}

// Eliminar fila del Excel
export async function deleteRowFromExcel(codigo) {
  try {
    const response = await axios.delete(`${API_URL}/delete-row?codigo=${codigo}`);
    console.log('✅ Cliente eliminado del Excel:', response.data);
    return response.data;
  } catch (error) {
    // ⚠️ Si no está en Excel, no bloqueamos el borrado en Firebase
    console.warn('⚠️ No se pudo eliminar del Excel (puede que no exista):', error.response?.data || error.message);
    return null;
  }
}