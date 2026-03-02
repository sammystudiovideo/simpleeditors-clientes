import axios from 'axios';

const API_URL = import.meta.env.PROD 
  ? '/api' 
  : 'http://localhost:3001/api';

// Helper: formatea estilos (array o string)
const formatEstilo = (data) => {
  if (Array.isArray(data.tiposEstilo) && data.tiposEstilo.length > 0) {
    return data.tiposEstilo.join('; ');
  }
  return data.tipoEstilo || '';
};

// Helper: formatea proyectos
const formatProyectos = (data) =>
  data.proyectos?.filter(p => p.nombre || p.link)
    .map((p, i) => `${String(i+1).padStart(2,'0')}. ${p.nombre || ''}${p.link ? ` → ${p.link}` : ''}`)
    .join(' | ') || '';

// Helper: formatea referencias visuales
const formatReferencias = (data) =>
  data.referenciasVisuales?.filter(r => r.link)
    .map((r, i) => `${String(i+1).padStart(2,'0')}. ${r.link}${r.nota ? ` (${r.nota})` : ''}`)
    .join(' | ') || '';

// Helper: formatea fechas de entrega
const formatFechasEntrega = (data) =>
  data.fechasEntrega?.filter(f => f.fecha)
    .map((f, i) => `${String(i+1).padStart(2,'0')}. ${f.fecha}${f.descripcion ? ` — ${f.descripcion}` : ''}`)
    .join(' | ') || '';

// ──────────────────────────────────────────────────────────
// Columnas Excel:
// A  - Código
// B  - Empresa
// C  - País
// D  - Teléfono
// E  - Contactos
// F  - Emails
// G  - (vacía / Columna1)
// H  - Tipo Trabajo
// I  - Estilo
// J  - Status
// K  - Fecha 1er Contacto
// L  - Creado Por
// M  - Fecha Registro
// N  - Editado Por
// O  - Notas
// P  - Tipo Compañía        ← NUEVO
// Q  - Web Empresa          ← NUEVO
// R  - Identidad de Marca   ← NUEVO
// S  - Factura              ← NUEVO
// T  - Por dónde nos conoció← NUEVO
// U  - Proyectos            ← NUEVO
// V  - Referencias Visuales ← NUEVO
// W  - Fechas de Entrega    ← NUEVO
// X  - Notas a Editor       ← NUEVO
// ──────────────────────────────────────────────────────────

const buildRow = (clientData) => [
  clientData.codigo || '',
  clientData.empresa || '',
  clientData.pais || '',
  clientData.telefono || '',
  clientData.contactos?.map(c => `${c.nombre} ${c.apellido}${c.rol ? ` (${c.rol})` : ''}`).join('; ') || '',
  clientData.emails?.map(e => `${e.email}${e.nota ? ` (${e.nota})` : ''}`).join('; ') || '',
  '',                                           // G - vacía
  clientData.tipoTrabajo || '',
  formatEstilo(clientData),
  clientData.status || 'Activo',
  clientData.fechaPrimerContacto || '',
  clientData.creadoPor || '',
  clientData.fechaRegistro || '',
  clientData.editadoPor || '',
  clientData.notas || '',
  clientData.tipoCompania || '',               // P
  clientData.webEmpresa || '',                 // Q
  clientData.identidadMarca || '',             // R
  clientData.factura || '',                    // S
  clientData.porDondeNosConoci || '',          // T
  formatProyectos(clientData),                 // U
  formatReferencias(clientData),               // V
  formatFechasEntrega(clientData),             // W
  clientData.notasEditor || '',                // X
];

// ── Agregar fila ───────────────────────────────────────────
export async function addRowToExcel(clientData) {
  try {
    const row = buildRow(clientData);
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

// ── Actualizar fila ────────────────────────────────────────
export async function updateRowInExcel(codigo, clientData) {
  try {
    const row = buildRow(clientData);
    console.log('📤 Actualizando Excel:', { codigo, row });
    console.log('📏 Número de columnas:', row.length);
    const response = await axios.patch(`${API_URL}/update-row`, { codigo, row });
    console.log('✅ Cliente actualizado en Excel:', response.data);
    return response.data;
  } catch (error) {
    console.warn('⚠️ No se pudo actualizar en Excel:', error.response?.data || error.message);
    return null;
  }
}

// ── Eliminar fila ──────────────────────────────────────────
export async function deleteRowFromExcel(codigo) {
  try {
    const response = await axios.delete(`${API_URL}/delete-row?codigo=${codigo}`);
    console.log('✅ Cliente eliminado del Excel:', response.data);
    return response.data;
  } catch (error) {
    console.warn('⚠️ No se pudo eliminar del Excel (puede que no exista):', error.response?.data || error.message);
    return null;
  }
}