import axios from 'axios';

const API_URL = import.meta.env.PROD 
  ? '/api' 
  : 'http://localhost:3001/api';

// Agregar fila al Excel
export async function addRowToExcel(clientData) {
  try {
    // ✅ ORDEN CORRECTO según tu Excel (16 columnas):
    // A=Código, B=Empresa, C=País, D=Teléfono, E=Contactos, F=Emails,
    // G=Columna1, H=Tipo Trabajo, I=Estilo, J=Status, K=Fecha 1er Contacto,
    // L=Creado Por, M=Fecha Registro, N=Editado Por, O=Notas, P=(columna 16)
    
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
      clientData.notas || '',                     // O - Notas
      ''                                          // P - Columna 16 (vacía)
    ];

    console.log('📤 Enviando al Excel:', row);
    
    // ✅ SIN el siteId - tu API no lo necesita
    const response = await axios.post(`${API_URL}/add-row`, { row });
    console.log('✅ Cliente agregado al Excel:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error agregando al Excel:', error.response?.data || error.message);
    throw error;  // Re-lanzar para que App.jsx pueda manejarlo
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
      '',                                         // Columna1 vacía
      clientData.tipoTrabajo || '',
      clientData.tipoEstilo || '',
      clientData.status || 'Activo',
      clientData.fechaPrimerContacto || '',
      clientData.creadoPor || '',
      clientData.fechaRegistro || '',
      clientData.editadoPor || '',
      clientData.notas || '',
      ''                                          // Columna 16 vacía
    ];

    console.log('📤 Actualizando Excel:', { codigo, row: updatedRow });
    
    const response = await axios.patch(`${API_URL}/update-row`, { 
      codigo, 
      row: updatedRow 
    });
    console.log('✅ Cliente actualizado en Excel:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error actualizando en Excel:', error.response?.data || error.message);
    throw error;
  }
}

// Eliminar fila del Excel
export async function deleteRowFromExcel(codigo) {
  try {
    const response = await axios.delete(`${API_URL}/delete-row/${codigo}`);
    con