# 🚀 INSTALACIÓN SCRIPT V4 - CON INTEGRACIÓN ODOO

## ¿QUÉ INCLUYE LA V4?

✅ **Procesamiento automático de diagnósticos** (de Respuestas de formulario a DIAGNÓSTICOS_2026)  
✅ **Cálculo automático de presupuestos** con deduplicación y precios del catálogo  
✅ **Asignación de EYM al aprobar** (no antes)  
✅ **Creación automática de OP** (Órdenes de Producción)  
✅ **NUEVO: Integración Odoo - Crear RMA automáticamente**  
✅ **NUEVO: Link directo a RMA en columna AC**  

---

## 📋 PASOS DE INSTALACIÓN

### PASO 1: Copiar el Script

1. Abre la hoja **DIAGNÓSTICOS_2026**
2. Ve a **Extensiones** → **Apps Script**
3. Borra TODO el código actual (Ctrl+A, Delete)
4. Copia el contenido de: `/home/user/eym_oficinas/automation/scripts/SCRIPT_V4_CON_ODOO.gs`
5. Pégalo completamente en el editor
6. Guarda (Ctrl+S)
7. Cierra y regresa a la hoja

### PASO 2: Instalar Trigger Automático

1. En la hoja DIAGNÓSTICOS_2026, aparecerá un menú: **🚀 EYM v4.0**
2. Haz clic en **🔧 Instalar Trigger**
3. Autoriza acceso cuando sea necesario
4. Verás el mensaje: ✅ TRIGGER AUTOMÁTICO INSTALADO

---

## 🔐 VERIFICAR CREDENCIALES ODOO

El script contiene las credenciales hardcoded (temporal):
```
url: "https://eym-oficinas.ovh/web"
username: "eymclaude@eym-oficinas.com"
password: "Camilo1973*"
database: "eym_oficinas"
```

**⚠️ IMPORTANTE:** 
- Estas credenciales están en el .env del repositorio (no las copies a Google)
- En producción, usar OAuth en lugar de credenciales hardcoded
- El script usa XML-RPC de Odoo (puerto 8069)

---

## ✅ VERIFICAR CONFIGURACIÓN EN ODOO

Para que la integración funcione, verifica en tu Odoo v14:

### 1. Módulo RMA Instalado
```
Aplicaciones → Buscar "RMA" → Instalar si no está
```

### 2. Cliente/Contacto Existe
```
Contactos → Verificar que el cliente existe
```

### 3. Productos Configurados
```
Inventario → Productos → Verificar que tus productos existen
Cada producto debe tener:
  - Nombre
  - Código interno (opcional, pero recomendado)
  - Precio
```

### 4. API XML-RPC Habilitada
```
Configuración → Técnico → NO desactivar API XML-RPC
```

---

## 🔄 FLUJO COMPLETO CON ODOO

```
1. Formulario → Nueva respuesta
           ↓
2. Trigger automático → Procesa en DIAGNÓSTICOS_2026
           ↓
3. Usuario escribe "Aprobado" en columna AE
           ↓
4. onEdit() dispara:
   a) Asigna EYM (si está vacío)
   b) Rellena fecha de aprobación (AB)
   c) ✅ CREA RMA EN ODOO (NUEVO)
   d) Escribe número RMA en AC con LINK
   e) Crea OP automáticamente
```

---

## 📊 NUEVO: COLUMNA AC - RMA CON LINK

Cuando se aprueba un diagnóstico:

**Antes:**
- AC estaba vacío

**Ahora:**
- AC contiene: `RMA-12345` (azul, subrayado)
- Es un hipervínculo directo a: `https://eym-oficinas.ovh/web#id=12345&model=rma.rma&view_type=form`
- 1 clic = abre la RMA en Odoo directamente

---

## 🔍 SOLUCIONAR PROBLEMAS

### Problema: "❌ Error creando RMA en Odoo"

**Causas posibles:**
1. ❌ Odoo no está en línea → Verificar URL
2. ❌ Credenciales incorrectas → Verificar usuario/contraseña
3. ❌ Cliente no existe en Odoo → El script intenta crear uno, pero puede fallar
4. ❌ Módulo RMA no instalado → Instalar desde Aplicaciones

**Solución:**
1. Abre Google Apps Script (Extensiones → Apps Script)
2. Haz clic en ▶️ Ejecutar función → `crearRMAenOdoo`
3. Revisa los LOGS en Ejecuciones (habrá mensajes de error)
4. Ajusta según el error

### Problema: "RMA creada pero no aparece en Odoo"

**Causa:** La RMA se crea en "borrador" (state: draft)

**Solución:**
1. Ve a Odoo → RMA
2. Filtra por estado "Borrador"
3. Abre la RMA y haz clic en "Confirmar"
4. El número RMA se asignará automáticamente

### Problema: El link en AC no funciona

**Causa:** El ID de la RMA en Odoo no coincide con el número mostrado

**Solución:**
1. Abre la RMA directamente en Odoo
2. Mira la URL: `/web#id=XXXX&model=rma.rma`
3. Ese es el número que debe estar en AC
4. Si no coincide, es un problema de sincronización

---

## 📝 CAMBIOS DE LA V4 vs V3

| Aspecto | V3 | V4 |
|--------|----|----|
| Procesar diagnósticos | ✅ | ✅ |
| Crear OP al aprobar | ✅ | ✅ |
| Crear RMA en Odoo | ❌ | ✅ NUEVO |
| Link a RMA en AC | ❌ | ✅ NUEVO |
| Consolidar productos | ❌ | ✅ NUEVO |
| Búsqueda de códigos Odoo | ❌ | ✅ NUEVO |

---

## 🎯 PRÓXIMOS PASOS

Después de verificar que V4 funciona:

### Fase 2: Generar PDF automático
```
- PDF con datos del diagnóstico
- Agrupado por cliente/oportunidad
- Adjunto automático a la RMA en Odoo
```

### Fase 3: Notificaciones Gmail
```
- Alertas cuando se aprueba un diagnóstico
- Notificación cuando RMA se crea
- Resumen diario de órdenes en proceso
```

### Fase 4: Sincronización bidireccional
```
- Leer estado de RMA desde Odoo
- Actualizar estado en SEGUIMIENTO
- Generar factura automáticamente
```

---

## 🆘 SOPORTE RÁPIDO

Si algo no funciona:

1. **Abre Apps Script** (Extensiones → Apps Script)
2. **Ve a Ejecuciones** (reloj) → Última ejecución
3. **Lee los LOGS** (expandir líneas)
4. **Busca líneas con:**
   - `❌ Error` → Hay un error
   - `✅ Éxito` → Todo funcionó
   - `⚠️ Advertencia` → Algo raro pero no crítico

4. **Toma captura de pantalla del error**
5. **Comparte conmigo**

---

## ✨ RESUMEN

**Antes de V4:** Tenías que hacer clic en Odoo para crear RMA manualmente  
**Ahora con V4:** RMA se crea automáticamente al aprobar, con link directo en la hoja  
**Resultado:** Proceso 100% automático de diagnóstico → presupuesto → RMA → Factura (próximo)

¡Listo para continuar con PDF y notificaciones! 🎉
