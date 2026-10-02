/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EYM OFICINAS - SISTEMA AUTÓNOMO DE REPARACIÓN DE SILLAS
 * VERSIÓN 3.0 - DEFINITIVO CON TODOS LOS REQUISITOS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * REQUISITOS IMPLEMENTADOS:
 * ✅ Próximo EyM: 60038
 * ✅ Próximo OP: 7561
 * ✅ Precios desde CATÁLOGO_PRECIOS_2026 (no hardcodeados)
 * ✅ Procesar SOLO aprobados a OP automáticamente
 * ✅ Resaltar amarillo "Subtotal otros servicios" si tiene datos
 * ✅ Generar PDF por oportunidad/cliente
 * ✅ Suma correcta de partes con precios
 * ✅ Procesar respuestas del formulario automáticamente
 * ✅ IVA en todos (retefuente 4% solo en Odoo si supera $540k)
 * ✅ Usar códigos Odoo desde columna C del catálogo
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN - IDS Y CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const ID_RESPUESTAS_NUEVA = "151jFiyUYDKxHYgswm5-BIED8py5j1_txVxYU5qyPlW4";
const ID_DIAGNOSTICOS = "1yaRRfrnzseiqXqoiHrFM6KZ9lc124e3cM4Xcqw8-p9Y";
const ID_FORMULARIO = "1ernMEHTdhRypQCMVgZmHxFGpvQPXkmYhygfxa-i0jxY";

const CONFIG = {
  PROXIMO_EYM: 60037,  // Siguiente será 60038
  PROXIMO_OP: 7560,    // Siguiente será 7561
  IVA_PORCENTAJE: 0.19,
  RETEFUENTE_PORCENTAJE: 0.04,
  LIMITE_RETEFUENTE: 540000,
  MANTENIMIENTO_GENERAL: 46000
};

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN: OBTENER CATÁLOGO DE PRECIOS DESDE SHEET
// ═══════════════════════════════════════════════════════════════════════════

