const ID_RESPUESTAS_NUEVA = "151jFiyUYDKxHYgswm5-BIED8py5j1_txVxYU5qyPlW4";
const ID_DIAGNOSTICOS = "1yaRRfrnzseiqXqoiHrFM6KZ9lc124e3cM4Xcqw8-p9Y";
const ID_FORMULARIO = "1ernMEHTdhRypQCMVgZmHxFGpvQPXkmYhygfxa-i0jxY";

const CONFIG = {
  PROXIMO_EYM: 60037,
  PROXIMO_OP: 7560,
  MANTENIMIENTO_GENERAL: 46000,
  CELDA_CONTROL: "AE1" // Guardar cuántas respuestas se procesaron
};

let CATALOGO_CACHE = null; // Caché global para evitar lecturas repetidas

function obtenerCatalogoPreciosDesdeSheet() {
  if (CATALOGO_CACHE !== null) {
    return CATALOGO_CACHE; // Devolver caché si ya está cargado
  }

  try {
    const ssDiag = SpreadsheetApp.openById(ID_DIAGNOSTICOS);
    const hojaCatalogo = ssDiag.getSheetByName("CATÁLOGO_PRECIOS_2026");

    if (!hojaCatalogo) {
      Logger.log("⚠️ ADVERTENCIA: Hoja CATÁLOGO_PRECIOS_2026 no encontrada");
      return {};
    }

    const datos = hojaCatalogo.getDataRange().getValues();
    const catalogo = {};

    // Estructura esperada:
    // Fila 1: Encabezados (Nombre | Precio | Código Odoo)
    // Filas 2+: Datos
    for (let i = 1; i < datos.length; i++) {
      const nombre = datos[i][0] ? datos[i][0].toString().toLowerCase().trim() : "";
      const precio = datos[i][1] ? parseInt(datos[i][1]) : 0;

      if (nombre && precio > 0) {
        catalogo[nombre] = precio;
      }
    }

    CATALOGO_CACHE = catalogo;
    Logger.log("✅ Catálogo cargado: " + Object.keys(catalogo).length + " artículos");
    return catalogo;
  } catch (e) {
    Logger.log("❌ Error al obtener catálogo: " + e.toString());
    return {};
  }
}

