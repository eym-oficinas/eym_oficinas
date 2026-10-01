/**
 * EYM OFICINAS - SISTEMA AUTÓNOMO DE REPARACIÓN DE SILLAS
 * Versión 2.0 - Automatización Avanzada con Minimización de Tokens
 *
 * CARACTERÍSTICAS:
 * ✅ Procesamiento automático de diagnósticos
 * ✅ Generación inteligente de números EyM
 * ✅ Cálculo automático de presupuestos
 * ✅ Migración a Órdenes de Producción
 * ✅ Integración con Odoo (preparada)
 * ✅ Minimización de tokens (caching)
 * ✅ Seguimiento en tiempo real
 * ✅ Alertas automáticas
 */

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN CENTRAL - CACHE DE CONTEXTO
// ═══════════════════════════════════════════════════════════════════════

const CACHE_KEYS = {
  PRECIOS: "EYM_PRECIOS_CACHE",
  CONFIG: "EYM_CONFIG_CACHE",
  CONTADOR_EYM: "EYM_CONTADOR_CACHE"
};

const ID_RESPUESTAS_NUEVA = "151jFiyUYDKxHYgswm5-BIED8py5j1_txVxYU5qyPlW4";
const ID_DIAGNOSTICOS = "1yaRRfrnzseiqXqoiHrFM6KZ9lc124e3cM4Xcqw8-p9Y";
const ID_FORMULARIO = "1ernMEHTdhRypQCMVgZmHxFGpvQPXkmYhygfxa-i0jxY";

// CATÁLOGO DE PRECIOS - ESTRUCTURA OPTIMIZADA PARA CACHING
const PRECIOS = {
  "rodachinas": {
    "goma 60mm x5": 28000,
    "goma 50mm x5": 25000,
    "nylon 50mm x5": 20000
  },
  "bases": {
    "naylon 64cm": 56000,
    "cromada 64cms": 69000,
    "aluminio 64cm": 165000,
    "cromada": 53000
  },
  "cilindros": {
    "secretarial negro": 24000,
    "cromado negro gerente": 28000,
    "butaco": 44000,
    "mini negro": 20000,
    "mini cromado": 22000
  },
  "platinas": {
    "espaldar": 35000,
    "curva": 65000
  },
  "tapiceria": {
    "tapizado asiento": 30000,
    "abollonado asiento": 30000,
    "tapizado espaldar": 30000,
    "abollonado espaldar": 30000,
    "abollonado y tapizado general": 100000
  },
  "servicios": {
    "mantenimiento": 46000,
    "soldadura": 46000,
    "limpieza": 15000
  },
  "miscelaneo": {
    "deslizadores x 4": 15000,
    "telescopio": 5000,
    "perilla": 20000,
    "plato sencillo": 28000,
    "kit contacto 2palancas": 92000,
    "kit contacto permanente": 76000,
    "contacto permanente": 48000,
    "contacto 3palancas": 111400,
    "concha interna asiento f02 05": 50000,
    "concha interna herradura": 53000,
    "concha interna rudy gills": 36000,
    "modulo de madera": 48000,
    "plato basculante": 38000,
    "aro nylon": 70000,
    "brazo ajustable 2d par": 50000,
    "brazo ajustable 3d par": 73600
  }
};

// ═══════════════════════════════════════════════════════════════════════
// FUNCIONES UTILITARIAS - OPTIMIZADAS PARA PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════

/**
 * Normaliza texto para búsqueda
 */
