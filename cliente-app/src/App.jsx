import TestConnection from './TestConnection';
import { useState, useMemo, useEffect } from "react";
import { collection, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore";
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

const TIPOS_TRABAJO = ["Learning", "Social", "Corporativo", "Show", "Mixto", "Desconocido"];
const TIPOS_ESTILO = ["Live", "Animado", "Live Mixto", "Animado Mixto", "Mixto", "Desconocido"];
const STATUS_OPTIONS = ["Activo", "Pausa", "Inactivo"];

const TAG_TRABAJO = {
  Learning: "tag-learning", Social: "tag-social", Corporativo: "tag-corporativo",
  Show: "tag-show", Mixto: "tag-mixto", Desconocido: "tag-desconocido",
};
const TAG_ESTILO = {
  Live: "tag-live", Animado: "tag-animado", "Live Mixto": "tag-live-mixto",
  "Animado Mixto": "tag-animado-mixto", Mixto: "tag-mixto", Desconocido: "tag-desconocido",
};
const TAG_STATUS = {
  Activo: "tag-status-activo",
  Pausa: "tag-status-pausa",
  Inactivo: "tag-status-inactivo",
};

const emptyContact = () => ({ nombre: "", apellido: "", rol: "" });
const emptyEmail = () => ({ email: "", nota: "" });
const defaultForm = () => ({
  empresa: "", pais: "ES", telefono: "+34",
  tipoTrabajo: "Desconocido", tipoEstilo: "Desconocido",
  status: "Activo",
  notas: "", fechaPrimerContacto: "",
  contactos: [emptyContact()], emails: [emptyEmail()],
});

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
  const [filters, setFilters] = useState({ search: "", pais: "", tipoTrabajo: "", tipoEstilo: "", status: "" });
  const [sortOrder, setSortOrder] = useState("newest");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const loadedUsers = {};
        usersSnap.forEach((doc) => {
          loadedUsers[doc.id] = doc.data();
        });
        
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

  useEffect(() => {
    if (!currentUser) return;
    const loadData = async () => {
      try {
        const clientsSnap = await getDocs(collection(db, "clients"));
        const loadedClients = {};
        clientsSnap.forEach((doc) => {
          loadedClients[doc.id] = doc.data();
        });
        setClients(loadedClients);

        const countersSnap = await getDocs(collection(db, "counters"));
        const loadedCounters = {};
        countersSnap.forEach((doc) => {
          loadedCounters[doc.id] = doc.data().count;
        });
        setCounters(loadedCounters);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  // ✅ EFECTO PARA PREFIJO TELEFÓNICO AUTOMÁTICO
  useEffect(() => {
    const paisSel = PAISES.find(p => p.codigo === form.pais);
    if (paisSel) {
      setForm(f => ({ ...f, telefono: paisSel.prefijo }));
    }
  }, [form.pais]);

  const filteredClients = useMemo(() => {
    const filtered = Object.values(clients).filter((c) => {
      const s = filters.search.toLowerCase();
      const matchSearch = !s ||
        c.empresa?.toLowerCase().includes(s) ||
        c.codigo?.toLowerCase().includes(s) ||
        c.contactos?.some((ct) => `${ct.nombre} ${ct.apellido} ${ct.rol}`.toLowerCase().includes(s)) ||
        c.emails?.some((e) => e.email?.toLowerCase().includes(s));
      const matchPais = !filters.pais || c.pais === filters.pais;
      const matchTrabajo = !filters.tipoTrabajo || c.tipoTrabajo === filters.tipoTrabajo;
      const matchEstilo = !filters.tipoEstilo || c.tipoEstilo === filters.tipoEstilo;
      const matchStatus = !filters.status || c.status === filters.status;
      return matchSearch && matchPais && matchTrabajo && matchEstilo && matchStatus;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.fechaCreacion || 0);
      const dateB = new Date(b.fechaCreacion || 0);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [clients, filters, sortOrder]);

  if (showTest) {
    return <TestConnection />;
  }

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
    if (users[newUsername]) {
      alert("Este usuario ya existe");
      return;
    }
    const newUser = { password: newPassword };
    await setDoc(doc(db, "users", newUsername), newUser);
    setUsers((prev) => ({ ...prev, [newUsername]: newUser }));
    setNewUsername("");
    setNewPassword("");
    setShowAddUser(false);
  };

  const saveClientToFirebase = async (code, data) => {
    try {
      await setDoc(doc(db, "clients", code), data);
    } catch (error) {
      console.error("Error guardando cliente:", error);
    }
  };

  const saveCounterToFirebase = async (pais, count) => {
    try {
      await setDoc(doc(db, "counters", pais), { count });
    } catch (error) {
      console.error("Error guardando contador:", error);
    }
  };

  const deleteClientFromFirebase = async (code) => {
    try {
      await deleteDoc(doc(db, "clients", code));
    } catch (error) {
      console.error("Error borrando cliente:", error);
    }
  };

  const handleDeleteClient = async (clientCode) => {
    const confirmDelete = window.confirm(`¿Estás seguro de que quieres eliminar el cliente ${clientCode}?\n\nEsta acción no se puede deshacer.`);
    if (!confirmDelete) return;
    await deleteClientFromFirebase(clientCode);
    await deleteRowFromExcel(clientCode);
    setClients((prev) => {
      const updated = { ...prev };
      delete updated[clientCode];
      return updated;
    });
    setSelectedClient(null);
    setEditingClient(null);
  };

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleContactChange = (i, field, value) =>
    setForm((f) => ({ ...f, contactos: f.contactos.map((c, idx) => idx === i ? { ...c, [field]: value } : c) }));
  const addContact = () => setForm((f) => ({ ...f, contactos: [...f.contactos, emptyContact()] }));
  const removeContact = (i) => setForm((f) => ({ ...f, contactos: f.contactos.filter((_, idx) => idx !== i) }));
  const handleEmailChange = (i, field, value) =>
    setForm((f) => ({ ...f, emails: f.emails.map((e, idx) => idx === i ? { ...e, [field]: value } : e) }));
  const addEmail = () => setForm((f) => ({ ...f, emails: [...f.emails, emptyEmail()] }));
  const removeEmail = (i) => setForm((f) => ({ ...f, emails: f.emails.filter((_, idx) => idx !== i) }));

  const handleEditChange = (e) => setEditForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleEditContactChange = (i, field, value) =>
    setEditForm((f) => ({ ...f, contactos: f.contactos.map((c, idx) => idx === i ? { ...c, [field]: value } : c) }));
  const addEditContact = () => setEditForm((f) => ({ ...f, contactos: [...f.contactos, emptyContact()] }));
  const removeEditContact = (i) => setEditForm((f) => ({ ...f, contactos: f.contactos.filter((_, idx) => idx !== i) }));
  const handleEditEmailChange = (i, field, value) =>
    setEditForm((f) => ({ ...f, emails: f.emails.map((e, idx) => idx === i ? { ...e, [field]: value } : e) }));
  const addEditEmail = () => setEditForm((f) => ({ ...f, emails: [...f.emails, emptyEmail()] }));
  const removeEditEmail = (i) => setEditForm((f) => ({ ...f, emails: f.emails.filter((_, idx) => idx !== i) }));

  // ✅ MODIFICACIÓN DE GENERACIÓN DE CÓDIGO (EJ: AR001)
  const handleRegister = async () => {
    if (!form.empresa || !form.pais) return;
    const paisCodigo = form.pais;
    const newCount = (counters[paisCodigo] || 0) + 1;
    
    const codeNumber = String(newCount).padStart(3, '0');
    const code = `${paisCodigo}${codeNumber}`;
    
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
  const clearFilters = () => setFilters({ search: "", pais: "", tipoTrabajo: "", tipoEstilo: "", status: "" });

  const paisNombre = (codigo) => PAISES.find((p) => p.codigo === codigo)?.nombre || codigo;
  const clientCount = Object.keys(clients).length;
  const hasFilters = filters.search || filters.pais || filters.tipoTrabajo || filters.tipoEstilo || filters.status;

  const renderForm = (f, onChange, contactos, onContactChange, onAddContact, onRemoveContact, emails, onEmailChange, onAddEmail, onRemoveEmail, onSubmit, submitLabel, extraBtn) => (
    <>
      <div className="section-title">📋 Datos de la empresa</div>
      <div className="form-grid">
        <div className="form-group full">
          <label>Nombre de empresa *</label>
          <input name="empresa" value={f.empresa} onChange={onChange} placeholder="Acme Productions S.L." />
        </div>
        <div className="form-group">
          <label>País *</label>
          <select name="pais" value={f.pais} onChange={onChange}>
            {PAISES.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Teléfono</label>
          <div className="phone-input-group" style={{ display: 'flex', gap: '8px' }}>
            <input 
              name="telefono" 
              value={f.telefono} 
              onChange={onChange} 
              placeholder="+34 600 000 000" 
              style={{ flex: 1 }}
            />
            <button 
              type="button" 
              className="btn-desconocido"
              onClick={() => onChange({ target: { name: 'telefono', value: 'Desconocido' } })}
              style={{ padding: '0 10px', fontSize: '12px', background: '#eee', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
            >
              ¿?
            </button>
          </div>
        </div>
      </div>

      <div className="section-title">👥 Contactos</div>
      <ContactsBlock contactos={contactos} onChange={onContactChange} onAdd={onAddContact} onRemove={onRemoveContact} />

      <div className="section-title">📧 Emails</div>
      <EmailsBlock emails={emails} onChange={onEmailChange} onAdd={onAddEmail} onRemove={onRemoveEmail} />

      <div className="section-title">🎯 Categorización</div>
      <div className="form-grid">
        <div className="form-group">
          <label>Tipo de trabajo</label>
          <select name="tipoTrabajo" value={f.tipoTrabajo} onChange={onChange}>
            {TIPOS_TRABAJO.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Estilo</label>
          <select name="tipoEstilo" value={f.tipoEstilo} onChange={onChange}>
            {TIPOS_ESTILO.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select name="status" value={f.status} onChange={onChange}>
            {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Fecha de primer contacto</label>
          <input type="date" name="fechaPrimerContacto" value={f.fechaPrimerContacto} onChange={onChange} />
        </div>
      </div>

      <div className="section-title">📝 Notas</div>
      <div className="form-group" style={{ marginBottom: 20 }}>
        <textarea name="notas" value={f.notas} onChange={onChange} placeholder="Observaciones adicionales sobre el cliente..." />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {extraBtn}
        <button className="btn btn-primary" onClick={onSubmit} disabled={!f.empresa || !f.pais} style={{ marginTop: 0 }}>
          {submitLabel}
        </button>
      </div>
    </>
  );

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
              
              <button 
                type="button"
                onClick={() => setShowTest(true)}
                style={{
                  marginTop: 12,
                  padding: '10px 16px',
                  backgroundColor: '#444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: 14
                }}
              >
                🔧 Test de Conexión SharePoint
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
              {Object.entries(users).map(([username, data]) => (
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
                {renderForm(form, handleChange, form.contactos, handleContactChange, addContact, removeContact, form.emails, handleEmailChange, addEmail, removeEmail, handleRegister, "🎫 Generar código de cliente", null)}
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
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn btn-ghost" style={{ marginTop: 0 }} onClick={handleReset}>+ Registrar otro</button>
                  <button className="btn btn-primary" style={{ marginTop: 0 }} onClick={() => { setTab("db"); setSelectedClient(null); setGeneratedCode(null); setForm(defaultForm()); }}>🗄️ Ver base de datos</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                    {TIPOS_TRABAJO.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select name="tipoEstilo" value={filters.tipoEstilo} onChange={handleFilter} className="filter-select">
                    <option value="">🎨 Estilo</option>
                    {TIPOS_ESTILO.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="filters-row">
                  <select name="status" value={filters.status} onChange={handleFilter} className="filter-select">
                    <option value="">📊 Status</option>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button 
                    className="sort-button" 
                    onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                    title={sortOrder === "newest" ? "Ordenar: más antiguo primero" : "Ordenar: más reciente primero"}
                  >
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
                      <div key={c.codigo} className={`client-row ${selectedClient?.codigo === c.codigo ? "active" : ""}`} onClick={() => { setSelectedClient(c); setEditingClient(null); setEditForm(null); }}>
                        <div className="client-row-avatar">{c.empresa?.[0]?.toUpperCase() || "?"}</div>
                        <div className="client-row-info">
                          <div className="client-row-name">{c.empresa}</div>
                          <div className="client-row-meta">
                            <span className="client-row-code">{c.codigo}</span>
                            <span className="client-row-dot">·</span>
                            <span>{paisNombre(c.pais)}</span>
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
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-delete" onClick={() => handleDeleteClient(selectedClient.codigo)} title="Eliminar cliente">🗑️</button>
                    <button className="btn-edit" onClick={() => { setEditingClient(selectedClient.codigo); setEditForm({ ...selectedClient }); }}>✏️ Editar</button>
                  </div>
                </div>
                <div className="card-body" style={{ padding: "8px 24px 24px" }}>
                  <div className="result-fields">
                    <div className="result-field">
                      <span className="result-field-label">Status</span>
                      <span className={`tag ${TAG_STATUS[selectedClient.status || "Activo"]}`}>{selectedClient.status || "Activo"}</span>
                    </div>
                    {selectedClient.contactos?.filter(c => c.nombre).length > 0 && (
                      <div className="result-field result-field-block">
                        <span className="result-field-label">Contactos</span>
                        <div className="contacts-list">
                          {selectedClient.contactos.filter(c => c.nombre).map((c, i) => (
                            <div key={i} className="contact-chip">
                              <span className="contact-chip-num">#{i + 1}</span>
                              <span className="contact-chip-name">{c.nombre} {c.apellido}</span>
                              {c.rol && <span className="contact-chip-rol">{c.rol}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedClient.emails?.filter(e => e.email).length > 0 && (
                      <div className="result-field result-field-block">
                        <span className="result-field-label">Emails</span>
                        <div className="emails-list">
                          {selectedClient.emails.filter(e => e.email).map((e, i) => (
                            <div key={i} className="email-chip">
                              <span>{e.email}</span>
                              {e.nota && <span className="email-chip-nota">{e.nota}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedClient.telefono && (
                      <div className="result-field">
                        <span className="result-field-label">Teléfono</span>
                        <span className="result-field-value">{selectedClient.telefono}</span>
                      </div>
                    )}
                    <div className="result-field">
                      <span className="result-field-label">Tipo trabajo</span>
                      <span className={`tag ${TAG_TRABAJO[selectedClient.tipoTrabajo] || "tag-desconocido"}`}>{selectedClient.tipoTrabajo}</span>
                    </div>
                    <div className="result-field">
                      <span className="result-field-label">Estilo</span>
                      <span className={`tag ${TAG_ESTILO[selectedClient.tipoEstilo] || "tag-desconocido"}`}>{selectedClient.tipoEstilo}</span>
                    </div>
                    {selectedClient.fechaPrimerContacto && (
                      <div className="result-field">
                        <span className="result-field-label">1er contacto</span>
                        <span className="result-field-value">{selectedClient.fechaPrimerContacto}</span>
                      </div>
                    )}
                    <div className="result-field">
                      <span className="result-field-label">Creado por</span>
                      <span className="result-field-value">{selectedClient.creadoPor || "—"}</span>
                    </div>
                    <div className="result-field">
                      <span className="result-field-label">Registrado</span>
                      <span className="result-field-value">{selectedClient.fechaRegistro}</span>
                    </div>
                    {selectedClient.editadoPor && (
                      <div className="result-field">
                        <span className="result-field-label">Editado por</span>
                        <span className="result-field-value">{selectedClient.editadoPor}</span>
                      </div>
                    )}
                    {selectedClient.notas && (
                      <div className="result-field result-field-block">
                        <span className="result-field-label">Notas</span>
                        <span className="result-field-value result-notes">{selectedClient.notas}</span>
                      </div>
                    )}
                  </div>
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
                  {renderForm(editForm, handleEditChange, editForm.contactos, handleEditContactChange, addEditContact, removeEditContact, editForm.emails, handleEditEmailChange, addEditEmail, removeEditEmail, handleSaveEdit, "💾 Guardar cambios",
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