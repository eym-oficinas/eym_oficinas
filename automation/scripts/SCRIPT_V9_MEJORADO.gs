// ═══════════════════════════════════════════════════════════════════════════════════════
// SISTEMA AUTOMÁTICO EYM OFICINAS v13.0 - INTEGRACIÓN COMPLETA ODOO RMA
// ═══════════════════════════════════════════════════════════════════════════════════════
// Versión estable: Diagnósticos + RMA en Odoo + Piezas + Operaciones + PDF (GOOGLE SHEETS) + Impuestos
// Estados columna AA: COTIZACIÓN (manual) → APROBADO (automático) → RECHAZADO
// ✅ V13.0: 2 PDF (silla x silla + consolidado) con logo, RMA en Odoo, aprobación + iniciar reparación, cierre + factura

const ID_RESPUESTAS_NUEVA = "151jFiyUYDKxHYgswm5-BIED8py5j1_txVxYU5qyPlW4";
const ID_DIAGNOSTICOS = "1yaRRfrnzseiqXqoiHrFM6KZ9lc124e3cM4Xcqw8-p9Y";
const ID_FORMULARIO = "1ernMEHTdhRypQCMVgZmHxFGpvQPXkmYhygfxa-i0jxY";

const CONFIG = {
  PROXIMO_EYM: 60037,
  PROXIMO_OP: 7560,
  MANTENIMIENTO_GENERAL: 46000,
  CELDA_CONTROL: "AE1",
  LIMITE_RETEFUENTE: 550000,
  NOMBRE_IVA: "IVA Ventas 19%",
  NOMBRE_RETEFUENTE: "RTFTE 4%",
  PRODUCTO_REPARAR_CODIGO: "MOBILIARIO",
  CODIGO_OTROS_SERVICIOS: "SVARIOS",
  CODIGO_MANTENIMIENTO: "SVCMO",
  ODOO_ACCION_RMA: 529,
  ODOO_MENU_RMA: 384,
  COL_ALARMA: 30,
  ADJUNTAR_CONSOLIDADO: true,
  ESTADO_OP_PRODUCCION: "En producción",
  ESTADO_OP_TERMINADO: "Terminado"
};

// Logo EyM (PNG 150x150) incrustado para no depender de ningún archivo en Drive
const LOGO_EYM_B64 = "iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAMAAAAL34HQAAAASFBMVEXm6h0AAAACHd+Wp2L19gpRaZu1wUnl6R3m6h0zT7S6ugB4jHtug4V/fwAmQcG4/wejs1jBykAA/wB/f39//wD/vwAkP7+ouFbK4TEjAAAAGHRSTlP+AP/+C//+X57/A///Av8DWP8BBAIE/y8Ja146AAAHM0lEQVR42s2ci5akKAxAowGRUrt7Zmd2//9PF0FLUJDwUMvTp6u7CuVWEsIrBJqc6zdjTP/B2M9P3/dgXepfId4fL3+kXpB+C2Mv8yJmng7Beyk4g5RFloy1MIlVQiEsw2bQXuxaLP3NGbOVdoq1oOk7L8PSgnKYKFgzWbLI6FgTs3WXhKUuwZIkBgmSYsJTHxHLiIwMBnSo3lsbGcuAEVVJwmJBqCSsRWKVsJTkverLwNJgFE3GsZT+xEk9iVjK+CkCi2H9YWH95WGRNAlRqxLnlaRjKYFNzXcJVkxUmVgArPlmuVjKgYpoBXlYMQuDM1FNPVyFpZtkDhZBgSVYsyJZOpa6ifTwfCylyFcq1otgVqVYioulYTEqVRHWzMUSsOhUZVjQB7igkKoQS3F5xxRQSFWKNcuLhpVEVYzl54L8NlgJy9seD1jfaVQVsHz+CzK9aE0sDxfse+dEqipYx34I9tPT/gksYDs3ATvDSqWqhNXv1Aj5rqEm1r45gqtCeAprZ14OVroK62GBs+AEZSqsiOWoccNiE4MnsZQaXz6sHBXWxIJpUyOUqbAqlqVGKGmFlbGATdMO65UprKpY2xgHCoVVFWtzElAorLpYb3FB5sDhGqy3uKBQWJWxVnFBmWXVxlq7RigUVm2sZYSzSMtTAEOXH6tDzmXbtpLzIUSKcxl1cY4RcYFXWMjb8CU9WOOXW8ZT7+6Zcjwb1xsstzc8Y9J17rG8N7hgKCPPsVy9wdpNdsY2erlYGJIqRr8phgYSsNehjFO1HdBuGFZ0muAto9fSst78IlC1ZI2bWpFqEKu4ZixHhxRZvYVAsEMeofJxzeMbcHQ4plINTutD4wSkYz22BpXv6GZr5IHHvbUIzqh0K/zFkeAn0W+9drVWExz9d3aHxyolTpYO30/7IrruoCowri3u94OmLcJfS4fnDuV4DSc37K306D15yE0o4wJLhxjCjwlLnkoyQLWRy4NxfYPlHnhQ2RHL8vfhcYceun9uiWxPTxYWP9c5D3i6Y4cyeLDE3pUOVCx5WqetxuG8hDwYFxwtHhNNS8akGQbn/s97hdXnYnURUWy2x2MlugMWg1wsjJZvYyW6QAEGxw4xFSvuQKIlhjMsnuZMx2ilklpiX6UAkVKPz15lSQkKFqb1PXHhZpfooU8x0WewxiSu27CgTRlDXIgVHiZx/Bys6BTRnmfdiEWaY+D9WCSuB7CQPH29EwvbT5QWiUrejtUmzPXvw7L9g+T+C2/3W513EegRd9r7hEWaZdyG9ZkjiE8ab4no9OhprIRZNSL+uhBL2FMM6qzaXcq+HIto8JyyjF2GxaBJxVKqXrT9dSVW4mSfzwMIbpSNF2H1yUsjaFpqu71chHVY3xpjfbnZTuFwmbSEgxWfBBsQVeCXhpMXYbEG/jSHFVqMrTtoorVXuAbLWtLt2ujiKV+fgmj9Uxmr1yvN4ji9wMhjOquJ1MAaPQvgzDNkDo237IqGaKUYNQr0qWdGcjZXpDM6HcfDhrDdmxP6Kow6nMFTgs0rzf80P+9aSVtRq3VtO1Dha+R8REwrMSPtNu5oM5+Bd1vXWHdn32z5mG3O3rONE5v5rF9gqI/FPJvCSFuD2Fa/a2Otm8KTu4XexfeF1VztbWNn4Rlztz5YWuYtUYc64GAfBIuSavl4GjWCs5/Br631c0kR1hJw4AuvXkJAzlujBvJhdWbn1giqs97p9M+yr4vvV9eXruEZzZQf+ePD4kaQ2koVW/d+Z+5IzSBy6SPk4v64bfBrMEtyjPw5Fm95h3PNvB1Rde64vDMsWFw5ZcWhP+P683HcCeuKQKklymAevOI85uhgneMZrLmINEpUr4O7SrvEldUPK0PdHf1ScBsWt7CkwUKtTWkUjNbgwYp2YzWD8IwogtL61xTZpAa4zZjdILyqIYt87iZbPUzUWLi8wx0lfincQb1K1ZHJdiesSwI8+TJW0ViHliiN+c3tVBplbkrcB3hmxw6f+a3FZc2/fr391vbB6q82v7UdFdlimqd6WPmdNDuGWrOnsTyh1h8QmG6f2oKCIz6VsexTD5B9eKw2VuDQwzGi8lYs9wDl5xyoYaEDNUpc7Cmsk+NHWeZ1w2GtnENkVbD6b3Z2tK1hr088CPjQscnjMXloCrnuOWT6qUdybz/ALGgHmG8+7u1Pc/D04fhA8oWHUwmI5u9nJl5IS1NB9hNlaSpeqUk9Xtcn9ThJNvJcCpQ+KwUKJeNPCVbf5CWM0Vm32FVYytinj0tGdJ5b57HUTdGUUrFEV+ySRFesMNFVJIMaPJUWbMlEWC2JmqiVRC2S3e2xlHOrJkUpFhkqIZ0hK01nKFhCAkh68kdvRkoqVi9eSVkpk1JlsuaYlpKCJS5MlWnGFQeyGNaaV/T3xWlYdzKLpWHV6p9uSFrbLElnmBBnSWuFRmqmV0423RwsO3cv++9HODl+7Qy/OXIy1/87K0l4DLYHAgAAAABJRU5ErkJggg==";

let CATALOGO_CACHE = null;

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECCIÓN 1: CATÁLOGO DE PRECIOS
// ═══════════════════════════════════════════════════════════════════════════════════════

function insertarLogoEYM(hoja, columna, fila, anchoColumna) {
  try {
    const blob = Utilities.newBlob(Utilities.base64Decode(LOGO_EYM_B64), "image/png", "logo_eym.png");
    const offsetX = Math.max(0, (anchoColumna || 60) - 52);
    hoja.insertImage(blob, columna, fila, offsetX, 2).setWidth(46).setHeight(46);
    hoja.setRowHeight(fila, 52);
    return true;
  } catch (e) {
    Logger.log("⚠️ No se pudo insertar el logo: " + e);
    return false;
  }
}

function buscarHojaCatalogo(ss) {
  const exacta = ss.getSheetByName("CATÁLOGO_PRECIOS_2026");
  if (exacta) return exacta;
  const limpiar = t => t.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const hojas = ss.getSheets();
  for (let i = 0; i < hojas.length; i++) {
    if (limpiar(hojas[i].getName()).includes("catalogo")) {
      Logger.log("ℹ️ Catálogo tomado de la hoja: '" + hojas[i].getName() + "'");
      return hojas[i];
    }
  }
  Logger.log("⚠️ Hojas disponibles: " + hojas.map(h => h.getName()).join(" | "));
  return null;
}

