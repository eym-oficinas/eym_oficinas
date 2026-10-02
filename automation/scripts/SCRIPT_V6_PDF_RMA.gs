// ═══════════════════════════════════════════════════════════════════════════════════════
// SISTEMA AUTOMÁTICO EYM OFICINAS v6.0 - INTEGRACIÓN COMPLETA ODOO RMA
// ═══════════════════════════════════════════════════════════════════════════════════════
// Incluye: Diagnósticos + RMA en Odoo + Piezas + Operaciones + PDF + Impuestos

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
// SECCIÓN 1: CATÁLOGO DE PRECIOS
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
    const hojaDiag = ssDiag.getSheetByName("DIAGNOSTICOS_2026");
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
  return {
    url: "https://eym-oficinas.ovh/web",
    database: "eym_oficinas",
    username: "eymclaude@eym-oficinas.com",
    password: "Camilo1973*"
  };
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
    const hojaCatalogo = ssDiag.getSheetByName("CATÁLOGO_PRECIOS_2026");

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

    const response = UrlFetchApp.fetch(
      creds.url + "/jsonrpc",
      options
    );

    const resultado = JSON.parse(response.getContentText());

    if (resultado.error) {
      Logger.log("❌ Error Odoo XML-RPC: " + resultado.error.message);
      return null;
    }

    return resultado.result;

  } catch (e) {
    Logger.log("❌ Error en llamada XML-RPC: " + e.toString());
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

    const linkRMA = creds.url + "/web#id=" + numeroRMA + "&model=rma.rma&view_type=form";

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

function onEdit(e) {
  try {
    const ss = e.source;
    const sheet = e.range.getSheet();
    if (sheet.getName() !== "DIAGNOSTICOS_2026") return;

    const col = e.range.getColumn();
    const fila = e.range.getRow();
    const valor = e.value;

    if (col === 31 && valor) {
      const estadoLower = valor.toString().toLowerCase();

      // CASO 1: APROBADO - genera EYM + OP
      if (estadoLower.includes("aprobado")) {
        const celdaEYM = sheet.getRange(fila, 5);
        const numeroEYM = celdaEYM.getValue();

        if (!numeroEYM || numeroEYM.toString().trim() === "") {
          const nuevoEYM = obtenerProximoEYM(sheet);
          celdaEYM.setValue(nuevoEYM);
          celdaEYM.setBackground("#FFFF00");
          celdaEYM.setFontColor("#0000FF");
          Logger.log("Nuevo EYM asignado: " + nuevoEYM);
        }

        sheet.getRange(fila, 28).setValue(new Date());

        try {
          const hojaOP = ss.getSheetByName("OP_2026");
          if (hojaOP) {
            crearOP(sheet, hojaOP, fila);
            Logger.log("OP creada para fila " + fila);
          }
        } catch (opError) {
          Logger.log("Error creando OP: " + opError);
        }
      }

      // CASO 2: COTIZACIÓN - Solo marca, no genera PDF aquí
      else if (estadoLower.includes("cotización")) {
        Logger.log("⏳ Estado 'Cotización' marcado - Usar botón 'Finalizar Oportunidad' para generar RMA");
      }
    }
  } catch (e) {
    Logger.log("❌ Error: " + e);
  }
}

function crearOP(hojaDiag, hojaOP, fila) {
  try {
    const numeroEyM = hojaDiag.getRange(fila, 5).getValue();
    const nuevoOP = obtenerProximoOP(hojaOP);

    const serviciosO = hojaDiag.getRange(fila, 15).getValue() || "";
    const serviciosP = hojaDiag.getRange(fila, 16).getValue() || "";
    const serviciosCombinados = [serviciosO, serviciosP].filter(s => s).join("; ");

    const filaOP = [
      nuevoOP,
      "",
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
      serviciosCombinados,
      hojaDiag.getRange(fila, 17).getValue(),
      hojaDiag.getRange(fila, 18).getValue(),
      numeroEyM
    ];

    const newFilaOP = hojaOP.getLastRow() + 1;
    hojaOP.getRange(newFilaOP, 1, 1, filaOP.length).setValues([filaOP]);

    Logger.log("✅ OP " + nuevoOP + " creada automáticamente");
  } catch (e) {
    Logger.log("❌ Error: " + e);
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
      const estadoAprobacion = hojaDiag.getRange(f, 31).getValue();
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
    const response = ui.prompt("Ingresa el NOMBRE DE LA OPORTUNIDAD:");

    if (response.getSelectedButton() == ui.Button.CANCEL) return;

    const nombreOportunidad = response.getResponseText().trim();
    if (!nombreOportunidad) {
      ui.alert("Debes ingresar un nombre");
      return;
    }

    Logger.log("Finalizando: " + nombreOportunidad);

    const diagnosticos = obtenerDiagnosticosDeOportunidad(hojaDiag, nombreOportunidad);
    if (diagnosticos.length === 0) {
      ui.alert("No se encontraron diagnosticos para: " + nombreOportunidad);
      return;
    }

    const cliente = diagnosticos[0].cliente;
    const numeroEYM = diagnosticos[0].numeroEYM;
    const productosConsolidados = consolidarProductosTotal(diagnosticos, hojaDiag);
    const serviciosConsolidados = consolidarServiciosTotal(diagnosticos, hojaDiag);

    // PASO 1: CREAR RMA
    Logger.log("📝 Creando RMA en Odoo...");
    const resultadoRMA = crearRMAenOdooConProductos(cliente, numeroEYM, productosConsolidados, serviciosConsolidados, nombreOportunidad);

    if (!resultadoRMA.exito) {
      ui.alert("Error creando RMA: " + resultadoRMA.error);
      return;
    }

    Logger.log("✅ RMA creada: " + resultadoRMA.referenciaRMA);

    // PASO 2: ESCRIBIR RMA EN COLUMNA AC
    for (let diag of diagnosticos) {
      hojaDiag.getRange(diag.fila, 29).setValue(resultadoRMA.referenciaRMA);
      hojaDiag.getRange(diag.fila, 29).setFormula('=HYPERLINK("' + resultadoRMA.linkRMA + '","' + resultadoRMA.referenciaRMA + '")');
      hojaDiag.getRange(diag.fila, 29).setFontColor("#0000FF");
      hojaDiag.getRange(diag.fila, 29).setFontLine("underline");
    }

    // PASO 3: GENERAR PDF Y ADJUNTAR
    Logger.log("📄 Generando PDF por silla...");
    const silasDatos = agruparPorSilla(diagnosticos, hojaDiag);
    const totalGeneral = calcularTotalGeneral(silasDatos);

    const urlPDF = generarPDFDiagnosticos(nombreOportunidad, cliente, silasDatos, totalGeneral);

    if (!urlPDF) {
      Logger.log("⚠️ No se pudo generar PDF, pero RMA fue creada");
      ui.alert("✅ RMA CREADA: " + resultadoRMA.referenciaRMA + "\n\n⚠️ Error generando PDF (pero puedes intentar manualmente después)\n\nLink RMA: " + resultadoRMA.linkRMA);
      return;
    }

    Logger.log("✅ PDF generado: " + urlPDF);

    // PASO 4: ADJUNTAR PDF A RMA EN ODOO
    Logger.log("📎 Adjuntando PDF a RMA en Odoo...");
    const resultadoAdjunto = adjuntarPDFaRMA(resultadoRMA.numeroRMA, urlPDF, nombreOportunidad);

    if (resultadoAdjunto.exito) {
      Logger.log("✅ PDF adjunto a RMA en Odoo");
      ui.alert("✅ COMPLETADO\n\nRMA: " + resultadoRMA.referenciaRMA + "\n✅ PDF generado y adjunto\n\nLink RMA: " + resultadoRMA.linkRMA);
    } else {
      Logger.log("⚠️ Error adjuntando PDF: " + resultadoAdjunto.error);
      ui.alert("✅ RMA CREADA: " + resultadoRMA.referenciaRMA + "\n⚠️ PDF generado pero error al adjuntar\n\nLink RMA: " + resultadoRMA.linkRMA);
    }

  } catch (e) {
    Logger.log("Error: " + e);
    SpreadsheetApp.getUi().alert("ERROR: " + e.toString());
  }
}

function obtenerDiagnosticosDeOportunidad(hoja, nombreOportunidad) {
  try {
    const diagnosticos = [];
    const ultFila = hoja.getLastRow();

    for (let f = 2; f <= ultFila; f++) {
      const oportunidad = hoja.getRange(f, 2).getValue();
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
    Logger.log("Error: " + e);
    return [];
  }
}

function agruparPorSilla(diagnosticos, hoja) {
  const silas = {};

  for (let diag of diagnosticos) {
    const numTemp = diag.numeroTemporal || "Sin numero";

    if (!silas[numTemp]) {
      silas[numTemp] = {
        numeroTemporal: numTemp,
        tipoSilla: diag.tipoSilla,
        color: diag.color,
        ubicacion: diag.ubicacion,
        subtotalPartes: 0,
        subtotalServicios: 0,
        subtotalTapiceria: 0,
        subtotalMO: 0,
        total: 0
      };
    }

    silas[numTemp].subtotalPartes = diag.subtotalPartes || 0;
    silas[numTemp].subtotalTapiceria = diag.subtotalTapiceria || 0;
    silas[numTemp].subtotalServicios = diag.subtotalServicios || 0;
    silas[numTemp].subtotalMO = diag.subtotalMO || 0;
    silas[numTemp].total = diag.totalPresupuesto || 0;
  }

  return Object.values(silas);
}

function calcularTotalGeneral(silasDatos) {
  let total = 0;
  silasDatos.forEach(sila => {
    total += sila.total || 0;
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

function generarPDFDiagnosticos(nombreOportunidad, cliente, silasDatos, totalGeneral) {
  try {
    Logger.log("Iniciando generación de PDF para: " + nombreOportunidad);
    Logger.log("Sillas encontradas: " + silasDatos.length);

    if (!silasDatos || silasDatos.length === 0) {
      Logger.log("ERROR: No hay datos de sillas");
      return null;
    }

    const nombre = "COTIZACION - " + nombreOportunidad + " - " + new Date().toLocaleDateString();
    Logger.log("Creando documento: " + nombre);

    const doc = DocumentApp.create(nombre);
    const body = doc.getBody();
    body.clear();

    body.setMarginTop(36);
    body.setMarginBottom(36);
    body.setMarginLeft(36);
    body.setMarginRight(36);

    const encabezado = body.appendParagraph("EYM OFICINAS");
    encabezado.setFontSize(18);
    encabezado.setBold(true);
    encabezado.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    const titulo = body.appendParagraph("COTIZACION DE REPARACION");
    titulo.setFontSize(14);
    titulo.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    body.appendParagraph("");
    const datosGenerales = body.appendParagraph("Oportunidad: " + nombreOportunidad);
    datosGenerales.appendText("\nCliente: " + cliente);
    datosGenerales.appendText("\nFecha: " + new Date().toLocaleDateString());

    body.appendParagraph("");

    // CREAR TABLA HORIZONTAL
    const tablaDatos = [
      ["Silla", "Tipo", "Color", "Ubicacion", "Partes", "Servicios", "Tapiceria", "M.G.", "TOTAL"]
    ];

    silasDatos.forEach(sila => {
      tablaDatos.push([
        sila.numeroTemporal || "",
        sila.tipoSilla || "",
        sila.color || "",
        sila.ubicacion || "",
        "$" + formatearNumero(sila.subtotalPartes || 0),
        "$" + formatearNumero(sila.subtotalServicios || 0),
        "$" + formatearNumero(sila.subtotalTapiceria || 0),
        "$" + formatearNumero(sila.subtotalMO || 0),
        "$" + formatearNumero(sila.total || 0)
      ]);
    });

    let totalPartes = 0, totalServicios = 0, totalTapiceria = 0, totalMO = 0;
    silasDatos.forEach(sila => {
      totalPartes += (sila.subtotalPartes || 0);
      totalServicios += (sila.subtotalServicios || 0);
      totalTapiceria += (sila.subtotalTapiceria || 0);
      totalMO += (sila.subtotalMO || 0);
    });

    tablaDatos.push([
      "TOTALES",
      "",
      "",
      "",
      "$" + formatearNumero(totalPartes),
      "$" + formatearNumero(totalServicios),
      "$" + formatearNumero(totalTapiceria),
      "$" + formatearNumero(totalMO),
      "$" + formatearNumero(totalGeneral)
    ]);

    Logger.log("Creando tabla con " + tablaDatos.length + " filas");
    const tabla = body.appendTable(tablaDatos);

    tabla.setColumnWidth(0, 70);
    tabla.setColumnWidth(1, 90);
    tabla.setColumnWidth(2, 70);
    tabla.setColumnWidth(3, 80);
    tabla.setColumnWidth(4, 75);
    tabla.setColumnWidth(5, 75);
    tabla.setColumnWidth(6, 75);
    tabla.setColumnWidth(7, 60);
    tabla.setColumnWidth(8, 85);

    for (let i = 0; i < tabla.getRow(0).getNumCells(); i++) {
      const celda = tabla.getRow(0).getCell(i);
      celda.getChild(0).asParagraph().setBold(true);
      celda.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      celda.setBackgroundColor("#E8E8E8");
    }

    const ultimaFila = tabla.getRow(tabla.getNumRows() - 1);
    for (let i = 0; i < ultimaFila.getNumCells(); i++) {
      const celda = ultimaFila.getCell(i);
      celda.getChild(0).asParagraph().setBold(true);
      celda.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
      celda.setBackgroundColor("#FFFFCC");
    }

    for (let r = 1; r < tabla.getNumRows() - 1; r++) {
      for (let c = 4; c < tabla.getRow(r).getNumCells(); c++) {
        tabla.getRow(r).getCell(c).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
      }
    }

    body.appendParagraph("");
    const nota = body.appendParagraph("Nota: El valor total antes de impuestos (IVA 19% y Retefuente segun aplique) se detallara en la RMA oficial.");
    nota.setFontSize(9);
    nota.setItalic(true);

    Logger.log("Guardando PDF...");
    doc.saveAndClose();

    const file = DriveApp.getFileById(doc.getId());
    const pdfBlob = file.getAs("application/pdf");
    const pdfFile = DriveApp.createFile(pdfBlob.setName("COTIZACION_" + nombreOportunidad + ".pdf"));

    DriveApp.getFileById(doc.getId()).setTrashed(true);

    Logger.log("PDF generado: " + pdfFile.getUrl());
    return pdfFile.getUrl();

  } catch (e) {
    Logger.log("ERROR EN generarPDFDiagnosticos: " + e.toString());
    Logger.log("Stack: " + e.stack);
    return null;
  }
}

function formatearNumero(numero) {
  return Math.round(numero).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function crearRMAenOdooConProductos(cliente, numeroEYM, productosConsolidados, serviciosConsolidados, nombreOportunidad) {
  try {
    const creds = obtenerCredencialesOdoo();

    Logger.log("📝 Creando RMA para: " + cliente);

    let clienteOdooId = buscarClienteOdoo(cliente, creds);
    if (!clienteOdooId) {
      Logger.log("Creando cliente en Odoo...");
      clienteOdooId = crearClienteOdoo(cliente, creds);
      if (!clienteOdooId) {
        return { exito: false, error: "No se pudo crear cliente" };
      }
    }

    const rmaData = {
      partner_id: clienteOdooId,
      reference: "RMA-" + numeroEYM,
      description: "Reparacion de sillas - Oportunidad: " + nombreOportunidad + " | EyM: " + numeroEYM,
      type: "customer",
      state: "draft"
    };

    const numeroRMA = llamarOdooXMLRPC("rma.rma", "create", [rmaData], creds);

    if (!numeroRMA) {
      return { exito: false, error: "Error creando RMA" };
    }

    Logger.log("✅ RMA base creada: " + numeroRMA);

    // PASO 2: AGREGAR LÍNEAS DE PRODUCTOS (PIEZAS)
    Logger.log("📦 Agregando líneas de productos...");
    const resultadoLineas = agregarLineasProductosRMA(numeroRMA, productosConsolidados, creds);
    if (!resultadoLineas.exito) {
      Logger.log("⚠️ Error agregando productos: " + resultadoLineas.error);
    } else {
      Logger.log("✅ Productos agregados: " + resultadoLineas.cantidad);
    }

    // PASO 3: AGREGAR LÍNEAS DE SERVICIOS (OPERACIONES)
    Logger.log("🔧 Agregando líneas de servicios...");
    const resultadoServicios = agregarLineasServiciosRMA(numeroRMA, serviciosConsolidados, creds);
    if (!resultadoServicios.exito) {
      Logger.log("⚠️ Error agregando servicios: " + resultadoServicios.error);
    } else {
      Logger.log("✅ Servicios agregados: " + resultadoServicios.cantidad);
    }

    const linkRMA = creds.url + "/web#id=" + numeroRMA + "&model=rma.rma&view_type=form";

    Logger.log("✅ RMA completada: " + numeroRMA);

    return {
      exito: true,
      numeroRMA: numeroRMA,
      referenciaRMA: "RMA-" + numeroRMA,
      linkRMA: linkRMA
    };

  } catch (e) {
    Logger.log("❌ Error creando RMA: " + e.toString());
    return { exito: false, error: e.toString() };
  }
}

function agregarLineasProductosRMA(numeroRMA, productosConsolidados, creds) {
  try {
    let cantidadAgregada = 0;

    for (let producto of productosConsolidados) {
      // Buscar código de producto en catálogo
      const codigoProducto = obtenerCodigoProductoDelCatalogo(producto.nombre);
      if (!codigoProducto) {
        Logger.log("⚠️ Código no encontrado para: " + producto.nombre);
        continue;
      }

      // Buscar producto en Odoo
      const productoOdooId = buscarProductoOdooPorCodigo(codigoProducto, creds);
      if (!productoOdooId) {
        Logger.log("⚠️ Producto no encontrado en Odoo: " + codigoProducto);
        continue;
      }

      // Calcular impuestos
      const subtotal = producto.cantidad * producto.precio;
      const impuestos = calcularImpuestos(subtotal, creds);

      // Crear línea RMA (Piezas)
      const lineaData = {
        rma_id: numeroRMA,
        product_id: productoOdooId,
        name: producto.nombre,
        product_qty: producto.cantidad,
        product_uom_id: 1, // Unidades
        price_unit: producto.precio,
        price_subtotal: subtotal,
        tax_ids: impuestos.taxIds, // [19% IVA, 4% RFTFE]
        type: "piezas"
      };

      const lineaRmaId = llamarOdooXMLRPC("rma.rma.line", "create", [lineaData], creds);
      if (lineaRmaId) {
        Logger.log("✅ Línea agregada: " + codigoProducto + " x" + producto.cantidad);
        cantidadAgregada++;
      } else {
        Logger.log("⚠️ Error agregando línea: " + codigoProducto);
      }
    }

    return { exito: true, cantidad: cantidadAgregada };

  } catch (e) {
    Logger.log("❌ Error en agregarLineasProductosRMA: " + e);
    return { exito: false, error: e.toString() };
  }
}

function agregarLineasServiciosRMA(numeroRMA, serviciosConsolidados, creds) {
  try {
    let cantidadAgregada = 0;

    for (let servicio of serviciosConsolidados) {
      // Buscar código de servicio en catálogo
      const codigoServicio = obtenerCodigoProductoDelCatalogo(servicio.nombre);
      if (!codigoServicio) {
        Logger.log("⚠️ Código no encontrado para servicio: " + servicio.nombre);
        continue;
      }

      // Buscar servicio en Odoo
      const servicioOdooId = buscarProductoOdooPorCodigo(codigoServicio, creds);
      if (!servicioOdooId) {
        Logger.log("⚠️ Servicio no encontrado en Odoo: " + codigoServicio);
        continue;
      }

      // Calcular impuestos
      const subtotal = servicio.cantidad * servicio.precio;
      const impuestos = calcularImpuestos(subtotal, creds);

      // Crear línea RMA (Operaciones/Servicios) - SIN campo "type"
      const lineaData = {
        rma_id: numeroRMA,
        product_id: servicioOdooId,
        name: servicio.nombre,
        product_qty: servicio.cantidad,
        product_uom_id: 1, // Unidades
        price_unit: servicio.precio,
        price_subtotal: subtotal,
        tax_ids: impuestos.taxIds
      };

      const lineaRmaId = llamarOdooXMLRPC("rma.rma.line", "create", [lineaData], creds);
      if (lineaRmaId) {
        Logger.log("✅ Servicio agregado: " + codigoServicio + " x" + servicio.cantidad);
        cantidadAgregada++;
      } else {
        Logger.log("⚠️ Error agregando servicio: " + codigoServicio);
      }
    }

    return { exito: true, cantidad: cantidadAgregada };

  } catch (e) {
    Logger.log("❌ Error en agregarLineasServiciosRMA: " + e);
    return { exito: false, error: e.toString() };
  }
}

function obtenerCodigoProductoDelCatalogo(nombreProducto) {
  try {
    const ssDiag = SpreadsheetApp.openById(ID_DIAGNOSTICOS);
    const hojaCatalogo = ssDiag.getSheetByName("CATÁLOGO_PRECIOS_2026");
    if (!hojaCatalogo) return null;

    const datos = hojaCatalogo.getDataRange().getValues();

    for (let i = 1; i < datos.length; i++) {
      const nombre = datos[i][0] ? datos[i][0].toString().toLowerCase().trim() : "";
      const codigo = datos[i][2] ? datos[i][2].toString() : "";

      if (nombre && nombre.includes(normalizarTexto(nombreProducto))) {
        return codigo;
      }
    }

    return null;
  } catch (e) {
    Logger.log("Error obtener código: " + e);
    return null;
  }
}

function buscarProductoOdooPorCodigo(codigo, creds) {
  try {
    const resultado = llamarOdooXMLRPC("product.product", "search", [[["default_code", "=", codigo]]], creds);
    if (resultado && resultado.length > 0) {
      return resultado[0];
    }
    return null;
  } catch (e) {
    Logger.log("Error buscando producto: " + e);
    return null;
  }
}

function calcularImpuestos(subtotal, creds) {
  // IVA 19% + RFTFE 4% (si >= $550.000)
  const impuestos = {
    iva: 19,
    rftfe: 0,
    taxIds: []
  };

  if (subtotal >= 550000) {
    impuestos.rftfe = 4;
  }

  // Buscar IDs de impuestos en Odoo por nombre
  const ivaId = buscarImpuestoPorNombre("IVA Ventas 19%", creds);
  const rftfeId = buscarImpuestoPorNombre("RTFTE 4%", creds);

  if (ivaId) {
    impuestos.taxIds.push(ivaId);
  }

  if (impuestos.rftfe > 0 && rftfeId) {
    impuestos.taxIds.push(rftfeId);
  }

  return impuestos;
}

function buscarImpuestoPorNombre(nombreImpuesto, creds) {
  try {
    const resultado = llamarOdooXMLRPC("account.tax", "search", [[["name", "=", nombreImpuesto]]], creds);
    if (resultado && resultado.length > 0) {
      return resultado[0];
    }
    Logger.log("⚠️ Impuesto no encontrado: " + nombreImpuesto);
    return null;
  } catch (e) {
    Logger.log("Error buscando impuesto: " + e);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES: PDF Y ATTACHMENT
// ═════════════════════════════════════════════════════════════════════════════════════════

function adjuntarPDFaRMA(numeroRMA, urlPDF, nombreOportunidad) {
  try {
    const creds = obtenerCredencialesOdoo();

    // Descargar PDF desde Google Drive
    const fileId = extraerFileIdDeURL(urlPDF);
    if (!fileId) {
      return { exito: false, error: "No se pudo extraer ID del PDF" };
    }

    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    const base64 = Utilities.base64Encode(blob.getBytes());

    // Crear attachment en Odoo
    const attachmentData = {
      name: "COTIZACION_" + nombreOportunidad + ".pdf",
      datas: base64,
      datas_fname: "COTIZACION_" + nombreOportunidad + ".pdf",
      res_model: "rma.rma",
      res_id: numeroRMA,
      type: "binary",
      mimetype: "application/pdf"
    };

    const resultadoAttach = llamarOdooXMLRPC("ir.attachment", "create", [attachmentData], creds);

    if (resultadoAttach) {
      Logger.log("✅ PDF adjunto a RMA en Odoo: " + numeroRMA);
      return { exito: true, attachmentId: resultadoAttach };
    } else {
      return { exito: false, error: "Error en XML-RPC" };
    }

  } catch (e) {
    Logger.log("❌ Error adjuntando a RMA: " + e);
    return { exito: false, error: e.toString() };
  }
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

function onOpen() {
  SpreadsheetApp.getUi().createMenu("EYM v6.0")
    .addItem("Procesar Manualmente", "procesarRespuestaFormulario")
    .addItem("Instalar Trigger", "instalarTriggerAutomatico")
    .addSeparator()
    .addItem("Finalizar Oportunidad", "finalizarOportunidad")
    .addSeparator()
    .addItem("Recalcular Todo", "recalcularTodo")
    .addItem("Configurar Listas Desplegables", "configurarValidacionAprobacion")
    .addItem("DEBUG: Ver Hojas", "diagnosticarHojas")
    .addToUi();
}