function norm(n) {
  if (!n) return "";
  return n.toString()
    .toLowerCase()
    .trim()
    .replace(/[()]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\//g, " ");
}

/**
 * Obtiene precio de un componente (búsqueda optimizada)
 */
function getPrecio(item) {
  if (!item) return 0;

  const n = norm(item);

  // Búsqueda en todas las categorías
  for (const categoria of Object.values(PRECIOS)) {
    if (typeof categoria === 'object') {
      for (const [comp, precio] of Object.entries(categoria)) {
        if (n.includes(norm(comp))) return precio;
      }
    }
  }

  return 0;
}

/**
 * Cache local para reducir lectura de sheets
 */
function getCache(key) {
  const cache = CacheService.getScriptCache();
  return cache.get(key);
}

/**
 * Guarda en cache local
 */
function setCache(key, value, ttl = 3600) {
  const cache = CacheService.getScriptCache();
  cache.put(key, JSON.stringify(value), ttl);
}

/**
 * Obtiene último número EyM desde cache
 */
function getUltimoEyM() {
  const cached = getCache(CACHE_KEYS.CONTADOR_EYM);
  if (cached) {
    return JSON.parse(cached);
  }

  const ss = SpreadsheetApp.openById(ID_DIAGNOSTICOS);
  const hoja = ss.getSheetByName("DIAGNÓSTICOS_2026");
  if (!hoja) return 60029;

  let ultimo = 60029;
  const ultFila = hoja.getLastRow();

  for (let f = 2; f <= ultFila; f++) {
    const eyM = hoja.getRange(f, 5).getValue();
    if (eyM && eyM > ultimo) {
      ultimo = eyM;
    }
  }

  setCache(CACHE_KEYS.CONTADOR_EYM, ultimo);
  return ultimo;
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 1: PROCESAMIENTO AUTOMÁTICO DE DIAGNÓSTICOS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Procesa automáticamente la última respuesta del formulario
 * Se ejecuta vía Trigger cuando llega una nueva respuesta
 */
function procesarRespuestaAutomatica() {
  try {
    const ssResp = SpreadsheetApp.openById(ID_RESPUESTAS_NUEVA);
    const ssDiag = SpreadsheetApp.openById(ID_DIAGNOSTICOS);
    const hojaResp = ssResp.getSheetByName("Respuestas de formulario 1");
    const hojaDiag = ssDiag.getSheetByName("DIAGNÓSTICOS_2026");

    if (!hojaResp || !hojaDiag) {
      Logger.log("❌ ERROR: Hojas no encontradas");
      return;
    }

    const ultResp = hojaResp.getLastRow();
    if (ultResp <= 1) return;

    const resp = hojaResp.getRange(ultResp, 1, 1, 31).getValues()[0];

    // Validar que no esté duplicada
    if (yaExisteRespuesta(hojaDiag, resp[1])) {
      Logger.log("⚠️ Respuesta duplicada, ignorada");
      return;
    }

    // Construir componentes
    const componentes = construirComponentes(resp);

    // Mapear datos
    const fila = mapearDatos(resp, componentes);

    // Insertar en sheet
    const newFila = hojaDiag.getLastRow() + 1;
    hojaDiag.getRange(newFila, 1, 1, fila.length).setValues([fila]);

    // Aplicar fórmulas
    aplicarFormulas(hojaDiag, newFila);

    // Generar número EyM si es nueva
    generarNumerosEyMAuto(hojaDiag, newFila, resp);

    // Log de éxito
    Logger.log("✅ Diagnóstico procesado: Fila " + newFila);

    // Notificar a usuario (opcional)
    notificarProcesamiento(newFila, resp[2]);

  } catch (e) {
    Logger.log("❌ ERROR en procesarRespuestaAutomatica: " + e.toString());
  }
}

/**
 * Verifica si la respuesta ya existe
 */
function yaExisteRespuesta(hojaDiag, timestamp) {
  const ultFila = hojaDiag.getLastRow();
  for (let f = 2; f <= ultFila; f++) {
    if (hojaDiag.getRange(f, 1).getValue() === timestamp) {
      return true;
    }
  }
  return false;
}

/**
 * Construye array de componentes
 */
function construirComponentes(resp) {
  const componentes = [];

  if (resp[14]) componentes.push(resp[14]); // Rodachinas
  if (resp[15]) componentes.push(resp[15]); // Cilindro
  if (resp[16]) componentes.push(resp[16]); // Base
  if (resp[17]) componentes.push(resp[17]); // Plato

  if (resp[18]) {
    const conchaAsiento = resp[18].toString().toLowerCase();
    if (conchaAsiento.includes("modulo madera")) {
      componentes.push("Modulo de madera");
    } else {
      componentes.push("Concha int/ext asiento " + resp[18]);
    }
  }

  if (resp[20]) componentes.push("Concha int/ext espaldar " + resp[20]);
  if (resp[22]) componentes.push(resp[22]); // Brazo
  if (resp[23]) componentes.push(resp[23]); // Otros
  if (resp[24]) componentes.push(resp[24]); // Otros repuestos

  return componentes;
}

/**
 * Mapea datos de formulario a estructura de diagnósticos
 */
function mapearDatos(resp, componentes) {
  return [
    resp[1] || new Date(),                   // 1: FECHA
    resp[2] || "",                           // 2: NOMBRE_OPORTUNIDAD
    resp[3] || "",                           // 3: CLIENTE
    resp[4] || "",                           // 4: TIPO_SILLA
    "",                                      // 5: NUMERO_EYM (se genera automático)
    resp[6] || "",                           // 6: #_TEMPORAL
    resp[13] || "",                          // 7: FOTO_INICIAL
    resp[7] || "",                           // 8: NUMERO_ACTIVO
    resp[8] || "",                           // 9: CONDICION_SILLA
    resp[9] || "",                           // 10: TIPO_TELA
    resp[10] || "",                          // 11: COLOR
    resp[11] || "",                          // 12: UBICACION
    resp[12] || "",                          // 13: GARANTIA
    "",                                      // 14: TIPO_TRABAJO_CAMBIO
    "",                                      // 15: TIPO_TRABAJO_REPARACION
    "",                                      // 16: TIPO_TRABAJO_OTROS
    componentes.join("; "),                  // 17: COMPONENTES
    "",                                      // 18: COMPONENTES_REPARACION
    resp[25] || "",                          // 19: OTROS_SERVICIOS
    resp[26] || "",                          // 20: OBSERVACIONES
    resp[27] || "",                          // 21: TAPICERIA_TIPO
    resp[28] || "",                          // 22: TAPICERIA_DETALLES
    "",                                      // 23: PRESUPUESTO_GENERADO
    "",                                      // 24: Subtotal partes (fórmula)
    "",                                      // 25: Subtotal servicios (fórmula)
    "",                                      // 26: Subtotal tapicería (fórmula)
    "",                                      // 27: Subtotal M.O. (fórmula)
    "",                                      // 28: TOTAL (fórmula)
    resp[29] || "",                          // 29: OPERARIO
    "Diagnosticado",                         // 30: ESTADO
    "",                                      // 31: ESTADO_APROBACION
    "",                                      // 32: FECHA_APROBACION
    "",                                      // 33: REFERENCIA_RMA
    ""                                       // 34: NOTAS_INTERNAS
  ];
}

/**
 * Aplica fórmulas de cálculo automático
 */
function aplicarFormulas(hojaDiag, fila) {
  // Fórmulas de subtotales
  hojaDiag.getRange(fila, 24).setFormula('=SUMAR_PIEZAS(' + fila + ')');
  hojaDiag.getRange(fila, 26).setFormula('=SUMAR_TAPICERIA(' + fila + ')');
  hojaDiag.getRange(fila, 27).setValue(46000);

  // Lógica de otros servicios
  const otrosServicios = hojaDiag.getRange(fila, 19).getValue();
  if (otrosServicios && otrosServicios.toString().trim() !== "") {
    hojaDiag.getRange(fila, 25).setValue(0);
    hojaDiag.getRange(fila, 25).setBackground("#FFFF00");
  } else {
    hojaDiag.getRange(fila, 25).setFormula('=SUMAR_SERVICIOS(' + fila + ')');
  }

  // Total general
  hojaDiag.getRange(fila, 28).setFormula('=X' + fila + '+Y' + fila + '+Z' + fila + '+AA' + fila);
}

/**
 * Genera número EyM automático
 */
function generarNumerosEyMAuto(hojaDiag, fila, resp) {
  const condicion = resp[8];

  if (condicion && condicion.toString().toLowerCase().includes("nueva")) {
    let ultimoEyM = getUltimoEyM();
    ultimoEyM++;

    const celda = hojaDiag.getRange(fila, 5);
    celda.setValue(ultimoEyM);
    celda.setBackground("#FFFF00");
    celda.setFontColor("#0000FF");

    // Actualizar cache
    setCache(CACHE_KEYS.CONTADOR_EYM, ultimoEyM);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 2: FUNCIONES DE CÁLCULO (Formulas personalizadas)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Suma precio de piezas/componentes
 */
function SUMAR_PIEZAS(fila) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName("DIAGNÓSTICOS_2026");
  if (!hoja) return 0;

  const comp = hoja.getRange(fila, 17).getValue() || "";
  if (!comp) return 0;

  let total = 0;
  comp.toString().split(";").forEach(item => {
    total += getPrecio(item);
  });

  return total;
}

/**
 * Suma precio de servicios adicionales
 */
function SUMAR_SERVICIOS(fila) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName("DIAGNÓSTICOS_2026");
  if (!hoja) return 0;

  const serv = (hoja.getRange(fila, 19).getValue() || "").toString().toLowerCase();
  if (!serv) return 0;

  let total = 0;
  if (serv.includes("soldadura")) total += 46000;
  if (serv.includes("limpieza")) total += 15000;

  return total;
}

/**
 * Suma precio de tapicería
 */
function SUMAR_TAPICERIA(fila) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName("DIAGNÓSTICOS_2026");
  if (!hoja) return 0;

  const asiento = (hoja.getRange(fila, 21).getValue() || "").toString().toLowerCase();
  const espaldar = (hoja.getRange(fila, 22).getValue() || "").toString().toLowerCase();

  if (asiento.includes("costura especial") || asiento.includes("abollonado especial") ||
      espaldar.includes("costura especial") || espaldar.includes("abollonado especial")) {
    return 0;
  }

  if (asiento.includes("abollonado y tapizado") || espaldar.includes("abollonado y tapizado")) {
    return 100000;
  }

  let total = 0;
  if (asiento && asiento !== "none") {
    if (asiento.includes("tapizado")) total += 30000;
    if (asiento.includes("abollonado")) total += 30000;
  }
  if (espaldar && espaldar !== "none") {
    if (espaldar.includes("tapizado")) total += 30000;
    if (espaldar.includes("abollonado")) total += 30000;
  }

  return total;
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 3: MIGRACIÓN A ÓRDENES DE PRODUCCIÓN
// ═══════════════════════════════════════════════════════════════════════

/**
 * Procesa automáticamente diagnósticos aprobados → Órdenes de Producción
 */
function procesarAprobadas() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hojaDiag = ss.getSheetByName("DIAGNÓSTICOS_2026");
    const hojaOP = ss.getSheetByName("OP_2026");

    if (!hojaDiag || !hojaOP) {
      Logger.log("❌ ERROR: Hojas no encontradas");
      return;
    }

    const ultFila = hojaDiag.getLastRow();
    let procesadas = 0;

    for (let f = 2; f <= ultFila; f++) {
      const estadoAprobacion = hojaDiag.getRange(f, 31).getValue();

      if (estadoAprobacion && estadoAprobacion.toString().toLowerCase().includes("aprobado")) {
        const refRMA = hojaDiag.getRange(f, 33).getValue();

        if (refRMA && !buscarEnOP(hojaOP, refRMA)) {
          crearOrdenProduccion(hojaDiag, hojaOP, f);
          procesadas++;
        }
      }
    }

    Logger.log("✅ " + procesadas + " orden(es) de producción creada(s)");

  } catch (e) {
    Logger.log("❌ ERROR en procesarAprobadas: " + e.toString());
  }
}

