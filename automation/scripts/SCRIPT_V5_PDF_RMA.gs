// ═══════════════════════════════════════════════════════════════════════════════════════
// SISTEMA AUTOMÁTICO EYM OFICINAS v5.0 - GENERACIÓN PDF + RMA CONSOLIDADA
// ═══════════════════════════════════════════════════════════════════════════════════════
// Incluye: PDF automático agrupado por silla + RMA consolidada en Odoo

const ID_RESPUESTAS_NUEVA = "151jFiyUYDKxHYgswm5-BIED8py5j1_txVxYU5qyPlW4";
const ID_DIAGNOSTICOS = "1yaRRfrnzseiqXqoiHrFM6KZ9lc124e3cM4Xcqw8-p9Y";
const ID_FORMULARIO = "1ernMEHTdhRypQCMVgZmHxFGpvQPXkmYhygfxa-i0jxY";

const CONFIG = {
  PROXIMO_EYM: 60037,
  PROXIMO_OP: 7560,
  MANTENIMIENTO_GENERAL: 46000,
  CELDA_CONTROL: "AE1"
};

let CATALOGO_CACHE = null;

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECCIÓN 1: CATÁLOGO Y PRECIOS
// ═══════════════════════════════════════════════════════════════════════════════════════

function obtenerCatalogoPreciosDesdeSheet() {
  if (CATALOGO_CACHE !== null) {
    return CATALOGO_CACHE;
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

    for (let i = 1; i < datos.length; i++) {
      const nombre = datos[i][0] ? datos[i][0].toString().toLowerCase().trim() : "";
      const precio = datos[i][1] ? parseInt(datos[i][1]) : 0;
      const codigo = datos[i][2] || "";

      if (nombre && precio > 0) {
        catalogo[nombre] = { precio: precio, codigo: codigo };
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
    return 0;
  }

  const nombreNormalizado = normalizarTexto(nombreProducto);

  if (catalogo[nombreNormalizado]) return catalogo[nombreNormalizado].precio;

  const palabras = nombreNormalizado.split(" ");
  for (const [comp, info] of Object.entries(catalogo)) {
    let coincidencias = 0;
    for (const palabra of palabras) {
      if (palabra.length > 2 && comp.includes(palabra)) coincidencias++;
    }
    if (coincidencias > 0) return info.precio;
  }

  return 0;
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECCIÓN 2: PROCESAMIENTO DE RESPUESTAS (SIN CAMBIOS)
// ═══════════════════════════════════════════════════════════════════════════════════════

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

    const ultimaProcesada = obtenerUltimaRespuestaProcesada();
    let procesadas = 0;

    const ultFilaDiag = hojaDiag.getLastRow();
    for (let r = 2; r <= ultFilaResp; r++) {
      const resp = hojaResp.getRange(r, 1, 1, 34).getValues()[0];

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

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECCIÓN 3: FUNCIONES NUMÉRICAS
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
// SECCIÓN 4: FINALIZAR OPORTUNIDAD (NUEVO)
// ═══════════════════════════════════════════════════════════════════════════════════════

/**
 * Finalizar oportunidad: generar PDF consolidado + crear RMA en Odoo
 */
function finalizarOportunidad() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hojaDiag = ss.getSheetByName("DIAGNÓSTICOS_2026");
    if (!hojaDiag) {
      SpreadsheetApp.getUi().alert("❌ Hoja DIAGNÓSTICOS_2026 no encontrada");
      return;
    }

    // Pedir nombre de oportunidad
    const ui = SpreadsheetApp.getUi();
    const response = ui.prompt("Ingresa el NOMBRE DE LA OPORTUNIDAD a finalizar:");

    if (response.getSelectedButton() == ui.Button.CANCEL) {
      return;
    }

    const nombreOportunidad = response.getResponseText().trim();
    if (!nombreOportunidad) {
      ui.alert("❌ Debes ingresar un nombre");
      return;
    }

    Logger.log("🔄 Finalizando oportunidad: " + nombreOportunidad);

    // 1. Obtener todos los diagnósticos de esta oportunidad
    const diagnosticos = obtenerDiagnosticosDeOportunidad(hojaDiag, nombreOportunidad);

    if (diagnosticos.length === 0) {
      ui.alert("❌ No se encontraron diagnósticos para: " + nombreOportunidad);
      return;
    }

    Logger.log("✅ Encontrados " + diagnosticos.length + " diagnósticos");

    // 2. Agrupar por silla
    const silasDatos = agruparPorSilla(diagnosticos, hojaDiag);

    // 3. Consolidar productos
    const productosConsolidados = consolidarProductosTotal(diagnosticos, hojaDiag);

    // 4. Calcular totales
    const totalGeneral = calcularTotalGeneral(silasDatos);

    // 5. Obtener datos del cliente
    const cliente = diagnosticos[0].cliente;
    const numeroEYM = diagnosticos[0].numeroEYM;

    Logger.log("📊 Cliente: " + cliente + " | EYM: " + numeroEYM);

    // 6. Generar PDF
    const urlPDF = generarPDFDiagnosticos(nombreOportunidad, cliente, silasDatos, totalGeneral);

    if (!urlPDF) {
      ui.alert("❌ Error generando PDF");
      return;
    }

    Logger.log("📄 PDF generado: " + urlPDF);

    // 7. Crear RMA en Odoo
    const resultadoRMA = crearRMAenOdooConProductos(cliente, numeroEYM, productosConsolidados, nombreOportunidad);

    if (!resultadoRMA.exito) {
      ui.alert("❌ Error creando RMA: " + resultadoRMA.error);
      return;
    }

    Logger.log("✅ RMA creada: " + resultadoRMA.referenciaRMA);

    // 8. Adjuntar PDF a RMA (si es posible)
    try {
      adjuntarPDFaRMA(resultadoRMA.numeroRMA, urlPDF);
    } catch (e) {
      Logger.log("⚠️ No se pudo adjuntar PDF: " + e);
    }

    // 9. Escribir RMA en diagnósticos
    for (let diag of diagnosticos) {
      hojaDiag.getRange(diag.fila, 29).setValue(resultadoRMA.referenciaRMA);
      hojaDiag.getRange(diag.fila, 29).setFormula('=HYPERLINK("' + resultadoRMA.linkRMA + '","' + resultadoRMA.referenciaRMA + '")');
      hojaDiag.getRange(diag.fila, 29).setFontColor("#0000FF");
      hojaDiag.getRange(diag.fila, 29).setFontLine("underline");
    }

    ui.alert("✅ OPORTUNIDAD FINALIZADA\n\nRMA: " + resultadoRMA.referenciaRMA + "\nPDF generado y vinculado\n\nLink: " + resultadoRMA.linkRMA);

  } catch (e) {
    Logger.log("❌ Error: " + e);
    SpreadsheetApp.getUi().alert("❌ ERROR: " + e.toString());
  }
}

/**
 * Obtener todos los diagnósticos de una oportunidad
 */
function obtenerDiagnosticosDeOportunidad(hoja, nombreOportunidad) {
  try {
    const diagnosticos = [];
    const ultFila = hoja.getLastRow();

    for (let f = 2; f <= ultFila; f++) {
      const oportunidad = hoja.getRange(f, 2).getValue(); // Columna B
      if (oportunidad && oportunidad.toString().toLowerCase().includes(nombreOportunidad.toLowerCase())) {
        diagnosticos.push({
          fila: f,
          fecha: hoja.getRange(f, 1).getValue(),
          oportunidad: oportunidad,
          cliente: hoja.getRange(f, 3).getValue(),
          tipoSilla: hoja.getRange(f, 4).getValue(),
          numeroEYM: hoja.getRange(f, 5).getValue(),
          numeroTemporal: hoja.getRange(f, 6).getValue(),
          color: hoja.getRange(f, 8).getValue(),
          ubicacion: hoja.getRange(f, 9).getValue(),
          componentes: hoja.getRange(f, 14).getValue(),
          otrosServicios: hoja.getRange(f, 15).getValue(),
          tapiceriaAsiento: hoja.getRange(f, 17).getValue(),
          tapiceriaEspaldar: hoja.getRange(f, 18).getValue(),
          subtotalPartes: hoja.getRange(f, 20).getValue(),
          subtotalServicios: hoja.getRange(f, 21).getValue(),
          subtotalTapiceria: hoja.getRange(f, 22).getValue(),
          subtotalMO: hoja.getRange(f, 23).getValue(),
          totalPresupuesto: hoja.getRange(f, 24).getValue()
        });
      }
    }

    return diagnosticos;

  } catch (e) {
    Logger.log("❌ Error obteniendo diagnósticos: " + e);
    return [];
  }
}

/**
 * Agrupar diagnósticos por silla (número temporal)
 */
function agruparPorSilla(diagnosticos, hoja) {
  const silas = {};

  for (let diag of diagnosticos) {
    const numTemp = diag.numeroTemporal || "Sin número";

    if (!silas[numTemp]) {
      silas[numTemp] = {
        numeroTemporal: numTemp,
        tipoSilla: diag.tipoSilla,
        color: diag.color,
        ubicacion: diag.ubicacion,
        partes: [],
        tapiceria: [],
        servicios: [],
        componentes: diag.componentes,
        otrosServicios: diag.otrosServicios,
        subtotalPartes: 0,
        subtotalServicios: 0,
        subtotalTapiceria: 0,
        subtotalMO: 0,
        total: 0
      };
    }

    // Agregar componentes a partes
    if (diag.componentes) {
      const comps = diag.componentes.toString().split(";");
      comps.forEach(comp => {
        const compTrim = comp.trim();
        if (compTrim) {
          silas[numTemp].partes.push({
            nombre: compTrim,
            precio: obtenerPrecioDelCatalogo(compTrim)
          });
        }
      });
    }

    // Agregar tapicería
    if (diag.tapiceriaAsiento) {
      silas[numTemp].tapiceria.push({
        nombre: diag.tapiceriaAsiento,
        precio: obtenerPrecioDelCatalogo(diag.tapiceriaAsiento)
      });
    }
    if (diag.tapiceriaEspaldar && diag.tapiceriaEspaldar !== diag.tapiceriaAsiento) {
      silas[numTemp].tapiceria.push({
        nombre: diag.tapiceriaEspaldar,
        precio: obtenerPrecioDelCatalogo(diag.tapiceriaEspaldar)
      });
    }

    // Agregar otros servicios
    if (diag.otrosServicios) {
      silas[numTemp].servicios.push({
        nombre: diag.otrosServicios,
        precio: diag.subtotalServicios || 0
      });
    }

    // Actualizar subtotales
    silas[numTemp].subtotalPartes = diag.subtotalPartes || 0;
    silas[numTemp].subtotalTapiceria = diag.subtotalTapiceria || 0;
    silas[numTemp].subtotalServicios = diag.subtotalServicios || 0;
    silas[numTemp].subtotalMO = diag.subtotalMO || 0;
    silas[numTemp].total = diag.totalPresupuesto || 0;
  }

  return Object.values(silas);
}

/**
 * Calcular total general de todas las sillas
 */
function calcularTotalGeneral(silasDatos) {
  let total = 0;
  silasDatos.forEach(sila => {
    total += sila.total || 0;
  });
  return total;
}

/**
 * Consolidar todos los productos para la RMA (agregar cantidades)
 */
function consolidarProductosTotal(diagnosticos, hoja) {
  const productosMap = {};

  for (let diag of diagnosticos) {
    // Procesar componentes (partes)
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

    // Procesar tapicería
    if (diag.tapiceriaAsiento) {
      const nombreNormalizado = normalizarTexto(diag.tapiceriaAsiento);
      if (!productosMap[nombreNormalizado]) {
        productosMap[nombreNormalizado] = {
          nombre: diag.tapiceriaAsiento,
          cantidad: 0,
          precio: obtenerPrecioDelCatalogo(diag.tapiceriaAsiento),
          tipo: "Tapicería"
        };
      }
      productosMap[nombreNormalizado].cantidad += 1;
    }

    if (diag.tapiceriaEspaldar && diag.tapiceriaEspaldar !== diag.tapiceriaAsiento) {
      const nombreNormalizado = normalizarTexto(diag.tapiceriaEspaldar);
      if (!productosMap[nombreNormalizado]) {
        productosMap[nombreNormalizado] = {
          nombre: diag.tapiceriaEspaldar,
          cantidad: 0,
          precio: obtenerPrecioDelCatalogo(diag.tapiceriaEspaldar),
          tipo: "Tapicería"
        };
      }
      productosMap[nombreNormalizado].cantidad += 1;
    }

    // Procesar otros servicios
    if (diag.otrosServicios) {
      const nombreNormalizado = normalizarTexto(diag.otrosServicios);
      if (!productosMap[nombreNormalizado]) {
        productosMap[nombreNormalizado] = {
          nombre: diag.otrosServicios,
          cantidad: 0,
          precio: 0,
          tipo: "Servicios"
        };
      }
      productosMap[nombreNormalizado].cantidad += 1;
    }
  }

  return Object.values(productosMap);
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECCIÓN 5: GENERACIÓN DE PDF
// ═══════════════════════════════════════════════════════════════════════════════════════

/**
 * Generar PDF con datos de los diagnósticos agrupados por silla
 */
function generarPDFDiagnosticos(nombreOportunidad, cliente, silasDatos, totalGeneral) {
  try {
    // Crear documento Google Docs
    const nombre = "COTIZACIÓN - " + nombreOportunidad + " - " + new Date().toLocaleDateString();
    const doc = DocumentApp.create(nombre);
    const body = doc.getBody();

    // Configurar márgenes
    body.setMarginTop(36);
    body.setMarginBottom(36);
    body.setMarginLeft(36);
    body.setMarginRight(36);

    // Logo/Encabezado
    const encabezado = body.appendParagraph("EYM OFICINAS");
    encabezado.setFontSize(18);
    encabezado.setBold(true);
    encabezado.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    const titulo = body.appendParagraph("COTIZACIÓN DE REPARACIÓN");
    titulo.setFontSize(14);
    titulo.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    // Datos generales
    body.appendParagraph("");
    const datosGenerales = body.appendParagraph("Oportunidad: " + nombreOportunidad);
    datosGenerales.appendText("\nCliente: " + cliente);
    datosGenerales.appendText("\nFecha: " + new Date().toLocaleDateString());

    body.appendParagraph("");

    // Tabla de detalles por silla (DETALLADA CON TODOS LOS DATOS)
    silasDatos.forEach((sila, index) => {
      // Encabezado de silla con datos generales
      const encabezadoSilla = body.appendParagraph("SILLA " + sila.numeroTemporal);
      encabezadoSilla.setBold(true);
      encabezadoSilla.setFontSize(12);

      // Datos generales de la silla
      const datosSilla = body.appendParagraph(
        "Tipo: " + (sila.tipoSilla || "") +
        " | Color: " + (sila.color || "") +
        " | Ubicación: " + (sila.ubicacion || "")
      );
      datosSilla.setFontSize(9);
      datosSilla.setItalic(true);

      // PARTES
      if (sila.subtotalPartes > 0) {
        const partesHeading = body.appendParagraph("PARTES:");
        partesHeading.setBold(true);

        if (sila.componentes) {
          const comps = sila.componentes.toString().split(";");
          comps.forEach(comp => {
            if (comp.trim()) {
              const compText = body.appendParagraph("  • " + comp.trim());
              compText.setIndentFirstLine(18);
            }
          });
        }

        const subtotalPartes = body.appendParagraph("Subtotal Partes: $" + formatearNumero(sila.subtotalPartes));
        subtotalPartes.setBold(true);
        subtotalPartes.setIndentFirstLine(0);
      }

      // OTROS SERVICIOS
      if (sila.subtotalServicios > 0) {
        const serviciosHeading = body.appendParagraph("OTROS SERVICIOS:");
        serviciosHeading.setBold(true);

        if (sila.otrosServicios) {
          const servText = body.appendParagraph("  • " + sila.otrosServicios);
          servText.setIndentFirstLine(18);
        }

        const subtotalServicios = body.appendParagraph("Subtotal Servicios: $" + formatearNumero(sila.subtotalServicios));
        subtotalServicios.setBold(true);
        subtotalServicios.setIndentFirstLine(0);
      }

      // TAPICERÍA
      if (sila.subtotalTapiceria > 0) {
        const tapiceriaHeading = body.appendParagraph("TAPICERÍA:");
        tapiceriaHeading.setBold(true);

        if (sila.tapiceria && sila.tapiceria.length > 0) {
          sila.tapiceria.forEach(tap => {
            const tapText = body.appendParagraph("  • " + tap.nombre);
            tapText.setIndentFirstLine(18);
          });
        }

        const subtotalTapiceria = body.appendParagraph("Subtotal Tapicería: $" + formatearNumero(sila.subtotalTapiceria));
        subtotalTapiceria.setBold(true);
        subtotalTapiceria.setIndentFirstLine(0);
      }

      // MANTENIMIENTO GENERAL
      if (sila.subtotalMO > 0) {
        const moHeading = body.appendParagraph("MANTENIMIENTO GENERAL:");
        moHeading.setBold(true);
        const moText = body.appendParagraph("  • Mantenimiento General: $" + formatearNumero(sila.subtotalMO));
        moText.setIndentFirstLine(18);
      }

      // SUBTOTAL GENERAL DE LA SILLA
      const linea = body.appendParagraph("─────────────────────────────────────");
      linea.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const totalSilla = body.appendParagraph("TOTAL SILLA " + sila.numeroTemporal + ": $" + formatearNumero(sila.total));
      totalSilla.setBold(true);
      totalSilla.setFontSize(12);
      totalSilla.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

      body.appendParagraph("");
    });

    // Total general
    const lineaDivision = body.appendParagraph("═════════════════════════════════════════");
    lineaDivision.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    const totalFinal = body.appendParagraph("TOTAL GENERAL: $" + formatearNumero(totalGeneral));
    totalFinal.setBold(true);
    totalFinal.setFontSize(13);
    totalFinal.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    const lineaDivision2 = body.appendParagraph("═════════════════════════════════════════");
    lineaDivision2.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    body.appendParagraph("");
    const nota = body.appendParagraph("Nota: El valor total antes de impuestos (IVA 19% y Retefuente según aplique) se detallará en la RMA oficial.");
    nota.setFontSize(9);
    nota.setItalic(true);

    // Guardar como PDF
    const file = DriveApp.getFileById(doc.getId());
    const pdfBlob = file.getAs("application/pdf");
    const pdfFile = DriveApp.createFile(pdfBlob.setName("COTIZACIÓN_" + nombreOportunidad + ".pdf"));

    // Eliminar el documento Docs (ya que tenemos el PDF)
    DriveApp.getFileById(doc.getId()).setTrashed(true);

    Logger.log("✅ PDF generado: " + pdfFile.getUrl());
    return pdfFile.getUrl();

  } catch (e) {
    Logger.log("❌ Error generando PDF: " + e);
    return null;
  }
}

function formatearNumero(numero) {
  return Math.round(numero).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECCIÓN 6: INTEGRACIÓN ODOO MEJORADA
// ═══════════════════════════════════════════════════════════════════════════════════════

function obtenerCredencialesOdoo() {
  return {
    url: "https://eym-oficinas.ovh/web",
    database: "eym_oficinas",
    username: "eymclaude@eym-oficinas.com",
    password: "Camilo1973*"
  };
}

function llamarOdooXMLRPC(modelo, metodo, args, creds) {
  try {
    const payload = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: metodo,
        args: [creds.database, creds.username, creds.password, modelo, metodo, ...args],
        kwargs: {}
      }
    };

    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(creds.url + "/jsonrpc", options);
    const resultado = JSON.parse(response.getContentText());

    if (resultado.error) {
      Logger.log("❌ Error Odoo: " + resultado.error.message);
      return null;
    }

    return resultado.result;

  } catch (e) {
    Logger.log("❌ Error XML-RPC: " + e.toString());
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

    return llamarOdooXMLRPC("res.partner", "create", [clienteData], creds);

  } catch (e) {
    Logger.log("❌ Error creando cliente: " + e);
    return null;
  }
}

function crearRMAenOdooConProductos(cliente, numeroEYM, productosConsolidados, nombreOportunidad) {
  try {
    const creds = obtenerCredencialesOdoo();

    Logger.log("🔄 Creando RMA en Odoo para: " + cliente);

    let clienteOdooId = buscarClienteOdoo(cliente, creds);
    if (!clienteOdooId) {
      Logger.log("⚠️ Creando cliente en Odoo...");
      clienteOdooId = crearClienteOdoo(cliente, creds);
      if (!clienteOdooId) {
        return { exito: false, error: "No se pudo crear cliente" };
      }
    }

    const rmaData = {
      partner_id: clienteOdooId,
      reference: "RMA-" + numeroEYM,
      description: "Reparación de sillas - Oportunidad: " + nombreOportunidad + " | EyM: " + numeroEYM,
      type: "customer",
      state: "draft"
    };

    const numeroRMA = llamarOdooXMLRPC("rma.rma", "create", [rmaData], creds);

    if (!numeroRMA) {
      return { exito: false, error: "Error creando RMA en Odoo" };
    }

    const linkRMA = creds.url + "/web#id=" + numeroRMA + "&model=rma.rma&view_type=form";

    Logger.log("✅ RMA creada: " + numeroRMA);

    return {
      exito: true,
      numeroRMA: numeroRMA,
      referenciaRMA: "RMA-" + numeroRMA,
      linkRMA: linkRMA
    };

  } catch (e) {
    Logger.log("❌ Error: " + e.toString());
    return { exito: false, error: e.toString() };
  }
}

function adjuntarPDFaRMA(numeroRMA, urlPDF) {
  try {
    Logger.log("📎 Adjuntando PDF a RMA " + numeroRMA + ": " + urlPDF);
    // Implementar adjunto cuando Odoo lo requiera
  } catch (e) {
    Logger.log("⚠️ Error adjuntando: " + e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECCIÓN 7: MENÚ Y TRIGGERS
// ═══════════════════════════════════════════════════════════════════════════════════════

function onOpen() {
  SpreadsheetApp.getUi().createMenu("🚀 EYM v5.0")
    .addItem("📥 Procesar Manualmente", "procesarRespuestaFormulario")
    .addItem("🔧 Instalar Trigger", "instalarTriggerAutomatico")
    .addSeparator()
    .addItem("✅ Finalizar Oportunidad", "finalizarOportunidad")
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

    const ssDiag = SpreadsheetApp.openById(ID_DIAGNOSTICOS);
    const hojaDiag = ssDiag.getSheetByName("DIAGNÓSTICOS_2026");
    if (hojaDiag) {
      hojaDiag.getRange(CONFIG.CELDA_CONTROL).setValue(1);
    }

    ScriptApp.newTrigger('procesarRespuestaFormulario')
      .forForm(FormApp.openById(ID_FORMULARIO))
      .onFormSubmit()
      .create();

    SpreadsheetApp.getUi().alert("✅ TRIGGER AUTOMÁTICO INSTALADO");
  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ ERROR: " + e);
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
