const ID_RESPUESTAS_NUEVA = "151jFiyUYDKxHYgswm5-BIED8py5j1_txVxYU5qyPlW4";
const ID_DIAGNOSTICOS = "1yaRRfrnzseiqXqoiHrFM6KZ9lc124e3cM4Xcqw8-p9Y";
const ID_FORMULARIO = "1ernMEHTdhRypQCMVgZmHxFGpvQPXkmYhygfxa-i0jxY";

const CONFIG = {
  PROXIMO_EYM: 60037,
  PROXIMO_OP: 7560,
  MANTENIMIENTO_GENERAL: 46000
};

const PRECIOS = {
  "deslizadores x 4": 15000,
  "rodachinas goma 60mm x5": 28000,
  "rodachinas goma 50mm x5": 25000,
  "rodachinas nylon 50mm x5": 20000,
  "base naylon 64cm": 56000,
  "base cromada 64cms": 69000,
  "base aluminio 64cm": 165000,
  "telescopio": 5000,
  "cilindro secretarial negro": 24000,
  "cilindro cromado negro gerente": 28000,
  "cilindro butaco": 44000,
  "cilindro mini negro": 20000,
  "cilindro mini cromado": 22000,
  "platina espaldar": 35000,
  "platina curva": 65000,
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
  "base cromada": 53000,
  "aro nylon": 70000,
  "brazo ajustable 2d par": 50000,
  "brazo ajustable 3d par": 73600,
  "servicio de mantenimiento y mdo": 46000,
  "tapizado asiento": 30000,
  "abollonado asiento": 30000,
  "tapizado espaldar": 30000,
  "abollonado espaldar": 30000,
  "abollonado y tapizado general": 100000,
  "abollonado especial": 0,
  "costura especial": 0
};