function normalizarTexto(texto) {
  if (!texto) return "";
  return texto.toString().toLowerCase().trim().replace(/[()]/g, "").replace(/\s+/g, " ").replace(/\//g, " ");
}

function obtenerPrecioDelCatalogo(nombreProducto) {
  if (!nombreProducto) return 0;

  const catalogo = obtenerCatalogoPreciosDesdeSheet();
  if (!catalogo || Object.keys(catalogo).length === 0) {
    Logger.log("⚠️ Catálogo vacío");
    return 0;
  }

  const nombreNormalizado = normalizarTexto(nombreProducto);

  // Búsqueda exacta
  if (catalogo[nombreNormalizado]) return catalogo[nombreNormalizado];

  // Búsqueda fuzzy (por palabras clave)
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

function obtenerUltimaRespuestaProcesada() {
  try {
    const ssDiag = SpreadsheetApp.openById(ID_DIAGNOSTICOS);
    const hojaDiag = ssDiag.getSheetByName("DIAGNÓSTICOS_2026");
    if (!hojaDiag) return 1;

    const celda = hojaDiag.getRange(CONFIG.CELDA_CONTROL);
    const valor = celda.getValue();
    return valor ? parseInt(valor) : 1;
  } catch (e) {
    return 1;
  }
}

function guardarUltimaRespuestaProcesada(numRespuesta) {
  try {
    const ssDiag = SpreadsheetApp.openById(ID_DIAGNOSTICOS);
    const hojaDiag = ssDiag.getSheetByName("DIAGNÓSTICOS_2026");
    if (!hojaDiag) return;

    hojaDiag.getRange(CONFIG.CELDA_CONTROL).setValue(numRespuesta);
  } catch (e) {
    Logger.log("Error guardando control: " + e);
  }
}

function procesarRespuestaFormulario() {
  try {
    const ssResp = SpreadsheetApp.openById(ID_RESPUESTAS_NUEVA);
    const ssDiag = SpreadsheetApp.openById(ID_DIAGNOSTICOS);
    const hojaResp = ssResp.getSheetByName("Respuestas de formulario 1");
    const hojaDiag = ssDiag.getSheetByName("DIAGNÓSTICOS_2026");

    if (!hojaResp || !hojaDiag) {
      Logger.log("❌ ERROR: Hojas no encontradas");
      return;
    }

    const ultFilaResp = hojaResp.getLastRow();
    if (ultFilaResp <= 1) {
      Logger.log("⚠️ No hay respuestas");
      return;
    }

    // Obtener cuántas respuestas ya fueron procesadas
    const ultimaProcesada = obtenerUltimaRespuestaProcesada();

    let procesadas = 0;

    // Procesar TODAS las respuestas (desde fila 2), evitando duplicados
    const ultFilaDiag = hojaDiag.getLastRow();
    for (let r = 2; r <= ultFilaResp; r++) {
      const resp = hojaResp.getRange(r, 1, 1, 34).getValues()[0];

      // Verificar si esta respuesta ya existe en diagnósticos (por fecha + cliente)
      const fechaResp = resp[1];
      const clienteResp = resp[3];
      let yaExiste = false;

      if (ultFilaDiag > 1) {
        for (let d = 2; d <= ultFilaDiag; d++) {
          const fechaDiag = hojaDiag.getRange(d, 1).getValue();
          const clienteDiag = hojaDiag.getRange(d, 3).getValue();
          if (Math.abs(new Date(fechaResp) - new Date(fechaDiag)) < 60000 && clienteResp === clienteDiag) {
            yaExiste = true;
            break;
          }
        }
      }

      if (yaExiste) continue;

      const componentes = [];
      if (resp[14]) componentes.push(resp[14]);
      if (resp[15]) componentes.push(resp[15]);
      if (resp[16]) componentes.push(resp[16]);
      if (resp[17]) componentes.push(resp[17]);
      if (resp[18]) componentes.push("Concha " + resp[18]);
      if (resp[20]) componentes.push("Concha " + resp[20]);
      if (resp[22]) componentes.push(resp[22]);
      if (resp[23]) componentes.push(resp[23]);
      if (resp[24]) componentes.push(resp[24]);

      const fila = [
        resp[1] || new Date(),               // 1: A
        resp[2] || "",                       // 2: B
        resp[3] || "",                       // 3: C
        resp[4] || "",                       // 4: D
        "",                                  // 5: E (se genera después)
        resp[6] || "",                       // 6: F - TEMPORAL
        resp[13] || "",                      // 7: G
        resp[7] || "",                       // 8: H
        resp[8] || "",                       // 9: I
        resp[9] || "",                       // 10: J
        resp[10] || "",                      // 11: K
        resp[11] || "",                      // 12: L
        resp[12] || "",                      // 13: M
        componentes.join("; "),              // 14: N
        resp[25] || "",                      // 15: O
        resp[26] || "",                      // 16: P
        resp[27] || "",                      // 17: Q
        resp[28] || "",                      // 18: R
        "",                                  // 19: S
        0,                                   // 20: T
        0,                                   // 21: U
        0,                                   // 22: V
        0,                                   // 23: W
        0,                                   // 24: X
        resp[29] || "",                      // 25: Y - OPERARIO (AD de respuestas)
        "Diagnosticado",                     // 26: Z
        "",                                  // 27: AA
        "",                                  // 28: AB
        "",                                  // 29: AC
        ""                                   // 30: AD
      ];

      const newFila = hojaDiag.getLastRow() + 1;
      hojaDiag.getRange(newFila, 1, 1, fila.length).setValues([fila]);

      calcularSubtotales(hojaDiag, newFila);
      generarEyMSiEsNueva(hojaDiag, newFila, resp);

      procesadas++;
    }

    // Guardar la última fila procesada
    if (procesadas > 0) {
      guardarUltimaRespuestaProcesada(ultFilaResp);
      Logger.log("✅ " + procesadas + " diagnóstico(s) procesado(s) automáticamente");
    }

  } catch (e) {
    Logger.log("❌ ERROR: " + e);
  }
}

function calcularSubtotales(hoja, fila) {
  try {
    const componentes = hoja.getRange(fila, 14).getValue() || "";
    let totalT = 0;
    if (componentes) {
      componentes.toString().split(";").forEach(item => {
        totalT += obtenerPrecioDelCatalogo(item);
      });
    }
    hoja.getRange(fila, 20).setValue(totalT);

    const otrosServicios = hoja.getRange(fila, 15).getValue() || "";
    if (otrosServicios && otrosServicios.toString().trim() !== "") {
      hoja.getRange(fila, 21).setBackground("#FFFF00");
      hoja.getRange(fila, 21).setValue("");
    } else {
      hoja.getRange(fila, 21).setValue(0);
      hoja.getRange(fila, 21).setBackground("#FFFFFF");
    }

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

    hoja.getRange(fila, 23).setValue(CONFIG.MANTENIMIENTO_GENERAL);

    const valorU = hoja.getRange(fila, 21).getValue();
    const totalU = (valorU === "" || isNaN(valorU)) ? 0 : parseFloat(valorU);
    const totalX = totalT + totalU + totalV + CONFIG.MANTENIMIENTO_GENERAL;
    hoja.getRange(fila, 24).setValue(totalX);

  } catch (e) {
    Logger.log("❌ Error: " + e);
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
    Logger.log("❌ Error: " + e);
  }
}

function recalcularTodo() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName("DIAGNÓSTICOS_2026");
    if (!hoja) return;

    const ultFila = hoja.getLastRow();
    for (let f = 2; f <= ultFila; f++) {
      const estadoDiag = hoja.getRange(f, 26).getValue();
      if (!estadoDiag || estadoDiag === "") {
        hoja.getRange(f, 26).setValue("Diagnosticado");
      }

      hoja.getRange(f, 27).setValue("");
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

    // Si se escribe "aprobado" en la columna AE (27) - ESTADO_APROBACION
    if (col === 27 && valor && valor.toString().toLowerCase().includes("aprobado")) {
      // 1. Rellenar fecha de aprobación en AB (28)
      sheet.getRange(fila, 28).setValue(new Date());

      // 2. Crear OP automáticamente
      try {
        const hojaOP = ss.getSheetByName("OP_2026");
        if (hojaOP) {
          crearOP(sheet, hojaOP, fila);
          Logger.log("✅ OP creada automáticamente para fila " + fila);
        }
      } catch (opError) {
        Logger.log("⚠️ Error creando OP: " + opError);
      }
    }
  } catch (e) {
    Logger.log("❌ Error: " + e);
  }
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu("🚀 EYM V3.0")
    .addItem("📥 Procesar Manualmente", "procesarRespuestaFormulario")
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

    // Inicializar celda de control
    const ssDiag = SpreadsheetApp.openById(ID_DIAGNOSTICOS);
    const hojaDiag = ssDiag.getSheetByName("DIAGNÓSTICOS_2026");
    if (hojaDiag) {
      hojaDiag.getRange(CONFIG.CELDA_CONTROL).setValue(1);
    }

    ScriptApp.newTrigger('procesarRespuestaFormulario')
      .forForm(FormApp.openById(ID_FORMULARIO))
      .onFormSubmit()
      .create();

    SpreadsheetApp.getUi().alert("✅ TRIGGER AUTOMÁTICO INSTALADO\n\nCada nueva respuesta se procesará automáticamente");
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
    Logger.log("❌ Error: " + e);
  }
}