function obtenerCatalogoPreciosDesdeSheet() {
  if (CATALOGO_CACHE !== null) {
    return CATALOGO_CACHE;
  }

  try {
    const ssDiag = SpreadsheetApp.openById(ID_DIAGNOSTICOS);
    const hojaCatalogo = buscarHojaCatalogo(ssDiag);

    if (!hojaCatalogo) {
      Logger.log("⚠️ ADVERTENCIA: No se encontró ninguna hoja de catálogo (el nombre debe contener 'catalogo')");
      return {};
    }

    const datos = hojaCatalogo.getDataRange().getValues();
    const catalogo = {};

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

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECCIÓN 2: PROCESAMIENTO DE RESPUESTAS
// ═══════════════════════════════════════════════════════════════════════════════════════

function obtenerUltimaRespuestaProcesada() {
  try {
    const ssDiag = SpreadsheetApp.openById(ID_DIAGNOSTICOS);
    const hojaDiag = ssDiag.getSheetByName("DIAGNOSTICOS_2026");
    if (!hojaDiag) {
      Logger.log("⚠️ No se pudo abrir DIAGNOSTICOS_2026");
      return 1;
    }

    const celda = hojaDiag.getRange(CONFIG.CELDA_CONTROL);
    const valor = celda.getValue();
    const resultado = valor ? parseInt(valor) : 1;

    Logger.log("📖 Obtenido de " + CONFIG.CELDA_CONTROL + ": " + resultado);
    return resultado;
  } catch (e) {
    Logger.log("⚠️ Error obteniendo control: " + e);
    return 1;
  }
}

function guardarUltimaRespuestaProcesada(numRespuesta) {
  try {
    const ssDiag = SpreadsheetApp.openById(ID_DIAGNOSTICOS);
    const hojaDiag = ssDiag.getSheetByName("DIAGNOSTICOS_2026");
    if (!hojaDiag) return;

    const celda = hojaDiag.getRange(CONFIG.CELDA_CONTROL);
    celda.setValue(numRespuesta);
    SpreadsheetApp.flush(); // Forzar la escritura inmediatamente

    Logger.log("💾 Guardado en " + CONFIG.CELDA_CONTROL + ": " + numRespuesta);
  } catch (e) {
    Logger.log("❌ Error guardando control: " + e);
  }
}

function procesarRespuestaFormulario() {
  try {
    const ssResp = SpreadsheetApp.openById(ID_RESPUESTAS_NUEVA);
    const ssDiag = SpreadsheetApp.openById(ID_DIAGNOSTICOS);
    const hojaResp = ssResp.getSheetByName("Respuestas de formulario 1");
    const hojaDiag = ssDiag.getSheetByName("DIAGNOSTICOS_2026");

    if (!hojaResp || !hojaDiag) {
      Logger.log("❌ ERROR: Hojas no encontradas");
      return;
    }

    const ultFilaResp = hojaResp.getLastRow();
    if (ultFilaResp <= 1) {
      Logger.log("⚠️ No hay respuestas");
      return;
    }

    const ultimaProcesada = obtenerUltimaRespuestaProcesada();
    let procesadas = 0;

    // Cargar TODOS los datos de DIAGNOSTICOS_2026 una sola vez para comparación eficiente
    const ultFilaDiag = hojaDiag.getLastRow();
    const datoDiagnosticos = ultFilaDiag > 1 ? hojaDiag.getRange(2, 1, ultFilaDiag - 1, 29).getValues() : [];

    Logger.log("🔍 Última respuesta procesada: " + ultimaProcesada);
    Logger.log("🔍 Total respuestas en formulario: " + (ultFilaResp - 1));
    Logger.log("🔍 Procesando SOLO desde fila " + (ultimaProcesada + 1) + " en adelante");
    Logger.log("🔍 Diagnósticos existentes: " + datoDiagnosticos.length);

    // ⚠️ CRÍTICO: Solo procesar NUEVAS respuestas desde la última procesada
    // Validación de duplicados por OPORTUNIDAD (es única)
    for (let r = ultimaProcesada + 1; r <= ultFilaResp; r++) {
      Logger.log("\n📌 Validando respuesta #" + r);
      const resp = hojaResp.getRange(r, 1, 1, 34).getValues()[0];

      const oportunidadResp = resp[2] ? resp[2].toString().trim() : "";

      let yaExiste = false;

      // Validación por OPORTUNIDAD (es el identificador único)
      for (let diagRow of datoDiagnosticos) {
        const oportunidadDiag = diagRow[1] ? diagRow[1].toString().trim() : ""; // Columna B

        if (oportunidadResp === oportunidadDiag && oportunidadResp !== "") {
          Logger.log("⚠️ DUPLICADO DETECTADO - Oportunidad: " + oportunidadResp);
          Logger.log("⚠️ Esta oportunidad ya existe en DIAGNOSTICOS_2026, saltando...");
          yaExiste = true;
          break;
        }
      }

      if (yaExiste) {
        Logger.log("⏭️ Respuesta #" + r + " IGNORADA (oportunidad ya existe)");
        continue;
      }

      Logger.log("✅ Respuesta #" + r + " es NUEVA, procesando...");

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
        resp[1] || new Date(),
        resp[2] || "",
        resp[3] || "",
        resp[4] || "",
        "",
        resp[6] || "",
        resp[13] || "",
        resp[7] || "",
        resp[8] || "",
        resp[9] || "",
        resp[10] || "",
        resp[11] || "",
        resp[12] || "",
        componentes.join("; "),
        resp[25] || "",
        resp[26] || "",
        resp[27] || "",
        resp[28] || "",
        "",
        0,
        0,
        0,
        0,
        0,
        resp[29] || "",
        "Diagnosticado",
        "",
        "",
        "",
        ""
      ];

      const newFila = hojaDiag.getLastRow() + 1;
      hojaDiag.getRange(newFila, 1, 1, fila.length).setValues([fila]);

      calcularSubtotales(hojaDiag, newFila);
      validarYResaltarColumnaU(hojaDiag, newFila);

      procesadas++;
    }

    if (procesadas > 0) {
      guardarUltimaRespuestaProcesada(ultFilaResp);
      Logger.log("✅ " + procesadas + " diagnóstico(s) procesado(s) automáticamente");
    }

  } catch (e) {
    Logger.log("❌ ERROR: " + e);
  }
}

function validarYResaltarColumnaU(hoja, fila) {
  try {
    // Columna O = 15, Columna P = 16, Columna U = 21
    const valorO = hoja.getRange(fila, 15).getValue() || "";
    const valorP = hoja.getRange(fila, 16).getValue() || "";
    const celdaU = hoja.getRange(fila, 21);

    // Si O o P tienen contenido, resaltar U en amarillo
    if (valorO || valorP) {
      celdaU.setBackground("#FFFF00"); // Amarillo
      celdaU.setFontColor("#000000"); // Texto negro para contrastar
      Logger.log("✅ Fila " + fila + ": Columna U resaltada en amarillo (O o P tienen contenido)");
    } else {
      celdaU.setBackground("#FFFFFF"); // Blanco si no hay contenido
    }
  } catch (e) {
    Logger.log("⚠️ Error validando columna U: " + e);
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
    hoja.getRange(fila, 24).setFormula("=SUM(T" + fila + ":W" + fila + ")");

  } catch (e) {
    Logger.log("❌ Error: " + e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECCIÓN 3: FUNCIONES NUMÉRICAS (EYM, OP)
// ═══════════════════════════════════════════════════════════════════════════════════════

function obtenerProximoEYM(hoja) {
  try {
    const columnaE = hoja.getRange("E:E").getValues();
    let maxEYM = 60036;

    for (let i = 1; i < columnaE.length; i++) {
      const valor = columnaE[i][0];
      if (valor && !isNaN(valor)) {
        const num = parseInt(valor);
        if (num > maxEYM) {
          maxEYM = num;
        }
      }
    }

    return maxEYM + 1;
  } catch (e) {
    Logger.log("⚠️ Error obteniendo próximo EYM: " + e);
    return 60037;
  }
}

function obtenerProximoOP(hojaOP) {
  try {
    const columnaA = hojaOP.getRange("A:A").getValues();
    let maxOP = 7559;

    for (let i = 1; i < columnaA.length; i++) {
      const valor = columnaA[i][0];
      if (valor && !isNaN(valor)) {
        const num = parseInt(valor);
        if (num > maxOP) {
          maxOP = num;
        }
      }
    }

    return maxOP + 1;
  } catch (e) {
    Logger.log("⚠️ Error obteniendo próximo OP: " + e);
    return 7560;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECCIÓN 4: INTEGRACIÓN ODOO - CREAR RMA
// ═══════════════════════════════════════════════════════════════════════════════════════

function obtenerCredencialesOdoo() {
  const props = PropertiesService.getUserProperties();

  // Obtener credenciales del almacenamiento seguro
  const creds = {
    url: props.getProperty("ODOO_URL") || "https://eym-oficinas.ovh",
    urlWeb: props.getProperty("ODOO_URL_WEB") || "https://eym-oficinas.ovh/web",
    database: props.getProperty("ODOO_DATABASE") || "eym1",
    username: props.getProperty("ODOO_USERNAME"),
    password: props.getProperty("ODOO_PASSWORD")
  };

  // Si faltan credenciales, avisar
  if (!creds.username || !creds.password) {
    Logger.log("⚠️ Credenciales no configuradas. Usa: Menú → EYM v6.0 → ⚙️ Configurar Credenciales");
    return null;
  }

  return creds;
}

function configurarCredencialesOdoo() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt(
    "🔐 CONFIGURAR CREDENCIALES ODOO\n\n" +
    "Formato: usuario|password|database|url\n\n" +
    "Ejemplo:\nusuario@dominio.com|su_clave|eym1|https://eym-oficinas.ovh",
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const input = response.getResponseText().trim();
  const partes = input.split("|");

  if (partes.length < 2) {
    ui.alert("❌ Formato incorrecto");
    return;
  }

  const props = PropertiesService.getUserProperties();
  props.setProperty("ODOO_USERNAME", partes[0].trim());
  props.setProperty("ODOO_PASSWORD", partes[1].trim());
  props.setProperty("ODOO_DATABASE", partes[2]?.trim() || "eym1");
  props.setProperty("ODOO_URL", partes[3]?.trim() || "https://eym-oficinas.ovh");
  props.setProperty("ODOO_URL_WEB", partes[3]?.trim() + "/web" || "https://eym-oficinas.ovh/web");

  ui.alert("✅ Credenciales guardadas de forma segura");
}

function listarBaseDatosOdoo(creds) {
  try {
    // Prueba 1: Verificar que el servidor está vivo
    Logger.log("\n🔗 Prueba 1: Verificando servidor Odoo...");
    try {
      const headResponse = UrlFetchApp.fetch(creds.url, {
        method: "head",
        muteHttpExceptions: true,
        followRedirects: true
      });
      Logger.log("✅ Servidor respondió: " + headResponse.getResponseCode());
    } catch (headError) {
      Logger.log("⚠️ HEAD request falló: " + headError.toString());
    }

    // Prueba 2: Intentar GET a /web
    Logger.log("\n🔗 Prueba 2: Verificando /web...");
    try {
      const webResponse = UrlFetchApp.fetch(creds.url + "/web", {
        method: "get",
        muteHttpExceptions: true,
        followRedirects: false
      });
      Logger.log("✅ /web status: " + webResponse.getResponseCode());
    } catch (webError) {
      Logger.log("⚠️ /web falló: " + webError.toString());
    }

    // Prueba 3: Listar BDs en /jsonrpc
    Logger.log("\n🔗 Prueba 3: Listando BDs...");
    const url = creds.url + "/jsonrpc";
    const payload = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "db",
        method: "list",
        args: []  // db.list no necesita argumentos
      }
    };

    Logger.log("📤 POST a: " + url);

    const response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      headers: {
        "Accept": "application/json"
      }
    });

    Logger.log("📥 Status: " + response.getResponseCode());
    const responseText = response.getContentText();
    Logger.log("📥 Response: " + responseText.substring(0, 300));

    if (!responseText) {
      Logger.log("❌ Respuesta vacía");
      return null;
    }

    const resultado = JSON.parse(responseText);

    if (resultado.error) {
      Logger.log("❌ Error: " + JSON.stringify(resultado.error));
      return null;
    }

    return resultado.result || [];

  } catch (e) {
    Logger.log("❌ Error: " + e.toString());
    Logger.log("Stack: " + e.stack);
    return null;
  }
}

function consolidarProductos(componentesTexto) {
  try {
    if (!componentesTexto) return [];

    const componentes = componentesTexto.toString().split(";");
    const productosMap = {};

    componentes.forEach(comp => {
      const compLimpio = comp.trim();
      if (!compLimpio) return;

      const nombreNormalizado = normalizarTexto(compLimpio);

      if (!productosMap[nombreNormalizado]) {
        productosMap[nombreNormalizado] = {
          nombre: compLimpio,
          cantidad: 0,
          precio: obtenerPrecioDelCatalogo(compLimpio),
          codigoOdoo: buscarCodigoOdooDelCatalogo(compLimpio)
        };
      }

      productosMap[nombreNormalizado].cantidad += 1;
    });

    return Object.values(productosMap);

  } catch (e) {
    Logger.log("❌ Error consolidando productos: " + e);
    return [];
  }
}

function buscarCodigoOdooDelCatalogo(nombreProducto) {
  try {
    const ssDiag = SpreadsheetApp.openById(ID_DIAGNOSTICOS);
    const hojaCatalogo = buscarHojaCatalogo(ssDiag);

    if (!hojaCatalogo) {
      return null;
    }

    const datos = hojaCatalogo.getDataRange().getValues();
    const nombreNormalizado = normalizarTexto(nombreProducto);

    for (let i = 1; i < datos.length; i++) {
      const nombre = normalizarTexto(datos[i][0] || "");
      const codigoOdoo = datos[i][2];

      if (nombre === nombreNormalizado && codigoOdoo) {
        return codigoOdoo;
      }
    }

    return null;

  } catch (e) {
    Logger.log("⚠️ Error buscando código Odoo: " + e);
    return null;
  }
}

let ODOO_UID_CACHE = null;
let ODOO_ULTIMO_ERROR = "";

function odooUid(creds) {
  const clave = creds.url + "|" + creds.database + "|" + creds.username;
  if (ODOO_UID_CACHE && ODOO_UID_CACHE.clave === clave) return ODOO_UID_CACHE.uid;

  const authPayload = {
    jsonrpc: "2.0",
    method: "call",
    params: { service: "common", method: "authenticate", args: [creds.database, creds.username, creds.password, {}] }
  };
  const authResponse = UrlFetchApp.fetch(creds.url + "/jsonrpc", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(authPayload),
    muteHttpExceptions: true
  });
  const authResult = JSON.parse(authResponse.getContentText());
  if (authResult.error || !authResult.result) {
    ODOO_ULTIMO_ERROR = "Autenticación en Odoo fallida (revisa usuario, clave y base de datos)";
    Logger.log("❌ " + ODOO_ULTIMO_ERROR);
    return null;
  }
  ODOO_UID_CACHE = { clave: clave, uid: authResult.result };
  Logger.log("✅ Odoo autenticado (UID " + authResult.result + ")");
  return authResult.result;
}

function llamarOdooXMLRPC(modelo, metodo, args, creds, kwargs) {
  try {
    const uid = odooUid(creds);
    if (!uid) return null;

    const executeKwArgs = [creds.database, uid, creds.password, modelo, metodo, Array.isArray(args) ? args : []];
    if (kwargs) executeKwArgs.push(kwargs);

    const payload = {
      jsonrpc: "2.0",
      method: "call",
      params: { service: "object", method: "execute_kw", args: executeKwArgs }
    };

    const response = UrlFetchApp.fetch(creds.url + "/jsonrpc", {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      headers: { "Accept": "application/json" }
    });

    const responseText = response.getContentText();
    if (!responseText) {
      ODOO_ULTIMO_ERROR = "Respuesta vacía de Odoo (HTTP " + response.getResponseCode() + ")";
      Logger.log("❌ " + ODOO_ULTIMO_ERROR);
      return null;
    }

    let resultado;
    try {
      resultado = JSON.parse(responseText);
    } catch (parseError) {
      ODOO_ULTIMO_ERROR = "Odoo no devolvió JSON (HTTP " + response.getResponseCode() + ")";
      Logger.log("❌ " + ODOO_ULTIMO_ERROR + ": " + responseText.substring(0, 300));
      return null;
    }

    if (resultado.error) {
      const detalle = (resultado.error.data && resultado.error.data.message) || resultado.error.message || JSON.stringify(resultado.error);
      ODOO_ULTIMO_ERROR = modelo + "." + metodo + ": " + detalle;
      Logger.log("❌ Error Odoo en " + ODOO_ULTIMO_ERROR);
      return null;
    }

    return resultado.result;

  } catch (e) {
    ODOO_ULTIMO_ERROR = "Excepción llamando a Odoo: " + e.toString();
    Logger.log("❌ " + ODOO_ULTIMO_ERROR);
    return null;
  }
}

function buscarClienteOdoo(nombreCliente, creds) {
  try {
    const resultado = llamarOdooXMLRPC(
      "res.partner",
      "search",
      [[["name", "ilike", nombreCliente]]],
      creds
    );

    if (resultado && resultado.length > 0) {
      return resultado[0];
    }

    return null;

  } catch (e) {
    Logger.log("⚠️ Error buscando cliente: " + e);
    return null;
  }
}

function crearClienteOdoo(nombreCliente, creds) {
  try {
    const clienteData = {
      name: nombreCliente,
      is_company: false,
      customer_rank: 1
    };

    const clienteId = llamarOdooXMLRPC(
      "res.partner",
      "create",
      [clienteData],
      creds
    );

    return clienteId;

  } catch (e) {
    Logger.log("❌ Error creando cliente: " + e);
    return null;
  }
}

function buscarProductoOdoo(nombreProducto, creds) {
  try {
    const resultado = llamarOdooXMLRPC(
      "product.product",
      "search",
      [[["name", "ilike", nombreProducto]]],
      creds
    );

    if (resultado && resultado.length > 0) {
      return resultado[0];
    }

    return null;

  } catch (e) {
    Logger.log("⚠️ Error buscando producto: " + e);
    return null;
  }
}

function crearRMAenOdoo(datosRMA) {
  try {
    const creds = obtenerCredencialesOdoo();

    const productosConsolidados = consolidarProductos(datosRMA.componentes);

    Logger.log("🔄 Creando RMA en Odoo para cliente: " + datosRMA.cliente);
    Logger.log("   Productos consolidados: " + JSON.stringify(productosConsolidados));

    let clienteOdooId = buscarClienteOdoo(datosRMA.cliente, creds);
    if (!clienteOdooId) {
      Logger.log("⚠️ Cliente no encontrado, creando...");
      clienteOdooId = crearClienteOdoo(datosRMA.cliente, creds);
      if (!clienteOdooId) {
        return { exito: false, error: "No se pudo crear cliente en Odoo" };
      }
    }

    const rmaData = {
      partner_id: clienteOdooId,
      reference: "RMA-" + datosRMA.numeroEyM,
      description: "Reparación de silla - EyM: " + datosRMA.numeroEyM,
      type: "customer",
      state: "draft"
    };

    const numeroRMA = llamarOdooXMLRPC("rma.rma", "create", [rmaData], creds);

    if (!numeroRMA) {
      Logger.log("❌ Error creando RMA en Odoo");
      return { exito: false, error: "Error en llamada XML-RPC" };
    }

    const linkRMA = creds.urlWeb + "#id=" + numeroRMA + "&model=rma.rma&view_type=form";

    Logger.log("✅ RMA creada exitosamente: RMA-" + numeroRMA);

    return {
      exito: true,
      numeroRMA: numeroRMA,
      referenciaRMA: "RMA-" + numeroRMA,
      linkRMA: linkRMA
    };

  } catch (e) {
    Logger.log("❌ Error en crearRMAenOdoo: " + e.toString());
    return { exito: false, error: e.toString() };
  }
}

function escribirRMAenHoja(hoja, fila, numeroRMA, linkRMA) {
  try {
    const celdaRMA = hoja.getRange(fila, 29);
    celdaRMA.setValue(numeroRMA);
    celdaRMA.setFormula('=HYPERLINK("' + linkRMA + '","' + numeroRMA + '")');
    celdaRMA.setFontColor("#0000FF");
    celdaRMA.setFontLine("underline");

    Logger.log("✅ RMA escrito en columna AC: " + numeroRMA + " con link");

  } catch (e) {
    Logger.log("❌ Error escribiendo RMA: " + e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECCIÓN 5: TRIGGERS (onEdit, onOpen)
// ═══════════════════════════════════════════════════════════════════════════════════════
// FUNCIÓN CONSOLIDADA ÚNICA - Captura todos los 5 métodos de entrada en columna AA (27):


function instalarTriggerAutomatico() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => {
      if (t.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT) {
        ScriptApp.deleteTrigger(t);
      }
    });

    const ssDiag = SpreadsheetApp.openById(ID_DIAGNOSTICOS);
    const hojaDiag = ssDiag.getSheetByName("DIAGNOSTICOS_2026");
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
    const hojaDiag = ss.getSheetByName("DIAGNOSTICOS_2026");
    const hojaOP = ss.getSheetByName("OP_2026");

    if (!hojaDiag || !hojaOP) {
      SpreadsheetApp.getUi().alert("❌ Hojas no encontradas");
      return;
    }

    const ultFila = hojaDiag.getLastRow();
    let procesadas = 0;

    for (let f = 2; f <= ultFila; f++) {
      // Usar columna 27 (AA - ESTADO_APROBACION)
      const estadoAprobacion = hojaDiag.getRange(f, 27).getValue();
      if (estadoAprobacion && estadoAprobacion.toString().toLowerCase().includes("aprobado")) {
        // Verificar si ya tiene EYM
        const eymExistente = hojaDiag.getRange(f, 5).getValue();
        if (!eymExistente) {
          crearOP(hojaDiag, hojaOP, f);
          procesadas++;
        }
      }
    }

    SpreadsheetApp.getUi().alert("✅ " + procesadas + " OP creadas");
  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ ERROR: " + e);
  }
}

function recalcularTodo() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName("DIAGNOSTICOS_2026");
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

// ═════════════════════════════════════════════════════════════════════════════════════════
// NUEVAS FUNCIONES V5: GENERAR PDF CONSOLIDADO + FINALIZAR OPORTUNIDAD
// ═════════════════════════════════════════════════════════════════════════════════════════

function diagnosticarHojas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojas = ss.getSheets();
  let nombres = "Hojas disponibles:\n";
  for (let h of hojas) {
    nombres += "- '" + h.getName() + "'\n";
  }
  SpreadsheetApp.getUi().alert(nombres);
}

function pruebaOnEdit() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName("DIAGNOSTICOS_2026");

    if (!hoja) {
      SpreadsheetApp.getUi().alert("❌ Hoja DIAGNOSTICOS_2026 no encontrada");
      return;
    }

    // Simular cambio en columna AA (27) con valor "Aprobado"
    const ultimaFila = hoja.getLastRow();
    if (ultimaFila < 2) {
      SpreadsheetApp.getUi().alert("❌ No hay datos en la hoja");
      return;
    }

    Logger.log("\n🧪 ════════════════════════════════════════════════════════");
    Logger.log("🧪 PRUEBA DE onEdit()");
    Logger.log("🧪 Simulando edición en columna AA, fila " + ultimaFila);
    Logger.log("🧪 Escribiendo valor: 'Aprobado'");
    Logger.log("🧪 ════════════════════════════════════════════════════════\n");

    // IMPORTANTE: Esta es una PRUEBA manual
    // Para que onEdit() se dispare automáticamente:
    // 1. Abre Google Sheets
    // 2. Ve a DIAGNOSTICOS_2026
    // 3. Haz clic en columna AA (ESTADO_APROBACION)
    // 4. Digita "Aprobado" y presiona Enter
    // 5. Revisa los logs (Extensiones > Apps Script > Ejecuciones)

    SpreadsheetApp.getUi().alert(
      "🧪 INSTRUCCIONES DE PRUEBA:\n\n" +
      "onEdit() se dispara AUTOMÁTICAMENTE en Google Sheets.\n\n" +
      "Para probar:\n" +
      "1. Ve a columna AA (ESTADO_APROBACION)\n" +
      "2. En cualquier fila (ej: fila 2)\n" +
      "3. Digita: Aprobado\n" +
      "4. Presiona ENTER\n" +
      "5. Verifica los logs en:\n" +
      "   Extensiones > Apps Script > Ejecuciones\n\n" +
      "Si los logs no aparecen, hay un error en onEdit().\n" +
      "Revisa en: Extensiones > Apps Script > Mis ejecuciones > (ícono de error)"
    );

  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ Error en prueba: " + e.toString());
  }
}

