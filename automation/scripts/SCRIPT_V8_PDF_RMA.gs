// ═══════════════════════════════════════════════════════════════════════════════════════
// SISTEMA AUTOMÁTICO EYM OFICINAS v8.0 - INTEGRACIÓN COMPLETA ODOO RMA
// ═══════════════════════════════════════════════════════════════════════════════════════
// Versión estable: Diagnósticos + RMA en Odoo + Piezas + Operaciones + PDF + Impuestos
// Estados columna AA: COTIZACIÓN (manual) → APROBADO (automático) → RECHAZADO
// ✅ V8.0: Duplicados resueltos + onEdit optimizado + RMA separado

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

    // Cargar TODOS los datos de DIAGNOSTICOS_2026 una sola vez para comparación eficiente
    const ultFilaDiag = hojaDiag.getLastRow();
    const datoDiagnosticos = ultFilaDiag > 1 ? hojaDiag.getRange(2, 1, ultFilaDiag - 1, 29).getValues() : [];

    Logger.log("🔍 Última respuesta procesada: " + ultimaProcesada);
    Logger.log("🔍 Total respuestas en formulario: " + (ultFilaResp - 1));
    Logger.log("🔍 Procesando SOLO desde fila " + (ultimaProcesada + 1) + " en adelante");
    Logger.log("🔍 Diagnósticos existentes: " + datoDiagnosticos.length);

    // ⚠️ CRÍTICO: Solo procesar NUEVAS respuestas desde la última procesada
    for (let r = ultimaProcesada + 1; r <= ultFilaResp; r++) {
      const resp = hojaResp.getRange(r, 1, 1, 34).getValues()[0];

      const fechaResp = resp[1];
      const clienteResp = resp[3];
      const tipoSillaResp = resp[4]; // Agregamos tipo de silla para mejor identificación

      let yaExiste = false;

      // Búsqueda mejorada: comparar timestamp + cliente + tipo de silla
      for (let diagRow of datoDiagnosticos) {
        const fechaDiag = diagRow[0]; // Columna A (0-indexed)
        const clienteDiag = diagRow[2]; // Columna C
        const tipoSillaDiag = diagRow[3]; // Columna D

        // Validación: mismo cliente + mismo tipo de silla + timestamp muy cercano (± 5 minutos)
        const diferenciaTiempo = Math.abs(new Date(fechaResp) - new Date(fechaDiag));

        if (clienteResp === clienteDiag && tipoSillaResp === tipoSillaDiag && diferenciaTiempo < 300000) {
          Logger.log("⚠️ Respuesta duplicada detectada: " + clienteResp + " - " + tipoSillaResp + " (timestamp diff: " + (diferenciaTiempo / 1000) + "s)");
          yaExiste = true;
          break;
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

function procesarOportunidadCompleta(hojaDiag, nombreOportunidad, mostrarAlerta = true) {
  try {
    Logger.log("🚀 Iniciando procesamiento completo de oportunidad: " + nombreOportunidad);

    // PASO 1: OBTENER DIAGNÓSTICOS
    const diagnosticos = obtenerDiagnosticosDeOportunidad(hojaDiag, nombreOportunidad);
    if (diagnosticos.length === 0) {
      return { exito: false, error: "No se encontraron diagnósticos para: " + nombreOportunidad };
    }

    Logger.log("✅ Diagnósticos encontrados: " + diagnosticos.length);

    const cliente = diagnosticos[0].cliente;
    const numeroEYM = diagnosticos[0].numeroEYM;
    const productosConsolidados = consolidarProductosTotal(diagnosticos, hojaDiag);
    const serviciosConsolidados = consolidarServiciosTotal(diagnosticos, hojaDiag);

    // PASO 2: CREAR RMA EN ODOO
    Logger.log("📝 Creando RMA en Odoo...");
    const resultadoRMA = crearRMAenOdooConProductos(cliente, numeroEYM, productosConsolidados, serviciosConsolidados, nombreOportunidad);

    if (!resultadoRMA.exito) {
      return { exito: false, error: resultadoRMA.error };
    }

    Logger.log("✅ RMA creada: " + resultadoRMA.referenciaRMA);

    // PASO 3: ESCRIBIR RMA CON HYPERLINK EN COLUMNA AC (REFERENCIA_RMA)
    Logger.log("🔗 Escribiendo RMA link en DIAGNOSTICOS_2026 (columna AC)...");
    for (let diag of diagnosticos) {
      hojaDiag.getRange(diag.fila, 29).setValue(resultadoRMA.referenciaRMA);
      hojaDiag.getRange(diag.fila, 29).setFormula('=HYPERLINK("' + resultadoRMA.linkRMA + '","' + resultadoRMA.referenciaRMA + '")');
      hojaDiag.getRange(diag.fila, 29).setFontColor("#0000FF");
      hojaDiag.getRange(diag.fila, 29).setFontLine("underline");
    }

    // PASO 4: GENERAR PDF CONSOLIDADO
    Logger.log("📄 Generando PDF consolidado por silla...");
    const silasDatos = agruparPorSilla(diagnosticos, hojaDiag);
    const totalGeneral = calcularTotalGeneral(silasDatos);

    const urlPDF = generarPDFDiagnosticos(nombreOportunidad, cliente, silasDatos, totalGeneral);

    if (!urlPDF) {
      Logger.log("⚠️ No se pudo generar PDF, pero RMA fue creada");
      return {
        exito: true,
        rmaCreada: true,
        pdfError: true,
        referenciaRMA: resultadoRMA.referenciaRMA,
        linkRMA: resultadoRMA.linkRMA,
        mensaje: "✅ RMA CREADA: " + resultadoRMA.referenciaRMA + "\n\n⚠️ Error generando PDF (pero la RMA está lista en Odoo)\n\nLink RMA: " + resultadoRMA.linkRMA
      };
    }

    Logger.log("✅ PDF generado: " + urlPDF);

    // PASO 5: ADJUNTAR PDF A RMA EN ODOO
    Logger.log("📎 Adjuntando PDF a RMA en Odoo...");
    const resultadoAdjunto = adjuntarPDFaRMA(resultadoRMA.numeroRMA, urlPDF, nombreOportunidad);

    if (!resultadoAdjunto.exito) {
      Logger.log("⚠️ Error adjuntando PDF: " + resultadoAdjunto.error);
      return {
        exito: true,
        rmaCreada: true,
        pdfGenerado: true,
        adjuntoError: true,
        referenciaRMA: resultadoRMA.referenciaRMA,
        linkRMA: resultadoRMA.linkRMA,
        mensaje: "✅ RMA CREADA: " + resultadoRMA.referenciaRMA + "\n✅ PDF generado\n\n⚠️ Error al adjuntar PDF a RMA (pero el PDF está en Drive)\n\nLink RMA: " + resultadoRMA.linkRMA
      };
    }

    Logger.log("✅ PDF adjunto a RMA en Odoo");

    return {
      exito: true,
      rmaCreada: true,
      pdfGenerado: true,
      adjunto: true,
      referenciaRMA: resultadoRMA.referenciaRMA,
      linkRMA: resultadoRMA.linkRMA,
      urlPDF: urlPDF,
      mensaje: "✅ COMPLETADO\n\nRMA: " + resultadoRMA.referenciaRMA + "\n✅ Productos y servicios agregados\n✅ PDF generado y adjunto\n\nLink RMA: " + resultadoRMA.linkRMA
    };

  } catch (e) {
    Logger.log("❌ Error en procesarOportunidadCompleta: " + e.toString());
    return { exito: false, error: e.toString() };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// TRIGGER AUTOMÁTICO: GENERAR EYM + OP AL MARCAR "APROBADO"
// Captura los 5 métodos de entrada en columna AA (27):
// 1. Dropdown selection, 2. Copy/paste, 3. Drag operation, 4. Manual text entry, 5. Odoo sync
// ═══════════════════════════════════════════════════════════════════════════════════════

function onEdit(e) {
  try {
    // ⚠️ IMPORTANTE: Este logging es CRÍTICO para diagnóstico
    // Si no ves estos mensajes en los logs, onEdit() NO se está disparando
    const ahora = new Date().toLocaleTimeString();
    Logger.log("\n🟣 ════════════════════════════════════════════════════════");
    Logger.log("🟣 onEdit ACTIVADO a las " + ahora);
    Logger.log("🟣 ════════════════════════════════════════════════════════");

    const range = e.range;
    const hoja = range.getSheet();
    const hojaName = hoja.getName();
    const columna = range.getColumn();
    const fila = range.getRow();

    Logger.log("🟣 Hoja: " + hojaName);
    Logger.log("🟣 Columna: " + columna + " (AA=27)");
    Logger.log("🟣 Fila: " + fila);

    // Solo procesar si es DIAGNOSTICOS_2026
    if (hojaName !== "DIAGNOSTICOS_2026") {
      Logger.log("🟣 ⊘ No es DIAGNOSTICOS_2026, ignorando");
      return;
    }

    // Solo procesar si se cambió columna AA (ESTADO_APROBACION - columna 27)
    if (columna !== 27) {
      Logger.log("🟣 ⊘ Columna " + columna + " no es AA (27), ignorando");
      return;
    }

    // Validar que sea encabezado o datos
    if (fila === 1) {
      Logger.log("🟣 ⊘ Es encabezado (fila 1), ignorando");
      return;
    }

    const nuevoValor = range.getValue();
    Logger.log("🟣 Valor: '" + nuevoValor + "' (tipo: " + typeof nuevoValor + ")");

    if (!nuevoValor) {
      Logger.log("🟣 ⊘ Celda vacía, ignorando");
      return;
    }

    const nuevoValorStr = nuevoValor.toString().trim();
    const nuevoValorLower = nuevoValorStr.toLowerCase();

    Logger.log("🟣 Valor normalizado: '" + nuevoValorStr + "'");
    Logger.log("🟣 Valor lowercase: '" + nuevoValorLower + "'");

    // ✅ MÉTODO 1: Dropdown selection - "Aprobado" (con cualquier capitalización)
    // ✅ MÉTODO 2: Copy/paste - Captura el valor exacto pegado
    // ✅ MÉTODO 3: Drag operation - Copia valores de celdas adyacentes
    // ✅ MÉTODO 4: Manual text entry - Digita el usuario
    // ✅ MÉTODO 5: Odoo sync - Escrito por función sincronización (ver sincronizarRMAsDesdeOdoo)

    if (nuevoValorLower.includes("cotización")) {
      Logger.log("📋 Cotización marcada en fila " + fila);
    }
    else if (nuevoValorLower.includes("aprobado")) {
      Logger.log("✅ DETECTADO 'APROBADO' en fila " + fila + " - Disparando procesarAprobacionEnFila()");
      procesarAprobacionEnFila(hoja, fila);
      Logger.log("✅ procesarAprobacionEnFila() completado");
    }
    else if (nuevoValorLower.includes("rechazado")) {
      Logger.log("❌ Rechazado marcado en fila " + fila);
    }
    else {
      Logger.log("🟣 ⊘ Valor '" + nuevoValorStr + "' no coincide con opciones esperadas");
    }

    Logger.log("🟣 ════════════════════════════════════════════════════════\n");

  } catch (e) {
    Logger.log("\n❌ ════════════════════════════════════════════════════════");
    Logger.log("❌ ERROR CRÍTICO en onEdit:");
    Logger.log("❌ Mensaje: " + e.toString());
    Logger.log("❌ Stack: " + e.stack);
    Logger.log("❌ ════════════════════════════════════════════════════════\n");
  }
}

function procesarAprobacionEnFila(hoja, fila) {
  try {
    Logger.log("\n🔵 ════════════════════════════════════════════════════════");
    Logger.log("🔵 INICIANDO PROCESAMIENTO DE APROBACIÓN - Fila " + fila);
    Logger.log("🔵 ════════════════════════════════════════════════════════");

    const ss = SpreadsheetApp.getParent();
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

    // PASO 4: PROGRAMAR RMA en Odoo para ejecución SEPARADA (evita timeout en onEdit)
    // Esto se ejecutará de forma separada para no bloquear onEdit
    const nombreOportunidad = hoja.getRange(fila, 2).getValue();
    if (!nombreOportunidad) {
      Logger.log("⚠️ ADVERTENCIA: No hay nombre de oportunidad en fila " + fila);
      return;
    }

    Logger.log("\n📍 PASO 4: Programando creación de RMA en Odoo (ejecución separada)...");
    Logger.log("📝 Oportunidad: " + nombreOportunidad);
    Logger.log("✅ RMA será creada en próxima ejecución automática");

    // Marcar para procesamiento de RMA
    hoja.getRange(fila, 29).setValue("⏳ Pendiente RMA");
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
      numeroEYM                             // P: NUM_EYM ← Col E (NUMERO_EYM)
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

    // PASO 3: Crear Repair Order (módulo Repair nativo de Odoo v14)
    const rmaData = {
      partner_id: clienteOdooId,
      name: "RMA-" + numeroEYM,
      state: "draft",
      location_id: 1  // Stock location (por defecto)
    };

    const numeroRMA = llamarOdooXMLRPC("repair.order", "create", [rmaData], creds);

    if (!numeroRMA) {
      Logger.log("❌ Error creando Repair Order en Odoo");
      return { exito: false, error: "Error creando RMA en Odoo" };
    }

    Logger.log("✅ Repair Order creada: " + numeroRMA);

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

    const linkRMA = creds.urlWeb + "#id=" + numeroRMA + "&model=repair.order&view_type=form";

    Logger.log("✅ Repair Order completada: " + numeroRMA);

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

      // Crear línea de reparación (Piezas)
      const lineaData = {
        repair_id: numeroRMA,
        product_id: productoOdooId,
        name: producto.nombre,
        product_qty: producto.cantidad,
        product_uom_id: 1, // Unidades
        price_unit: producto.precio,
        tax_ids: impuestos.taxIds // [19% IVA, 4% RFTFE]
      };

      const lineaRmaId = llamarOdooXMLRPC("repair.line", "create", [lineaData], creds);
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

      // Crear línea de honorarios/servicios en repair.order
      const lineaData = {
        repair_id: numeroRMA,
        name: servicio.nombre,
        product_id: servicioOdooId,
        product_qty: servicio.cantidad,
        product_uom_id: 1, // Unidades
        price_unit: servicio.precio,
        tax_ids: impuestos.taxIds
      };

      const lineaRmaId = llamarOdooXMLRPC("repair.fee", "create", [lineaData], creds);
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
    // PASO 1: Búsqueda EXACTA en crm.lead (ignorar filtros de usuario/pipeline)
    Logger.log("🔍 PASO 1: Búsqueda EXACTA en crm.lead: " + nombreOportunidad);

    // Búsqueda exacta: type='opportunity' AND name=nombreOportunidad (sin ilike)
    let dominio = [
      ["type", "=", "opportunity"],
      ["name", "=", nombreOportunidad]
    ];

    let resultado = llamarOdooXMLRPC("crm.lead", "search", [dominio], creds);
    if (resultado && resultado.length > 0) {
      Logger.log("✅ Oportunidad encontrada (EXACTA): ID " + resultado[0]);
      return resultado[0];
    }

    // PASO 2: Búsqueda PARCIAL (ilike) en crm.lead
    Logger.log("⚠️ PASO 2: Búsqueda PARCIAL en crm.lead: " + nombreOportunidad);
    dominio = [
      ["type", "=", "opportunity"],
      ["name", "ilike", nombreOportunidad]
    ];

    resultado = llamarOdooXMLRPC("crm.lead", "search", [dominio], creds);
    if (resultado && resultado.length > 0) {
      Logger.log("✅ Oportunidad encontrada (PARCIAL): ID " + resultado[0]);
      if (resultado.length > 1) {
        Logger.log("⚠️ ADVERTENCIA: Se encontraron " + resultado.length + " oportunidades. Usando la primera.");
      }
      return resultado[0];
    }

    // PASO 3: Si no encuentra en crm.lead, intentar en sale.order
    Logger.log("⚠️ PASO 3: No encontrado en crm.lead, buscando en sale.order...");
    resultado = llamarOdooXMLRPC("sale.order", "search", [[["name", "ilike", nombreOportunidad]]], creds);
    if (resultado && resultado.length > 0) {
      Logger.log("✅ Sale.Order encontrada: ID " + resultado[0]);
      return resultado[0];
    }

    Logger.log("❌ Oportunidad NO encontrada en CRM ni en Sale.Order");
    Logger.log("💡 SUGERENCIA: Verifica que escribiste el nombre exacto de la columna 'Oportunidad' en Odoo");
    return null;
  } catch (e) {
    Logger.log("Error buscando oportunidad: " + e);
    return null;
  }
}

function obtenerClienteDeOportunidad(oportunidadId, creds) {
  try {
    // PASO 1: Intentar leer de crm.lead (Oportunidades)
    Logger.log("🔍 Intentando obtener cliente de crm.lead ID: " + oportunidadId);
    let oportunidad = llamarOdooXMLRPC("crm.lead", "read", [[oportunidadId], ["partner_id"]], creds);

    if (oportunidad && oportunidad.length > 0 && oportunidad[0].partner_id) {
      const clienteId = oportunidad[0].partner_id[0]; // partner_id es array [id, nombre]
      Logger.log("✅ Cliente obtenido de crm.lead: " + clienteId);
      return clienteId;
    }

    // PASO 2: Si no está en crm.lead, intentar en sale.order
    Logger.log("⚠️ No encontrado en crm.lead, intentando sale.order...");
    oportunidad = llamarOdooXMLRPC("sale.order", "read", [[oportunidadId], ["partner_id"]], creds);
    if (oportunidad && oportunidad.length > 0 && oportunidad[0].partner_id) {
      const clienteId = oportunidad[0].partner_id[0];
      Logger.log("✅ Cliente obtenido de sale.order: " + clienteId);
      return clienteId;
    }

    Logger.log("❌ Cliente no encontrado en crm.lead ni sale.order");
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

    // Crear attachment en Odoo (repair.order)
    const attachmentData = {
      name: "COTIZACION_" + nombreOportunidad + ".pdf",
      datas: base64,
      datas_fname: "COTIZACION_" + nombreOportunidad + ".pdf",
      res_model: "repair.order",
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

// ═══════════════════════════════════════════════════════════════════════════════════════
// SINCRONIZACIÓN CON ODOO: Detectar RMAs confirmadas y actualizar columna AA
// ═══════════════════════════════════════════════════════════════════════════════════════
function sincronizarRMAsDesdeOdoo() {
  try {
    SpreadsheetApp.getUi().alert("🔄 Sincronizando RMAs desde Odoo...\n\nRevisa los Logs para detalles...");

    const creds = obtenerCredencialesOdoo();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hojaDiag = ss.getSheetByName("DIAGNOSTICOS_2026");

    if (!hojaDiag) {
      SpreadsheetApp.getUi().alert("❌ Hoja DIAGNOSTICOS_2026 no encontrada");
      return;
    }

    Logger.log("═══════════════════════════════════════════════════════════════");
    Logger.log("🔄 SINCRONIZANDO RMAs DESDE ODOO");
    Logger.log("═══════════════════════════════════════════════════════════════");

    // PASO 1: Obtener todas las RMAs de Odoo con estado "Confirmada"
    const rmasConfirmadas = buscarRMAsConfirmadasEnOdoo(creds);
    Logger.log("✅ RMAs confirmadas encontradas: " + rmasConfirmadas.length);

    let actualizadas = 0;

    // PASO 2: Para cada RMA confirmada, buscar en columna AC (REFERENCIA_RMA) y actualizar
    for (const rmaOdoo of rmasConfirmadas) {
      Logger.log("📌 Procesando RMA Odoo: " + rmaOdoo.name);

      // PASO 3: Buscar todas las filas donde AC (columna 29) = REFERENCIA_RMA
      const ultFila = hojaDiag.getLastRow();
      for (let f = 2; f <= ultFila; f++) {
        const referenciaRMAEnHoja = hojaDiag.getRange(f, 29).getValue(); // Columna AC
        const estadoActual = hojaDiag.getRange(f, 27).getValue(); // Columna AA

        // Si la REFERENCIA_RMA coincide con la RMA de Odoo
        if (referenciaRMAEnHoja && referenciaRMAEnHoja.toString().trim() === rmaOdoo.name.toString().trim()) {
          // Si no está ya "Aprobado", actualizar a "Aprobado"
          if (!estadoActual || !estadoActual.toString().toLowerCase().includes("aprobado")) {
            Logger.log("  ⏳ Fila " + f + ": Escribiendo 'Aprobado' en columna AA...");
            hojaDiag.getRange(f, 27).setValue("Aprobado");
            Logger.log("  ✅ Fila " + f + " actualizada a 'Aprobado' - Esto disparará EYM + OP automáticamente");
            actualizadas++;

            // Pequeña pausa para que onEdit se ejecute
            Utilities.sleep(500);
          }
        }
      }
    }

    Logger.log("═══════════════════════════════════════════════════════════════");
    Logger.log("✅ Sincronización completada: " + actualizadas + " filas actualizadas a 'Aprobado'");

    SpreadsheetApp.getUi().alert("✅ Sincronización completada\n\n" + actualizadas + " diagnósticos actualizados a 'Aprobado'\n(EYM y OP se generan automáticamente)");

  } catch (e) {
    Logger.log("❌ Error en sincronización: " + e.toString());
    SpreadsheetApp.getUi().alert("❌ ERROR: " + e.toString());
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// FUNCIÓN AUXILIAR: Buscar Repair Orders confirmadas en Odoo (repair.order state=confirmed)
// Retorna nombre de RMA para buscar en columna AC (REFERENCIA_RMA) de DIAGNOSTICOS_2026
// ═══════════════════════════════════════════════════════════════════════════════════════
function buscarRMAsConfirmadasEnOdoo(creds) {
  try {
    Logger.log("🔍 Buscando Repair Orders confirmadas en Odoo (repair.order state='confirmed')...");

    // Buscar en repair.order con state = "confirmed"
    // Campos: name (referencia RMA), partner_id (cliente), state (estado)
    const resultados = llamarOdooXMLRPC("repair.order", "search_read", [
      [["state", "=", "confirmed"]],
      ["id", "name", "partner_id", "state"]
    ], creds);

    if (!resultados || !Array.isArray(resultados)) {
      Logger.log("⚠️ No se encontraron RMAs confirmadas o error en búsqueda");
      return [];
    }

    const rmas = [];
    for (const rma of resultados) {
      rmas.push({
        id: rma.id,
        name: rma.name,  // Este es el nombre de la RMA que se buscará en columna AC
        estado: rma.state,
        cliente: rma.partner_id ? rma.partner_id[1] : ""
      });
      Logger.log("  📋 RMA encontrada: " + rma.name + " (Cliente: " + (rma.partner_id ? rma.partner_id[1] : "N/A") + ")");
    }

    Logger.log("✅ RMAs encontradas: " + rmas.length);
    return rmas;

  } catch (e) {
    Logger.log("❌ Error buscando RMAs: " + e.toString());
    return [];
  }
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu("EYM v8.0")
    .addItem("📥 Procesar Manualmente", "procesarRespuestaFormulario")
    .addItem("🔧 Instalar Trigger", "instalarTriggerAutomatico")
    .addSeparator()
    .addItem("📋 Finalizar Oportunidad", "finalizarOportunidad")
    .addItem("📝 Procesar RMAs Pendientes", "procesarRMAsPendientes")
    .addItem("🔄 Sincronizar RMAs desde Odoo", "sincronizarRMAsDesdeOdoo")
    .addSeparator()
    .addItem("✅ Procesar Aprobados → OP", "procesarAprobadosAOP")
    .addItem("🔁 Recalcular Todo", "recalcularTodo")
    .addItem("📋 Configurar Listas Desplegables", "configurarValidacionAprobacion")
    .addSeparator()
    .addItem("⚙️ Configurar Credenciales Odoo", "configurarCredencialesOdoo")
    .addItem("🔧 PRUEBA: Conectar Odoo", "pruebaConexionOdoo")
    .addItem("🧪 PRUEBA: onEdit() funciona?", "pruebaOnEdit")
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