function normalizarTexto(texto) {
  if (!texto) return "";
  return texto.toString().toLowerCase().trim().replace(/[()]/g, "").replace(/\s+/g, " ").replace(/\//g, " ");
}

function obtenerPrecioDelCatalogo(nombreProducto) {
  if (!nombreProducto) return 0;
  const nombreNormalizado = normalizarTexto(nombreProducto);
  if (PRECIOS[nombreNormalizado]) return PRECIOS[nombreNormalizado];
  const palabras = nombreNormalizado.split(" ");
  for (const [comp, precio] of Object.entries(PRECIOS)) {
    let coincidencias = 0;
    for (const palabra of palabras) {
      if (palabra.length > 2 && comp.includes(palabra)) coincidencias++;
    }
    if (coincidencias > 0) return precio;
  }
  return 0;
}

function procesarTodasLasRespuestas() {
  try {
    const ssResp = SpreadsheetApp.openById(ID_RESPUESTAS_NUEVA);
    const ssDiag = SpreadsheetApp.openById(ID_DIAGNOSTICOS);
    const hojaResp = ssResp.getSheetByName("Respuestas de formulario 1");
    const hojaDiag = ssDiag.getSheetByName("DIAGNÓSTICOS_2026");

    if (!hojaResp || !hojaDiag) {
      SpreadsheetApp.getUi().alert("❌ ERROR: Hojas no encontradas");
      return;
    }

    const ultFilaResp = hojaResp.getLastRow();

    if (ultFilaResp <= 1) {
      SpreadsheetApp.getUi().alert("⚠️ No hay respuestas");
      return;
    }

    let procesadas = 0;

    for (let r = 2; r <= ultFilaResp; r++) {
      const resp = hojaResp.getRange(r, 1, 1, 31).getValues()[0];

      const componentes = [];
      if (resp[14]) componentes.push(resp[14]); // O: Rodachinas
      if (resp[15]) componentes.push(resp[15]); // P: Cilindro
      if (resp[16]) componentes.push(resp[16]); // Q: Base
      if (resp[17]) componentes.push(resp[17]); // R: Plato
      if (resp[18]) componentes.push("Concha " + resp[18]); // S: Concha Asiento
      if (resp[20]) componentes.push("Concha " + resp[20]); // U: Concha Espaldar
      if (resp[22]) componentes.push(resp[22]); // W: Brazo
      if (resp[23]) componentes.push(resp[23]); // X: Otros
      if (resp[24]) componentes.push(resp[24]); // Y: Otros repuestos

      // MAPEO CORRECTO: 30 elementos (eliminadas 4 columnas N,O,P,R de DIAGNÓSTICOS_2026)
      const fila = [
        resp[1] || new Date(),               // 1: A - FECHA_DIAGNOSTICO
        resp[2] || "",                       // 2: B - NOMBRE_OPORTUNIDAD
        resp[3] || "",                       // 3: C - CLIENTE
        resp[4] || "",                       // 4: D - TIPO_SILLA
        resp[5] || "",                       // 5: E - NUMERO_EYM_ANTERIOR
        resp[6] || "",                       // 6: F - #_TEMPORAL
        resp[13] || "",                      // 7: G - FOTO_INICIAL
        resp[7] || "",                       // 8: H - NUMERO_ACTIVO_EMPRESA
        resp[8] || "",                       // 9: I - CONDICION_SILLA
        resp[9] || "",                       // 10: J - TIPO_TELA
        resp[10] || "",                      // 11: K - COLOR
        resp[11] || "",                      // 12: L - UBICACION
        resp[12] || "",                      // 13: M - GARANTIA
        componentes.join("; "),              // 14: N (era Q) - COMPONENTES
        resp[25] || "",                      // 15: O (era S) - OTROS_SERVICIOS
        resp[26] || "",                      // 16: P (era T) - OBSERVACIONES
        resp[27] || "",                      // 17: Q (era U) - TAPICERIA_TIPO
        resp[28] || "",                      // 18: R (era V) - TAPICERIA_DETALLES
        "",                                  // 19: S (era W) - PRESUPUESTO_GENERADO
        0,                                   // 20: T (era X) - Subtotal Repuestos
        0,                                   // 21: U (era Y) - Subtotal Servicios
        0,                                   // 22: V (era Z) - Subtotal Tapicería
        0,                                   // 23: W (era AA) - Subtotal M.O.
        0,                                   // 24: X (era AB) - TOTAL
        resp[30] || "",                      // 25: Y - OPERARIO_DIAGNOSTICA
        "Diagnosticado",                     // 26: Z - ESTADO_DIAGNOSTICO
        "",                                  // 27: AA - ESTADO_APROBACION
        "",                                  // 28: AB - FECHA_APROBACION
        "",                                  // 29: AC - REFERENCIA_RMA
        ""                                   // 30: AD - NOTAS_INTERNAS
      ];

      const newFila = hojaDiag.getLastRow() + 1;
      hojaDiag.getRange(newFila, 1, 1, fila.length).setValues([fila]);

      calcularSubtotales(hojaDiag, newFila);
      generarEyMSiEsNueva(hojaDiag, newFila, resp);

      procesadas++;
    }

    SpreadsheetApp.getUi().alert("✅ " + procesadas + " diagnósticos procesados");
  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ ERROR: " + e);
    Logger.log(e);
  }
}

function procesarRespuestaFormulario() {
  procesarTodasLasRespuestas();
}

function calcularSubtotales(hoja, fila) {
  try {
    // T (col 20): Suma precios de componentes en N (col 14)
    const componentes = hoja.getRange(fila, 14).getValue() || "";
    let totalT = 0;
    if (componentes) {
      componentes.toString().split(";").forEach(item => {
        totalT += obtenerPrecioDelCatalogo(item);
      });
    }
    hoja.getRange(fila, 20).setValue(totalT);

    // U (col 21): Amarillo si O (col 15) tiene datos
    const otrosServicios = hoja.getRange(fila, 15).getValue() || "";
    if (otrosServicios && otrosServicios.toString().trim() !== "") {
      hoja.getRange(fila, 21).setBackground("#FFFF00");
      hoja.getRange(fila, 21).setValue("");
    } else {
      hoja.getRange(fila, 21).setValue(0);
      hoja.getRange(fila, 21).setBackground("#FFFFFF");
    }

    // V (col 22): Suma precios de Q (col 17) + R (col 18)
    // NO duplicar SOLO si ambas son exactamente "Abollonado y Tapizado general"
    const asiento = hoja.getRange(fila, 17).getValue() || "";
    const espaldar = hoja.getRange(fila, 18).getValue() || "";
    let totalV = 0;

    const asientoNormalizado = normalizarTexto(asiento);
    const espaldarNormalizado = normalizarTexto(espaldar);
    const textoAbollonado = "abollonado y tapizado general";

    if (asiento && espaldar) {
      if (asientoNormalizado === textoAbollonado && espaldarNormalizado === textoAbollonado) {
        totalV = obtenerPrecioDelCatalogo(asiento);
      } else {
        totalV = obtenerPrecioDelCatalogo(asiento) + obtenerPrecioDelCatalogo(espaldar);
      }
    } else if (asiento) {
      totalV = obtenerPrecioDelCatalogo(asiento);
    } else if (espaldar) {
      totalV = obtenerPrecioDelCatalogo(espaldar);
    }
    hoja.getRange(fila, 22).setValue(totalV);

    // W (col 23): Siempre 46,000
    hoja.getRange(fila, 23).setValue(CONFIG.MANTENIMIENTO_GENERAL);

    // X (col 24): Total = T + U + V + W
    const valorU = hoja.getRange(fila, 21).getValue();
    const totalU = (valorU === "" || isNaN(valorU)) ? 0 : parseFloat(valorU);
    const totalX = totalT + totalU + totalV + CONFIG.MANTENIMIENTO_GENERAL;
    hoja.getRange(fila, 24).setValue(totalX);

  } catch (e) {
    Logger.log("❌ Error calcularSubtotales: " + e);
  }
}

function generarEyMSiEsNueva(hoja, fila, resp) {
  try {
    const condicion = resp[8];
    if (condicion && condicion.toString().toLowerCase().includes("nueva")) {
      CONFIG.PROXIMO_EYM++;
      const celda = hoja.getRange(fila, 5);
      celda.setValue(CONFIG.PROXIMO_EYM);
      celda.setBackground("#FFFF00");
      celda.setFontColor("#0000FF");
    }
  } catch (e) {
    Logger.log("❌ Error EyM: " + e);
  }
}

function recalcularTodo() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName("DIAGNÓSTICOS_2026");
    if (!hoja) return;

    const ultFila = hoja.getLastRow();
    for (let f = 2; f <= ultFila; f++) {
      // Llenar Z (col 26) = "Diagnosticado"
      const estadoDiag = hoja.getRange(f, 26).getValue();
      if (!estadoDiag || estadoDiag === "") {
        hoja.getRange(f, 26).setValue("Diagnosticado");
      }

      // Dejar AA (col 27) en blanco
      hoja.getRange(f, 27).setValue("");

      // Recalcular subtotales
      calcularSubtotales(hoja, f);
    }

    SpreadsheetApp.getUi().alert("✅ RECALCULADO");
  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ ERROR: " + e);
  }
}