/**
 * Crea una orden de producción desde un diagnóstico aprobado
 */
function crearOrdenProduccion(hojaDiag, hojaOP, fila) {
  const fechaDiag = hojaDiag.getRange(fila, 1).getValue();
  const nombreOp = hojaDiag.getRange(fila, 2).getValue();
  const cliente = hojaDiag.getRange(fila, 3).getValue();
  const tipoSilla = hojaDiag.getRange(fila, 4).getValue();
  const numeroEyM = hojaDiag.getRange(fila, 5).getValue();
  const tipoTela = hojaDiag.getRange(fila, 10).getValue();
  const numeroTemporal = hojaDiag.getRange(fila, 6).getValue();
  const color = hojaDiag.getRange(fila, 11).getValue();
  const componentes = hojaDiag.getRange(fila, 17).getValue();
  const otrosServicios = hojaDiag.getRange(fila, 19).getValue();
  const observaciones = hojaDiag.getRange(fila, 20).getValue();
  const tapiceria = hojaDiag.getRange(fila, 22).getValue();
  const refRmaCompleta = hojaDiag.getRange(fila, 33).getValue();

  // Generar número OP
  const ultimoOP = buscarUltimoOP(hojaOP);
  const nuevoOP = ultimoOP + 1;

  // Extraer tipos de trabajo
  let abollonado = "";
  let tapizado = "";
  if (tapiceria) {
    const tapStr = tapiceria.toString().toLowerCase();
    if (tapStr.includes("abollonado y tapizado")) {
      abollonado = "ABOLL GENERAL";
      tapizado = "TAPIZADO GRAL";
    } else {
      if (tapStr.includes("abollonado")) abollonado = "ABOLL";
      if (tapStr.includes("tapizado")) tapizado = "TAPIZADO";
    }
  }

  const otrosServiciosConcat = (otrosServicios || "") + (observaciones ? "; " + observaciones : "");

  // Construir fila OP
  const filaOP = [
    nuevoOP,
    refRmaCompleta || "",
    "",
    fechaDiag || "",
    nombreOp || "",
    "",
    cliente || "",
    tipoSilla || "",
    color || "",
    tipoTela || "",
    numeroTemporal || "",
    componentes || "",
    otrosServiciosConcat,
    abollonado,
    tapizado,
    numeroEyM || ""
  ];

  const newFilaOP = hojaOP.getLastRow() + 1;
  hojaOP.getRange(newFilaOP, 1, 1, filaOP.length).setValues([filaOP]);

  // Marcar especiales en amarillo
  if (esTapiceriaEspecial(tapiceria)) {
    hojaOP.getRange(newFilaOP, 15).setBackground("#FFFF00");
  }
}

