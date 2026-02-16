# 🗂️ Gestión de Clientes

Aplicación para registrar clientes y consultar su información mediante un código único.

---

## 🚀 Cómo ejecutarla

### Requisitos previos
- Tener **Node.js** instalado → [Descargar en nodejs.org](https://nodejs.org)

### Pasos

1. **Abre una terminal** en la carpeta del proyecto  
   *(Clic derecho en la carpeta → "Abrir Terminal" o "Git Bash")*

2. **Instala las dependencias** (solo la primera vez):
   ```bash
   npm install
   ```

3. **Inicia la aplicación**:
   ```bash
   npm run dev
   ```

4. **Abre el navegador** en la dirección que aparece, normalmente:
   ```
   http://localhost:5173
   ```

---

## 📦 Generar versión para producción

Si quieres una versión optimizada para distribuir:

```bash
npm run build
```

Los archivos generados estarán en la carpeta `/dist`.

---

## 💡 Uso

| Pestaña | Función |
|---|---|
| **Registrar** | Rellena los datos del cliente y pulsa "Generar código" |
| **Consultar** | Introduce el código para ver la información del cliente |

> ⚠️ Los datos se guardan en memoria. Al cerrar la aplicación, se borran.
> Si necesitas persistencia de datos, consulta cómo añadir localStorage o una base de datos.