function onEdit(e) {
  try {
    const ss = e.source;
    const sheet = e.range.getSheet();
    if (sheet.getName() !== "DIAGNÓSTICOS_2026") return;

    const col = e.range.getColumn();
    const fila = e.range.getRow();
    const valor = e.value;

    // Col 27 = AA (ESTADO_APROBACION), Col 28 = AB (FECHA_APROBACION)
    if (col === 27 && valor && valor.toString().toLowerCase().includes("aprobado")) {
      sheet.getRange(fila, 28).setValue(new Date());
    }
  } catch (e) {
    Logger.log("❌ Error en onEdit: " + e);
  }
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu("🚀 EYM V3.0")
    .addItem("📥 Procesar Última", "procesarRespuestaFormulario")
    .addItem("📤 Procesar Aprobados", "procesarAprobadosAOP")
    .addItem("🔧 Instalar Trigger", "instalarTriggerAutomatico")
    .addSeparator()
    .addItem("🔄 Recalcular Todo", "recalcularTodo")
    .addToUi();
}

function instalarTriggerAutomatico() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => {
      if (t.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT) {
        ScriptApp.deleteTrigger(t);
      }
    });

    ScriptApp.newTrigger('procesarRespuestaFormulario')
      .forForm(FormApp.openById(ID_FORMULARIO))
      .onFormSubmit()
      .create();

    SpreadsheetApp.getUi().alert("✅ TRIGGER INSTALADO");
  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ ERROR: " + e);
  }
}

function procesarAprobadosAOP() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hojaDiag = ss.getSheetByName("DIAGNÓSTICOS_2026");
    const hojaOP = ss.getSheetByName("OP_2026");

    if (!hojaDiag || !hojaOP) {
      SpreadsheetApp.getUi().alert("❌ Hojas no encontradas");
      return;
    }

    const ultFila = hojaDiag.getLastRow();
    let procesadas = 0;

    for (let f = 2; f <= ultFila; f++) {
      const estadoAprobacion = hojaDiag.getRange(f, 27).getValue();
      if (estadoAprobacion && estadoAprobacion.toString().toLowerCase().includes("aprobado")) {
        crearOP(hojaDiag, hojaOP, f);
        procesadas++;
      }
    }

    SpreadsheetApp.getUi().alert("✅ " + procesadas + " OP creadas");
  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ ERROR: " + e);
  }
}

function crearOP(hojaDiag, hojaOP, fila) {
  try {
    const numeroEyM = hojaDiag.getRange(fila, 5).getValue();
    const refRMA = "RMA-" + numeroEyM;

    CONFIG.PROXIMO_OP++;

    const filaOP = [
      CONFIG.PROXIMO_OP,
      refRMA,
      "",
      hojaDiag.getRange(fila, 1).getValue(),
      hojaDiag.getRange(fila, 2).getValue(),
      "",
      hojaDiag.getRange(fila, 3).getValue(),
      hojaDiag.getRange(fila, 4).getValue(),
      hojaDiag.getRange(fila, 11).getValue(),
      hojaDiag.getRange(fila, 10).getValue(),
      hojaDiag.getRange(fila, 6).getValue(),
      hojaDiag.getRange(fila, 14).getValue(),
      hojaDiag.getRange(fila, 15).getValue(),
      "",
      "",
      numeroEyM
    ];

    const newFilaOP = hojaOP.getLastRow() + 1;
    hojaOP.getRange(newFilaOP, 1, 1, filaOP.length).setValues([filaOP]);

    hojaDiag.getRange(fila, 29).setValue(refRMA);
  } catch (e) {
    Logger.log("❌ Error crearOP: " + e);
  }
}