function configurarValidacionAprobacion() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName("DIAGNOSTICOS_2026");

    if (!hoja) {
      SpreadsheetApp.getUi().alert("Hoja DIAGNOSTICOS_2026 no encontrada");
      return;
    }

    const ultFila = hoja.getLastRow();
    const columnaAE = hoja.getRange("AE2:AE" + ultFila);

    const rule = SpreadsheetApp.newDataValidation()
      .allowList(["Aprobado", "Cotización", "Pendiente", "Rechazado"])
      .setHelpText("Selecciona una opción: Aprobado, Pendiente o Rechazado")
      .setShowDropdown(true)
      .build();

    columnaAE.setDataValidation(rule);

    SpreadsheetApp.getUi().alert("✅ LISTAS DESPLEGABLES CONFIGURADAS\n\nAhora puedes hacer clic en la columna AE y seleccionar de la lista");

  } catch (e) {
    SpreadsheetApp.getUi().alert("ERROR: " + e.toString());
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// NUEVA FUNCIÓN: Generar Presupuesto PDF (silla por silla) - Descargable
// El usuario puede descargarlo y guardarlo donde prefiera, luego adjuntarlo manualmente
// ═══════════════════════════════════════════════════════════════════════════════════════

function generarPresupuestoDescargable() {
  try {
    const ui = SpreadsheetApp.getUi();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hojaDiag = ss.getSheetByName("DIAGNOSTICOS_2026");

    if (!hojaDiag) {
      ui.alert("❌ Hoja DIAGNOSTICOS_2026 no encontrada");
      return;
    }

    // Pedir nombre de la oportunidad
    const response = ui.prompt("📋 Ingresa el NOMBRE EXACTO de la OPORTUNIDAD:\n(Debe ser idéntico al de la columna B. Ej: Mensula Rubby 03/10/2026)");

    if (response.getSelectedButton() === ui.Button.CANCEL) return;

    const nombreOportunidad = response.getResponseText().trim();
    if (!nombreOportunidad) {
      ui.alert("⚠️ Debes ingresar un nombre de oportunidad");
      return;
    }

    Logger.log("\n🖨️ ════════════════════════════════════════════════════════");
    Logger.log("🖨️ INICIANDO: Generar Presupuesto Descargable");
    Logger.log("🖨️ Oportunidad: " + nombreOportunidad);
    Logger.log("🖨️ ════════════════════════════════════════════════════════");

    // Obtener diagnósticos de la oportunidad
    Logger.log("🖨️ PASO 1: Buscando diagnósticos...");
    const diagnosticos = obtenerDiagnosticosDeOportunidad(hojaDiag, nombreOportunidad);

    if (diagnosticos.length === 0) {
      Logger.log("❌ NO se encontraron diagnósticos");
      ui.alert("❌ " + mensajeOportunidadNoEncontrada(hojaDiag, nombreOportunidad));
      return;
    }

    Logger.log("✅ Diagnósticos encontrados: " + diagnosticos.length);

    // Agrupar por silla y calcular totales
    Logger.log("🖨️ PASO 2: Agrupando por silla...");
    const silasDatos = agruparPorSilla(diagnosticos, hojaDiag);
    const totalGeneral = calcularTotalGeneral(silasDatos);
    const cliente = diagnosticos[0].cliente;
    let advertencia = "";
    const borradorPrevio = consolidarBorradorRMA(silasDatos);
    if (Math.abs(totalGeneral - borradorPrevio.total) > 1) {
      const dif = Math.round(totalGeneral - borradorPrevio.total);
      advertencia = "\n\n🚨 ALARMA: el total silla x silla ($" + formatearNumero(totalGeneral) + ") NO es igual al consolidado por ítem ($" +
        formatearNumero(borradorPrevio.total) + "). Diferencia: $" + formatearNumero(dif) + ". Revisa los precios (se marcó en la columna AD).";
      escribirAlarmaEnFilas(hojaDiag, diagnosticos.map(d => d.fila),
        "Total silla x silla " + formatearNumero(totalGeneral) + " ≠ consolidado por ítem " + formatearNumero(borradorPrevio.total) + " (dif. " + formatearNumero(dif) + "). Revisar precios.");
    }

    Logger.log("✅ Sillas encontradas: " + silasDatos.length);
    Logger.log("✅ Cliente: " + cliente);
    Logger.log("✅ Total General: " + totalGeneral);

    // Generar PDF (esto crea un documento en Google Drive)
    Logger.log("🖨️ PASO 3: Generando PDF...");
    const pdfs = generarPDFDiagnosticos(nombreOportunidad, cliente, silasDatos, totalGeneral);

    if (!pdfs || !pdfs.presupuesto) {
      Logger.log("❌ FALLO en generarPDFDiagnosticos()");
      ui.alert("❌ Error generando PDF\n\nRevisa la consola (Extensions > Apps Script > Executions) para ver detalles del error.");
      return;
    }

    Logger.log("✅ PDF Generado exitosamente");

    // Mostrar mensaje de éxito con el link
    Logger.log("🖨️ PASO 4: Mostrando resultado al usuario...");
    ui.alert(
      "✅ PRESUPUESTO GENERADO\n\n" +
      "Oportunidad: " + nombreOportunidad + "\n" +
      "Cliente: " + cliente + "\n" +
      "Sillas: " + silasDatos.length + "\n" +
      "Total: $" + formatearNumero(totalGeneral) + "\n\n" +
      "📄 Se crearon 2 PDF en Google Drive.\n\n" +
      "1) Presupuesto silla x silla:\n" + pdfs.presupuesto + "\n\n" +
      "2) Consolidado de repuestos:\n" + (pdfs.consolidado || "(no disponible)") + advertencia
    );

    Logger.log("🖨️ ════════════════════════════════════════════════════════");
    Logger.log("✅ PRESUPUESTO DESCARGABLE COMPLETADO EXITOSAMENTE");
    Logger.log("🖨️ ════════════════════════════════════════════════════════\n");

  } catch (e) {
    Logger.log("❌ ERROR FATAL en generarPresupuestoDescargable():");
    Logger.log("❌ Mensaje: " + e.toString());
    Logger.log("❌ Stack: " + e.stack);
    SpreadsheetApp.getUi().alert("❌ Error: " + e.toString() + "\n\nRevisa los logs para más detalles.");
  }
}

function finalizarOportunidad() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hojas = ss.getSheets();
    let hojaDiag = null;

    for (let h of hojas) {
      if (h.getName() === "DIAGNOSTICOS_2026") {
        hojaDiag = h;
        break;
      }
    }

    if (!hojaDiag) {
      SpreadsheetApp.getUi().alert("Hoja DIAGNOSTICOS_2026 no encontrada");
      return;
    }

    const ui = SpreadsheetApp.getUi();
    const response = ui.prompt("Ingresa el NOMBRE EXACTO de la OPORTUNIDAD (idéntico a la columna B):");

    if (response.getSelectedButton() == ui.Button.CANCEL) return;

    const nombreOportunidad = response.getResponseText().trim();
    if (!nombreOportunidad) {
      ui.alert("Debes ingresar un nombre");
      return;
    }

    Logger.log("Finalizando: " + nombreOportunidad);

    const resultadoFinal = procesarOportunidadCompleta(hojaDiag, nombreOportunidad, true);

    if (!resultadoFinal.exito) {
      ui.alert("❌ ERROR:\n\n" + resultadoFinal.error);
      return;
    }

    ui.alert(resultadoFinal.mensaje);

  } catch (e) {
    Logger.log("Error: " + e);
    SpreadsheetApp.getUi().alert("ERROR: " + e.toString());
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// NUEVA FUNCIÓN: Procesar RMAs pendientes de creación en Odoo
// Esta función procesa todas las filas "Aprobado" que aún no tienen REFERENCIA_RMA
// ═══════════════════════════════════════════════════════════════════════════════════════

function procesarRMAsPendientes() {
  try {
    Logger.log("\n🟠 ════════════════════════════════════════════════════════");
    Logger.log("🟠 Iniciando procesamiento de RMAs pendientes");
    Logger.log("🟠 ════════════════════════════════════════════════════════");

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hojaDiag = ss.getSheetByName("DIAGNOSTICOS_2026");

    if (!hojaDiag) {
      SpreadsheetApp.getUi().alert("❌ Hoja DIAGNOSTICOS_2026 no encontrada");
      return;
    }

    const ultFila = hojaDiag.getLastRow();
    let procesadas = 0;
    let errores = [];

    for (let f = 2; f <= ultFila; f++) {
      try {
        const estadoAprobacion = hojaDiag.getRange(f, 27).getValue() || ""; // Columna AA
        const referenciaRMA = hojaDiag.getRange(f, 29).getValue() || ""; // Columna AC
        const nombreOportunidad = hojaDiag.getRange(f, 2).getValue() || ""; // Columna B

        // Buscar filas marcadas como "Aprobado" O "⏳ Pendiente RMA" sin REFERENCIA_RMA
        const esAprobado = estadoAprobacion.toString().toLowerCase().includes("aprobado");
        const esPendienteRMA = estadoAprobacion.toString().toLowerCase().includes("pendiente rma") ||
                                referenciaRMA.toString().includes("⏳");
        const sinRMA = !referenciaRMA || referenciaRMA.toString().trim() === "" || referenciaRMA.toString().includes("⏳");

        if ((esAprobado || esPendienteRMA) && sinRMA && nombreOportunidad) {
          Logger.log("\n📍 Fila " + f + ": Procesando RMA para " + nombreOportunidad);

          // Procesar la oportunidad completa (RMA + PDF + Adjunto)
          const resultado = procesarOportunidadCompleta(hojaDiag, nombreOportunidad, false);

          if (resultado.exito) {
            Logger.log("✅ RMA creada: " + resultado.referenciaRMA);

            // Limpiar marca de pendiente
            const marcaPendiente = hojaDiag.getRange(f, 27).getValue();
            if (marcaPendiente && marcaPendiente.toString().includes("pendiente")) {
              hojaDiag.getRange(f, 27).setValue("Aprobado");
            }

            procesadas++;
          } else {
            Logger.log("❌ Error: " + resultado.error);
            errores.push("Fila " + f + ": " + resultado.error);
          }
        }
      } catch (rowError) {
        Logger.log("❌ Error procesando fila " + f + ": " + rowError.toString());
        errores.push("Fila " + f + ": " + rowError.toString());
      }
    }

    Logger.log("\n🟢 ════════════════════════════════════════════════════════");
    Logger.log("🟢 Resultado: " + procesadas + " RMA(s) creada(s)");
    if (errores.length > 0) {
      Logger.log("🟢 Errores: " + errores.length);
      errores.forEach(e => Logger.log("  - " + e));
    }
    Logger.log("🟢 ════════════════════════════════════════════════════════\n");

    const mensaje = "✅ RMAs procesadas: " + procesadas + (errores.length > 0 ? "\n\n⚠️ Errores: " + errores.length + "\n\nRevisar logs para detalles" : "");
    SpreadsheetApp.getUi().alert(mensaje);

  } catch (e) {
    Logger.log("\n❌ ════════════════════════════════════════════════════════");
    Logger.log("❌ ERROR en procesarRMAsPendientes:");
    Logger.log("❌ " + e.toString());
    Logger.log("❌ Stack: " + e.stack);
    Logger.log("❌ ════════════════════════════════════════════════════════\n");

    SpreadsheetApp.getUi().alert("❌ ERROR:\n\n" + e.toString());
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// NUEVA FUNCIÓN: PROCESAR OPORTUNIDAD COMPLETA
// Consolida todo el flujo: RMA + PDF + Adjuntar
// ═══════════════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════════════
// TRIGGER AUTOMÁTICO: GENERAR EYM + OP AL MARCAR "APROBADO"
// Captura los 5 métodos de entrada en columna AA (27):
// 1. Dropdown selection, 2. Copy/paste, 3. Drag operation, 4. Manual text entry, 5. Odoo sync
// ═══════════════════════════════════════════════════════════════════════════════════════

function procesarAprobacionEnFila(hoja, fila) {
  try {
    Logger.log("\n🔵 ════════════════════════════════════════════════════════");
    Logger.log("🔵 INICIANDO PROCESAMIENTO DE APROBACIÓN - Fila " + fila);
    Logger.log("🔵 ════════════════════════════════════════════════════════");

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hojaOP = ss.getSheetByName("OP_2026");

    if (!hojaOP) {
      Logger.log("❌ ERROR: Hoja OP_2026 no encontrada");
      return;
    }

    // PASO 1: Generar número EYM si no existe
    Logger.log("\n📍 PASO 1: Generando número EYM...");
    const celdaEYM = hoja.getRange(fila, 5);
    const numeroEYMActual = celdaEYM.getValue();
    let numeroEYMFinal = numeroEYMActual;

    if (!numeroEYMActual || numeroEYMActual.toString().trim() === "") {
      numeroEYMFinal = obtenerProximoEYM(hoja);
      celdaEYM.setValue(numeroEYMFinal);
      celdaEYM.setBackground("#FFFF00");
      celdaEYM.setFontColor("#0000FF");
      Logger.log("✅ Número EYM generado: " + numeroEYMFinal);
      SpreadsheetApp.flush(); // Garantiza que se escriba antes de continuar
    } else {
      Logger.log("✅ Número EYM ya existe: " + numeroEYMActual);
    }

    // PASO 2: Registrar fecha de aprobación en columna AB (28)
    Logger.log("\n📍 PASO 2: Registrando fecha de aprobación...");
    const ahora = new Date();
    hoja.getRange(fila, 28).setValue(ahora);
    Logger.log("✅ Fecha de aprobación registrada: " + ahora.toLocaleString());
    SpreadsheetApp.flush();

    // PASO 3: Crear OP
    Logger.log("\n📍 PASO 3: Creando Orden de Producción...");
    crearOP(hoja, hojaOP, fila);
    Logger.log("✅ OP creada correctamente");
    SpreadsheetApp.flush();

    Logger.log("\n🟢 ════════════════════════════════════════════════════════");
    Logger.log("🟢 APROBACIÓN COMPLETADA - EYM: " + numeroEYMFinal);
    Logger.log("🟢 ════════════════════════════════════════════════════════\n");

  } catch (e) {
    Logger.log("\n❌ ════════════════════════════════════════════════════════");
    Logger.log("❌ ERROR en procesarAprobacionEnFila (Fila " + fila + "):");
    Logger.log("❌ " + e.toString());
    Logger.log("❌ Stack: " + e.stack);
    Logger.log("❌ ════════════════════════════════════════════════════════\n");
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// FUNCIÓN: Crear Orden de Producción (OP) - Mapeo de 29 columnas DIAGNOSTICOS a 16 columnas OP
// Columnas DIAGNOSTICOS_2026 (29 columnas):
// A=1:FECHA_DIAGNOSTICO, B=2:OPORTUNIDAD, C=3:CLIENTE, D=4:TIPO_SILLA, E=5:NUMERO_EYM,
// F=6:#_TEMPORAL, G=7:FOTO, H=8:ACTIVO, I=9:CONDICION_SILLA, J=10:TIPO_TELA, K=11:COLOR,
// L=12:UBICACION, M=13:GARANTIA, N=14:Repuestos, O=15:OTROS_SERVICIOS,
// P=16:OBSERVACIONES_ESPECIALES, Q=17:TAPICERIA_Asiento, R=18:TAPICERIA_Espaldar,
// S=19:PRESUPUESTO_GENERADO, T=20:Repuestos, U=21:Subtotal_OtrosServicios,
// V=22:Subtotal_Tapiceria, W=23:Subtotal_MO_Mantenimiento, X=24:TOTAL_PPTTO,
// Y=25:OPERARIO_DIAGNOSTICA, Z=26:ESTADO_DIAGNOSTICO, AA=27:ESTADO_APROBACION,
// AB=28:FECHA_APROBACION, AC=29:REFERENCIA_RMA
// ═══════════════════════════════════════════════════════════════════════════════════════
function crearOP(hojaDiag, hojaOP, fila) {
  try {
    const numeroEYM = hojaDiag.getRange(fila, 5).getValue(); // Columna E
    const nuevoOP = obtenerProximoOP(hojaOP);

    // Obtener servicios y combinarlos
    // OTROS SERVICIOS está en columna 15 (O), OBSERVACIONES en 16 (P)
    const otrosServicios = hojaDiag.getRange(fila, 15).getValue() || "";
    const observaciones = hojaDiag.getRange(fila, 16).getValue() || "";
    const serviciosCombinados = [otrosServicios, observaciones].filter(s => s).join("; ");

    // TAPICERIA: Columna 17 (Q) = Asiento, Columna 18 (R) = Espaldar
    const tapiceriaAsiento = hojaDiag.getRange(fila, 17).getValue() || "";
    const tapiceriaEspaldar = hojaDiag.getRange(fila, 18).getValue() || "";

    // Estructura de 16 columnas para OP_2026:
    // A: OP, B: RMA, C: FACTURA, D: FECHA RECIBO, E: COTIZACION, F: OC, G: CLIENTE,
    // H: TIPO_SILLA, I: COLOR, J: TIPO_TELA, K: NUMERO_TEMP, L: PARTES,
    // M: OTROS_SERVICIOS, N: ABOLLONADO, O: TAPIZADO, P: NUM_EYM
    const filaOP = [
      nuevoOP,                              // A: OP (consecutivo nuevo)
      "",                                   // B: RMA (se llena después en Odoo)
      "",                                   // C: FACTURA (se llena después en Odoo)
      hojaDiag.getRange(fila, 1).getValue(),    // D: FECHA RECIBO ← Col A (FECHA_DIAGNOSTICO)
      hojaDiag.getRange(fila, 2).getValue(),    // E: COTIZACION ← Col B (OPORTUNIDAD)
      "",                                   // F: OC (Orden Cliente - vacío por ahora)
      hojaDiag.getRange(fila, 3).getValue(),    // G: CLIENTE ← Col C
      hojaDiag.getRange(fila, 4).getValue(),    // H: TIPO_SILLA ← Col D
      hojaDiag.getRange(fila, 11).getValue(),   // I: COLOR ← Col K
      hojaDiag.getRange(fila, 10).getValue(),   // J: TIPO_TELA ← Col J
      hojaDiag.getRange(fila, 6).getValue(),    // K: NUMERO_TEMP ← Col F (#_TEMPORAL)
      hojaDiag.getRange(fila, 14).getValue(),   // L: PARTES ← Col N (Repuestos)
      serviciosCombinados,                 // M: OTROS_SERVICIOS ← Col O + Col P
      tapiceriaAsiento,                    // N: ABOLLONADO/ASIENTO ← Col Q (TAPICERIA Asiento)
      tapiceriaEspaldar,                   // O: TAPIZADO/ESPALDAR ← Col R (TAPICERIA Espaldar)
      numeroEYM,                            // P: NUM_EYM ← Col E (NUMERO_EYM)
      CONFIG.ESTADO_OP_PRODUCCION           // Q: ESTADO_OP (En producción | Terminado)
    ];

    const newFilaOP = hojaOP.getLastRow() + 1;
    hojaOP.getRange(newFilaOP, 1, 1, filaOP.length).setValues([filaOP]);

    Logger.log("✅ OP " + nuevoOP + " creada automáticamente");
  } catch (e) {
    Logger.log("❌ Error creando OP: " + e.toString());
  }
}

function obtenerDiagnosticosDeOportunidad(hoja, nombreOportunidad) {
  try {
    const diagnosticos = [];
    const ultFila = hoja.getLastRow();
    if (ultFila < 2) return diagnosticos;

    const datos = hoja.getRange(2, 1, ultFila - 1, 24).getValues();
    const temporalesVisibles = hoja.getRange(2, 6, ultFila - 1, 1).getDisplayValues();
    const busqueda = normalizarNombreOportunidad(nombreOportunidad);
    if (!busqueda) return diagnosticos;
    const num = v => (v === "" || v === null || isNaN(Number(v))) ? 0 : Number(v);

    for (let i = 0; i < datos.length; i++) {
      const r = datos[i];
      const oportunidad = r[1];
      if (oportunidad && normalizarNombreOportunidad(oportunidad) === busqueda) {
        diagnosticos.push({
          fila: i + 2,
          fecha: r[0],
          oportunidad: oportunidad,
          cliente: r[2],
          tipoSilla: r[3],
          numeroEYM: r[4],
          numeroTemporal: String(temporalesVisibles[i][0]).trim(),
          color: r[10],                    // K
          ubicacion: r[11],                // L
          repuestos: r[13],                // N
          otrosServicios: r[14],           // O
          observacionesEspeciales: r[15],  // P
          tapiceriaAsiento: r[16],         // Q
          tapiceriaEspaldar: r[17],        // R
          valorPartes: num(r[19]),         // T
          valorOtrosServicios: num(r[20]), // U
          valorTapiceria: num(r[21]),      // V
          valorMO: num(r[22]),             // W
          valorTotal: num(r[19]) + num(r[20]) + num(r[21]) + num(r[22]) // T+U+V+W (no depende de X)
        });
      }
    }

    return diagnosticos;

  } catch (e) {
    Logger.log("Error: " + e);
    return [];
  }
}

function agruparPorSilla(diagnosticos, hoja) {
  // Una fila de PDF por cada fila del diagnóstico (no se fusionan #Temporal repetidos)
  const vistos = {};
  return diagnosticos.map(diag => {
    const numTemp = diag.numeroTemporal || "Sin numero";
    if (vistos[numTemp]) {
      Logger.log("⚠️ #Temporal repetido: '" + numTemp + "' (fila " + diag.fila + " de la hoja) - se incluye igual como silla aparte");
    }
    vistos[numTemp] = true;

    return {
      numeroTemporal: numTemp,
      tipoSilla: diag.tipoSilla,
      color: diag.color,
      ubicacion: diag.ubicacion,
      partesYServicios: consolidarPartesYServicios(diag),
      tapiceria: consolidarTapiceria(diag),
      valorPartesYMO: (diag.valorPartes || 0) + (diag.valorMO || 0),
      valorOtrosServicios: diag.valorOtrosServicios || 0,
      valorTapiceria: diag.valorTapiceria || 0,
      valorTotal: diag.valorTotal || 0,
      diag: diag
    };
  });
}

// Consolidar Partes y Servicios: N + O + P + "M.O y mantenimiento General"
function consolidarPartesYServicios(diag) {
  const partes = [];

  if (diag.repuestos) {
    partes.push(diag.repuestos.toString().trim());
  }
  if (diag.otrosServicios) {
    partes.push(diag.otrosServicios.toString().trim());
  }
  if (diag.observacionesEspeciales) {
    partes.push(diag.observacionesEspeciales.toString().trim());
  }

  // SIEMPRE INCLUIR M.O y mantenimiento General
  partes.push("M.O y mantenimiento general");

  return partes.filter(p => p && p.length > 0).join(", ");
}

// Consolidar Tapicería con lógica especial
function consolidarTapiceria(diag) {
  const asiento = (diag.tapiceriaAsiento || "").toString().trim();
  const espaldar = (diag.tapiceriaEspaldar || "").toString().trim();

  // Si alguno contiene "Abollonado y Tapizado general", omitir el formato especial
  if (asiento.toLowerCase().includes("abollonado y tapizado general") ||
      espaldar.toLowerCase().includes("abollonado y tapizado general")) {
    // Retornar solo el que tiene este texto
    if (asiento.toLowerCase().includes("abollonado y tapizado general")) {
      return asiento;
    }
    if (espaldar.toLowerCase().includes("abollonado y tapizado general")) {
      return espaldar;
    }
  }

  // Formato normal: "Asiento: X; Espaldar: Y"
  const partes = [];
  if (asiento) {
    partes.push("Asiento: " + asiento);
  }
  if (espaldar) {
    partes.push("Espaldar: " + espaldar);
  }

  return partes.join("; ");
}

function calcularTotalGeneral(silasDatos) {
  let total = 0;
  silasDatos.forEach(sila => {
    total += sila.valorTotal || 0;
  });
  return total;
}

function consolidarProductosTotal(diagnosticos, hoja) {
  const productosMap = {};

  for (let diag of diagnosticos) {
    if (diag.componentes) {
      const comps = diag.componentes.toString().split(";");
      comps.forEach(comp => {
        const compLimpio = comp.trim();
        if (!compLimpio) return;
        const nombreNormalizado = normalizarTexto(compLimpio);
        if (!productosMap[nombreNormalizado]) {
          productosMap[nombreNormalizado] = {
            nombre: compLimpio,
            cantidad: 0,
            precio: obtenerPrecioDelCatalogo(compLimpio),
            tipo: "Partes"
          };
        }
        productosMap[nombreNormalizado].cantidad += 1;
      });
    }
  }

  return Object.values(productosMap);
}

function consolidarServiciosTotal(diagnosticos, hoja) {
  const serviciosMap = {};

  for (let diag of diagnosticos) {
    // OTROS SERVICIOS
    if (diag.otrosServicios) {
      const servicios = diag.otrosServicios.toString().split(";");
      servicios.forEach(serv => {
        const servLimpio = serv.trim();
        if (!servLimpio) return;
        const nombreNormalizado = normalizarTexto(servLimpio);
        if (!serviciosMap[nombreNormalizado]) {
          serviciosMap[nombreNormalizado] = {
            nombre: servLimpio,
            cantidad: 0,
            precio: obtenerPrecioDelCatalogo(servLimpio),
            tipo: "Servicios"
          };
        }
        serviciosMap[nombreNormalizado].cantidad += 1;
      });
    }

    // TAPICERÍA (ASIENTO + ESPALDAR)
    if (diag.tapiceriaAsiento) {
      const tapiceria = diag.tapiceriaAsiento.toString().trim();
      if (tapiceria) {
        const nombreNormalizado = normalizarTexto(tapiceria);
        if (!serviciosMap[nombreNormalizado]) {
          serviciosMap[nombreNormalizado] = {
            nombre: tapiceria,
            cantidad: 0,
            precio: obtenerPrecioDelCatalogo(tapiceria),
            tipo: "Tapicería"
          };
        }
        serviciosMap[nombreNormalizado].cantidad += 1;
      }
    }

    if (diag.tapiceriaEspaldar) {
      const tapiceria = diag.tapiceriaEspaldar.toString().trim();
      if (tapiceria) {
        const nombreNormalizado = normalizarTexto(tapiceria);
        if (!serviciosMap[nombreNormalizado]) {
          serviciosMap[nombreNormalizado] = {
            nombre: tapiceria,
            cantidad: 0,
            precio: obtenerPrecioDelCatalogo(tapiceria),
            tipo: "Tapicería"
          };
        }
        serviciosMap[nombreNormalizado].cantidad += 1;
      }
    }

    // MANTENIMIENTO GENERAL (siempre se suma)
    const mo = 46000; // Valor fijo
    if (!serviciosMap["mantenimiento general"]) {
      serviciosMap["mantenimiento general"] = {
        nombre: "Mantenimiento General",
        cantidad: 1,
        precio: mo,
        tipo: "Mantenimiento"
      };
    } else {
      serviciosMap["mantenimiento general"].cantidad += 1;
    }
  }

  return Object.values(serviciosMap);
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// BORRADOR DE RMA: consolida por ítem (partes, otros servicios, tapicería, M.O)
// ═══════════════════════════════════════════════════════════════════════════════════════
function consolidarBorradorRMA(silasDatos) {
  const mapa = {};
  const orden = [];
  const textoGeneral = "abollonado y tapizado general";

  function agregar(grupo, nombre, cant, total, claveCatalogo) {
    const key = grupo + "|" + normalizarTexto(nombre);
    if (!mapa[key]) {
      mapa[key] = { grupo: grupo, nombre: nombre, catalogo: claveCatalogo || nombre, cant: 0, total: 0 };
      orden.push(key);
    }
    mapa[key].cant += cant;
    mapa[key].total += total;
  }

  silasDatos.forEach(x => {
    const d = x.diag;
    if (!d) return;

    // 1) PARTES (col N): una unidad por cada aparición, precio del catálogo
    (d.repuestos || "").toString().split(";").map(p => p.trim()).filter(p => p).forEach(p => {
      agregar(1, p, 1, obtenerPrecioDelCatalogo(p));
    });

    // 2) OTROS SERVICIOS Y ESPECIALES (col O + P): el valor viene de la col U
    const otros = [d.otrosServicios, d.observacionesEspeciales]
      .map(t => (t || "").toString().trim()).filter(t => t).join("; ");
    if (otros) {
      agregar(2, otros, 1, d.valorOtrosServicios || 0);
    }

    // 3) TAPICERÍA (col Q + R): mismo criterio que el cálculo de la col V
    const asiento = (d.tapiceriaAsiento || "").toString().trim();
    const espaldar = (d.tapiceriaEspaldar || "").toString().trim();
    if (asiento && espaldar &&
        normalizarTexto(asiento) === textoGeneral && normalizarTexto(espaldar) === textoGeneral) {
      agregar(3, asiento, 1, obtenerPrecioDelCatalogo(asiento), asiento);
    } else {
      if (asiento) agregar(3, "Asiento: " + asiento, 1, obtenerPrecioDelCatalogo(asiento), asiento);
      if (espaldar) agregar(3, "Espaldar: " + espaldar, 1, obtenerPrecioDelCatalogo(espaldar), espaldar);
    }

    // 4) M.O Y MANTENIMIENTO GENERAL (col W): una por silla
    agregar(4, "M.O y mantenimiento general", 1, d.valorMO || CONFIG.MANTENIMIENTO_GENERAL);
  });

  const items = orden.map(k => {
    const it = mapa[k];
    it.unitario = it.cant > 0 ? Math.round(it.total / it.cant) : 0;
    return it;
  }).sort((a, b) => a.grupo - b.grupo);

  const total = items.reduce((acc, it) => acc + it.total, 0);
  return { items: items, total: total };
}

function agregarHojaBorradorRMA(ssTemp, silasDatos, cliente, nombreOportunidad, totalPresupuesto) {
  const borrador = consolidarBorradorRMA(silasDatos);
  if (borrador.items.length === 0) {
    Logger.log("⚠️ Borrador RMA: sin detalle de diagnósticos, no se agrega la hoja");
    return null;
  }

  const hoja = ssTemp.insertSheet("CONSOLIDADO");
  let fila = 1;

  hoja.getRange(fila, 1, 1, 4).merge();
  hoja.getRange(fila, 1).setValue("EYM OFICINAS - CONSOLIDADO DE REPUESTOS Y SERVICIOS").setFontSize(11).setFontWeight("normal").setVerticalAlignment("middle");
  fila++;
  hoja.getRange(fila, 1).setValue("CLIENTE: " + cliente).setFontSize(8);
  fila++;
  hoja.getRange(fila, 1).setValue("Referencia: " + nombreOportunidad).setFontSize(8).setFontWeight("normal");
  fila += 2;

  const encabezado = hoja.getRange(fila, 1, 1, 4);
  encabezado.setValues([["Ítem", "Cantidad", "Precio unitario", "Total Antes de IVA"]]);
  encabezado.setBackgroundColor("#1a73e8").setFontColor("#FFFFFF").setFontSize(8).setFontWeight("normal").setHorizontalAlignment("center");
  fila++;

  const sinPrecio = [];
  const filas = borrador.items.map(it => {
    if (!it.total) sinPrecio.push(it.nombre);
    return [it.nombre + (it.total ? "" : " *"), it.cant, it.unitario, it.total];
  });
  const rango = hoja.getRange(fila, 1, filas.length, 4);
  rango.setValues(filas);
  rango.setFontSize(8).setFontWeight("normal").setVerticalAlignment("top");
  rango.setBorder(null, null, true, null, null, true, "#999999", SpreadsheetApp.BorderStyle.SOLID);
  hoja.getRange(fila, 1, filas.length, 1).setWrap(true);
  hoja.getRange(fila, 2, filas.length, 1).setHorizontalAlignment("center");
  hoja.getRange(fila, 3, filas.length, 2).setNumberFormat("#,##0").setHorizontalAlignment("right");
  fila += filas.length;

  const filaTotal = hoja.getRange(fila, 1, 1, 4);
  filaTotal.setValues([["TOTAL ANTES DE IVA", "", "", borrador.total]]);
  filaTotal.setBackgroundColor("#FFF2CC").setFontSize(8).setFontWeight("normal");
  hoja.getRange(fila, 4).setNumberFormat("#,##0").setHorizontalAlignment("right");
  fila += 2;

  const diferencia = Math.round(totalPresupuesto - borrador.total);
  if (sinPrecio.length > 0) {
    hoja.getRange(fila, 1).setValue("* Sin precio en el catálogo / valor en 0: " + sinPrecio.join("; ")).setFontSize(7);
    fila++;
  }
  if (diferencia !== 0) {
    hoja.getRange(fila, 1).setValue("Nota: el total del presupuesto por silla es $" + formatearNumero(totalPresupuesto) +
      " (diferencia de $" + formatearNumero(diferencia) + " frente a este consolidado; revisar precios editados a mano).").setFontSize(7);
    Logger.log("⚠️ Borrador RMA difiere del presupuesto en $" + diferencia);
  }

  hoja.setColumnWidth(1, 380);
  hoja.setColumnWidth(2, 70);
  hoja.setColumnWidth(3, 110);
  hoja.setColumnWidth(4, 120);
  insertarLogoEYM(hoja, 4, 1, 120);
  Logger.log("✅ Consolidado: " + borrador.items.length + " ítems, total $" + formatearNumero(borrador.total));
  return hoja;
}

function generarPDFDiagnosticos(nombreOportunidad, cliente, silasDatos, totalGeneral) {
  try {
    Logger.log("\n🖨️ ═══════════════════════════════════════════════════════");
    Logger.log("🖨️ GENERANDO PRESUPUESTO SILLA X SILLA - V11 GOOGLE SHEETS");
    Logger.log("🖨️ Oportunidad: " + nombreOportunidad);
    Logger.log("🖨️ Cliente: " + cliente);
    Logger.log("🖨️ Sillas: " + silasDatos.length);
    Logger.log("🖨️ Total General: $" + formatearNumero(totalGeneral));
    Logger.log("🖨️ ═══════════════════════════════════════════════════════");

    if (!silasDatos || silasDatos.length === 0) {
      Logger.log("❌ ERROR: No hay datos de sillas");
      return null;
    }

    // Crear Google Sheet temporal con nombre único
    const ahora = new Date();
    const timestamp = ahora.getFullYear() + "-" + String(ahora.getMonth() + 1).padStart(2, '0') + "-" + String(ahora.getDate()).padStart(2, '0');
    const nombreSheet = "PDF_COTIZACION_" + nombreOportunidad.substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_") + "_" + timestamp;

    Logger.log("🖨️ PASO 1: Creando Google Sheet temporal...");
    Logger.log("🖨️ Nombre: " + nombreSheet);

    // Crear el sheet
    const ssTemp = SpreadsheetApp.create(nombreSheet);
    const hojaData = ssTemp.getActiveSheet();

    // Renombrar la hoja a "COTIZACION"
    hojaData.setName("COTIZACION");

    // COLUMNAS DINÁMICAS: se omiten Tapicería y Otros Servicios cuando ninguna silla los tiene
    const hayTapiceria = silasDatos.some(x => (x.tapiceria || "").toString().trim() !== "" || (x.valorTapiceria || 0) > 0);
    const hayOtrosServ = silasDatos.some(x => (x.valorOtrosServicios || 0) > 0);
    const columnas = [
      { enc: "#", ancho: 28, valor: (x, n) => n.toString() },
      { enc: "# Silla", ancho: 48, valor: x => x.numeroTemporal || "-" },
      { enc: "Tipo", ancho: 62, valor: x => x.tipoSilla || "-" },
      { enc: "Color", ancho: 50, valor: x => x.color || "-" },
      { enc: "Ubicación", ancho: 68, valor: x => x.ubicacion || "-" },
      { enc: "Partes y Servicios", ancho: 190, wrap: true, valor: x => x.partesYServicios || "-" },
      { enc: "Tapicería", ancho: 105, wrap: true, valor: x => x.tapiceria || "-", incluir: hayTapiceria },
      { enc: "Valor Partes, M.O y Mmto General", ancho: 82, num: true, total: "valorPartesYMO", valor: x => x.valorPartesYMO || 0 },
      { enc: "Valor Otros Servicios", ancho: 72, num: true, total: "valorOtrosServicios", valor: x => x.valorOtrosServicios || 0, incluir: hayOtrosServ },
      { enc: "Valor Tapicería", ancho: 72, num: true, total: "valorTapiceria", valor: x => x.valorTapiceria || 0, incluir: hayTapiceria },
      { enc: "Valor Total Antes de IVA", ancho: 82, num: true, total: "valorTotal", valor: x => x.valorTotal || 0 }
    ].filter(c => c.incluir !== false);
    const numCols = columnas.length;
    const primeraNum = columnas.findIndex(c => c.num) + 1;
    const cantNum = numCols - primeraNum + 1;
    Logger.log("🖨️ Columnas del PDF (" + numCols + "): " + columnas.map(c => c.enc).join(" | "));

    // ENCABEZADO CON LOGO (arriba a la derecha) Y CLIENTE
    let fila = 1;
    hojaData.getRange(fila, 1, 1, numCols).merge();
    hojaData.getRange(fila, 1).setValue("EYM OFICINAS - COTIZACIÓN DE REPARACIÓN");
    hojaData.getRange(fila, 1).setHorizontalAlignment("left").setVerticalAlignment("middle");
    hojaData.getRange(fila, 1).setFontSize(11).setFontWeight("normal");
    fila++;

    hojaData.getRange(fila, 1).setValue("CLIENTE: " + cliente);
    hojaData.getRange(fila, 1).setFontSize(8);
    fila++;

    hojaData.getRange(fila, 1).setValue("FECHA: " + ahora.toLocaleDateString("es-CO"));
    hojaData.getRange(fila, 1).setFontSize(8);
    fila++;

    hojaData.getRange(fila, 1).setValue("Referencia: " + nombreOportunidad);
    hojaData.getRange(fila, 1).setFontSize(8).setFontWeight("normal");
    fila++;

    // Fila en blanco
    fila++;

    // ENCABEZADOS DE TABLA
    hojaData.getRange(fila, 1, 1, numCols).setValues([columnas.map(c => c.enc)]);
    const rangoEncabezados = hojaData.getRange(fila, 1, 1, numCols);
    rangoEncabezados.setBackgroundColor("#1a73e8");
    rangoEncabezados.setFontColor("#FFFFFF");
    rangoEncabezados.setFontWeight("normal");
    rangoEncabezados.setFontSize(8);
    rangoEncabezados.setHorizontalAlignment("center");
    rangoEncabezados.setWrap(true);
    const filaEncabezado = fila;
    fila++;

    // DATOS DE SILLAS
    const totales = { valorPartesYMO: 0, valorOtrosServicios: 0, valorTapiceria: 0, valorTotal: 0 };
    const filasDatos = silasDatos.map((x, i) => {
      Object.keys(totales).forEach(k => { totales[k] += x[k] || 0; });
      return columnas.map(c => c.valor(x, i + 1));
    });
    const totalGeneral2 = totales.valorTotal;

    if (filasDatos.length > 0) {
      // Columnas 1-2 como texto para que "1-10" no se convierta en fecha
      hojaData.getRange(fila, 1, filasDatos.length, 2).setNumberFormat("@");
      hojaData.getRange(fila, 1, filasDatos.length, numCols).setValues(filasDatos);
      hojaData.getRange(fila, primeraNum, filasDatos.length, cantNum).setNumberFormat("#,##0");
      hojaData.getRange(fila, primeraNum, filasDatos.length, cantNum).setHorizontalAlignment("right");
      hojaData.getRange(fila, 1, filasDatos.length, numCols).setVerticalAlignment("top");
      hojaData.getRange(fila, 1, filasDatos.length, numCols).setFontSize(8).setFontWeight("normal");
      // Línea separadora entre sillas
      hojaData.getRange(fila, 1, filasDatos.length, numCols).setBorder(null, null, true, null, null, true, "#999999", SpreadsheetApp.BorderStyle.SOLID);
      fila += filasDatos.length;
    }

    // FILA DE TOTALES
    const filaTotales = columnas.map((c, i) => i === 1 ? "TOTALES" : (c.num ? totales[c.total] : ""));
    hojaData.getRange(fila, 1, 1, numCols).setValues([filaTotales]);
    const rangoTotales = hojaData.getRange(fila, 1, 1, numCols);
    rangoTotales.setBackgroundColor("#FFF2CC");
    rangoTotales.setFontWeight("normal");
    rangoTotales.setFontSize(8);
    hojaData.getRange(fila, primeraNum, 1, cantNum).setNumberFormat("#,##0");
    hojaData.getRange(fila, primeraNum, 1, cantNum).setHorizontalAlignment("right");
    fila++;

    // TOTAL GENERAL ANTES DE IVA
    fila++;
    hojaData.getRange(fila, numCols - 1).setValue("TOTAL ANTES DE IVA:").setFontWeight("normal").setFontSize(8).setHorizontalAlignment("right");
    hojaData.getRange(fila, numCols).setValue(totalGeneral2).setNumberFormat("#,##0").setFontWeight("normal").setFontSize(8).setHorizontalAlignment("right");

    // Anchos de columna y ajuste de texto
    columnas.forEach((c, i) => {
      hojaData.setColumnWidth(i + 1, c.ancho);
      if (c.wrap) hojaData.getRange(filaEncabezado + 1, i + 1, filasDatos.length, 1).setWrap(true);
    });

    let hojaConsolidado = null;
    try {
      hojaConsolidado = agregarHojaBorradorRMA(ssTemp, silasDatos, cliente, nombreOportunidad, totalGeneral2);
    } catch (errRMA) {
      Logger.log("⚠️ No se pudo agregar el consolidado: " + errRMA);
    }
    insertarLogoEYM(hojaData, numCols, 1, columnas[numCols - 1].ancho);

    SpreadsheetApp.flush();

    Logger.log("🖨️ PASO 2: Exportando los PDF y guardándolos en Drive...");
    const ssId = ssTemp.getId();
    const exportBase = "https://docs.google.com/spreadsheets/d/" + ssId + "/export?format=pdf" +
      "&portrait=false&size=letter&fitw=true&gridlines=false&printtitle=false&sheetnames=false&pagenumbers=false" +
      "&top_margin=0.3&bottom_margin=0.3&left_margin=0.3&right_margin=0.3";
    const nombreBase = nombreOportunidad.replace(/[^a-zA-Z0-9]/g, "_") + "_" + timestamp;
    let todoGuardado = true;

    const exportarHoja = (hojaPDF, nombrePDF) => {
      const urlExport = exportBase + "&gid=" + hojaPDF.getSheetId();
      try {
        const respuesta = UrlFetchApp.fetch(urlExport, {
          headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
          muteHttpExceptions: true
        });
        if (respuesta.getResponseCode() === 200) {
          const archivo = DriveApp.createFile(respuesta.getBlob().setName(nombrePDF));
          Logger.log("✅ PDF guardado en Drive: " + nombrePDF);
          return archivo.getUrl();
        }
        Logger.log("⚠️ Export devolvió HTTP " + respuesta.getResponseCode() + " para " + nombrePDF);
      } catch (errPdf) {
        Logger.log("⚠️ No se pudo guardar " + nombrePDF + ": " + errPdf);
      }
      todoGuardado = false;
      return urlExport;
    };

    const resultado = {
      presupuesto: exportarHoja(hojaData, "PRESUPUESTO_SILLA_X_SILLA_" + nombreBase + ".pdf"),
      consolidado: hojaConsolidado ? exportarHoja(hojaConsolidado, "CONSOLIDADO_REPUESTOS_" + nombreBase + ".pdf") : null
    };
    if (todoGuardado) DriveApp.getFileById(ssId).setTrashed(true);
    const pdfUrl = resultado.presupuesto;

    Logger.log("✅ PASO 3: PDF generado");
    Logger.log("✅ Sheet ID: " + ssId);
    Logger.log("✅ URL PDF: " + pdfUrl);
    Logger.log("✅ CARACTERÍSTICAS IMPLEMENTADAS:");
    Logger.log("   ✓ Plataforma: Google Sheets (confiable)");
    Logger.log("   ✓ Orientación: LANDSCAPE (Horizontal)");
    Logger.log("   ✓ Tamaño: Letter");
    Logger.log("   ✓ Fuentes: 8pt (datos), 11pt (título)");
    Logger.log("   ✓ Logo EYM: Superior derecha");
    Logger.log("   ✓ Referencia: Incluida bajo cliente y fecha");
    Logger.log("   ✓ COLUMNAS EXACTAS (11):");
    Logger.log("      1. # (Silla)");
    Logger.log("      2. Nº Temp (columna F)");
    Logger.log("      3. Tipo (columna D)");
    Logger.log("      4. Color (columna K)");
    Logger.log("      5. Ubicación (columna L)");
    Logger.log("      6. Partes y Servicios (N+O+P+'M.O y mantenimiento general')");
    Logger.log("      7. Valor Partes y M.O (T+W)");
    Logger.log("      8. Valor Otros Servicios (U)");
    Logger.log("      9. Valor Tapicería (V)");
    Logger.log("      10. Tapicería (Q+R consolidado)");
    Logger.log("      11. Valor Total (X)");
    Logger.log("   ✓ M.O y Mantenimiento General: SIEMPRE INCLUIDO");
    Logger.log("   ✓ Text Wrapping: Partes y Servicios + Tapicería");
    Logger.log("✅ TOTAL GENERAL CALCULADO: $" + formatearNumero(totalGeneral2));
    Logger.log("🖨️ ═══════════════════════════════════════════════════════\n");

    return resultado;

  } catch (e) {
    Logger.log("\n❌ ════════════════════════════════════════════════════════");
    Logger.log("❌ ERROR EN generarPDFDiagnosticos()");
    Logger.log("❌ Mensaje: " + e.toString());
    Logger.log("❌ Línea: " + e.lineNumber);
    Logger.log("❌ Stack: " + e.stack);
    Logger.log("❌ ════════════════════════════════════════════════════════\n");
    return null;
  }
}

function formatearNumero(numero) {
  return Math.round(numero).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ═════════════════════════════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES: PDF Y ATTACHMENT
// ═════════════════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════════════
// V12: OPORTUNIDAD EXACTA, ALARMAS (COLUMNA AD) Y CÓDIGOS DE CATÁLOGO
// ═══════════════════════════════════════════════════════════════════════════════════════

function normalizarNombreOportunidad(texto) {
  return (texto || "").toString().toLowerCase().replace(/\s+/g, " ").trim();
}

function mensajeOportunidadNoEncontrada(hoja, nombre) {
  const buscado = normalizarNombreOportunidad(nombre);
  const similares = [];
  const ult = hoja.getLastRow();
  if (ult >= 2 && buscado) {
    hoja.getRange(2, 2, ult - 1, 1).getValues().forEach(r => {
      const n = (r[0] || "").toString().trim();
      if (n && normalizarNombreOportunidad(n).includes(buscado) && similares.indexOf(n) === -1) similares.push(n);
    });
  }
  let msg = "No existe ninguna oportunidad con el nombre EXACTO:\n'" + nombre + "'\n\n" +
    "El nombre debe ser idéntico al de la columna B (OPORTUNIDAD).";
  if (similares.length > 0) {
    msg += "\n\nOportunidades parecidas:\n- " + similares.slice(0, 8).join("\n- ");
  }
  return msg;
}

function escribirAlarmaEnFilas(hoja, filas, texto) {
  const col = CONFIG.COL_ALARMA;
  if (!hoja.getRange(1, col).getValue()) hoja.getRange(1, col).setValue("ALARMA");
  const msg = "⚠️ " + texto.toString().substring(0, 800);
  filas.forEach(f => {
    const c = hoja.getRange(f, col);
    c.setValue(msg);
    c.setBackground("#F4CCCC");
    c.setFontColor("#990000");
  });
  Logger.log("🚨 ALARMA en columna AD (" + filas.length + " filas): " + texto);
}

function limpiarAlarmaEnFilas(hoja, filas) {
  const col = CONFIG.COL_ALARMA;
  filas.forEach(f => {
    const c = hoja.getRange(f, col);
    if (c.getValue()) {
      c.clearContent();
      c.setBackground(null);
      c.setFontColor(null);
    }
  });
}

let CATALOGO_CODIGOS_CACHE = null;

function obtenerCatalogoCodigos() {
  if (CATALOGO_CODIGOS_CACHE !== null) return CATALOGO_CODIGOS_CACHE;
  const codigos = {};
  try {
    const hoja = buscarHojaCatalogo(SpreadsheetApp.openById(ID_DIAGNOSTICOS));
    if (hoja) {
      const datos = hoja.getDataRange().getValues();
      for (let i = 1; i < datos.length; i++) {
        const nombre = datos[i][0] ? datos[i][0].toString().toLowerCase().trim() : "";
        const precio = datos[i][1] ? parseInt(datos[i][1]) : 0;
        if (nombre && precio > 0) {
          codigos[nombre] = datos[i][2] ? datos[i][2].toString().trim() : "";
        }
      }
    }
  } catch (e) {
    Logger.log("❌ Error leyendo códigos del catálogo: " + e);
  }
  CATALOGO_CODIGOS_CACHE = codigos;
  return codigos;
}

// Misma lógica de coincidencia que obtenerPrecioDelCatalogo, para que precio y código salgan de la misma fila
function buscarCodigoCatalogo(nombre, soloExacto) {
  const precios = obtenerCatalogoPreciosDesdeSheet();
  const codigos = obtenerCatalogoCodigos();
  const n = normalizarTexto(nombre);
  if (!n) return null;

  if (precios[n] !== undefined) return codigos[n] || null;

  const claves = Object.keys(precios);
  for (const k of claves) {
    if (normalizarTexto(k) === n) return codigos[k] || null;
  }
  if (soloExacto) return null;

  const palabras = n.split(" ");
  for (const k of claves) {
    let coincidencias = 0;
    for (const p of palabras) {
      if (p.length > 2 && k.includes(p)) coincidencias++;
    }
    if (coincidencias > 0) return codigos[k] || null;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// V12: ODOO - BÚSQUEDA DE OPORTUNIDAD, IMPUESTOS Y CREACIÓN DE LA RMA (repair.order)
// ═══════════════════════════════════════════════════════════════════════════════════════

const ODOO_CAMPOS_CACHE = {};

function odooCampos(modelo, creds) {
  if (ODOO_CAMPOS_CACHE[modelo]) return ODOO_CAMPOS_CACHE[modelo];
  const r = llamarOdooXMLRPC(modelo, "fields_get", [[], ["type", "required", "relation", "string"]], creds) || {};
  ODOO_CAMPOS_CACHE[modelo] = r;
  return r;
}

// Coincidencia EXACTA (sin importar mayúsculas), nunca parcial
function buscarOportunidadOdoo(nombreOportunidad, creds) {
  const patron = nombreOportunidad.toString().trim().replace(/([%_\\])/g, "\\$1");
  Logger.log("🔍 Buscando oportunidad EXACTA en CRM: '" + nombreOportunidad + "'");
  const ids = llamarOdooXMLRPC("crm.lead", "search", [[["type", "=", "opportunity"], ["name", "=ilike", patron]]], creds);
  if (ids === null) return { id: null, count: 0, error: ODOO_ULTIMO_ERROR };
  return { id: ids.length > 0 ? ids[0] : null, count: ids.length };
}

function sugerirOportunidadesOdoo(nombreOportunidad, creds) {
  const r = llamarOdooXMLRPC("crm.lead", "search_read",
    [[["type", "=", "opportunity"], ["name", "ilike", nombreOportunidad.toString().trim()]], ["name"]], creds, { limit: 8 });
  return (r || []).map(x => x.name);
}

function obtenerClienteDeOportunidad(oportunidadId, creds) {
  const r = llamarOdooXMLRPC("crm.lead", "read", [[oportunidadId], ["partner_id"]], creds);
  if (r && r.length > 0 && r[0].partner_id) return r[0].partner_id[0];
  return null;
}

function buscarImpuestoPorNombre(nombre, creds) {
  const r = llamarOdooXMLRPC("account.tax", "search_read",
    [[["name", "=", nombre], ["type_tax_use", "=", "sale"]], ["name"]], creds, { limit: 1 });
  return (r && r.length > 0) ? r[0].id : null;
}

function buscarImpuestoPorMonto(monto, creds) {
  const r = llamarOdooXMLRPC("account.tax", "search_read",
    [[["amount", "=", monto], ["amount_type", "=", "percent"], ["type_tax_use", "=", "sale"]], ["name"]], creds, { limit: 1 });
  return (r && r.length > 0) ? r[0].id : null;
}

// IVA 19% siempre; Retefuente 4% solo si el total del PDF es >= $550.000. Se asigna por línea.
function obtenerImpuestosRMA(totalPDF, creds) {
  const ivaId = buscarImpuestoPorNombre(CONFIG.NOMBRE_IVA, creds) || buscarImpuestoPorMonto(19, creds);
  const aplicaRete = totalPDF >= CONFIG.LIMITE_RETEFUENTE;
  const retId = aplicaRete ? (buscarImpuestoPorNombre(CONFIG.NOMBRE_RETEFUENTE, creds) || buscarImpuestoPorMonto(-4, creds)) : null;
  const ids = [];
  if (ivaId) ids.push(ivaId);
  if (retId) ids.push(retId);
  return { ids: ids, ivaId: ivaId, retId: retId, aplicaRete: aplicaRete };
}

function obtenerUbicacionStock(creds) {
  const w = llamarOdooXMLRPC("stock.warehouse", "search_read", [[], ["lot_stock_id"]], creds, { limit: 1 });
  if (w && w.length > 0 && w[0].lot_stock_id) return w[0].lot_stock_id[0];
  const l = llamarOdooXMLRPC("stock.location", "search", [[["usage", "=", "internal"]]], creds, { limit: 1 });
  return (l && l.length > 0) ? l[0] : null;
}

// Otros servicios: el precio unitario es el valor escrito a mano en la columna U (total / cantidad).
// Los demás ítems usan el precio que trae Odoo.
function precioLineaRMA(x) {
  if (x.item.grupo === 2) return x.item.cant > 0 ? x.item.total / x.item.cant : 0;
  return x.prod.list_price || 0;
}

function buscarProductoMobiliario(creds) {
  const r = llamarOdooXMLRPC("product.product", "search_read",
    [["|", ["default_code", "=", CONFIG.PRODUCTO_REPARAR_CODIGO], ["name", "=ilike", "Mobiliario"]], ["name", "default_code", "uom_id"]],
    creds, { limit: 1 });
  return (r && r.length > 0) ? r[0] : null;
}

// Cruza cada ítem del borrador con el código de la columna C del catálogo y con el producto de Odoo
function resolverItemsBorradorEnOdoo(items, creds) {
  const filas = items.map(it => {
    const base = it.catalogo || it.nombre;
    let codigo = null;
    if (it.grupo === 4) {
      codigo = CONFIG.CODIGO_MANTENIMIENTO;
    } else if (it.grupo === 2) {
      codigo = buscarCodigoCatalogo(base, true);
    } else {
      codigo = buscarCodigoCatalogo(base, false);
    }
    return { item: it, codigo: codigo, prod: null, generico: false };
  });

  const codigos = filas.map(x => x.codigo).filter(c => c);
  const prods = codigos.length > 0
    ? (llamarOdooXMLRPC("product.product", "search_read", [[["default_code", "in", codigos]], ["default_code", "list_price", "uom_id", "name"]], creds) || [])
    : [];
  const porCodigo = {};
  prods.forEach(p => { porCodigo[p.default_code] = p; });
  filas.forEach(x => { if (x.codigo) x.prod = porCodigo[x.codigo] || null; });

  // Otros servicios sin código propio: se usa el producto genérico "Otros servicios" de Odoo
  // (la descripción de la línea es el texto del servicio y el precio es el de la columna U)
  const sinCodigo = filas.filter(x => x.item.grupo === 2 && !x.codigo);
  if (sinCodigo.length > 0) {
    const g = llamarOdooXMLRPC("product.product", "search_read",
      [["|", ["default_code", "=", CONFIG.CODIGO_OTROS_SERVICIOS], ["name", "=ilike", "%otros servicios%"]],
        ["default_code", "list_price", "uom_id", "name"]], creds, { limit: 1 });
    if (g && g.length > 0) {
      sinCodigo.forEach(x => { x.prod = g[0]; x.codigo = g[0].default_code || "(Otros servicios)"; x.generico = true; });
    }
  }

  const faltantes = [];
  filas.forEach(x => {
    if (!x.codigo) {
      faltantes.push("'" + x.item.nombre + "' no tiene código en la columna C del catálogo" +
        (x.item.grupo === 2 ? " ni existe un producto 'Otros servicios' en Odoo" : ""));
    } else if (!x.prod) {
      faltantes.push("el código '" + x.codigo + "' (" + x.item.nombre + ") no existe en Odoo");
    }
  });
  return { filas: filas, faltantes: faltantes };
}
// Crea la RMA (New Repair) con cliente de la oportunidad, líneas e impuestos.
// Devuelve { exito, id, nombre, link, error, alarma, avisos }
function crearRMAenOdooDesdeBorrador(nombreOportunidad, borrador, totalPDF, creds) {
  const res = { exito: false, error: "", alarma: "", avisos: [] };
  const avisos = [];
  try {
    // 1) Oportunidad EXACTA en CRM
    const op = buscarOportunidadOdoo(nombreOportunidad, creds);
    if (!op.id) {
      const sug = sugerirOportunidadesOdoo(nombreOportunidad, creds);
      res.error = "La oportunidad '" + nombreOportunidad + "' NO se encontró en Odoo (CRM, coincidencia exacta)." +
        (op.error ? "\nDetalle: " + op.error : "") +
        (sug.length ? "\n\nParecidas en Odoo:\n- " + sug.join("\n- ") : "");
      return res;
    }
    if (op.count > 1) {
      res.error = "Hay " + op.count + " oportunidades con ese nombre exacto en Odoo. Renombra una para evitar confundirlas.";
      return res;
    }
    Logger.log("✅ Oportunidad encontrada en Odoo: ID " + op.id);

    const partnerId = obtenerClienteDeOportunidad(op.id, creds);
    if (!partnerId) {
      res.error = "La oportunidad en Odoo no tiene cliente asignado.";
      return res;
    }

    // 2) Códigos del catálogo (col. C) y productos de Odoo
    const r = resolverItemsBorradorEnOdoo(borrador.items, creds);
    if (r.faltantes.length > 0) {
      avisos.push("Líneas NO cargadas (agregar a mano): " + r.faltantes.join("; "));
    }
    const filasOk = r.filas.filter(x => x.prod);

    // 3) Monto sin impuestos vs subtotal del PDF: si difiere se crea igual y se avisa
    let esperado = 0;
    filasOk.forEach(x => { esperado += x.item.cant * precioLineaRMA(x); });
    let avisoPrecio = false;
    if (r.faltantes.length === 0 && Math.abs(esperado - totalPDF) > 1) {
      avisoPrecio = true;
      avisos.push("Con los precios de Odoo el monto sin impuestos es $" + formatearNumero(esperado) +
        " y el PDF suma $" + formatearNumero(totalPDF) + " (dif. $" + formatearNumero(esperado - totalPDF) + "). Revisar precios.");
    }

    // 4) Impuestos (si falta alguno se crea igual y se avisa)
    const imp = obtenerImpuestosRMA(totalPDF, creds);
    if (!imp.ivaId) {
      avisos.push("No se encontró el impuesto '" + CONFIG.NOMBRE_IVA + "' en Odoo: líneas sin IVA.");
    }
    if (imp.aplicaRete && !imp.retId) {
      avisos.push("El total supera $" + formatearNumero(CONFIG.LIMITE_RETEFUENTE) + " pero no se encontró '" + CONFIG.NOMBRE_RETEFUENTE + "' en Odoo: líneas sin Retefuente.");
    }

    // 5) Datos de la orden (producto a reparar, método de facturación, cliente)
    const camposOrden = odooCampos("repair.order", creds);
    const prodReparar = buscarProductoMobiliario(creds);
    if (!prodReparar) {
      res.alarma = "No se creó la RMA: no se encontró el producto '[" + CONFIG.PRODUCTO_REPARAR_CODIGO + "] Mobiliario' en Odoo.";
      return res;
    }
    const requeridos = Object.keys(camposOrden).filter(k => camposOrden[k].required);
    const defaults = (requeridos.length > 0 ? llamarOdooXMLRPC("repair.order", "default_get", [requeridos], creds) : null) || {};
    const valsOrden = Object.assign({}, defaults, {
      partner_id: partnerId,
      product_id: prodReparar.id,
      product_uom: prodReparar.uom_id ? prodReparar.uom_id[0] : defaults.product_uom
    });
    if (camposOrden.product_qty && !valsOrden.product_qty) valsOrden.product_qty = 1;
    // Dirección de facturación = el mismo cliente de la oportunidad
    if (camposOrden.partner_invoice_id) valsOrden.partner_invoice_id = partnerId;
    if (camposOrden.invoice_method) valsOrden.invoice_method = "after_repair";
    const campoLead = Object.keys(camposOrden).find(k => camposOrden[k].type === "many2one" && camposOrden[k].relation === "crm.lead");
    if (campoLead) valsOrden[campoLead] = op.id;

    // Odoo no siempre entrega estos valores por defecto vía API: se buscan explícitamente
    if (!valsOrden.location_id) {
      const ubic = obtenerUbicacionStock(creds);
      if (ubic) valsOrden.location_id = ubic;
    }
    if (camposOrden.company_id && !valsOrden.company_id) {
      const u = llamarOdooXMLRPC("res.users", "read", [[odooUid(creds)], ["company_id"]], creds);
      if (u && u[0] && u[0].company_id) valsOrden.company_id = u[0].company_id[0];
    }
    const faltanObligatorios = requeridos.filter(k => k !== "name" &&
      (valsOrden[k] === undefined || valsOrden[k] === null || valsOrden[k] === false));
    if (faltanObligatorios.length > 0) {
      res.error = "No se pudieron completar los campos obligatorios de la RMA: " + faltanObligatorios.join(", ");
      return res;
    }
    Logger.log("📝 Datos de la RMA: " + JSON.stringify(valsOrden));

    const rmaId = llamarOdooXMLRPC("repair.order", "create", [valsOrden], creds);
    if (!rmaId) {
      res.error = "Odoo no creó la RMA. " + ODOO_ULTIMO_ERROR;
      return res;
    }
    Logger.log("✅ RMA creada en Odoo: ID " + rmaId);

    // 6) Líneas: partes -> Piezas (repair.line); mantenimiento, tapicería y otros servicios -> Operaciones (repair.fee)
    const camposLinea = odooCampos("repair.line", creds);
    const camposFee = odooCampos("repair.fee", creds);
    const destinoProduccion = llamarOdooXMLRPC("stock.location", "search", [[["usage", "=", "production"]]], creds, { limit: 1 });
    const errores = [];

    filasOk.forEach(x => {
      const campos = x.item.grupo === 1 ? camposLinea : camposFee;
      const modelo = x.item.grupo === 1 ? "repair.line" : "repair.fee";
      const vals = {
        repair_id: rmaId,
        name: x.item.grupo === 2 ? x.item.nombre : x.prod.name,
        product_id: x.prod.id,
        price_unit: precioLineaRMA(x)
      };
      vals[campos.product_uom_qty ? "product_uom_qty" : "product_qty"] = x.item.cant;
      vals[campos.product_uom ? "product_uom" : "product_uom_id"] = x.prod.uom_id ? x.prod.uom_id[0] : false;
      const campoImp = campos.tax_id ? "tax_id" : (campos.tax_ids ? "tax_ids" : null);
      if (campoImp) vals[campoImp] = [[6, 0, imp.ids]];
      if (campos.to_invoice) vals.to_invoice = true;
      if (x.item.grupo === 1) {
        vals.type = "add";
        vals.location_id = valsOrden.location_id;
        if (destinoProduccion && destinoProduccion.length > 0) vals.location_dest_id = destinoProduccion[0];
      }
      const idLinea = llamarOdooXMLRPC(modelo, "create", [vals], creds);
      if (!idLinea) errores.push(x.item.nombre + ": " + ODOO_ULTIMO_ERROR);
      if (x.item.grupo === 2 && !x.item.total) avisos.push("Otros servicios sin valor en la columna U: '" + x.item.nombre + "'");
    });

    // 7) Datos finales y verificación del monto
    const camposLeer = camposOrden.amount_untaxed ? ["name", "amount_untaxed"] : ["name"];
    let info = llamarOdooXMLRPC("repair.order", "read", [[rmaId], camposLeer], creds);
    if (!info) info = llamarOdooXMLRPC("repair.order", "read", [[rmaId], ["name"]], creds);
    const nombreRMA = (info && info[0] && info[0].name) ? info[0].name : ("RMA-" + rmaId);
    const sinImpuestos = (info && info[0]) ? info[0].amount_untaxed : null;

    res.exito = true;
    res.id = rmaId;
    res.nombre = nombreRMA;
    res.link = creds.urlWeb + "#id=" + rmaId + "&action=" + CONFIG.ODOO_ACCION_RMA +
      "&model=repair.order&view_type=form&cids=1&menu_id=" + CONFIG.ODOO_MENU_RMA;
    res.aplicaRete = imp.aplicaRete;

    if (errores.length > 0) {
      avisos.push("Fallaron líneas: " + errores.join("; "));
    }
    if (!avisoPrecio && r.faltantes.length === 0 && errores.length === 0 &&
        (sinImpuestos === null || Math.abs(sinImpuestos - totalPDF) > 1)) {
      avisos.push("El monto sin impuestos en Odoo es $" + formatearNumero(sinImpuestos || 0) +
        " y el PDF suma $" + formatearNumero(totalPDF) + ". Revisar antes de enviar.");
    }
    res.avisos = avisos;
    res.alarma = avisos.length > 0 ? "RMA " + nombreRMA + ": " + avisos.join(" | ") : "";
    return res;

  } catch (e) {
    Logger.log("❌ Error creando RMA: " + e + "\n" + e.stack);
    res.error = e.toString();
    return res;
  }
}

function adjuntarPDFaRMAOdoo(rmaId, urlPDF, creds) {
  try {
    if (!urlPDF || urlPDF.indexOf("drive.google.com/file") === -1) {
      return { exito: false, error: "El PDF no quedó guardado en Drive (solo existe el enlace de exportación)" };
    }
    const fileId = extraerFileIdDeURL(urlPDF);
    if (!fileId) return { exito: false, error: "No se pudo leer el ID del PDF en Drive" };

    const archivo = DriveApp.getFileById(fileId);
    const adjunto = {
      name: archivo.getName(),
      datas: Utilities.base64Encode(archivo.getBlob().getBytes()),
      res_model: "repair.order",
      res_id: rmaId,
      type: "binary",
      mimetype: "application/pdf"
    };
    const id = llamarOdooXMLRPC("ir.attachment", "create", [adjunto], creds);
    if (!id) return { exito: false, error: ODOO_ULTIMO_ERROR };
    return { exito: true, attachmentId: id };
  } catch (e) {
    return { exito: false, error: e.toString() };
  }
}

function escribirRMAEnFilas(hoja, filas, nombreRMA, link) {
  filas.forEach(f => {
    const c = hoja.getRange(f, 29);
    c.setFormula('=HYPERLINK("' + link + '","' + nombreRMA.toString().replace(/"/g, "") + '")');
    c.setFontColor("#0000FF");
    c.setFontLine("underline");
  });
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// V12: FINALIZAR OPORTUNIDAD = PDF + RMA en Odoo + adjuntar PDF + RMA en columna AC
// ═══════════════════════════════════════════════════════════════════════════════════════

function procesarOportunidadCompleta(hojaDiag, nombreOportunidad, mostrarAlerta = true) {
  try {
    const nombre = (nombreOportunidad || "").toString().trim();
    Logger.log("🚀 Procesando oportunidad: '" + nombre + "'");

    const diagnosticos = obtenerDiagnosticosDeOportunidad(hojaDiag, nombre);
    if (diagnosticos.length === 0) {
      return { exito: false, error: mensajeOportunidadNoEncontrada(hojaDiag, nombre) };
    }
    const filas = diagnosticos.map(d => d.fila);

    // Evitar RMA duplicada
    for (const d of diagnosticos) {
      const ac = (hojaDiag.getRange(d.fila, 29).getValue() || "").toString().trim();
      if (ac && ac.indexOf("⏳") === -1 && ac.toUpperCase().indexOf("ERROR") !== 0) {
        return { exito: false, error: "Esta oportunidad ya tiene la RMA '" + ac + "' en la columna AC (fila " + d.fila + ").\nNo se crea otra. Si necesitas rehacerla, borra primero esa columna." };
      }
    }

    const cliente = diagnosticos[0].cliente;
    const silasDatos = agruparPorSilla(diagnosticos, hojaDiag);
    const totalGeneral = calcularTotalGeneral(silasDatos);
    const borrador = consolidarBorradorRMA(silasDatos);
    Logger.log("📊 Sillas: " + silasDatos.length + " | Total silla x silla: " + totalGeneral + " | Consolidado por ítem: " + borrador.total);

    // PDF (siempre, para poder revisarlos)
    const pdfs = generarPDFDiagnosticos(nombre, cliente, silasDatos, totalGeneral);
    const urlPDF = pdfs ? pdfs.presupuesto : null;
    const urlConsolidado = pdfs ? pdfs.consolidado : null;
    if (!urlPDF) {
      return { exito: false, error: "No se pudo generar el PDF. Revisa el registro de ejecuciones." };
    }

    // ALARMA (no bloquea): silla x silla vs consolidado por ítem
    const alarmas = [];
    if (Math.abs(totalGeneral - borrador.total) > 1) {
      const dif = Math.round(totalGeneral - borrador.total);
      alarmas.push("Total silla x silla " + formatearNumero(totalGeneral) + " ≠ consolidado por ítem " + formatearNumero(borrador.total) +
        " (dif. " + formatearNumero(dif) + "). Revisar precios y corregir a mano en la RMA.");
    }

    // Odoo
    const creds = obtenerCredencialesOdoo();
    if (!creds) {
      return { exito: false, urlPDF: urlPDF, error: "Faltan las credenciales de Odoo. Usa el menú: ⚙️ Configurar Credenciales Odoo.\n\nPDF generado:\n" + urlPDF };
    }

    const rma = crearRMAenOdooDesdeBorrador(nombre, borrador, totalGeneral, creds);

    if (!rma.exito) {
      alarmas.push(rma.error || rma.alarma);
      escribirAlarmaEnFilas(hojaDiag, filas, alarmas.join(" | "));
      return { exito: false, urlPDF: urlPDF, error: (rma.error || rma.alarma) + "\n\nEl PDF sí se generó:\n" + urlPDF };
    }

    // RMA en columna AC (número de Odoo + enlace) en todas las sillas de la oportunidad
    escribirRMAEnFilas(hojaDiag, filas, rma.nombre, rma.link);

    // Adjuntar los PDF a la RMA
    const adj = adjuntarPDFaRMAOdoo(rma.id, urlPDF, creds);
    const adjCons = (CONFIG.ADJUNTAR_CONSOLIDADO && urlConsolidado)
      ? adjuntarPDFaRMAOdoo(rma.id, urlConsolidado, creds) : { exito: true, omitido: true };

    if (rma.alarma) alarmas.push(rma.alarma);
    if (!adj.exito) alarmas.push("No se pudo adjuntar el PDF silla x silla a la RMA: " + adj.error);
    if (!adjCons.exito) alarmas.push("No se pudo adjuntar el consolidado a la RMA: " + adjCons.error);

    if (alarmas.length > 0) {
      escribirAlarmaEnFilas(hojaDiag, filas, alarmas.join(" | "));
    } else {
      limpiarAlarmaEnFilas(hojaDiag, filas);
    }

    let mensaje = (alarmas.length > 0 ? "⚠️ RMA CREADA CON ALERTAS\n\n" : "✅ COMPLETADO\n\n") +
      "RMA: " + rma.nombre + "\nLink: " + rma.link + "\n" +
      "Impuestos: IVA 19%" + (rma.aplicaRete ? " + Retefuente 4%" : "") + "\n" +
      "PDF silla x silla " + (adj.exito ? "adjunto a la RMA ✅" : "NO adjunto ❌") + "\n" + urlPDF + "\n" +
      "PDF consolidado " + (!urlConsolidado ? "(no generado)" : (adjCons.omitido ? "(generado, no se adjunta)" : (adjCons.exito ? "adjunto a la RMA ✅" : "NO adjunto ❌"))) +
      (urlConsolidado ? "\n" + urlConsolidado : "");
    if (alarmas.length > 0) mensaje += "\n\n🚨 " + alarmas.join("\n🚨 ") + "\n(Marcado en la columna AD)";

    return { exito: true, referenciaRMA: rma.nombre, linkRMA: rma.link, urlPDF: urlPDF, urlConsolidado: urlConsolidado, mensaje: mensaje };

  } catch (e) {
    Logger.log("❌ Error en procesarOportunidadCompleta: " + e.toString() + "\n" + e.stack);
    return { exito: false, error: e.toString() };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// V12: APROBADO (todas las formas) -> EYM + fecha + OP
// ═══════════════════════════════════════════════════════════════════════════════════════

function aprobarFilaSiCorresponde(hoja, fila) {
  const fechaAprobacion = hoja.getRange(fila, 28).getValue();
  if (fechaAprobacion) {
    Logger.log("🟣 Fila " + fila + " ya fue aprobada antes (" + fechaAprobacion + "), no se repite");
    return false;
  }
  procesarAprobacionEnFila(hoja, fila);
  return true;
}

// X (TOTAL PPTTO antes de IVA) = T + U + V + W, siempre como fórmula en la celda. Solo toca filas con oportunidad (col. B).
function recalcularTotalXFilas(hoja, filaIni, filaFin) {
  const n = filaFin - filaIni + 1;
  if (n < 1) return 0;
  const oportunidades = hoja.getRange(filaIni, 2, n, 1).getValues();
  const rangoX = hoja.getRange(filaIni, 24, n, 1);
  const formulas = rangoX.getFormulas();
  const valores = rangoX.getValues();
  let cambios = 0;
  const salida = oportunidades.map((r, i) => {
    if (!r[0]) return [formulas[i][0] || valores[i][0]];
    const f = "=SUM(T" + (filaIni + i) + ":W" + (filaIni + i) + ")";
    if (formulas[i][0] !== f) cambios++;
    return [f];
  });
  rangoX.setFormulas(salida);
  return cambios;
}

// Botón de menú: recalcula SOLO la columna X de todas las filas (no toca U, estados ni nada más)
function recalcularTotalesX() {
  const ui = SpreadsheetApp.getUi();
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DIAGNOSTICOS_2026");
  if (!hoja) { ui.alert("❌ Hoja DIAGNOSTICOS_2026 no encontrada"); return; }
  const ult = hoja.getLastRow();
  if (ult < 2) { ui.alert("No hay diagnósticos."); return; }
  const cambios = recalcularTotalXFilas(hoja, 2, ult);
  ui.alert("✅ Totales actualizados: la columna X ahora es siempre T + U + V + W.\n\nFilas corregidas: " + cambios);
}

// Cubre: lista desplegable, escrito, pegado, arrastrado (varias filas a la vez)
function onEdit(e) {
  try {
    const range = e.range;
    const hoja = range.getSheet();
    if (hoja.getName() !== "DIAGNOSTICOS_2026") return;

    const c1 = range.getColumn(), c2 = range.getLastColumn();
    const filaIni = Math.max(range.getRow(), 2);
    const filaFin = range.getLastRow();
    if (filaFin < 2) return;

    // Columnas O (15) o P (16): resaltar U para llenar el valor a mano
    if (c1 <= 16 && c2 >= 15) {
      for (let f = filaIni; f <= filaFin; f++) validarYResaltarColumnaU(hoja, f);
    }

    // Columnas T a W (20-23): X = T + U + V + W se recalcula para que el total no quede desactualizado
    if (c1 <= 23 && c2 >= 20) {
      recalcularTotalXFilas(hoja, filaIni, filaFin);
    }

    // Columna AA (27): estados
    if (c1 <= 27 && c2 >= 27) {
      const valores = hoja.getRange(filaIni, 27, filaFin - filaIni + 1, 1).getValues();
      Logger.log("🟣 onEdit AA: filas " + filaIni + " a " + filaFin);
      for (let i = 0; i < valores.length; i++) {
        const f = filaIni + i;
        const v = (valores[i][0] || "").toString().trim().toLowerCase();
        if (v.includes("aprobado")) {
          aprobarFilaSiCorresponde(hoja, f);
        }
      }
    }
  } catch (err) {
    Logger.log("❌ ERROR en onEdit: " + err.toString() + "\n" + err.stack);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// V13: SINCRONIZAR CON ODOO (botón único)
//  A) RMA ya no está en borrador -> sillas "Aprobado" (EYM + fecha + OP "En producción") y "Iniciar reparación"
//  B) Todas las OP de una RMA en "Terminado" -> "Finalizar reparación" y "Crear factura"
// Los cambios hechos por script no activan onEdit, por eso aquí se llama directamente al proceso de aprobación.
// ═══════════════════════════════════════════════════════════════════════════════════════

function leerRMAsDeHoja(hoja) {
  const ult = hoja.getLastRow();
  const porRMA = {};
  if (ult < 2) return porRMA;
  hoja.getRange(2, 1, ult - 1, 30).getValues().forEach((r, i) => {
    const rma = (r[28] || "").toString().trim();
    if (!rma || rma.indexOf("⏳") !== -1 || rma.toUpperCase().indexOf("ERROR") === 0) return;
    (porRMA[rma] = porRMA[rma] || []).push({
      fila: i + 2,
      eym: (r[4] || "").toString().trim(),
      aprobada: (r[26] || "").toString().toLowerCase().includes("aprobado"),
      fechaAprobacion: r[27]
    });
  });
  return porRMA;
}

function estadosRMAenOdoo(nombres, creds) {
  if (nombres.length === 0) return [];
  return llamarOdooXMLRPC("repair.order", "search_read", [[["name", "in", nombres]], ["name", "state"]], creds);
}

// A) Aprobación e inicio de reparación
function sincronizarAprobacionesOdoo(hoja, creds) {
  const res = { aprobadas: 0, iniciadas: [], confirmadas: [], borradores: [], errores: [] };
  const porRMA = leerRMAsDeHoja(hoja);
  const rmas = estadosRMAenOdoo(Object.keys(porRMA), creds);
  if (rmas === null) {
    res.errores.push("No se pudo consultar Odoo: " + ODOO_ULTIMO_ERROR);
    return res;
  }
  rmas.forEach(rma => {
    if (rma.state === "cancel") return;

    // Aprobado a mano en la hoja con la RMA aún en borrador: se confirma la RMA en Odoo
    if (rma.state === "draft") {
      const aprobadaEnHoja = porRMA[rma.name].some(x => x.aprobada || x.fechaAprobacion);
      if (!aprobadaEnHoja) { res.borradores.push(rma.name); return; }
      const conf = llamarOdooXMLRPC("repair.order", "action_repair_confirm", [[rma.id]], creds);
      if (conf === null) {
        res.errores.push(rma.name + ": no se pudo confirmar la RMA en Odoo. " + ODOO_ULTIMO_ERROR);
        escribirAlarmaEnFilas(hoja, porRMA[rma.name].map(x => x.fila), "Odoo no pudo confirmar la RMA " + rma.name + ": " + ODOO_ULTIMO_ERROR);
        return;
      }
      res.confirmadas.push(rma.name);
      rma.state = "confirmed";
    }

    porRMA[rma.name].forEach(x => {
      if (!x.aprobada) hoja.getRange(x.fila, 27).setValue("Aprobado");
      if (aprobarFilaSiCorresponde(hoja, x.fila)) res.aprobadas++;
    });

    if (rma.state === "confirmed" || rma.state === "ready") {
      const r = llamarOdooXMLRPC("repair.order", "action_repair_start", [[rma.id]], creds);
      if (r === null) {
        res.errores.push(rma.name + ": no se pudo iniciar la reparación. " + ODOO_ULTIMO_ERROR);
        escribirAlarmaEnFilas(hoja, porRMA[rma.name].map(x => x.fila), "Odoo no pudo iniciar la reparación de " + rma.name + ": " + ODOO_ULTIMO_ERROR);
      } else {
        res.iniciadas.push(rma.name);
      }
    }
  });
  return res;
}

// B) Cierre: todas las OP de la RMA en "Terminado" (se relacionan por el número EyM: OP col. P <-> diagnóstico col. E)
function cerrarRMAsTerminadas(hoja, hojaOP, creds, ui) {
  const res = { facturadas: [], pendientes: [], errores: [], omitido: false };
  if (!hojaOP) {
    res.errores.push("No se encontró la hoja OP_2026");
    return res;
  }
  const totalPorEYM = {}, terminadasPorEYM = {};
  const ultOP = hojaOP.getLastRow();
  if (ultOP >= 2) {
    hojaOP.getRange(2, 16, ultOP - 1, 2).getValues().forEach(r => {
      const eym = (r[0] || "").toString().trim();
      if (!eym) return;
      totalPorEYM[eym] = (totalPorEYM[eym] || 0) + 1;
      if ((r[1] || "").toString().trim().toLowerCase() === CONFIG.ESTADO_OP_TERMINADO.toLowerCase()) {
        terminadasPorEYM[eym] = (terminadasPorEYM[eym] || 0) + 1;
      }
    });
  }

  const porRMA = leerRMAsDeHoja(hoja);
  const candidatas = Object.keys(porRMA).filter(nombre => {
    const filas = porRMA[nombre];
    const completa = filas.every(x => x.eym && totalPorEYM[x.eym] > 0 && terminadasPorEYM[x.eym] === totalPorEYM[x.eym]);
    if (!completa) res.pendientes.push(nombre);
    return completa;
  });
  if (candidatas.length === 0) return res;

  const rmas = estadosRMAenOdoo(candidatas, creds);
  if (rmas === null) {
    res.errores.push("No se pudo consultar Odoo: " + ODOO_ULTIMO_ERROR);
    return res;
  }
  const porCerrar = rmas.filter(r => r.state === "under_repair" || r.state === "2binvoiced");
  if (porCerrar.length === 0) return res;

  const resp = ui.alert("🏁 CERRAR RMAs TERMINADAS",
    "Todas las OP de estas RMAs están en 'Terminado':\n\n" +
    porCerrar.map(r => "• " + r.name + (r.state === "2binvoiced" ? " (solo falta la factura)" : "")).join("\n") +
    "\n\nSe hará 'Finalizar reparación' y luego 'Crear factura' en Odoo.\n¿Continuar?", ui.ButtonSet.YES_NO);
  if (resp !== ui.Button.YES) {
    res.omitido = true;
    return res;
  }

  porCerrar.forEach(rma => {
    const filas = porRMA[rma.name].map(x => x.fila);
    if (rma.state === "under_repair") {
      const fin = llamarOdooXMLRPC("repair.order", "action_repair_end", [[rma.id]], creds);
      if (fin === null) {
        res.errores.push(rma.name + ": no se pudo finalizar la reparación. " + ODOO_ULTIMO_ERROR);
        escribirAlarmaEnFilas(hoja, filas, "Odoo no pudo finalizar la reparación de " + rma.name + ": " + ODOO_ULTIMO_ERROR);
        return;
      }
    }
    const fac = llamarOdooXMLRPC("repair.order", "action_repair_invoice_create", [[rma.id]], creds);
    if (fac === null) {
      res.errores.push(rma.name + ": reparación finalizada pero no se pudo crear la factura. " + ODOO_ULTIMO_ERROR);
      escribirAlarmaEnFilas(hoja, filas, "Odoo no pudo crear la factura de " + rma.name + ": " + ODOO_ULTIMO_ERROR);
      return;
    }
    res.facturadas.push(rma.name);
  });
  return res;
}

function sincronizarConOdoo() {
  const ui = SpreadsheetApp.getUi();
  try {
    const creds = obtenerCredencialesOdoo();
    if (!creds) {
      ui.alert("Faltan las credenciales de Odoo. Usa: ⚙️ Configurar Credenciales Odoo");
      return;
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName("DIAGNOSTICOS_2026");
    if (!hoja) {
      ui.alert("❌ Hoja DIAGNOSTICOS_2026 no encontrada");
      return;
    }

    const a = sincronizarAprobacionesOdoo(hoja, creds);
    const b = cerrarRMAsTerminadas(hoja, ss.getSheetByName("OP_2026"), creds, ui);

    const lineas = ["🔄 SINCRONIZACIÓN CON ODOO", ""];
    lineas.push("A) Aprobación");
    lineas.push("• Sillas aprobadas ahora (EYM + fecha + OP en producción): " + a.aprobadas);
    if (a.confirmadas.length) lineas.push("• RMAs confirmadas en Odoo desde la hoja: " + a.confirmadas.join(", "));
    lineas.push("• Reparaciones iniciadas en Odoo: " + (a.iniciadas.join(", ") || "ninguna"));
    if (a.borradores.length) lineas.push("• RMAs en borrador sin aprobar (escribe 'Aprobado' en la hoja o confírmalas en Odoo): " + a.borradores.join(", "));
    lineas.push("");
    lineas.push("B) Cierre");
    lineas.push("• Reparación finalizada y factura creada: " + (b.facturadas.join(", ") || "ninguna"));
    if (b.omitido) lineas.push("• Cierre cancelado por el usuario");
    if (b.pendientes.length) lineas.push("• RMAs con OP aún sin terminar: " + b.pendientes.join(", "));
    const errores = a.errores.concat(b.errores);
    if (errores.length) {
      lineas.push("");
      lineas.push("🚨 PROBLEMAS (también marcados en la columna AD):");
      errores.forEach(e => lineas.push("• " + e));
    }
    ui.alert(lineas.join("\n"));

  } catch (e) {
    Logger.log("❌ Error en sincronizarConOdoo: " + e + "\n" + e.stack);
    ui.alert("❌ ERROR: " + e.toString());
  }
}

// Una sola ejecución que deja en el registro todo lo necesario del esquema de RMA en Odoo
function diagnosticoOdooRMA() {
  const ui = SpreadsheetApp.getUi();
  const creds = obtenerCredencialesOdoo();
  if (!creds) {
    ui.alert("Faltan las credenciales de Odoo. Usa: ⚙️ Configurar Credenciales Odoo");
    return;
  }
  Logger.log("═══ DIAGNÓSTICO ODOO RMA ═══");
  const uid = odooUid(creds);
  Logger.log("Conexión: " + (uid ? "OK (UID " + uid + ")" : "FALLÓ"));
  if (!uid) {
    ui.alert("❌ No se pudo autenticar en Odoo. Revisa credenciales.");
    return;
  }

  ["repair.order", "repair.line", "repair.fee"].forEach(m => {
    const c = odooCampos(m, creds);
    const claves = Object.keys(c);
    Logger.log("\n▶ " + m + " (" + claves.length + " campos)");
    Logger.log("  Requeridos: " + claves.filter(k => c[k].required).join(", "));
    Logger.log("  Relacionados con crm.lead: " + (claves.filter(k => c[k].relation === "crm.lead").join(", ") || "ninguno"));
    Logger.log("  Cantidad: " + ["product_uom_qty", "product_qty"].filter(k => c[k]).join(", ") +
      " | Unidad: " + ["product_uom", "product_uom_id"].filter(k => c[k]).join(", ") +
      " | Impuestos: " + ["tax_id", "tax_ids"].filter(k => c[k]).join(", ") +
      " | to_invoice: " + (c.to_invoice ? "sí" : "no") + " | invoice_method: " + (c.invoice_method ? "sí" : "no"));
  });

  const mob = buscarProductoMobiliario(creds);
  Logger.log("\nProducto a reparar: " + (mob ? "[" + mob.default_code + "] " + mob.name + " (id " + mob.id + ")" : "NO ENCONTRADO"));

  const imp = llamarOdooXMLRPC("account.tax", "search_read",
    [[["type_tax_use", "=", "sale"], "|", ["amount", "=", 19], ["amount", "=", -4]], ["name", "amount"]], creds) || [];
  Logger.log("Impuestos de venta 19% / -4%: " + (imp.map(t => "'" + t.name + "' (" + t.amount + ")").join(" | ") || "ninguno"));
  Logger.log("IVA por nombre '" + CONFIG.NOMBRE_IVA + "': " + (buscarImpuestoPorNombre(CONFIG.NOMBRE_IVA, creds) || "NO ENCONTRADO"));
  Logger.log("Retefuente por nombre '" + CONFIG.NOMBRE_RETEFUENTE + "': " + (buscarImpuestoPorNombre(CONFIG.NOMBRE_RETEFUENTE, creds) || "NO ENCONTRADO"));

  const estados = llamarOdooXMLRPC("repair.order", "fields_get", [["state"], ["selection"]], creds);
  Logger.log("Estados de repair.order: " + JSON.stringify(estados && estados.state && estados.state.selection));

  const resp = ui.prompt("Nombre EXACTO de una oportunidad para probar la búsqueda (opcional):");
  if (resp.getSelectedButton() === ui.Button.OK && resp.getResponseText().trim()) {
    const nombre = resp.getResponseText().trim();
    const op = buscarOportunidadOdoo(nombre, creds);
    Logger.log("Oportunidad '" + nombre + "': " + (op.id ? "ENCONTRADA (id " + op.id + ", " + op.count + " coincidencia/s), cliente id " + obtenerClienteDeOportunidad(op.id, creds) : "NO encontrada. Parecidas: " + sugerirOportunidadesOdoo(nombre, creds).join(" | ")));
  }
  Logger.log("═══ FIN DIAGNÓSTICO ═══");
  ui.alert("Diagnóstico listo. Revisa Ejecuciones → registro.");
}


function extraerFileIdDeURL(url) {
  try {
    // URL de Google Drive: https://drive.google.com/file/d/FILE_ID/view
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)\//);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════════════════
// WEBHOOK ENDPOINT PARA ODOO → EXCEL (Fase 2)
// ═════════════════════════════════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    Logger.log("🔔 Webhook recibido de Odoo: " + JSON.stringify(payload));

    if (payload.evento === "rma_confirmada") {
      const numeroEYM = payload.numeroEYM;
      const estadoNuevo = "Aprobado";

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const hojaDiag = ss.getSheetByName("DIAGNOSTICOS_2026");
      if (!hojaDiag) {
        return ContentService.createTextOutput(JSON.stringify({ exito: false, error: "Hoja no encontrada" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const ultFila = hojaDiag.getLastRow();
      let actualizado = false;

      for (let f = 2; f <= ultFila; f++) {
        const eyM = hojaDiag.getRange(f, 5).getValue();
        if (eyM == numeroEYM) {
          hojaDiag.getRange(f, 31).setValue(estadoNuevo); // Columna AE
          actualizado = true;
          Logger.log("✅ Estado actualizado a 'Aprobado' para EYM: " + numeroEYM);
          break;
        }
      }

      if (actualizado) {
        return ContentService.createTextOutput(JSON.stringify({ exito: true, mensaje: "Estado actualizado" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ exito: false, error: "Evento no reconocido" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    Logger.log("❌ Error en webhook: " + e);
    return ContentService.createTextOutput(JSON.stringify({ exito: false, error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// SINCRONIZACIÓN CON ODOO: Detectar RMAs confirmadas y actualizar columna AA
// ═══════════════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════════════
// FUNCIÓN AUXILIAR: Buscar Repair Orders confirmadas en Odoo (repair.order state=confirmed)
// Retorna nombre de RMA para buscar en columna AC (REFERENCIA_RMA) de DIAGNOSTICOS_2026
// ═══════════════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════════════
// FUNCIÓN: Probar los 5 métodos de entrada en columna AA
// ═══════════════════════════════════════════════════════════════════════════════════════

function probarTodosLosMetodos() {
  try {
    const ui = SpreadsheetApp.getUi();
    Logger.log("\n════════════════════════════════════════════════════════");
    Logger.log("🧪 PRUEBA DE LOS 5 MÉTODOS DE ENTRADA EN COLUMNA AA");
    Logger.log("════════════════════════════════════════════════════════\n");

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName("DIAGNOSTICOS_2026");

    if (!hoja) {
      ui.alert("❌ Hoja DIAGNOSTICOS_2026 no encontrada");
      return;
    }

    const ultimaFila = hoja.getLastRow();
    const testFila = ultimaFila + 1; // Usar una fila vacía para pruebas

    // Crear datos de prueba en la fila
    Logger.log("📌 Creando fila de prueba (fila " + testFila + ")...");
    hoja.getRange(testFila, 1).setValue(new Date()); // Fecha
    hoja.getRange(testFila, 2).setValue("TEST_Oportunidad_5Metodos");
    hoja.getRange(testFila, 3).setValue("TestCliente");
    hoja.getRange(testFila, 4).setValue("TestSilla");

    const metodos = [
      { nombre: "1️⃣ DROPDOWN", descripcion: "Seleccionar de lista desplegable" },
      { nombre: "2️⃣ COPY/PASTE", descripcion: "Copiar y pegar de otra celda" },
      { nombre: "3️⃣ DRAG", descripcion: "Arrastrar desde otra celda" },
      { nombre: "4️⃣ MANUAL", descripcion: "Escribir manualmente" },
      { nombre: "5️⃣ ODOO", descripcion: "Sincronizado desde Odoo" }
    ];

    Logger.log("\n📋 MÉTODOS A PROBAR:\n");
    for (let m of metodos) {
      Logger.log("  " + m.nombre + " - " + m.descripcion);
    }
    Logger.log("\n════════════════════════════════════════════════════════");
    Logger.log("INSTRUCCIONES:\n");
    Logger.log("1. Haz clic en ACEPTAR");
    Logger.log("2. Irá a fila " + testFila + " columna AA (vacía)");
    Logger.log("3. Para CADA método, escribe 'Aprobado' de esa forma");
    Logger.log("4. Presiona ENTER después de cada escritura");
    Logger.log("5. Verifica en los logs que aparezca:");
    Logger.log("   '✅ [MÉTODO DETECTADO]'");
    Logger.log("════════════════════════════════════════════════════════\n");

    // Ir a la celda AA de la fila de prueba
    hoja.getRange(testFila, 27).activate();

    ui.alert(
      "🧪 INSTRUCCIONES PARA PROBAR LOS 5 MÉTODOS\n\n" +
      "Fila de prueba: " + testFila + " (columna AA)\n\n" +
      "1️⃣ DROPDOWN: Haz clic en el triángulo ▼ y selecciona 'Aprobado'\n\n" +
      "2️⃣ COPY/PASTE: Copia 'Aprobado' de otra celda y pégalo aquí\n\n" +
      "3️⃣ DRAG: Arrastra 'Aprobado' de otra celda a esta\n\n" +
      "4️⃣ MANUAL: Digita manualmente: Aprobado\n\n" +
      "5️⃣ ODOO: (Manual por ahora, simula 'Aprobado')\n\n" +
      "Después de CADA paso, presiona ENTER.\n" +
      "Revisa los logs buscando '✅ [MÉTODO DETECTADO]'\n\n" +
      "¡Adelante! 🚀"
    );

  } catch (e) {
    Logger.log("❌ ERROR en probarTodosLosMetodos(): " + e.toString());
    SpreadsheetApp.getUi().alert("❌ Error: " + e.toString());
  }
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu("EYM v13.0")
    .addItem("📥 Procesar Manualmente", "procesarRespuestaFormulario")
    .addItem("🔧 Instalar Trigger", "instalarTriggerAutomatico")
    .addSeparator()
    .addItem("🖨️ Presupuesto silla x silla", "generarPresupuestoDescargable")
    .addItem("📋 Finalizar Oportunidad", "finalizarOportunidad")
    .addItem("🔄 Sincronizar con Odoo (aprobar / cerrar)", "sincronizarConOdoo")
    .addSeparator()
    .addItem("✅ Procesar Aprobados → OP", "procesarAprobadosAOP")
    .addItem("🧮 Recalcular totales (columna X)", "recalcularTotalesX")
    .addItem("🔁 Recalcular Todo", "recalcularTodo")
    .addItem("📋 Configurar Listas Desplegables", "configurarValidacionAprobacion")
    .addSeparator()
    .addItem("⚙️ Configurar Credenciales Odoo", "configurarCredencialesOdoo")
    .addItem("🔧 PRUEBA: Conectar Odoo", "pruebaConexionOdoo")
    .addItem("🔬 DIAGNÓSTICO: Esquema RMA en Odoo", "diagnosticoOdooRMA")
    .addItem("🧪 PRUEBA: onEdit() funciona?", "pruebaOnEdit")
    .addItem("🧪 PRUEBA: 5 Métodos de Entrada", "probarTodosLosMetodos")
    .addItem("DEBUG: Ver Hojas", "diagnosticarHojas")
    .addToUi();
}

function pruebaGenerarPDFConEjemplo() {
  try {
    Logger.log("\n🧪 ════════════════════════════════════════════════════════");
    Logger.log("🧪 PRUEBA: Generar PDF con datos de ejemplo");
    Logger.log("🧪 ════════════════════════════════════════════════════════\n");

    // Datos de ejemplo - 3 sillas
    const silasDatos = [
      {
        numeroTemporal: "S-001",
        tipoSilla: "Secretarial",
        color: "Negro",
        ubicacion: "Oficina Gerente",
        partesYServicios: "Cilindro Butaco, Contacto Permanente, Soldadura, M.O y mantenimiento general",
        valorPartesYMO: 165000,
        valorOtrosServicios: 35000,
        valorTapiceria: 0,
        tapiceria: "-",
        valorTotal: 200000
      },
      {
        numeroTemporal: "S-002",
        tipoSilla: "Gerencial",
        color: "Beige",
        ubicacion: "Sala Juntas",
        partesYServicios: "Base Cromada, Rodachinas, Abollonado, M.O y mantenimiento general",
        valorPartesYMO: 120000,
        valorOtrosServicios: 25000,
        valorTapiceria: 85000,
        tapiceria: "Asiento: Abollonado; Espaldar: Tapizado",
        valorTotal: 230000
      },
      {
        numeroTemporal: "S-003",
        tipoSilla: "Butaca",
        color: "Gris",
        ubicacion: "Recepción",
        partesYServicios: "Platina, Brazos, Limpieza, M.O y mantenimiento general",
        valorPartesYMO: 95000,
        valorOtrosServicios: 30000,
        valorTapiceria: 120000,
        tapiceria: "Abollonado y Tapizado general",
        valorTotal: 245000
      }
    ];

    const nombreOportunidad = "PRUEBA_Ejemplo_" + new Date().toLocaleDateString("es-CO");
    const cliente = "CLIENTE DE PRUEBA S.A.S.";
    const totalGeneral = 675000;

    Logger.log("📋 Datos de ejemplo preparados:");
    Logger.log("   - Sillas: " + silasDatos.length);
    Logger.log("   - Cliente: " + cliente);
    Logger.log("   - Total: $" + formatearNumero(totalGeneral));
    Logger.log("   - Oportunidad: " + nombreOportunidad);

    // Generar PDF
    const pdfsEjemplo = generarPDFDiagnosticos(nombreOportunidad, cliente, silasDatos, totalGeneral);
    const urlPDF = pdfsEjemplo ? pdfsEjemplo.presupuesto : null;

    if (urlPDF) {
      Logger.log("\n✅ PRUEBA EXITOSA");
      Logger.log("✅ URL del PDF: " + urlPDF);
      Logger.log("\n📥 DESCARGA EL PDF:");
      Logger.log("   " + urlPDF + "?export=download");

      SpreadsheetApp.getUi().alert(
        "✅ PRUEBA COMPLETADA EXITOSAMENTE\n\n" +
        "📄 Se generó un PDF con datos de ejemplo\n\n" +
        "🔗 URL (para editar):\n" +
        urlPDF + "\n\n" +
        "📥 URL (para descargar PDF):\n" +
        urlPDF.replace("/edit", "/export/pdf").replace("presentation", "presentation") + "?export=download"
      );
    } else {
      Logger.log("❌ PRUEBA FALLIDA");
      SpreadsheetApp.getUi().alert("❌ Error generando el PDF\n\nRevisa los logs en Extensiones > Apps Script > Ejecuciones");
    }

  } catch (e) {
    Logger.log("\n❌ ERROR EN PRUEBA:");
    Logger.log("❌ " + e.toString());
    Logger.log("❌ Línea: " + e.lineNumber);
    SpreadsheetApp.getUi().alert("❌ Error: " + e.toString());
  }
}

function pruebaConexionOdoo() {
  try {
    const creds = obtenerCredencialesOdoo();

    SpreadsheetApp.getUi().alert("🔍 Probando conexión a Odoo...\n\nPrimero voy a listar las bases de datos disponibles...\n\nRevisa los Logs para detalles...");

    Logger.log("═══════════════════════════════════════════════════════════════");
    Logger.log("🔍 INICIANDO PRUEBA DE CONEXIÓN ODOO");
    Logger.log("═══════════════════════════════════════════════════════════════");
    Logger.log("URL: " + creds.url);
    Logger.log("Database actual: " + creds.database);
    Logger.log("Username: " + creds.username);
    Logger.log("URL completa JSON-RPC: " + creds.url + "/jsonrpc");

    // Prueba 0: Listar bases de datos disponibles (sin autenticación)
    Logger.log("\n📌 PRUEBA 0: Listando bases de datos disponibles...");
    const bdsList = listarBaseDatosOdoo(creds);
    if (bdsList && bdsList.length > 0) {
      Logger.log("✅ Bases de datos encontradas: " + bdsList.join(", "));
    } else {
      Logger.log("⚠️ No se pudo listar las BDs o lista vacía");
    }

    // Prueba 1: Buscar en crm.lead (sin filtros)
    Logger.log("\n📌 PRUEBA 1: Buscando TODOS los CRM LEADS (sin filtros)...");
    const leadsAll = llamarOdooXMLRPC("crm.lead", "search", [[]], creds);

    if (leadsAll === null) {
      Logger.log("❌ FALLO: llamarOdooXMLRPC retornó null");
      SpreadsheetApp.getUi().alert("❌ CONEXIÓN FALLIDA\n\nError: La llamada a Odoo retornó null.\n\nVerifica en Logs (Extensiones → Apps Script → Ejecuciones):\n1. El status HTTP\n2. Si hay error de Odoo\n3. Si la respuesta está vacía");
      return;
    }

    Logger.log("✅ Búsqueda exitosa");
    Logger.log("CRM Leads encontrados: " + (Array.isArray(leadsAll) ? leadsAll.length : "NO ES ARRAY: " + typeof leadsAll));

    if (Array.isArray(leadsAll) && leadsAll.length > 0) {
      Logger.log("Primeros 5 lead IDs: " + leadsAll.slice(0, 5).join(", "));
    }

    // Prueba 2: Buscar una oportunidad específica
    Logger.log("\n📌 PRUEBA 2: Buscando 'Mic 25' en CRM LEADS...");
    const resultado = llamarOdooXMLRPC("crm.lead", "search", [[["name", "ilike", "Mic 25"]]], creds);

    if (resultado === null) {
      Logger.log("❌ FALLO: Búsqueda específica retornó null");
    } else {
      Logger.log("Resultados encontrados: " + (Array.isArray(resultado) ? resultado.length : "NO ES ARRAY"));
      if (Array.isArray(resultado) && resultado.length > 0) {
        Logger.log("✅ ENCONTRADA! IDs: " + resultado.join(", "));
      } else {
        Logger.log("⚠️ No encontrada (pero la búsqueda fue exitosa)");
      }
    }

    // Prueba 3: Verificar acceso a res.partner
    Logger.log("\n📌 PRUEBA 3: Verificando acceso a PARTNERS...");
    const partnersAll = llamarOdooXMLRPC("res.partner", "search", [[]], creds);
    if (partnersAll === null) {
      Logger.log("❌ No se puede acceder a Partners");
    } else {
      Logger.log("✅ Partners encontrados: " + (Array.isArray(partnersAll) ? partnersAll.length : "NO ES ARRAY"));
    }

    Logger.log("\n═══════════════════════════════════════════════════════════════");
    Logger.log("✅ PRUEBA COMPLETADA - Revisa los detalles arriba");
    Logger.log("═══════════════════════════════════════════════════════════════");

    if (Array.isArray(leadsAll) && leadsAll.length > 0) {
      SpreadsheetApp.getUi().alert("✅ CONEXIÓN EXITOSA!\n\nCRM Leads totales: " + leadsAll.length + "\n\nRevisa los Logs para ver detalles completos de las 3 pruebas");
    } else {
      SpreadsheetApp.getUi().alert("⚠️ CONEXIÓN PARCIAL\n\nNo se encontraron leads, pero la conexión respondió.\n\nRevisa los Logs para más detalles");
    }

  } catch (e) {
    Logger.log("❌ ERROR DE CONEXIÓN: " + e.toString());
    SpreadsheetApp.getUi().alert("❌ ERROR:\n" + e.toString() + "\n\nVerifica:\n1. URL de Odoo\n2. Credenciales\n3. Acceso a módulo CRM");
  }
}