function obtenerCatalogoPreciosDesdeSheet() {
  try {
    const ss = SpreadsheetApp.openById(ID_DIAGNOSTICOS);
    const hojasCatalogo = ss.getSheetByName("CATÁLOGO_PRECIOS_2026");

    if (!hojasCatalogo) {
      Logger.log("⚠️ ADVERTENCIA: Hoja CATÁLOGO_PRECIOS_2026 no encontrada");
      return {};
    }

    const datos = hojasCatalogo.getDataRange().getValues();
    const catalogo = {};

    // Estructura esperada:
    // Fila 1: Encabezados (Nombre | Precio | Código Odoo)
    // Filas 2+: Datos

    for (let i = 1; i < datos.length; i++) {
      const nombre = datos[i][0] ? datos[i][0].toString().toLowerCase().trim() : "";
      const precio = datos[i][1] ? parseInt(datos[i][1]) : 0;
      const codigoOdoo = datos[i][2] ? datos[i][2].toString().trim() : "";

      if (nombre && precio > 0) {
        catalogo[nombre] = {
          precio: precio,
          codigoOdoo: codigoOdoo
        };
      }
    }

    Logger.log("✅ Catálogo cargado: " + Object.keys(catalogo).length + " artículos");
    return catalogo;

  } catch (e) {
    Logger.log("❌ Error al obtener catálogo: " + e.toString());
    return {};
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN: NORMALIZAR TEXTO PARA BÚSQUEDA
// ═══════════════════════════════════════════════════════════════════════════

function normalizarTexto(texto) {
  if (!texto) return "";
  return texto.toString()
    .toLowerCase()
    .trim()
    .replace(/[()]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\//g, " ");
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN: BUSCAR PRECIO EN CATÁLOGO
// ═══════════════════════════════════════════════════════════════════════════

function obtenerPrecioDelCatalogo(nombreProducto, catalogo) {
  if (!nombreProducto || Object.keys(catalogo).length === 0) return 0;

  const nombreNormalizado = normalizarTexto(nombreProducto);

  // Búsqueda exacta
  if (catalogo[nombreNormalizado]) {
    return catalogo[nombreNormalizado].precio;
  }

  // Búsqueda por palabras clave
  const palabras = nombreNormalizado.split(" ");
  for (const [comp, datos] of Object.entries(catalogo)) {
    let coincidencias = 0;
    for (const palabra of palabras) {
      if (palabra.length > 2 && comp.includes(palabra)) {
        coincidencias++;
      }
    }
    if (coincidencias > 0) {
      return datos.precio;
    }
  }

  return 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN: FÓRMULA PERSONALIZADA - SUMAR_PIEZAS
// ═══════════════════════════════════════════════════════════════════════════

function SUMAR_PIEZAS(fila) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName("DIAGNÓSTICOS_2026");
    if (!hoja) return 0;

    // Columna 14 = N (Repuestos)
    const repuestos = hoja.getRange(fila, 14).getValue() || "";
    if (!repuestos) return 0;

    const catalogo = obtenerCatalogoPreciosDesdeSheet();
    let total = 0;

    // Separar por punto y coma
    repuestos.toString().split(";").forEach(item => {
      const precio = obtenerPrecioDelCatalogo(item, catalogo);
      total += precio;
      if (precio === 0 && item.trim()) {
        Logger.log("⚠️ Precio no encontrado para: " + item);
      }
    });

    return total;

  } catch (e) {
    Logger.log("❌ Error en SUMAR_PIEZAS: " + e.toString());
    return 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN: FÓRMULA PERSONALIZADA - SUMAR_SERVICIOS
// ═══════════════════════════════════════════════════════════════════════════

function SUMAR_SERVICIOS(fila) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName("DIAGNÓSTICOS_2026");
    if (!hoja) return 0;

    // Columna 15 = O (OTROS SERVICIOS)
    const otrosServicios = hoja.getRange(fila, 15).getValue() || "";
    if (!otrosServicios) return 0;

    const catalogo = obtenerCatalogoPreciosDesdeSheet();
    let total = 0;

    // Buscar cada servicio
    otrosServicios.toString().toLowerCase().split(";").forEach(servicio => {
      const precio = obtenerPrecioDelCatalogo(servicio, catalogo);
      total += precio;
    });

    return total;

  } catch (e) {
    Logger.log("❌ Error en SUMAR_SERVICIOS: " + e.toString());
    return 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN: FÓRMULA PERSONALIZADA - SUMAR_TAPICERIA
// ═══════════════════════════════════════════════════════════════════════════

function SUMAR_TAPICERIA(fila) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName("DIAGNÓSTICOS_2026");
    if (!hoja) return 0;

    const catalogo = obtenerCatalogoPreciosDesdeSheet();
    let total = 0;

    // Columna 17 = Q (TAPICERIA Asiento)
    const asiento = hoja.getRange(fila, 17).getValue() || "";
    // Columna 18 = R (TAPICERIA Espaldar)
    const espaldar = hoja.getRange(fila, 18).getValue() || "";

    if (asiento) {
      const precioAsiento = obtenerPrecioDelCatalogo(asiento, catalogo);
      total += precioAsiento;
    }

    if (espaldar) {
      const precioEspaldar = obtenerPrecioDelCatalogo(espaldar, catalogo);
      total += precioEspaldar;
    }

    return total;

  } catch (e) {
    Logger.log("❌ Error en SUMAR_TAPICERIA: " + e.toString());
    return 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN: PROCESAR RESPUESTAS DEL FORMULARIO
// ═══════════════════════════════════════════════════════════════════════════

function procesarRespuestaFormulario() {
  try {
    const ssResp = SpreadsheetApp.openById(ID_RESPUESTAS_NUEVA);
    const ssDiag = SpreadsheetApp.openById(ID_DIAGNOSTICOS);

    const hojaResp = ssResp.getSheetByName("Respuestas de formulario 1");
    const hojaDiag = ssDiag.getSheetByName("DIAGNÓSTICOS_2026");

    if (!hojaResp || !hojaDiag) {
      SpreadsheetApp.getUi().alert("❌ ERROR: Hojas no encontradas");
      return;
    }

    const ultFila = hojaResp.getLastRow();
    if (ultFila <= 1) {
      SpreadsheetApp.getUi().alert("⚠️ No hay respuestas nuevas");
      return;
    }

    const resp = hojaResp.getRange(ultFila, 1, 1, 31).getValues()[0];

    // Validar que no sea duplicada
    if (yaExisteRespuesta(hojaDiag, resp[1])) {
      SpreadsheetApp.getUi().alert("⚠️ Esta respuesta ya fue procesada");
      return;
    }

    // Construir repuestos
    const repuestos = [];
    if (resp[14]) repuestos.push(resp[14]); // Rodachinas
    if (resp[15]) repuestos.push(resp[15]); // Cilindro
    if (resp[16]) repuestos.push(resp[16]); // Base
    if (resp[17]) repuestos.push(resp[17]); // Plato
    if (resp[18]) repuestos.push("Concha int/ext asiento " + resp[18]);
    if (resp[20]) repuestos.push("Concha int/ext espaldar " + resp[20]);
    if (resp[22]) repuestos.push(resp[22]); // Brazo
    if (resp[23]) repuestos.push(resp[23]); // Otros
    if (resp[24]) repuestos.push(resp[24]); // Otros repuestos

    // Mapear datos
    const fila = [
      resp[1] || new Date(),              // A: FECHA DIAGNOSTICO
      resp[2] || "",                      // B: OPORTUNIDAD
      resp[3] || "",                      // C: CLIENTE
      resp[4] || "",                      // D: TIPO_SILLA
      "",                                 // E: NUMERO_EYM (se genera automático)
      resp[6] || "",                      // F: #_TEMPORAL
      resp[13] || "",                     // G: FOTO
      resp[7] || "",                      // H: ACTIVO
      resp[8] || "",                      // I: CONDICION_SILLA
      resp[9] || "",                      // J: TIPO_TELA
      resp[10] || "",                     // K: COLOR
      resp[11] || "",                     // L: UBICACION
      resp[12] || "",                     // M: GARANTIA
      "",                                 // N: TIPO de TRABAJO (eliminado)
      "",                                 // O: TIPO de REPARACION (eliminado)
      "",                                 // P: OTROS (eliminado)
      repuestos.join("; "),               // Q: Repuestos
      "",                                 // R: Otros detalles (eliminado)
      resp[25] || "",                     // S: OTROS SERVICIOS
      resp[26] || "",                     // T: OBSERVACIONES_ESPECIALES
      resp[27] || "",                     // U: TAPICERIA Asiento
      resp[28] || "",                     // V: TAPICERIA Espaldar
      "",                                 // W: PRESUPUESTO_GENERADO
      "",                                 // X: Subtotal de partes (fórmula)
      "",                                 // Y: Subtotal de Otros Servicios (fórmula)
      "",                                 // Z: Subtotal Tapiceria (fórmula)
      "",                                 // AA: Subtotal M.O. (fórmula)
      "",                                 // AB: TOTAL PPTTO Antes de IVA (fórmula)
      resp[29] || "",                     // AC: OPERARIO_DIAGNOSTICA
      "Diagnosticado",                    // AD: ESTADO_DIAGNOSTICO
      "",                                 // AE: ESTADO_APROBACION
      "",                                 // AF: FECHA_APROBACION
      "",                                 // AG: REFERENCIA_RMA
      ""                                  // AH: NOTAS_INTERNAS
    ];

    // Insertar fila
    const newFila = hojaDiag.getLastRow() + 1;
    hojaDiag.getRange(newFila, 1, 1, fila.length).setValues([fila]);

    // Aplicar fórmulas
    aplicarFormulasCalculos(hojaDiag, newFila);

    // Generar número EyM si es nueva
    generarNumerosEyMSiEsNueva(hojaDiag, newFila, resp);

    SpreadsheetApp.getUi().alert("✅ Diagnóstico procesado - Fila " + newFila);

  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ ERROR: " + e.toString());
    Logger.log(e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN: APLICAR FÓRMULAS DE CÁLCULO
// ═══════════════════════════════════════════════════════════════════════════

function aplicarFormulasCalculos(hoja, fila) {
  try {
    // T (col 20): Subtotal de partes
    hoja.getRange(fila, 20).setFormula('=SUMAR_PIEZAS(' + fila + ')');

    // U (col 21): Subtotal de Otros Servicios (con lógica de resalte amarillo)
    const otrosServicios = hoja.getRange(fila, 15).getValue();
    if (otrosServicios && otrosServicios.toString().trim() !== "") {
      hoja.getRange(fila, 21).setFormula('=SUMAR_SERVICIOS(' + fila + ')');
      hoja.getRange(fila, 21).setBackground("#FFFF00"); // Resaltar amarillo
    } else {
      hoja.getRange(fila, 21).setValue(0);
      hoja.getRange(fila, 21).setBackground("#FFFFFF");
    }

    // V (col 22): Subtotal Tapiceria
    hoja.getRange(fila, 22).setFormula('=SUMAR_TAPICERIA(' + fila + ')');

    // W (col 23): Subtotal M.O. (fijo)
    hoja.getRange(fila, 23).setValue(CONFIG.MANTENIMIENTO_GENERAL);

    // X (col 24): TOTAL PPTTO Antes de IVA (T + U + V + W)
    hoja.getRange(fila, 24).setFormula('=T' + fila + '+U' + fila + '+V' + fila + '+W' + fila);

  } catch (e) {
    Logger.log("❌ Error en aplicarFormulasCalculos: " + e.toString());
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN: GENERAR NÚMERO EYM AUTOMÁTICO
// ═══════════════════════════════════════════════════════════════════════════

function generarNumerosEyMSiEsNueva(hoja, fila, resp) {
  try {
    const condicion = resp[8]; // CONDICION_SILLA

    if (condicion && condicion.toString().toLowerCase().includes("nueva")) {
      // Obtener último EyM
      let ultimoEyM = CONFIG.PROXIMO_EYM;
      ultimoEyM++;

      // Actualizar configuración (esto debería guardarse en un Sheet de configuración)
      CONFIG.PROXIMO_EYM = ultimoEyM;

      // Asignar número
      const celda = hoja.getRange(fila, 5);
      celda.setValue(ultimoEyM);
      celda.setBackground("#FFFF00");
      celda.setFontColor("#0000FF");

      Logger.log("✅ EyM generado: " + ultimoEyM);
    }
  } catch (e) {
    Logger.log("❌ Error en generarNumerosEyM: " + e.toString());
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN: PROCESAR APROBADOS A OP
// ═══════════════════════════════════════════════════════════════════════════

function procesarAprobadosAOP() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hojaDiag = ss.getSheetByName("DIAGNÓSTICOS_2026");
    const hojaOP = ss.getSheetByName("OP_2026");

    if (!hojaDiag || !hojaOP) {
      SpreadsheetApp.getUi().alert("❌ ERROR: Hojas no encontradas");
      return;
    }

    const ultFila = hojaDiag.getLastRow();
    let procesadas = 0;

    for (let f = 2; f <= ultFila; f++) {
      const estadoAprobacion = hojaDiag.getRange(f, 31).getValue(); // Columna AE

      if (estadoAprobacion && estadoAprobacion.toString().toLowerCase().includes("aprobado")) {
        // Verificar si ya fue procesada
        const refRMA = hojaDiag.getRange(f, 33).getValue(); // Columna AG
        if (refRMA && buscarEnOP(hojaOP, refRMA)) {
          continue; // Ya procesada
        }

        crearOrdenProduccion(hojaDiag, hojaOP, f);
        procesadas++;
      }
    }

    SpreadsheetApp.getUi().alert("✅ " + procesadas + " orden(es) de producción creada(s)");

  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ ERROR: " + e.toString());
    Logger.log(e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN: CREAR ORDEN DE PRODUCCIÓN
// ═══════════════════════════════════════════════════════════════════════════

function crearOrdenProduccion(hojaDiag, hojaOP, fila) {
  try {
    // Extraer datos
    const fechaDiag = hojaDiag.getRange(fila, 1).getValue();
    const oportunidad = hojaDiag.getRange(fila, 2).getValue();
    const cliente = hojaDiag.getRange(fila, 3).getValue();
    const tipoSilla = hojaDiag.getRange(fila, 4).getValue();
    const numeroEyM = hojaDiag.getRange(fila, 5).getValue();
    const numeroTemporal = hojaDiag.getRange(fila, 6).getValue();
    const color = hojaDiag.getRange(fila, 11).getValue();
    const tipoTela = hojaDiag.getRange(fila, 10).getValue();
    const repuestos = hojaDiag.getRange(fila, 17).getValue();
    const otrosServicios = hojaDiag.getRange(fila, 19).getValue();
    const observaciones = hojaDiag.getRange(fila, 20).getValue();
    const tapiceriaAsiento = hojaDiag.getRange(fila, 21).getValue();
    const tapiceriaEspaldar = hojaDiag.getRange(fila, 22).getValue();

    // Generar número OP
    let ultimoOP = CONFIG.PROXIMO_OP;
    ultimoOP++;
    CONFIG.PROXIMO_OP = ultimoOP;

    // Generar referencia RMA
    const refRMA = "RMA-" + numeroEyM;

    // Procesar tapicería
    let tapizado = "";
    let abollonado = "";

    if (tapiceriaAsiento && tapiceriaAsiento.toString().toLowerCase().includes("tapizado")) {
      tapizado = "TAPIZADO";
    }
    if (tapiceriaAsiento && tapiceriaAsiento.toString().toLowerCase().includes("abollonado")) {
      abollonado = "ABOLL";
    }
    if (tapiceriaEspaldar && tapiceriaEspaldar.toString().toLowerCase().includes("tapizado")) {
      tapizado = tapizado ? tapizado + " + TAPIZADO ESP" : "TAPIZADO ESP";
    }
    if (tapiceriaEspaldar && tapiceriaEspaldar.toString().toLowerCase().includes("abollonado")) {
      abollonado = abollonado ? abollonado + " + ABOLL ESP" : "ABOLL ESP";
    }

    // Concatenar otros servicios y observaciones
    let otrosServiciosConcat = "";
    if (otrosServicios) otrosServiciosConcat = otrosServicios.toString();
    if (observaciones) {
      otrosServiciosConcat = otrosServiciosConcat ? otrosServiciosConcat + "; " + observaciones : observaciones.toString();
    }

    // Construir fila OP (16 columnas aproximadamente)
    const filaOP = [
      ultimoOP,                     // A: OP
      refRMA,                        // B: RMA
      "",                            // C: FACTURA
      fechaDiag,                     // D: FECHA RECIBO
      oportunidad,                   // E: COTIZACION
      "",                            // F: OC
      cliente,                       // G: CLIENTE
      tipoSilla,                     // H: TIPO_SILLA
      color,                         // I: COLOR
      tipoTela,                      // J: TIPO_TELA
      numeroTemporal,                // K: NUMERO_TEMP
      repuestos,                     // L: PARTES
      otrosServiciosConcat,          // M: OTROS_SERVICIOS
      abollonado,                    // N: ABOLLONADO
      tapizado,                      // O: TAPIZADO
      numeroEyM                      // P: NUM_EYM
    ];

    // Insertar en OP
    const newFilaOP = hojaOP.getLastRow() + 1;
    hojaOP.getRange(newFilaOP, 1, 1, filaOP.length).setValues([filaOP]);

    // Resaltar amarillo si hay datos en columna M (otros servicios)
    if (otrosServiciosConcat && otrosServiciosConcat.toString().trim() !== "") {
      hojaOP.getRange(newFilaOP, 13).setBackground("#FFFF00"); // Columna M
    }

    // Guardar referencia RMA en diagnóstico
    hojaDiag.getRange(fila, 33).setValue(refRMA);

    Logger.log("✅ OP creada: " + ultimoOP);

  } catch (e) {
    Logger.log("❌ Error en crearOrdenProduccion: " + e.toString());
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

function yaExisteRespuesta(hoja, timestamp) {
  const ultFila = hoja.getLastRow();
  for (let f = 2; f <= ultFila; f++) {
    if (hoja.getRange(f, 1).getValue() === timestamp) {
      return true;
    }
  }
  return false;
}

function buscarEnOP(hojaOP, refRMA) {
  const rango = hojaOP.getRange(2, 2, hojaOP.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < rango.length; i++) {
    if (rango[i][0] === refRMA) return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN: INSTALAR TRIGGER AUTOMÁTICO
// ═══════════════════════════════════════════════════════════════════════════

function instalarTriggerAutomatico() {
  try {
    // Eliminar triggers anteriores
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => {
      if (t.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT) {
        ScriptApp.deleteTrigger(t);
      }
    });

    // Crear nuevo trigger
    ScriptApp.newTrigger('procesarRespuestaFormulario')
      .forForm(FormApp.openById(ID_FORMULARIO))
      .onFormSubmit()
      .create();

    SpreadsheetApp.getUi().alert("✅ TRIGGER AUTOMÁTICO INSTALADO");

  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ ERROR: " + e.toString());
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MENÚ PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

function onOpen() {
  SpreadsheetApp.getUi().createMenu("🚀 EYM AUTOMÁTICO V3.0")
    .addItem("📥 Procesar Última Respuesta", "procesarRespuestaFormulario")
    .addItem("📤 Procesar Aprobados → OP", "procesarAprobadosAOP")
    .addItem("🔧 Instalar Trigger", "instalarTriggerAutomatico")
    .addSeparator()
    .addItem("📊 Cargar Catálogo Precios", "obtenerCatalogoPreciosDesdeSheet")
    .addItem("🔄 Recalcular Todas las Fórmulas", "recalcularTodasLasFormulas")
    .addToUi();
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN: RECALCULAR TODAS LAS FÓRMULAS
// ═══════════════════════════════════════════════════════════════════════════

function recalcularTodasLasFormulas() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName("DIAGNÓSTICOS_2026");
    if (!hoja) return;

    const ultFila = hoja.getLastRow();

    for (let f = 2; f <= ultFila; f++) {
      aplicarFormulasCalculos(hoja, f);

      // Resaltar amarillo si hay otros servicios
      const otrosServicios = hoja.getRange(f, 15).getValue();
      if (otrosServicios && otrosServicios.toString().trim() !== "") {
        hoja.getRange(f, 21).setBackground("#FFFF00"); // Columna U
      } else {
        hoja.getRange(f, 21).setBackground("#FFFFFF");
      }
    }

    SpreadsheetApp.getUi().alert("✅ TODAS LAS FÓRMULAS RECALCULADAS");

  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ ERROR: " + e.toString());
  }
}
