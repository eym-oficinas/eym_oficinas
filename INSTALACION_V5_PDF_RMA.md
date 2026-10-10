# 🚀 INSTALACIÓN SCRIPT V5.0 - PDF CONSOLIDADO + RMA POR OPORTUNIDAD

## ¿QUÉ INCLUYE LA V5?

✅ **Procesamiento automático de diagnósticos** (de Respuestas → DIAGNÓSTICOS_2026)  
✅ **Cálculo automático de presupuestos** (deduplicación + precios catálogo)  
✅ **NUEVO: PDF consolidado** (agrupado por silla, solo subtotales)  
✅ **NUEVO: RMA consolidada** (cuando terminas la oportunidad)  
✅ **NUEVO: Link directo a RMA** (en columna AC con hipervínculo)  
✅ **NUEVO: Botón "Finalizar Oportunidad"** (dispara todo automáticamente)  

---

## 📊 FLUJO NUEVO EN V5

```
Diagnóstico 1 → DIAGNÓSTICOS_2026 ✅
Diagnóstico 2 → DIAGNÓSTICOS_2026 ✅
Diagnóstico 3 → DIAGNÓSTICOS_2026 ✅
Diagnóstico 4 → DIAGNÓSTICOS_2026 ✅
        ↓ (Sillas completas de una oportunidad)
Usuario: Menú → "✅ Finalizar Oportunidad"
        ↓ (Ingresa nombre: "Oportunidad-Cliente")
        ↓
SISTEMA GENERA:
1. PDF consolidado (agrupado por silla)
2. RMA en Odoo (con todos los productos)
3. Link en AC (para todas las sillas)
        ↓
✅ TERMINADO - Listo para facturar
```

---

## 📋 PASOS DE INSTALACIÓN

### PASO 1: Reemplazar Script en Google Apps Script

1. Abre **DIAGNÓSTICOS_2026**
2. **Extensiones** → **Apps Script**
3. Selecciona TODO (Ctrl+A) y borra
4. Copia contenido de: `automation/scripts/SCRIPT_V5_PDF_RMA.gs`
5. Pégalo completo
6. **Guarda** (Ctrl+S)
7. Cierra

### PASO 2: Instalar Trigger

1. Regresa a **DIAGNÓSTICOS_2026**
2. Menú **🚀 EYM v5.0** → **🔧 Instalar Trigger**
3. Autoriza si pide
4. Verás: ✅ TRIGGER AUTOMÁTICO INSTALADO

---

## 🎁 NUEVO MENÚ V5

En la hoja DIAGNÓSTICOS_2026, ahora ves:

```
🚀 EYM v5.0
├─ 📥 Procesar Manualmente
├─ 🔧 Instalar Trigger
├─ ═══════════════════
├─ ✅ Finalizar Oportunidad ← NUEVO
└─ 🔄 Recalcular Todo
```

---

## 📄 CÓMO GENERAR PDF + RMA

### Escenario:
Tienes 4 sillas de la misma oportunidad/cliente diagnosticadas:

```
OPORTUNIDAD: "Reparación Hotel Central"
CLIENTE: "Hotel Central SAS"

Silla 1-1 (Secretarial)
Silla 1-2 (Secretarial)
Silla 2-1 (Gerencial)
Silla 2-2 (Gerencial)
```

### Proceso:

1. **Cada silla se diagnostica independientemente**
   - Ingresa componentes, tapicería, servicios
   - El sistema calcula precios automáticamente

2. **Cuando todas están listas, haz clic en:**
   ```
   Menú 🚀 EYM v5.0 → ✅ Finalizar Oportunidad
   ```

3. **Sistema pide:** "Ingresa el NOMBRE DE LA OPORTUNIDAD"
   ```
   Ingreso: "Reparación Hotel Central"
   ```

4. **Sistema automáticamente:**
   - Busca TODOS los diagnósticos de esa oportunidad
   - Agrupa por silla (1-1, 1-2, 2-1, 2-2)
   - Genera PDF con estructura:
     ```
     SILLA 1-1 - Secretarial
       PARTES: $80,000
       TAPICERÍA: $120,000
       OTROS SERVICIOS: $25,000
     TOTAL SILLA 1-1: $225,000
     
     SILLA 1-2 - Secretarial
       PARTES: $60,000
       TAPICERÍA: $100,000
       OTROS SERVICIOS: $20,000
     TOTAL SILLA 1-2: $180,000
     
     SILLA 2-1 - Gerencial
     ...
     
     TOTAL GENERAL: $XXX,XXX
     ```
   - Crea RMA en Odoo
   - Adjunta PDF a RMA
   - Escribe RMA con link en columna AC

5. **Resultado:**
   ```
   AC: RMA-12345 (azul, clickeable)
       └─ 1 clic abre RMA en Odoo
   ```

---

## 📊 ESTRUCTURA DEL PDF

El PDF generado contiene:

```
╔═══════════════════════════════════════╗
║        EYM OFICINAS                   ║
║  COTIZACIÓN DE REPARACIÓN             ║
╚═══════════════════════════════════════╝

Oportunidad: Reparación Hotel Central
Cliente: Hotel Central SAS
Fecha: 2026-10-02

═══════════════════════════════════════

SILLA 1-1 - Secretarial
  PARTES: $80,000
  TAPICERÍA: $120,000
  OTROS SERVICIOS: $25,000
TOTAL SILLA 1-1: $225,000

SILLA 1-2 - Secretarial
  PARTES: $60,000
  TAPICERÍA: $100,000
  OTROS SERVICIOS: $20,000
TOTAL SILLA 1-2: $180,000

═══════════════════════════════════════

TOTAL GENERAL: $405,000

═══════════════════════════════════════

Nota: El valor total antes de impuestos 
(IVA 19% y Retefuente según aplique) 
se detallará en la RMA oficial.
```