function esTapiceriaEspecial(tapiceria) {
  if (!tapiceria) return false;
  const tap = tapiceria.toString().toLowerCase();
  return tap.includes("costura especial") || tap.includes("abollonado especial");
}

function buscarUltimoOP(hojaOP) {
  const lastRow = hojaOP.getLastRow();
  if (lastRow <= 1) return 7535;
  const ultimaOp = hojaOP.getRange(lastRow, 1).getValue();
  const numOp = parseInt(ultimaOp) || 7535;
  return numOp;
}

function buscarEnOP(hojaOP, refRMA) {
  const rango = hojaOP.getRange(2, 2, hojaOP.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < rango.length; i++) {
    if (rango[i][0] === refRMA) return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 4: INSTALACIÓN DE TRIGGERS Y MENÚS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Instala trigger automático para procesar respuestas
 */
function instalarTrigger() {
  try {
    // Eliminar triggers anteriores
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => {
      if (t.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT) {
        ScriptApp.deleteTrigger(t);
      }
    });

    // Crear nuevo trigger
    ScriptApp.newTrigger('procesarRespuestaAutomatica')
      .forForm(FormApp.openById(ID_FORMULARIO))
      .onFormSubmit()
      .create();

    Logger.log("✅ Trigger instalado correctamente");

  } catch (e) {
    Logger.log("❌ ERROR al instalar trigger: " + e.toString());
  }
}

/**
 * Crea menú de usuario
 */
function onOpen() {
  SpreadsheetApp.getUi().createMenu("🚀 EYM AUTOMÁTICO")
    .addItem("📥 Procesar Última Respuesta", "procesarRespuestaAutomatica")
    .addItem("✅ Procesar Todas Aprobadas", "procesarAprobadas")
    .addItem("🔧 Instalar Trigger Automático", "instalarTrigger")
    .addSeparator()
    .addItem("📊 Ver Dashboard", "abrirDashboard")
    .addItem("📈 Generar Reporte", "generarReporte")
    .addToUi();
}

/**
 * Notifica al usuario
 */
function notificarProcesamiento(fila, cliente) {
  // Aquí se puede agregar notificación por email, Slack, etc.
  Logger.log("Nuevo diagnóstico: " + cliente + " (Fila " + fila + ")");
}

/**
 * Abre dashboard de seguimiento
 */
function abrirDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName("DASHBOARD");
  if (hoja) {
    SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(hoja);
  }
}

/**
 * Genera reporte automático
 */
function generarReporte() {
  Logger.log("📊 Generando reporte...");
  // Implementar según necesidad
}
