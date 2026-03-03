import TestConnection from './TestConnection';
import { useState, useMemo, useEffect } from "react";
import { collection, getDocs, setDoc, doc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import "./App.css";
import { addRowToExcel, updateRowInExcel, deleteRowFromExcel } from "./microsoftGraph";

const PAISES = [
  { nombre: "Argentina", codigo: "AR", prefijo: "+54" },
  { nombre: "Bolivia", codigo: "BO", prefijo: "+591" },
  { nombre: "Brasil", codigo: "BR", prefijo: "+55" },
  { nombre: "Chile", codigo: "CL", prefijo: "+56" },
  { nombre: "Colombia", codigo: "CO", prefijo: "+57" },
  { nombre: "Costa Rica", codigo: "CR", prefijo: "+506" },
  { nombre: "Cuba", codigo: "CU", prefijo: "+53" },
  { nombre: "Ecuador", codigo: "EC", prefijo: "+593" },
  { nombre: "El Salvador", codigo: "SV", prefijo: "+503" },
  { nombre: "España", codigo: "ES", prefijo: "+34" },
  { nombre: "Estados Unidos", codigo: "US", prefijo: "+1" },
  { nombre: "Guatemala", codigo: "GT", prefijo: "+502" },
  { nombre: "Honduras", codigo: "HN", prefijo: "+504" },
  { nombre: "México", codigo: "MX", prefijo: "+52" },
  { nombre: "Nicaragua", codigo: "NI", prefijo: "+505" },
  { nombre: "Panamá", codigo: "PA", prefijo: "+507" },
  { nombre: "Paraguay", codigo: "PY", prefijo: "+595" },
  { nombre: "Perú", codigo: "PE", prefijo: "+51" },
  { nombre: "Portugal", codigo: "PT", prefijo: "+351" },
  { nombre: "Puerto Rico", codigo: "PR", prefijo: "+1" },
  { nombre: "República Dominicana", codigo: "DO", prefijo: "+1" },
  { nombre: "Uruguay", codigo: "UY", prefijo: "+598" },
  { nombre: "Venezuela", codigo: "VE", prefijo: "+58" },
  { nombre: "Andorra", codigo: "AD", prefijo: "+376" },
  { nombre: "Francia", codigo: "FR", prefijo: "+33" },
  { nombre: "Italia", codigo: "IT", prefijo: "+39" },
  { nombre: "Reino Unido", codigo: "GB", prefijo: "+44" },
  { nombre: "Otro", codigo: "XX", prefijo: "" },
];

const BASE_TIPOS_TRABAJO = ["Learning", "Social", "Corporativo", "Show", "Mixto", "Youtube", "Podcast", "Entrevista", "Desconocido"];
const BASE_TIPOS_ESTILO = ["Live", "Animado", "Live Mixto", "Animado Mixto", "Mixto", "Desconocido"];
const STATUS_OPTIONS = ["Activo", "Pausa", "Inactivo", "Completado"];
const POR_DONDE_OPTIONS = ["Redes sociales", "Recomendación", "Google", "LinkedIn", "Instagram", "YouTube", "Evento", "Otro"];

const TAG_TRABAJO = {
  Learning: "tag-learning", Social: "tag-social", Corporativo: "tag-corporativo",
  Show: "tag-show", Mixto: "tag-mixto", Desconocido: "tag-desconocido",
  Youtube: "tag-youtube", Podcast: "tag-podcast", Entrevista: "tag-entrevista",
};
const TAG_ESTILO = {
  Live: "tag-live", Animado: "tag-animado", "Live Mixto": "tag-live-mixto",
  "Animado Mixto": "tag-animado-mixto", Mixto: "tag-mixto", Desconocido: "tag-desconocido",
};
const TAG_STATUS = {
  Activo: "tag-status-activo",
  Pausa: "tag-status-pausa",
  Inactivo: "tag-status-inactivo",
  Completado: "tag-status-completado",
};

const emptyContact = () => ({ nombre: "", apellido: "", rol: "" });
const emptyEmail = () => ({ email: "", nota: "" });
const emptyProyecto = () => ({ nombre: "", link: "" });
const emptyFechaEntrega = () => ({ fecha: "" });
const emptyReferenciaVisual = () => ({ link: "", nota: "" });

const defaultForm = () => ({
  empresa: "",
  pais: "ES",
  telefono: "+34",
  tipoCompania: "",
  tipoTrabajo: "Desconocido",
  tiposEstilo: [],
  status: "Activo",
  notas: "",
  notasEditor: "",
  fechaPrimerContacto: "",
  contactos: [emptyContact()],
  emails: [emptyEmail()],
  identidadMarca: "",
  factura: "",
  porDondeNosConoci: "",
  webEmpresa: "",
  proyectos: [],
  referenciasVisuales: [],
  fechasEntrega: [],
});

// ── Contactos ──────────────────────────────────────────────
function ContactsBlock({ contactos, onChange, onAdd, onRemove }) {
  return (
    <>
      {contactos.map((c, i) => (
        <div className="contact-row" key={i}>
          <div className="contact-num">#{i + 1}</div>
          <div className="contact-fields">
            <input value={c.nombre} onChange={(e) => onChange(i, "nombre", e.target.value)} placeholder="Nombre" />
            <input value={c.apellido} onChange={(e) => onChange(i, "apellido", e.target.value)} placeholder="Apellido" />
            <input value={c.rol} onChange={(e) => onChange(i, "rol", e.target.value)} placeholder="Rol (ej: Director, PM...)" className="contact-rol" />
          </div>
          {contactos.length > 1 && <button className="btn-remove" onClick={() => onRemove(i)}>✕</button>}
        </div>
      ))}
      <button className="btn-add" onClick={onAdd}>+ Añadir contacto</button>
    </>
  );
}

// ── Emails ─────────────────────────────────────────────────
function EmailsBlock({ emails, onChange, onAdd, onRemove }) {
  return (
    <>
      {emails.map((e, i) => (
        <div className="email-row" key={i}>
          <div className="email-fields">
            <input type="email" value={e.email} onChange={(ev) => onChange(i, "email", ev.target.value)} placeholder="correo@empresa.com" />
            <input value={e.nota} onChange={(ev) => onChange(i, "nota", ev.target.value)} placeholder="Nota (ej: email principal, facturación...)" />
          </div>
          {emails.length > 1 && <button className="btn-remove" onClick={() => onRemove(i)}>✕</button>}
        </div>
      ))}
      <button className="btn-add" onClick={onAdd}>+ Añadir email</button>
    </>
  );
}

// ── Proyectos (número editable) ────────────────────────────
function ProyectosBlock({ proyectos, onChange, onAdd, onRemove }) {
  return (
    <>
      {proyectos.map((p, i) => (
        <div className="contact-row" key={i}>
          <input
            value={p.numero !== undefined && p.numero !== "" ? p.numero : String(i + 1).padStart(2, "0")}
            onChange={(e) => onChange(i, "numero", e.target.value)}
            className="numero-editable"
            title="Número (editable)"
          />
          <div className="contact-fields">
            <input value={p.nombre} onChange={(e) => onChange(i, "nombre", e.target.value)} placeholder="Nombre del proyecto" />
            <input value={p.link} onChange={(e) => onChange(i, "link", e.target.value)} placeholder="https://..." style={{ flex: 1.5 }} />
          </div>
          <button className="btn-remove" onClick={() => onRemove(i)}>✕</button>
        </div>
      ))}
      <button className="btn-add" onClick={onAdd}>+ Añadir proyecto</button>
    </>
  );
}

// ── Fechas de entrega (número editable) ───────────────────
function FechasEntregaBlock({ fechas, onChange, onAdd, onRemove }) {
  return (
    <>
      {fechas.map((f, i) => (
        <div className="contact-row" key={i} style={{ alignItems: "center" }}>
          <input
            value={f.numero !== undefined && f.numero !== "" ? f.numero : String(i + 1).padStart(2, "0")}
            onChange={(e) => onChange(i, "numero", e.target.value)}
            className="numero-editable"
            title="Número (editable)"
          />
          <div className="contact-fields">
            <input type="date" value={f.fecha} onChange={(e) => onChange(i, "fecha", e.target.value)} style={{ maxWidth: 200 }} />
            <input value={f.descripcion || ""} onChange={(e) => onChange(i, "descripcion", e.target.value)} placeholder="Descripción (opcional)" />
          </div>
          <button className="btn-remove" onClick={() => onRemove(i)}>✕</button>
        </div>
      ))}
      <button className="btn-add" onClick={onAdd}>+ Añadir fecha de entrega</button>
    </>
  );
}

// ── Referencias visuales ───────────────────────────────────
function ReferenciasVisualesBlock({ referencias, onChange, onAdd, onRemove }) {
  return (
    <>
      {referencias.map((r, i) => (
        <div className="contact-row" key={i}>
          <input
            value={r.numero !== undefined && r.numero !== "" ? r.numero : String(i + 1).padStart(2, "0")}
            onChange={(e) => onChange(i, "numero", e.target.value)}
            className="numero-editable"
            title="Número (editable)"
          />
          <div className="contact-fields">
            <input value={r.link} onChange={(e) => onChange(i, "link", e.target.value)} placeholder="https://..." style={{ flex: 1.5 }} />
            <input value={r.nota} onChange={(e) => onChange(i, "nota", e.target.value)} placeholder="Nota sobre esta referencia..." />
          </div>
          <button className="btn-remove" onClick={() => onRemove(i)}>✕</button>
        </div>
      ))}
      <button className="btn-add" onClick={onAdd}>+ Añadir referencia visual</button>
    </>
  );
}

// ── Estilos multi-select ───────────────────────────────────
function EstilosMultiSelect({ selected, onChange, allEstilos, onAddEstilo }) {
  const [newEstilo, setNewEstilo] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const toggle = (estilo) => {
    if (selected.includes(estilo)) {
      onChange(selected.filter((e) => e !== estilo));
    } else {
      onChange([...selected, estilo]);
    }
  };

  const handleAdd = () => {
    const trimmed = newEstilo.trim();
    if (!trimmed || allEstilos.includes(trimmed)) return;
    onAddEstilo(trimmed);
    onChange([...selected, trimmed]);
    setNewEstilo("");
    setShowAdd(false);
  };

  return (
    <div>
      <div className="estilos-grid">
        {allEstilos.map((e) => (
          <label key={e} className={`estilo-chip ${selected.includes(e) ? "selected" : ""}`}>
            <input type="checkbox" checked={selected.includes(e)} onChange={() => toggle(e)} style={{ display: "none" }} />
            {e}
          </label>
        ))}
        <button className="btn-add-small" onClick={() => setShowAdd(!showAdd)} type="button">+ Nuevo estilo</button>
      </div>
      {showAdd && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            value={newEstilo}
            onChange={(e) => setNewEstilo(e.target.value)}
            placeholder="Nombre del estilo..."
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" style={{ marginTop: 0, padding: "6px 14px" }} onClick={handleAdd}>Añadir</button>
          <button className="btn btn-ghost" style={{ marginTop: 0, padding: "6px 14px" }} onClick={() => setShowAdd(false)}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Tipo de compañía: dropdown + agregar ──────────────────
function TipoCompaniaSelect({ value, onChange, allTipos, onAddTipo }) {
  const [newTipo, setNewTipo] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = () => {
    const trimmed = newTipo.trim();
    if (!trimmed || allTipos.includes(trimmed)) return;
    onAddTipo(trimmed);
    onChange({ target: { name: "tipoCompania", value: trimmed } });
    setNewTipo(""); setShowAdd(false);
  };

  return (
    <div>
      <select name="tipoCompania" value={value || ""} onChange={onChange}>
        <option value="">— Seleccionar —</option>
        {allTipos.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <button type="button" className="btn-add-small" style={{ marginTop: 6 }} onClick={() => setShowAdd(!showAdd)}>
        + Agregar tipo
      </button>
      {showAdd && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={newTipo} onChange={(e) => setNewTipo(e.target.value)} placeholder="Ej: Startup, Agencia, ONG..."
            onKeyDown={(e) => e.key === "Enter" && handleAdd()} style={{ flex: 1 }} />
          <button className="btn btn-primary" style={{ marginTop: 0, padding: "6px 14px" }} onClick={handleAdd}>Añadir</button>
          <button className="btn btn-ghost" style={{ marginTop: 0, padding: "6px 14px" }} onClick={() => setShowAdd(false)}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Tipo de trabajo con categoría custom ───────────────────
function TipoTrabajoSelect({ value, onChange, allTipos, onAddTipo }) {
  const [newTipo, setNewTipo] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = () => {
    const trimmed = newTipo.trim();
    if (!trimmed || allTipos.includes(trimmed)) return;
    onAddTipo(trimmed);
    onChange({ target: { name: "tipoTrabajo", value: trimmed } });
    setNewTipo("");
    setShowAdd(false);
  };

  return (
    <div>
      <select name="tipoTrabajo" value={value} onChange={onChange}>
        {allTipos.map((t) => <option key={t}>{t}</option>)}
      </select>
      <button
        type="button"
        className="btn-add-small"
        style={{ marginTop: 6 }}
        onClick={() => setShowAdd(!showAdd)}
      >
        + Agregar categoría
      </button>
      {showAdd && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            value={newTipo}
            onChange={(e) => setNewTipo(e.target.value)}
            placeholder="Nueva categoría..."
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" style={{ marginTop: 0, padding: "6px 14px" }} onClick={handleAdd}>Añadir</button>
          <button className="btn btn-ghost" style={{ marginTop: 0, padding: "6px 14px" }} onClick={() => setShowAdd(false)}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Export ficha para editor ───────────────────────────────
function exportarFichaEditor(client) {
  const paisNombre = (codigo) => PAISES.find((p) => p.codigo === codigo)?.nombre || codigo;

  const estilos = Array.isArray(client.tiposEstilo) && client.tiposEstilo.length > 0
    ? client.tiposEstilo.join(", ")
    : client.tipoEstilo || "—";

  const fechasEntrega = client.fechasEntrega?.length > 0
    ? client.fechasEntrega.map((f, i) =>
        `   ${String(i + 1).padStart(2, "0")}. ${f.fecha || "—"}${f.descripcion ? ` — ${f.descripcion}` : ""}`
      ).join("\n")
    : "   —";

  const referencias = client.referenciasVisuales?.length > 0
    ? client.referenciasVisuales.map((r, i) =>
        `   ${String(i + 1).padStart(2, "0")}. ${r.link || "—"}${r.nota ? `\n       Nota: ${r.nota}` : ""}`
      ).join("\n")
    : "   —";

  const texto = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FICHA PARA EDITOR — ${client.codigo}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. NOMBRE EMPRESA
   ${client.empresa || "—"}

2. PAÍS
   ${paisNombre(client.pais)}

3. TIPO DE TRABAJO
   ${client.tipoTrabajo || "—"}

4. ESTILO
   ${estilos}

5. IDENTIDAD DE MARCA
   ${client.identidadMarca || "—"}

6. REFERENCIAS VISUALES
${referencias}

7. WEB EMPRESA
   ${client.webEmpresa || "—"}

8. FECHA DE ENTREGA
${fechasEntrega}

9. NOTAS A EDITOR
   ${client.notasEditor || "—"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generado el ${new Date().toLocaleDateString("es-ES")} a las ${new Date().toLocaleTimeString("es-ES")}
`;

  const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ficha-editor-${client.codigo}-${client.empresa?.replace(/\s+/g, "_")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════
export default function App() {
  const [showTest, setShowTest] = useState(false);
  const [users, setUsers] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [tab, setTab] = useState("register");
  const [counters, setCounters] = useState({});
  const [clients, setClients] = useState({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(defaultForm());
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [filters, setFilters] = useState({ search: "", pais: "", tipoTrabajo: "", tipoEstilo: "", status: "", tipoCompania: "" });
  const [sortOrder, setSortOrder] = useState("newest");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Opciones dinámicas (cargadas/guardadas en Firebase)
  const [tiposTrabajo, setTiposTrabajo] = useState(BASE_TIPOS_TRABAJO);
  const [tiposEstilo, setTiposEstilo] = useState(BASE_TIPOS_ESTILO);
  const [tiposCompania, setTiposCompania] = useState([]);

  // ── Cargar usuarios ──────────────────────────────────────
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const loadedUsers = {};
        usersSnap.forEach((d) => { loadedUsers[d.id] = d.data(); });
        if (Object.keys(loadedUsers).length === 0) {
          const initialUsers = {
            vendedor1: { password: "simplevendedor2026" },
            Samantha: { password: "SimpleSamantha213" },
          };
          for (const [username, data] of Object.entries(initialUsers)) {
            await setDoc(doc(db, "users", username), data);
          }
          setUsers(initialUsers);
        } else {
          setUsers(loadedUsers);
        }
      } catch (error) {
        console.error("Error cargando usuarios:", error);
      }
    };
    loadUsers();
  }, []);

  // ── Cargar clientes + contadores + opciones dinámicas ────
  useEffect(() => {
    if (!currentUser) return;
    const loadData = async () => {
      try {
        const clientsSnap = await getDocs(collection(db, "clients"));
        const loadedClients = {};
        clientsSnap.forEach((d) => { loadedClients[d.id] = d.data(); });
        setClients(loadedClients);

        const countersSnap = await getDocs(collection(db, "counters"));
        const loadedCounters = {};
        countersSnap.forEach((d) => { loadedCounters[d.id] = d.data().count; });
        setCounters(loadedCounters);

        // Cargar opciones dinámicas
        const configSnap = await getDoc(doc(db, "config", "options"));
        if (configSnap.exists()) {
          const cfg = configSnap.data();
          if (cfg.tiposTrabajo) setTiposTrabajo(cfg.tiposTrabajo);
          if (cfg.tiposEstilo) setTiposEstilo(cfg.tiposEstilo);
          if (cfg.tiposCompania) setTiposCompania(cfg.tiposCompania);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  // ── Prefijo telefónico automático ────────────────────────
  useEffect(() => {
    const paisSel = PAISES.find((p) => p.codigo === form.pais);
    if (paisSel) setForm((f) => ({ ...f, telefono: paisSel.prefijo }));
  }, [form.pais]);

  // ── Guardar opciones dinámicas en Firebase ───────────────
  const saveOptions = async (trabajo, estilo, compania) => {
    try {
      await setDoc(doc(db, "config", "options"), {
        tiposTrabajo: trabajo,
        tiposEstilo: estilo,
        tiposCompania: compania,
      });
    } catch (e) {
      console.error("Error guardando opciones:", e);
    }
  };

  const handleAddTipoTrabajo = (nuevo) => {
    const updated = [...tiposTrabajo, nuevo];
    setTiposTrabajo(updated);
    saveOptions(updated, tiposEstilo, tiposCompania);
  };

  const handleAddTipoEstilo = (nuevo) => {
    const updated = [...tiposEstilo, nuevo];
    setTiposEstilo(updated);
    saveOptions(tiposTrabajo, updated, tiposCompania);
  };

  const handleAddTipoCompania = (nuevo) => {
    if (!nuevo || tiposCompania.includes(nuevo)) return;
    const updated = [...tiposCompania, nuevo];
    setTiposCompania(updated);
    saveOptions(tiposTrabajo, tiposEstilo, updated);
  };

  // ── Filtros ──────────────────────────────────────────────
  const filteredClients = useMemo(() => {
    const filtered = Object.values(clients).filter((c) => {
      const s = filters.search.toLowerCase();
      const matchSearch = !s ||
        c.empresa?.toLowerCase().includes(s) ||
        c.codigo?.toLowerCase().includes(s) ||
        c.tipoCompania?.toLowerCase().includes(s) ||
        c.contactos?.some((ct) => `${ct.nombre} ${ct.apellido} ${ct.rol}`.toLowerCase().includes(s)) ||
        c.emails?.some((e) => e.email?.toLowerCase().includes(s));
      const matchPais = !filters.pais || c.pais === filters.pais;
      const matchTrabajo = !filters.tipoTrabajo || c.tipoTrabajo === filters.tipoTrabajo;
      const matchEstilo = !filters.tipoEstilo ||
        (Array.isArray(c.tiposEstilo) ? c.tiposEstilo.includes(filters.tipoEstilo) : c.tipoEstilo === filters.tipoEstilo);
      const matchStatus = !filters.status || c.status === filters.status;
      const matchCompania = !filters.tipoCompania || c.tipoCompania === filters.tipoCompania;
      return matchSearch && matchPais && matchTrabajo && matchEstilo && matchStatus && matchCompania;
    });
    return filtered.sort((a, b) => {
      const dateA = new Date(a.fechaCreacion || 0);
      const dateB = new Date(b.fechaCreacion || 0);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [clients, filters, sortOrder]);

  if (showTest) return <TestConnection />;

  // ── Login ────────────────────────────────────────────────
  const handleLogin = (e) => {
    e.preventDefault();
    if (users[loginUsername] && users[loginUsername].password === loginPassword) {
      setCurrentUser(loginUsername);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginUsername("");
    setLoginPassword("");
  };

  const handleAddUser = async () => {
    if (!newUsername || !newPassword) return;
    if (users[newUsername]) { alert("Este usuario ya existe"); return; }
    const newUser = { password: newPassword };
    await setDoc(doc(db, "users", newUsername), newUser);
    setUsers((prev) => ({ ...prev, [newUsername]: newUser }));
    setNewUsername(""); setNewPassword(""); setShowAddUser(false);
  };

  // ── Firebase helpers ─────────────────────────────────────
  const saveClientToFirebase = async (code, data) => {
    try { await setDoc(doc(db, "clients", code), data); }
    catch (e) { console.error("Error guardando cliente:", e); }
  };
  const saveCounterToFirebase = async (pais, count) => {
    try { await setDoc(doc(db, "counters", pais), { count }); }
    catch (e) { console.error("Error guardando contador:", e); }
  };
  const deleteClientFromFirebase = async (code) => {
    try { await deleteDoc(doc(db, "clients", code)); }
    catch (e) { console.error("Error borrando cliente:", e); }
  };

  const handleDeleteClient = async (clientCode) => {
    if (!window.confirm(`¿Eliminar cliente ${clientCode}?\nEsta acción no se puede deshacer.`)) return;
    await deleteClientFromFirebase(clientCode);
    await deleteRowFromExcel(clientCode);
    setClients((prev) => { const u = { ...prev }; delete u[clientCode]; return u; });
    setSelectedClient(null);
    setEditingClient(null);
  };

  // ── Helpers de form ──────────────────────────────────────
  const makeHandlers = (setter) => ({
    onChange: (e) => setter((f) => ({ ...f, [e.target.name]: e.target.value })),
    onContactChange: (i, field, value) => setter((f) => ({ ...f, contactos: f.contactos.map((c, idx) => idx === i ? { ...c, [field]: value } : c) })),
    onAddContact: () => setter((f) => ({ ...f, contactos: [...f.contactos, emptyContact()] })),
    onRemoveContact: (i) => setter((f) => ({ ...f, contactos: f.contactos.filter((_, idx) => idx !== i) })),
    onEmailChange: (i, field, value) => setter((f) => ({ ...f, emails: f.emails.map((e, idx) => idx === i ? { ...e, [field]: value } : e) })),
    onAddEmail: () => setter((f) => ({ ...f, emails: [...f.emails, emptyEmail()] })),
    onRemoveEmail: (i) => setter((f) => ({ ...f, emails: f.emails.filter((_, idx) => idx !== i) })),
    onProyectoChange: (i, field, value) => setter((f) => ({ ...f, proyectos: f.proyectos.map((p, idx) => idx === i ? { ...p, [field]: value } : p) })),
    onAddProyecto: () => setter((f) => ({ ...f, proyectos: [...f.proyectos, emptyProyecto()] })),
    onRemoveProyecto: (i) => setter((f) => ({ ...f, proyectos: f.proyectos.filter((_, idx) => idx !== i) })),
    onFechaEntregaChange: (i, field, value) => setter((f) => ({ ...f, fechasEntrega: f.fechasEntrega.map((fe, idx) => idx === i ? { ...fe, [field]: value } : fe) })),
    onAddFechaEntrega: () => setter((f) => ({ ...f, fechasEntrega: [...f.fechasEntrega, emptyFechaEntrega()] })),
    onRemoveFechaEntrega: (i) => setter((f) => ({ ...f, fechasEntrega: f.fechasEntrega.filter((_, idx) => idx !== i) })),
    onRefVisualChange: (i, field, value) => setter((f) => ({ ...f, referenciasVisuales: f.referenciasVisuales.map((r, idx) => idx === i ? { ...r, [field]: value } : r) })),
    onAddRefVisual: () => setter((f) => ({ ...f, referenciasVisuales: [...f.referenciasVisuales, emptyReferenciaVisual()] })),
    onRemoveRefVisual: (i) => setter((f) => ({ ...f, referenciasVisuales: f.referenciasVisuales.filter((_, idx) => idx !== i) })),
    onEstilosChange: (arr) => setter((f) => ({ ...f, tiposEstilo: arr })),
    onCompaniaBlur: (value) => { if (value && !tiposCompania.includes(value)) handleAddTipoCompania(value); },
  });

  const formH = makeHandlers(setForm);
  const editH = makeHandlers(setEditForm);

  // ── Registro ─────────────────────────────────────────────
  const handleRegister = async () => {
    if (!form.empresa || !form.pais) return;
    const paisCodigo = form.pais;
    const newCount = (counters[paisCodigo] || 0) + 1;
    const code = `${paisCodigo}${String(newCount).padStart(3, "0")}`;
    const clientData = {
      ...form,
      codigo: code,
      fechaRegistro: new Date().toLocaleDateString("es-ES"),
      creadoPor: currentUser,
      fechaCreacion: new Date().toISOString(),
    };
    setCounters((prev) => ({ ...prev, [paisCodigo]: newCount }));
    setClients((prev) => ({ ...prev, [code]: clientData }));
    setGeneratedCode(code);
    await saveClientToFirebase(code, clientData);
    await saveCounterToFirebase(paisCodigo, newCount);
    await addRowToExcel(clientData);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => { setForm(defaultForm()); setGeneratedCode(null); };

  const handleSaveEdit = async () => {
    const updated = {
      ...editForm,
      codigo: editingClient,
      editadoPor: currentUser,
      fechaEdicion: new Date().toISOString(),
    };
    setClients((prev) => ({ ...prev, [editingClient]: updated }));
    setSelectedClient(updated);
    setEditingClient(null);
    setEditForm(null);
    await saveClientToFirebase(editingClient, updated);
    await updateRowInExcel(editingClient, updated);
  };

  const handleFilter = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  const clearFilters = () => setFilters({ search: "", pais: "", tipoTrabajo: "", tipoEstilo: "", status: "", tipoCompania: "" });

  const paisNombre = (codigo) => PAISES.find((p) => p.codigo === codigo)?.nombre || codigo;
  const clientCount = Object.keys(clients).length;
  const hasFilters = filters.search || filters.pais || filters.tipoTrabajo || filters.tipoEstilo || filters.status || filters.tipoCompania;

  // ── Render formulario (reutilizado en registro y edición) ─
  const renderForm = (f, handlers, onSubmit, submitLabel, extraBtn) => (
    <>
      {/* ── Empresa ── */}
      <div className="section-title">📋 Datos de la empresa</div>
      <div className="form-grid">
        <div className="form-group full">
          <label>Nombre de empresa *</label>
          <input name="empresa" value={f.empresa} onChange={handlers.onChange} placeholder="Acme Productions S.L." />
        </div>
        <div className="form-group">
          <label>Tipo de compañía</label>
          <TipoCompaniaSelect value={f.tipoCompania} onChange={handlers.onChange} allTipos={tiposCompania} onAddTipo={handleAddTipoCompania} />
        </div>
        <div className="form-group">
          <label>País *</label>
          <select name="pais" value={f.pais} onChange={handlers.onChange}>
            {PAISES.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Teléfono</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input name="telefono" value={f.telefono} onChange={handlers.onChange} placeholder="+34 600 000 000" style={{ flex: 1 }} />
            <button type="button" className="btn-desconocido" onClick={() => handlers.onChange({ target: { name: "telefono", value: "Desconocido" } })}
              style={{ padding: "0 10px", fontSize: 12, background: "#eee", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }}>¿?</button>
          </div>
        </div>
        <div className="form-group">
          <label>🌐 Web empresa</label>
          <input name="webEmpresa" value={f.webEmpresa || ""} onChange={handlers.onChange} placeholder="https://www.empresa.com" />
        </div>
        <div className="form-group">
          <label>🔗 Identidad de marca</label>
          <input name="identidadMarca" value={f.identidadMarca || ""} onChange={handlers.onChange} placeholder="https://drive.google.com/..." />
        </div>
        <div className="form-group">
          <label>🧾 Factura</label>
          <input name="factura" value={f.factura || ""} onChange={handlers.onChange} placeholder="https://..." />
        </div>
        <div className="form-group">
          <label>💬 ¿Por dónde nos conoció?</label>
          <select name="porDondeNosConoci" value={f.porDondeNosConoci || ""} onChange={handlers.onChange}>
            <option value="">— Seleccionar —</option>
            {POR_DONDE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* ── Contactos ── */}
      <div className="section-title">👥 Contactos</div>
      <ContactsBlock contactos={f.contactos} onChange={handlers.onContactChange} onAdd={handlers.onAddContact} onRemove={handlers.onRemoveContact} />

      {/* ── Emails ── */}
      <div className="section-title">📧 Emails</div>
      <EmailsBlock emails={f.emails} onChange={handlers.onEmailChange} onAdd={handlers.onAddEmail} onRemove={handlers.onRemoveEmail} />

      {/* ── Proyectos ── */}
      <div className="section-title">📁 Proyectos</div>
      <ProyectosBlock proyectos={f.proyectos || []} onChange={handlers.onProyectoChange} onAdd={handlers.onAddProyecto} onRemove={handlers.onRemoveProyecto} />

      {/* ── Referencias visuales ── */}
      <div className="section-title">🎨 Referencias visuales</div>
      <ReferenciasVisualesBlock
        referencias={f.referenciasVisuales || []}
        onChange={handlers.onRefVisualChange}
        onAdd={handlers.onAddRefVisual}
        onRemove={handlers.onRemoveRefVisual}
      />

      {/* ── Fechas de entrega ── */}
      <div className="section-title">📅 Fechas de entrega</div>
      <FechasEntregaBlock
        fechas={f.fechasEntrega || []}
        onChange={handlers.onFechaEntregaChange}
        onAdd={handlers.onAddFechaEntrega}
        onRemove={handlers.onRemoveFechaEntrega}
      />

      {/* ── Categorización ── */}
      <div className="section-title">🎯 Categorización</div>
      <div className="form-grid">
        <div className="form-group">
          <label>Tipo de trabajo</label>
          <TipoTrabajoSelect
            value={f.tipoTrabajo}
            onChange={handlers.onChange}
            allTipos={tiposTrabajo}
            onAddTipo={handleAddTipoTrabajo}
          />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select name="status" value={f.status} onChange={handlers.onChange}>
            {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Fecha de primer contacto</label>
          <input type="date" name="fechaPrimerContacto" value={f.fechaPrimerContacto} onChange={handlers.onChange} />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 16 }}>
        <label>🎨 Estilo (puedes marcar varios)</label>
        <EstilosMultiSelect
          selected={f.tiposEstilo || []}
          onChange={handlers.onEstilosChange}
          allEstilos={tiposEstilo}
          onAddEstilo={handleAddTipoEstilo}
        />
      </div>

      {/* ── Notas ── */}
      <div className="section-title">📝 Notas</div>
      <div className="form-group" style={{ marginBottom: 12 }}>
        <label>Notas generales</label>
        <textarea name="notas" value={f.notas} onChange={handlers.onChange} placeholder="Observaciones adicionales sobre el cliente..." />
      </div>
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label>📋 Notas a editor</label>
        <textarea name="notasEditor" value={f.notasEditor || ""} onChange={handlers.onChange} placeholder="Indicaciones específicas para el editor..." rows={3} />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {extraBtn}
        <button className="btn btn-primary" onClick={onSubmit} disabled={!f.empresa || !f.pais} style={{ marginTop: 0 }}>
          {submitLabel}
        </button>
      </div>
    </>
  );

  // ── Ficha de cliente (vista) ──────────────────────────────
  const renderClientDetail = (c) => {
    const estilos = Array.isArray(c.tiposEstilo) && c.tiposEstilo.length > 0
      ? c.tiposEstilo : (c.tipoEstilo ? [c.tipoEstilo] : []);

    const fechaEdicionFormato = c.fechaEdicion
      ? new Date(c.fechaEdicion).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })
      : null;

    return (
      <div className="result-fields">
        <div className="result-field">
          <span className="result-field-label">Status</span>
          <span className={`tag ${TAG_STATUS[c.status || "Activo"]}`}>{c.status || "Activo"}</span>
        </div>

        {c.tipoCompania && (
          <div className="result-field">
            <span className="result-field-label">Tipo compañía</span>
            <span className="result-field-value">{c.tipoCompania}</span>
          </div>
        )}

        {c.contactos?.filter((ct) => ct.nombre).length > 0 && (
          <div className="result-field result-field-block">
            <span className="result-field-label">Contactos</span>
            <div className="contacts-list">
              {c.contactos.filter((ct) => ct.nombre).map((ct, i) => (
                <div key={i} className="contact-chip">
                  <span className="contact-chip-num">#{i + 1}</span>
                  <span className="contact-chip-name">{ct.nombre} {ct.apellido}</span>
                  {ct.rol && <span className="contact-chip-rol">{ct.rol}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {c.emails?.filter((e) => e.email).length > 0 && (
          <div className="result-field result-field-block">
            <span className="result-field-label">Emails</span>
            <div className="emails-list">
              {c.emails.filter((e) => e.email).map((e, i) => (
                <div key={i} className="email-chip">
                  <span>{e.email}</span>
                  {e.nota && <span className="email-chip-nota">{e.nota}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {c.telefono && (
          <div className="result-field">
            <span className="result-field-label">Teléfono</span>
            <span className="result-field-value">{c.telefono}</span>
          </div>
        )}

        {c.webEmpresa && (
          <div className="result-field">
            <span className="result-field-label">Web empresa</span>
            <a href={c.webEmpresa} target="_blank" rel="noopener noreferrer" className="result-link">{c.webEmpresa}</a>
          </div>
        )}

        {c.identidadMarca && (
          <div className="result-field">
            <span className="result-field-label">Identidad de marca</span>
            <a href={c.identidadMarca} target="_blank" rel="noopener noreferrer" className="result-link">🔗 Ver identidad</a>
          </div>
        )}

        {c.factura && (
          <div className="result-field">
            <span className="result-field-label">Factura</span>
            <a href={c.factura} target="_blank" rel="noopener noreferrer" className="result-link">🧾 Ver factura</a>
          </div>
        )}

        <div className="result-field">
          <span className="result-field-label">Tipo trabajo</span>
          <span className={`tag ${TAG_TRABAJO[c.tipoTrabajo] || "tag-desconocido"}`}>{c.tipoTrabajo}</span>
        </div>

        {estilos.length > 0 && (
          <div className="result-field result-field-block">
            <span className="result-field-label">Estilo</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {estilos.map((e) => (
                <span key={e} className={`tag ${TAG_ESTILO[e] || "tag-desconocido"}`}>{e}</span>
              ))}
            </div>
          </div>
        )}

        {c.proyectos?.filter((p) => p.nombre || p.link).length > 0 && (
          <div className="result-field result-field-block">
            <span className="result-field-label">Proyectos</span>
            <div className="contacts-list">
              {c.proyectos.filter((p) => p.nombre || p.link).map((p, i) => (
                <div key={i} className="contact-chip">
                  <span className="contact-chip-num">{p.numero || String(i + 1).padStart(2, "0")}</span>
                  {p.nombre && <span className="contact-chip-name">{p.nombre}</span>}
                  {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="result-link" style={{ fontSize: 12 }}>🔗 Link</a>}
                </div>
              ))}
            </div>
          </div>
        )}

        {c.referenciasVisuales?.filter((r) => r.link).length > 0 && (
          <div className="result-field result-field-block">
            <span className="result-field-label">Referencias visuales</span>
            <div className="contacts-list">
              {c.referenciasVisuales.filter((r) => r.link).map((r, i) => (
                <div key={i} className="contact-chip" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="contact-chip-num">{r.numero || String(i + 1).padStart(2, "0")}</span>
                    <a href={r.link} target="_blank" rel="noopener noreferrer" className="result-link">🔗 Ver referencia</a>
                  </div>
                  {r.nota && <span style={{ fontSize: 12, color: "var(--muted)", paddingLeft: 28 }}>{r.nota}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {c.fechasEntrega?.filter((f) => f.fecha).length > 0 && (
          <div className="result-field result-field-block">
            <span className="result-field-label">Fechas de entrega</span>
            <div className="contacts-list">
              {c.fechasEntrega.filter((f) => f.fecha).map((f, i) => (
                <div key={i} className="contact-chip">
                  <span className="contact-chip-num">{f.numero || String(i + 1).padStart(2, "0")}</span>
                  {f.descripcion && <span className="contact-chip-rol">{f.descripcion}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {c.porDondeNosConoci && (
          <div className="result-field">
            <span className="result-field-label">¿Cómo nos conoció?</span>
            <span className="result-field-value">{c.porDondeNosConoci}</span>
          </div>
        )}

        {c.fechaPrimerContacto && (
          <div className="result-field">
            <span className="result-field-label">1er contacto</span>
            <span className="result-field-value">{c.fechaPrimerContacto}</span>
          </div>
        )}

        <div className="result-field">
          <span className="result-field-label">Creado por</span>
          <span className="result-field-value">{c.creadoPor || "—"}</span>
        </div>
        <div className="result-field">
          <span className="result-field-label">Registrado</span>
          <span className="result-field-value">{c.fechaRegistro}</span>
        </div>
        {c.editadoPor && (
          <div className="result-field">
            <span className="result-field-label">Última edición</span>
            <span className="result-field-value">{c.editadoPor} · {fechaEdicionFormato}</span>
          </div>
        )}
        {c.notas && (
          <div className="result-field result-field-block">
            <span className="result-field-label">Notas</span>
            <span className="result-field-value result-notes">{c.notas}</span>
          </div>
        )}
        {c.notasEditor && (
          <div className="result-field result-field-block">
            <span className="result-field-label">Notas a editor</span>
            <span className="result-field-value result-notes" style={{ borderLeft: "3px solid var(--accent)", paddingLeft: 10 }}>{c.notasEditor}</span>
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // ── LOGIN ─────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="login-icon">🔐</div>
              <h1 className="login-title">Gestión de <span>Clientes</span></h1>
              <p className="login-subtitle">Inicia sesión para acceder</p>
            </div>
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label>Usuario</label>
                <input type="text" value={loginUsername} onChange={(e) => { setLoginUsername(e.target.value); setLoginError(false); }} placeholder="Ingresa tu usuario" autoFocus />
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input type="password" value={loginPassword} onChange={(e) => { setLoginPassword(e.target.value); setLoginError(false); }} placeholder="Ingresa tu contraseña" />
              </div>
              {loginError && <div className="login-error">⚠️ Usuario o contraseña incorrectos</div>}
              <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }}>🔓 Iniciar sesión</button>
              <button type="button" onClick={() => setShowTest(true)}
                style={{ marginTop: 12, padding: "10px 16px", backgroundColor: "#444", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", width: "100%", fontSize: 14 }}>
                🔧 Test de Conexión SharePoint
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── LOADING ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app">
        <div className="header">
          <div className="header-badge">⚡ Sistema de Clientes</div>
          <h1>Gestión de <span>Clientes</span></h1>
        </div>
        <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
          <div>Cargando datos...</div>
        </div>
      </div>
    );
  }

  // ── APP ───────────────────────────────────────────────────
  return (
    <div className="app">
      <div className="header">
        <div className="header-badge">⚡ Sistema de Clientes</div>
        <h1>Gestión de <span>Clientes</span></h1>
        <p>Sesión iniciada como <strong>{currentUser}</strong></p>
        <div className="header-actions">
          <button className="btn-logout" onClick={handleLogout}>🚪 Cerrar sesión</button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === "register" ? "active" : ""}`} onClick={() => { setTab("register"); setSelectedClient(null); setEditingClient(null); }}>✏️ Registrar</button>
        <button className={`tab ${tab === "db" ? "active" : ""}`} onClick={() => { setTab("db"); setSelectedClient(null); setEditingClient(null); }}>🗄️ Base de datos</button>
        <button className={`tab ${tab === "users" ? "active" : ""}`} onClick={() => { setTab("users"); setSelectedClient(null); setEditingClient(null); }}>👥 Usuarios</button>
      </div>

      {/* ── USUARIOS ── */}
      {tab === "users" && (
        <div className="card">
          <div className="card-header">
            <div className="card-icon">👥</div>
            <div>
              <div className="card-title">Gestión de Usuarios</div>
              <div className="card-subtitle">{Object.keys(users).length} usuario{Object.keys(users).length > 1 ? "s" : ""} registrado{Object.keys(users).length > 1 ? "s" : ""}</div>
            </div>
          </div>
          <div className="card-body">
            <div className="users-list">
              {Object.entries(users).map(([username]) => (
                <div key={username} className="user-item">
                  <div className="user-avatar">👤</div>
                  <div className="user-info">
                    <div className="user-name">{username}</div>
                    <div className="user-pass">••••••••</div>
                  </div>
                </div>
              ))}
            </div>
            {!showAddUser ? (
              <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowAddUser(true)}>+ Agregar nuevo usuario</button>
            ) : (
              <div style={{ marginTop: 20, padding: 20, background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <div className="section-title" style={{ marginTop: 0 }}>Nuevo Usuario</div>
                <div className="form-group">
                  <label>Nombre de usuario</label>
                  <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Ej: vendedor2" />
                </div>
                <div className="form-group">
                  <label>Contraseña</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Contraseña segura" />
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button className="btn btn-ghost" style={{ marginTop: 0 }} onClick={() => { setShowAddUser(false); setNewUsername(""); setNewPassword(""); }}>Cancelar</button>
                  <button className="btn btn-primary" style={{ marginTop: 0 }} onClick={handleAddUser} disabled={!newUsername || !newPassword}>💾 Guardar usuario</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REGISTRAR ── */}
      {tab === "register" && (
        <div className="card">
          <div className="card-header">
            <div className="card-icon">🏢</div>
            <div>
              <div className="card-title">Nuevo Cliente</div>
              <div className="card-subtitle">Completa los datos para generar un código</div>
            </div>
          </div>
          <div className="card-body">
            {!generatedCode ? (
              <>
                {renderForm(form, formH, handleRegister, "🎫 Generar código de cliente", null)}
                {clientCount > 0 && (
                  <div className="saved-count" style={{ marginTop: 16 }}>
                    <span>{clientCount}</span> cliente{clientCount > 1 ? "s" : ""} registrado{clientCount > 1 ? "s" : ""}
                  </div>
                )}
              </>
            ) : (
              <div className="success-wrap">
                <div className="success-top">
                  <div style={{ fontSize: 32 }}>✅</div>
                  <div className="success-name">{form.empresa}</div>
                  <div className="success-hint">Cliente guardado en la nube ☁️</div>
                </div>
                <div className="code-box">
                  <div className="code-label">🔑 Código único de cliente</div>
                  <div className="code-value">{generatedCode}</div>
                  <button className="code-copy" onClick={handleCopy}>{copied ? "✓ Copiado!" : "📋 Copiar código"}</button>
                  <div className="code-note">Creado por <strong>{currentUser}</strong></div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  <button className="btn btn-ghost" style={{ marginTop: 0 }} onClick={handleReset}>+ Registrar otro</button>
                  <button className="btn btn-secondary" style={{ marginTop: 0 }}
                    onClick={() => exportarFichaEditor(clients[generatedCode] || { ...form, codigo: generatedCode })}>
                    📄 Exportar ficha para editor
                  </button>
                  <button className="btn btn-primary" style={{ marginTop: 0 }}
                    onClick={() => { setTab("db"); setSelectedClient(null); setGeneratedCode(null); setForm(defaultForm()); }}>
                    🗄️ Ver base de datos
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BASE DE DATOS ── */}
      {tab === "db" && (
        <div className="db-layout">
          <div className="db-left">
            <div className="card">
              <div className="card-header">
                <div className="card-icon">🗄️</div>
                <div>
                  <div className="card-title">Base de datos</div>
                  <div className="card-subtitle">{clientCount} cliente{clientCount !== 1 ? "s" : ""} · {filteredClients.length} resultado{filteredClients.length !== 1 ? "s" : ""}</div>
                </div>
              </div>
              <div className="card-body" style={{ padding: "16px 20px" }}>
                <div className="search-wrap">
                  <span className="search-icon">🔍</span>
                  <input className="search-input" name="search" value={filters.search} onChange={handleFilter} placeholder="Buscar empresa, contacto, código..." />
                  {filters.search && <button className="search-clear" onClick={() => setFilters((f) => ({ ...f, search: "" }))}>✕</button>}
                </div>

                <div className="filters-row">
                  <select name="pais" value={filters.pais} onChange={handleFilter} className="filter-select">
                    <option value="">🌍 País</option>
                    {PAISES.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
                  </select>
                  <select name="tipoTrabajo" value={filters.tipoTrabajo} onChange={handleFilter} className="filter-select">
                    <option value="">🎯 Trabajo</option>
                    {tiposTrabajo.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select name="tipoEstilo" value={filters.tipoEstilo} onChange={handleFilter} className="filter-select">
                    <option value="">🎨 Estilo</option>
                    {tiposEstilo.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="filters-row">
                  <select name="status" value={filters.status} onChange={handleFilter} className="filter-select">
                    <option value="">📊 Status</option>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {tiposCompania.length > 0 && (
                    <select name="tipoCompania" value={filters.tipoCompania} onChange={handleFilter} className="filter-select">
                      <option value="">🏢 Compañía</option>
                      {tiposCompania.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                  <button className="sort-button" onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                    title={sortOrder === "newest" ? "Ordenar: más antiguo primero" : "Ordenar: más reciente primero"}>
                    {sortOrder === "newest" ? "🔽 Más reciente" : "🔼 Más antiguo"}
                  </button>
                  {hasFilters && <button className="clear-filters" onClick={clearFilters}>Limpiar</button>}
                </div>

                {clientCount === 0 ? (
                  <div className="empty-state">
                    <div style={{ fontSize: 36 }}>📭</div>
                    <div>No hay clientes aún</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Ve a Registrar para añadir el primero</div>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="empty-state">
                    <div style={{ fontSize: 36 }}>🔎</div>
                    <div>Sin resultados</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Prueba con otros filtros</div>
                  </div>
                ) : (
                  <div className="client-list">
                    {filteredClients.map((c) => (
                      <div key={c.codigo} className={`client-row ${selectedClient?.codigo === c.codigo ? "active" : ""}`}
                        onClick={() => { setSelectedClient(c); setEditingClient(null); setEditForm(null); }}>
                        <div className="client-row-avatar">{c.empresa?.[0]?.toUpperCase() || "?"}</div>
                        <div className="client-row-info">
                          <div className="client-row-name">{c.empresa}</div>
                          <div className="client-row-meta">
                            <span className="client-row-code">{c.codigo}</span>
                            <span className="client-row-dot">·</span>
                            <span>{paisNombre(c.pais)}</span>
                            {c.tipoCompania && <><span className="client-row-dot">·</span><span>{c.tipoCompania}</span></>}
                          </div>
                        </div>
                        <div className="client-row-tags">
                          <span className={`tag tag-sm ${TAG_STATUS[c.status || "Activo"]}`}>{c.status || "Activo"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── DETALLE ── */}
          <div className="db-right">
            {!selectedClient && !editingClient && (
              <div className="detail-empty">
                <div style={{ fontSize: 48 }}>👈</div>
                <div>Selecciona un cliente para ver su ficha</div>
              </div>
            )}

            {selectedClient && !editingClient && (
              <div className="card" style={{ maxWidth: "100%" }}>
                <div className="card-header" style={{ justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="card-icon">📄</div>
                    <div>
                      <div className="card-title">{selectedClient.empresa}</div>
                      <div className="card-subtitle">{selectedClient.codigo} · {paisNombre(selectedClient.pais)}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="btn btn-secondary" style={{ marginTop: 0, fontSize: 13, padding: "6px 12px" }}
                      onClick={() => exportarFichaEditor(selectedClient)}>
                      📄 Exportar ficha editor
                    </button>
                    <button className="btn-delete" onClick={() => handleDeleteClient(selectedClient.codigo)} title="Eliminar cliente">🗑️</button>
                    <button className="btn-edit" onClick={() => {
                      setEditingClient(selectedClient.codigo);
                      setEditForm({
                        ...selectedClient,
                        proyectos: selectedClient.proyectos || [],
                        referenciasVisuales: selectedClient.referenciasVisuales || [],
                        fechasEntrega: selectedClient.fechasEntrega || [],
                        tiposEstilo: selectedClient.tiposEstilo || (selectedClient.tipoEstilo ? [selectedClient.tipoEstilo] : []),
                      });
                    }}>✏️ Editar</button>
                  </div>
                </div>
                <div className="card-body" style={{ padding: "8px 24px 24px" }}>
                  {renderClientDetail(selectedClient)}
                </div>
              </div>
            )}

            {editingClient && editForm && (
              <div className="card" style={{ maxWidth: "100%" }}>
                <div className="card-header" style={{ justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="card-icon">✏️</div>
                    <div>
                      <div className="card-title">Editando cliente</div>
                      <div className="card-subtitle">{editingClient}</div>
                    </div>
                  </div>
                  <button className="btn-cancel" onClick={() => { setEditingClient(null); setEditForm(null); }}>✕ Cancelar</button>
                </div>
                <div className="card-body">
                  {renderForm(
                    editForm,
                    editH,
                    handleSaveEdit,
                    "💾 Guardar cambios",
                    <button className="btn btn-ghost" style={{ marginTop: 0 }} onClick={() => { setEditingClient(null); setEditForm(null); }}>Cancelar</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}