---

## 💰 IMPUESTOS EN ODOO

El script **NO calcula impuestos** (lo hace Odoo):

✅ En Odoo, cuando se abre la RMA, agrega:
- **IVA 19%** (siempre)
- **Retefuente 4%** (si total >= $550,000)

El PDF solo muestra el subtotal antes de impuestos.

---

## 🔍 ¿QUÉ PASA CON CADA COLUMNA?

| Columna | Antes | Después |
|---------|-------|---------|
| AA | (vacío) | (vacío) - No se usa en V5 |
| AB | Fecha aprobación | (vacío) - No se llena en V5 |
| AC | (vacío) | **RMA-XXXX con link** ← NUEVO |
| AD | (vacío) | (vacío) |

**Importante:** La V5 no usa las columnas AA/AB para aprobar.  
Solo usa el botón **"✅ Finalizar Oportunidad"**.

---

## ⚙️ CONFIGURACIÓN NECESARIA EN ODOO

Verifica que tu Odoo v14 tenga:

```
✅ Módulo RMA instalado
   Aplicaciones → Buscar "RMA" → Instalar
   
✅ Cliente/Contacto existe
   Contactos → Nombre del cliente
   
✅ Productos configurados
   Inventario → Productos
   
✅ API XML-RPC activa
   Configuración → NO desactivar
```

---

## 🚨 TROUBLESHOOTING

### Problema: "No se encontraron diagnósticos"

**Causa:** El nombre de oportunidad no coincide exactamente

**Solución:**
1. Copia el nombre EXACTAMENTE de columna B (NOMBRE_OPORTUNIDAD)
2. Pega en el diálogo
3. Ejemplo: "Oportunidad-001" (con guión exacto)

### Problema: PDF se genera pero RMA no aparece en Odoo

**Causa:** Problema de conexión XML-RPC

**Solución:**
1. Abre Google Apps Script (Extensiones → Apps Script)
2. Ve a **Ejecuciones** (reloj)
3. Expande los **LOGS**
4. Busca líneas con `❌ Error`
5. Verifica:
   - ¿Odoo está en línea?
   - ¿URL correcta?
   - ¿Módulo RMA instalado?

### Problema: "Error: No se pudieron obtener credenciales"

**Causa:** Credenciales de Odoo incorrectas en el script

**Solución:**
1. Abre el script (Apps Script)
2. Busca `obtenerCredencialesOdoo()`
3. Verifica:
   ```javascript
   url: "https://eym-oficinas.ovh/web"
   username: "eymclaude@eym-oficinas.com"
   password: "Camilo1973*"
   database: "eym_oficinas"
   ```
4. Si algo es incorrecto, actualiza

---

## 📝 CAMBIOS V4 → V5

| Aspecto | V4 | V5 |
|---------|----|----|
| Generar PDF | ❌ | ✅ NUEVO |
| RMA al aprobar | ✅ | ❌ (ahora al finalizar) |
| Consolidar sillas | ❌ | ✅ NUEVO |
| Botón Finalizar | ❌ | ✅ NUEVO |
| Requiere "Aprobado" | ✅ | ❌ |
| Requiere "Fin" | ❌ | ❌ |

---

## 🎯 RESUMEN FLUJO V5

```
1. DIAGNOSTICAR
   └─ Ingresa componentes, tapicería, servicios
   └─ Sistema calcula automáticamente
   └─ Presupuesto listo

2. REPETIR PARA TODAS LAS SILLAS
   └─ Silla 1-1 ✓
   └─ Silla 1-2 ✓
   └─ Silla 2-1 ✓
   └─ Silla 2-2 ✓

3. FINALIZAR OPORTUNIDAD
   └─ Menú → "✅ Finalizar Oportunidad"
   └─ Ingresa nombre de oportunidad
   └─ ENTER

4. SISTEMA AUTOMÁTICO
   └─ Genera PDF (consolidado por silla)
   └─ Crea RMA en Odoo
   └─ Adjunta PDF
   └─ Escribe RMA en AC (con link)

5. LISTO
   └─ Abre Odoo
   └─ Haz clic en RMA (desde AC)
   └─ Confirma reparación
   └─ Genera factura
```

---

## ✨ VENTAJAS V5

1. **100% automático** - No hay clicks manuales en Odoo
2. **PDF consolidado** - Una cotización por oportunidad, no 4
3. **Link directo** - 1 clic abre RMA en Odoo
4. **Audit trail** - PDF guardado en Google Drive con timestamps
5. **Escalable** - 10 sillas, 50 sillas, mismo proceso

---

## 🆘 SOPORTE

Si algo no funciona:

1. **Abre Apps Script**
2. **Ejecuciones** → Última ejecución
3. **Expande LOGS**
4. **Busca líneas con `❌` o `⚠️`**
5. **Toma screenshot**
6. **Comparte conmigo**

---

## 🎉 ¡LISTO!

La V5 está optimizada para tu flujo completo:
- Diagnóstico rápido (1 silla a la vez)
- PDF cuando todas están listas
- RMA automática en Odoo
- Seguimiento en tiempo real

¿Dudas? Estoy aquí. 🚀
