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
    "Ejemplo:\neymclaude@gmail.com|Camilo1973*|eym1|https://eym-oficinas.ovh",
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
    const url = creds.url + "/jsonrpc";

    // Paso 1: Obtener UID mediante autenticación
    Logger.log("🔐 Obteniendo UID...");
    const authPayload = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [creds.database, creds.username, creds.password, {}]
      }
    };

    const authResponse = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(authPayload),
      muteHttpExceptions: true
    });

    const authResult = JSON.parse(authResponse.getContentText());
    if (authResult.error || !authResult.result) {
      Logger.log("❌ Error en autenticación: " + JSON.stringify(authResult.error || "Sin UID"));
      return null;
    }

    const uid = authResult.result;
    Logger.log("✅ UID obtenido: " + uid);

    // Paso 2: Construir argumentos - Odoo espera: [db, uid, pwd, model, method, args_array]
    let executeKwArgs = [creds.database, uid, creds.password, modelo, metodo];

    // El sexto argumento debe ser un ARRAY con todos los parámetros del método
    // Para search(): [domain, offset, limit, order, count]
    // Para otros métodos: depende del método específico
    if (Array.isArray(args)) {
      executeKwArgs.push(args);
    } else {
      executeKwArgs.push([]);
    }

    Logger.log("📊 Estructura final de args: " + JSON.stringify(executeKwArgs));
    Logger.log("📊 Total argumentos enviados: " + executeKwArgs.length);

    // Paso 3: Llamar al método usando el UID
    const payload = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: executeKwArgs
      }
    };

    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      headers: {
        "Accept": "application/json"
      }
    };

    Logger.log("📤 Enviando a: " + url);
    Logger.log("📋 Payload completo: " + JSON.stringify(payload));

    const response = UrlFetchApp.fetch(url, options);

    Logger.log("📥 Status: " + response.getResponseCode());
    const responseText = response.getContentText();
    Logger.log("📥 Response (primeros 500 chars): " + responseText.substring(0, 500));

    if (!responseText) {
      Logger.log("❌ CRÍTICO: Respuesta vacía del servidor");
      return null;
    }

    let resultado;
    try {
      resultado = JSON.parse(responseText);
    } catch (parseError) {
      Logger.log("❌ CRÍTICO: No se pudo parsear JSON: " + parseError.toString());
      Logger.log("📥 Contenido recibido: " + responseText);
      return null;
    }

    if (resultado.error) {
      Logger.log("❌ Error Odoo JSON-RPC: " + JSON.stringify(resultado.error));
      return null;
    }

    if (!resultado.result && resultado.result !== 0 && resultado.result !== false) {
      Logger.log("⚠️ ADVERTENCIA: Resultado vacío pero sin error en respuesta");
      Logger.log("📥 Respuesta completa: " + JSON.stringify(resultado));
    }

    return resultado.result;

  } catch (e) {
    Logger.log("❌ CRÍTICO en llamada XML-RPC: " + e.toString());
    Logger.log("Stack trace: " + e.stack);
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
      ui.alert("❌ ERROR:\n\n" + resultadoRMA.error);
      return;
    }

    Logger.log("✅ RMA creada: " + resultadoRMA.referenciaRMA);
    ui.alert("✅ OPORTUNIDAD ENCONTRADA en Odoo\n✅ RMA Creada: " + resultadoRMA.referenciaRMA + "\n\nProcediendo con productos, servicios y PDF...");

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

    Logger.log("📝 Buscando Oportunidad en Odoo: " + nombreOportunidad);

    // PASO 1: Buscar oportunidad en Odoo
    const oportunidadOdooId = buscarOportunidadOdoo(nombreOportunidad, creds);
    if (!oportunidadOdooId) {
      Logger.log("❌ Oportunidad no encontrada en Odoo: " + nombreOportunidad);
      return { exito: false, error: "❌ Oportunidad '" + nombreOportunidad + "' NO encontrada en Odoo.\n\nPor favor:\n1. Crea la oportunidad en Odoo\n2. Asegúrate que el nombre coincida exactamente\n3. Intenta de nuevo" };
    }

    Logger.log("✅ Oportunidad encontrada en Odoo: " + oportunidadOdooId);

    // PASO 2: Obtener cliente desde la oportunidad
    const clienteOdooId = obtenerClienteDeOportunidad(oportunidadOdooId, creds);
    if (!clienteOdooId) {
      Logger.log("⚠️ No se pudo obtener cliente de la oportunidad");
      return { exito: false, error: "Error obteniendo cliente de la oportunidad" };
    }

    Logger.log("✅ Cliente obtenido de la oportunidad: " + clienteOdooId);

    // PASO 3: Crear RMA vinculada a la oportunidad
    const rmaData = {
      partner_id: clienteOdooId,
      reference: "RMA-" + numeroEYM,
      description: "Reparacion de sillas - Oportunidad: " + nombreOportunidad + " | EyM: " + numeroEYM,
      type: "customer",
      state: "draft",
      opportunity_id: oportunidadOdooId // Vincular a la oportunidad
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

    const linkRMA = creds.urlWeb + "#id=" + numeroRMA + "&model=rma.rma&view_type=form";

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

function buscarOportunidadOdoo(nombreOportunidad, creds) {
  try {
    // PASO 1: Buscar OPORTUNIDADES específicamente en crm.lead (type='opportunity')
    Logger.log("🔍 Buscando oportunidad en CRM (type='opportunity'): " + nombreOportunidad);

    // Filtro: type = 'opportunity' AND name contiene nombreOportunidad
    const dominio = [
      ["type", "=", "opportunity"],
      ["name", "ilike", nombreOportunidad]
    ];

    const resultado = llamarOdooXMLRPC("crm.lead", "search", [dominio], creds);
    if (resultado && resultado.length > 0) {
      Logger.log("✅ Oportunidad encontrada: ID " + resultado[0]);
      return resultado[0];
    }

    // PASO 2: Si no encuentra, intentar búsqueda parcial
    Logger.log("⚠️ Oportunidad exacta no encontrada, buscando en sale.order...");
    const resultadoOrder = llamarOdooXMLRPC("sale.order", "search", [[["name", "ilike", nombreOportunidad]]], creds);
    if (resultadoOrder && resultadoOrder.length > 0) {
      Logger.log("✅ Sale.Order encontrada: ID " + resultadoOrder[0]);
      return resultadoOrder[0];
    }

    Logger.log("❌ Oportunidad NO encontrada en CRM ni en Sale.Order");
    return null;
  } catch (e) {
    Logger.log("Error buscando oportunidad: " + e);
    return null;
  }
}

function obtenerClienteDeOportunidad(oportunidadId, creds) {
  try {
    // Obtener datos de la oportunidad
    const oportunidad = llamarOdooXMLRPC("sale.order", "read", [[oportunidadId], ["partner_id"]], creds);
    if (oportunidad && oportunidad.length > 0 && oportunidad[0].partner_id) {
      const clienteId = oportunidad[0].partner_id[0]; // partner_id es array [id, nombre]
      Logger.log("✅ Cliente obtenido de oportunidad: " + clienteId);
      return clienteId;
    }
    return null;
  } catch (e) {
    Logger.log("Error obteniendo cliente: " + e);
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
    .addSeparator()
    .addItem("⚙️ Configurar Credenciales Odoo", "configurarCredencialesOdoo")
    .addItem("🔧 PRUEBA: Conectar Odoo", "pruebaConexionOdoo")
    .addItem("DEBUG: Ver Hojas", "diagnosticarHojas")
    .addToUi();
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
