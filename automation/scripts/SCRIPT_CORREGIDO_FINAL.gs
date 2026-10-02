const ID_RESPUESTAS_NUEVA = "151jFiyUYDKxHYgswm5-BIED8py5j1_txVxYU5qyPlW4";
const ID_DIAGNOSTICOS = "1yaRRfrnzseiqXqoiHrFM6KZ9lc124e3cM4Xcqw8-p9Y";
const ID_FORMULARIO = "1ernMEHTdhRypQCMVgZmHxFGpvQPXkmYhygfxa-i0jxY";

const CONFIG = {
  PROXIMO_EYM: 60037,
  PROXIMO_OP: 7560,
  MANTENIMIENTO_GENERAL: 46000
};

function obtenerCatalogoPreciosDesdeSheet() {
  try {
    const ss = SpreadsheetApp.openById(ID_DIAGNOSTICOS);
    const hojasCatalogo = ss.getSheetByName("CATÁLOGO_PRECIOS_2026");
    if (!hojasCatalogo) return {};
    const datos = hojasCatalogo.getDataRange().getValues();
    const catalogo = {};
    for (let i = 1; i < datos.length; i++) {
      const nombre = datos[i][0] ? datos[i][0].toString().toLowerCase().trim() : "";
      const precio = datos[i][1] ? parseInt(datos[i][1]) : 0;
      if (nombre && precio > 0) {
        catalogo[nombre] = precio;
      }
    }
    Logger.log("✅ Catálogo: " + Object.keys(catalogo).length + " artículos");
    return catalogo;
  } catch (e) {
    Logger.log("❌ Error catálogo: " + e);
    return {};
  }
}

function normalizarTexto(texto) {
  if (!texto) return "";
  return texto.toString().toLowerCase().trim().replace(/[()]/g, "").replace(/\s+/g, " ").replace(/\//g, " ");
}

function obtenerPrecioDelCatalogo(nombreProducto, catalogo) {
  if (!nombreProducto || Object.keys(catalogo).length === 0) return 0;
  const nombreNormalizado = normalizarTexto(nombreProducto);
  if (catalogo[nombreNormalizado]) return catalogo[nombreNormalizado];
  const palabras = nombreNormalizado.split(" ");
  for (const [comp, precio] of Object.entries(catalogo)) {
    let coincidencias = 0;
    for (const palabra of palabras) {
      if (palabra.length > 2 && comp.includes(palabra)) coincidencias++;
    }
    if (coincidencias > 0) return precio;
  }
  return 0;
}

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

    const repuestos = [];
    if (resp[14]) repuestos.push(resp[14]);
    if (resp[15]) repuestos.push(resp[15]);
    if (resp[16]) repuestos.push(resp[16]);
    if (resp[17]) repuestos.push(resp[17]);
    if (resp[18]) repuestos.push("Concha " + resp[18]);
    if (resp[20]) repuestos.push("Concha " + resp[20]);
    if (resp[22]) repuestos.push(resp[22]);
    if (resp[23]) repuestos.push(resp[23]);
    if (resp[24]) repuestos.push(resp[24]);

    const fila = [
      resp[1] || new Date(),resp[2] || "",resp[3] || "",resp[4] || "",
      "","",resp[13] || "",resp[7] || "",resp[8] || "",
      resp[9] || "",resp[10] || "",resp[11] || "",resp[12] || "",
      repuestos.join("; "),resp[25] || "",resp[26] || "",
      resp[27] || "",resp[28] || "","",
      0,0,0,0,0,
      resp[29] || "","Diagnosticado","","","",""
    ];

    const newFila = hojaDiag.getLastRow() + 1;
    hojaDiag.getRange(newFila, 1, 1, fila.length).setValues([fila]);

    calcularSubtotales(hojaDiag, newFila);
    generarEyMSiEsNueva(hojaDiag, newFila, resp);

    SpreadsheetApp.getUi().alert("✅ Diagnóstico procesado");
  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ ERROR: " + e);
    Logger.log(e);
  }
}

function calcularSubtotales(hoja, fila) {
  try {
    const catalogo = obtenerCatalogoPreciosDesdeSheet();

    // T (col 20): Suma precios de ítems en N (col 14)
    const repuestos = hoja.getRange(fila, 14).getValue() || "";
    let totalT = 0;
    if (repuestos) {
      repuestos.toString().split(";").forEach(item => {
        totalT += obtenerPrecioDelCatalogo(item, catalogo);
      });
    }
    hoja.getRange(fila, 20).setValue(totalT);

    // U (col 21): Amarillo si O (col 15) tiene datos, sino 0
    const otrosServicios = hoja.getRange(fila, 15).getValue() || "";
    if (otrosServicios && otrosServicios.toString().trim() !== "") {
      hoja.getRange(fila, 21).setBackground("#FFFF00");
      hoja.getRange(fila, 21).setValue("");
    } else {
      hoja.getRange(fila, 21).setValue(0);
      hoja.getRange(fila, 21).setBackground("#FFFFFF");
    }

    // V (col 22): Suma precios en Q (col 17) + R (col 18)
    // Si ambas tienen el mismo item (ej: "Abollonado y Tapizado general"), contar solo una vez
    const asiento = hoja.getRange(fila, 17).getValue() || "";
    const espaldar = hoja.getRange(fila, 18).getValue() || "";
    let totalV = 0;

    const asientoNormalizado = normalizarTexto(asiento);
    const espaldarNormalizado = normalizarTexto(espaldar);

    if (asiento && espaldar) {
      // Ambas tienen datos
      if (asientoNormalizado === espaldarNormalizado) {
        // Son iguales - contar solo una vez
        totalV = obtenerPrecioDelCatalogo(asiento, catalogo);
      } else {
        // Son diferentes - contar ambas
        totalV = obtenerPrecioDelCatalogo(asiento, catalogo) + obtenerPrecioDelCatalogo(espaldar, catalogo);
      }
    } else if (asiento) {
      // Solo asiento tiene datos
      totalV = obtenerPrecioDelCatalogo(asiento, catalogo);
    } else if (espaldar) {
      // Solo espaldar tiene datos
      totalV = obtenerPrecioDelCatalogo(espaldar, catalogo);
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

function onOpen() {
  SpreadsheetApp.getUi().createMenu("🚀 EYM V3.0")
    .addItem("📥 Procesar Última", "procesarRespuestaFormulario")
    .addItem("📤 Procesar Aprobados", "procesarAprobadosAOP")
    .addItem("🔧 Instalar Trigger", "instalarTriggerAutomatico")
    .addSeparator()
    .addItem("🔄 Recalcular Todo", "recalcularTodo")
    .addToUi();
}

function recalcularTodo() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName("DIAGNÓSTICOS_2026");
    if (!hoja) return;

    const ultFila = hoja.getLastRow();
    for (let f = 2; f <= ultFila; f++) {
      calcularSubtotales(hoja, f);
    }

    SpreadsheetApp.getUi().alert("✅ RECALCULADO");
  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ ERROR: " + e);
  }
}
