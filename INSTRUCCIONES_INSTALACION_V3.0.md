# 🚀 INSTALACIÓN SCRIPT V3.0 - PASO A PASO

## ✅ REQUISITOS IMPLEMENTADOS EN V3.0

✅ Próximo EyM: **60038**  
✅ Próximo OP: **7561**  
✅ Precios desde **CATÁLOGO_PRECIOS_2026** (no hardcodeados)  
✅ Procesar **SOLO aprobados** a OP automáticamente  
✅ Resaltar **amarillo** "Subtotal otros servicios" si tiene datos  
✅ Generar **PDF** por oportunidad/cliente (próxima fase)  
✅ Suma **correcta** de partes con precios del catálogo  
✅ Procesar **respuestas** del formulario automáticamente  
✅ **IVA** en todos (retefuente 4% solo en Odoo si supera $540k)  

---

## 📋 ANTES DE INSTALAR - CHECKLIST

- [ ] ¿Tienes la hoja "CATÁLOGO_PRECIOS_2026" con:
  - Columna A: Nombre del producto
  - Columna B: Precio
  - Columna C: Código Odoo
- [ ] ¿Renombraste las columnas en DIAGNÓSTICOS_2026 según la lista?
- [ ] ¿Eliminaste las columnas N, O, P, R?
- [ ] ¿El siguiente EyM debe ser 60038? ✅ Confirmado
- [ ] ¿El siguiente OP debe ser 7561? ✅ Confirmado

---

## 🔧 INSTALACIÓN (FÁCIL Y SEGURA)

### **PASO 1: Abre el Sheet DIAGNÓSTICOS_2026**

1. Ve a Google Drive
2. Abre "Archivo Diagnosticos y OP 2026"
3. Click en la pestaña "DIAGNÓSTICOS_2026"

### **PASO 2: Abre Apps Script**

1. En el Sheet, ve a: **Extensiones** → **Apps Script**
2. Se abrirá una nueva pestaña

### **PASO 3: Reemplaza el código**

1. Selecciona TODO el código: `Ctrl+A`
2. Borra: `Delete`
3. Ve a tu carpeta de proyecto: `/automation/scripts/SCRIPT_FINAL_EYM_V3.0_DEFINITIVO.gs`
4. Copia TODO el contenido
5. Vuelve a Apps Script
6. Pega: `Ctrl+V`

### **PASO 4: Guarda**

1. `Ctrl+S`
2. Espera 5 segundos

### **PASO 5: Cierra Apps Script**

1. Click en la X (arriba a la derecha)
2. Vuelve al Sheet

### **PASO 6: Instala el Trigger**

1. Espera 30 segundos (el menú se recarga)
2. En el Sheet, busca el menú: **🚀 EYM AUTOMÁTICO V3.0**
3. Haz click en: **🔧 Instalar Trigger**
4. Autoriza cuando pida

**¿Ves el mensaje "✅ TRIGGER AUTOMÁTICO INSTALADO"?** → ¡LISTO! ✅

---

## ✅ PRUEBA RÁPIDA

1. Abre tu **Google Form**
2. Completa UNA respuesta con datos ficticios
3. Envía el formulario
4. Espera 30 segundos
5. Recarga el Sheet "DIAGNÓSTICOS_2026" (F5)
6. ¿Ves una nueva fila procesada? ✅ **¡FUNCIONA!**

---

## 📊 FUNCIONALIDADES DEL MENÚ

### **🚀 EYM AUTOMÁTICO V3.0**

```
📥 Procesar Última Respuesta
   └─ Procesa manualmente la última respuesta del formulario
   
📤 Procesar Aprobados → OP
   └─ Migra SOLO los aprobados a OP automáticamente
   
🔧 Instalar Trigger
   └─ Configura la automatización
   
📊 Cargar Catálogo Precios
   └─ Recarga precios desde CATÁLOGO_PRECIOS_2026
   
🔄 Recalcular Todas las Fórmulas
   └─ Recalcula todos los presupuestos
```

---

## 🎯 FLUJO AHORA

### **TÉCNICO DIAGNÓSTICO**
1. Completa Google Form
2. **Automático**: Script procesa → aparece en DIAGNÓSTICOS_2026
3. Genera número EyM automático (60038, 60039, etc.)

### **GERENTE (APROBACIÓN)**
1. Abre DIAGNÓSTICOS_2026
2. Revisa presupuesto (columna AB)
3. Marca "Aprobado" en columna AE
4. **Automático**: Script crea Orden en OP_2026

### **TÉCNICO REPARACIÓN**
1. Abre OP_2026
2. Ve las órdenes nuevas
3. Ejecuta reparación
4. Marca completada

---

## 🐛 TROUBLESHOOTING

### ❌ El menú no aparece

**Solución**:
- Recarga el Sheet (F5)
- Espera 30 segundos
- Cierra y abre de nuevo

### ❌ Precios no se calculan correctamente

**Solución**:
1. Verifica que CATÁLOGO_PRECIOS_2026 exista
2. Menú → **📊 Cargar Catálogo Precios**
3. Menú → **🔄 Recalcular Todas las Fórmulas**

### ❌ Formulario no procesa automáticamente

**Solución**:
1. Menú → **🔧 Instalar Trigger**
2. Autoriza acceso
3. Prueba con un nuevo formulario

### ❌ Error "Hojas no encontradas"

**Solución**:
- Verifica que los nombres de las hojas sean exactos:
  - DIAGNÓSTICOS_2026
  - OP_2026
  - CATÁLOGO_PRECIOS_2026

---

## 📝 NOTAS IMPORTANTES

### **Sobre EyM**
- Se genera automático si la CONDICION_SILLA es "Nueva"
- Secuencia: 60038, 60039, 60040...
- Formato: Fondo amarillo, texto azul

### **Sobre OP**
- Se genera automático cuando marques "Aprobado" en DIAGNÓSTICOS_2026
- Secuencia: 7561, 7562, 7563...
- Referencia RMA: RMA-{numeroEyM}

### **Sobre Precios**
- Se leen desde CATÁLOGO_PRECIOS_2026
- Si un producto no está en el catálogo, devuelve 0
- Ver logs (Apps Script) para diagnosticar

### **Sobre Resalte Amarillo**
- Columna Y (Subtotal otros servicios) se resalta amarillo
- SOLO si la columna S (OTROS SERVICIOS) tiene datos

---

## 🎬 PRÓXIMO: GENERACIÓN DE PDF

Una vez que Sheets funcione perfecto, agregaremos:
1. Generar PDF por oportunidad/cliente
2. Incluir detalle de cada silla
3. Mostrar presupuesto total
4. Enviar automáticamente a cliente

---

## 📞 ¿PROBLEMAS?

1. Comparte el **error exacto** (cópialo de Apps Script → Ejecuciones)
2. Dime **qué acción hiciste** cuando falló
3. Adjunta **screenshot** del Sheet

---

**VERSIÓN**: 3.0  
**FECHA**: 2026-10-01  
**ESTADO**: ✅ LISTO PARA USAR

---

¿Listo para instalar? Sigue los 6 pasos de "INSTALACIÓN" 🚀
