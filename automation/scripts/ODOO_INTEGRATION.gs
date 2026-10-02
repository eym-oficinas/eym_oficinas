// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRACIÓN ODOO - CREAR RMA AUTOMÁTICAMENTE
// ═══════════════════════════════════════════════════════════════════════════════

// Credenciales Odoo (leerlas desde .env mediante PropertiesService)
function obtenerCredencialesOdoo() {
  try {
    // En Google Apps Script, usar PropertiesService para acceder a variables
    // NOTA: Estas deben estar configuradas en el proyecto
    const props = PropertiesService.getScriptProperties();

    return {
      url: "https://eym-oficinas.ovh/web",           // URL base Odoo
      database: "eym_oficinas",
      username: "eymclaude@eym-oficinas.com",
      password: "Camilo1973*",                        // ⚠️ USAR VARIABLE DE ENTORNO EN PRODUCCIÓN
      apiEndpoint: "https://eym-oficinas.ovh/api/"   // API endpoint
    };
  } catch (e) {
    Logger.log("❌ Error obtener credenciales: " + e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIÓN: Crear RMA en Odoo
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Crea RMA en Odoo con productos consolidados
 * @param {object} datosRMA - { cliente, numeroEyM, componentes, total, hojaDiag, fila }
 * @returns {object} { numeroRMA, linkRMA, exito }
 */
function crearRMAenOdoo(datosRMA) {
  try {
    const creds = obtenerCredencialesOdoo();
    if (!creds) {
      Logger.log("❌ No se pudieron obtener credenciales");
      return { exito: false, error: "Credenciales no disponibles" };
    }

    // 1. Consolidar productos (agrupar por nombre)
    const productosConsolidados = consolidarProductos(datosRMA.componentes);

    Logger.log("🔄 Creando RMA en Odoo para cliente: " + datosRMA.cliente);
    Logger.log("   Productos consolidados: " + JSON.stringify(productosConsolidados));

    // 2. Buscar cliente en Odoo (res.partner)
    const clienteOdooId = buscarClienteOdoo(datosRMA.cliente, creds);
    if (!clienteOdooId) {
      Logger.log("⚠️ Cliente no encontrado en Odoo: " + datosRMA.cliente);
      // Crear cliente si no existe
      const nuevoClienteId = crearClienteOdoo(datosRMA.cliente, creds);
      if (!nuevoClienteId) {
        return { exito: false, error: "No se pudo crear cliente en Odoo" };
      }
    }

    // 3. Preparar datos para RMA
    const rmaData = {
      partner_id: clienteOdooId || nuevoClienteId,
      reference: "RMA-" + datosRMA.numeroEyM,
      description: "Reparación de silla - EyM: " + datosRMA.numeroEyM,
      type: "customer",
      state: "draft",
      rma_line_ids: productosConsolidados.map(prod => [0, 0, {
        product_id: buscarProductoOdoo(prod.nombre, creds),
        product_qty: prod.cantidad,
        unit_price: prod.precio
      }])
    };

    // 4. Llamada XML-RPC a Odoo para crear RMA
    const numeroRMA = llamarOdooXMLRPC("rma.rma", "create", [rmaData], creds);

    if (!numeroRMA) {
      Logger.log("❌ Error creando RMA en Odoo");
      return { exito: false, error: "Error en llamada XML-RPC" };
    }

    // 5. Generar link directo a RMA en Odoo
    const linkRMA = creds.url + "/web#id=" + numeroRMA + "&model=rma.rma&view_type=form";

    Logger.log("✅ RMA creada exitosamente: RMA-" + numeroRMA);
    Logger.log("   Link: " + linkRMA);

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

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIÓN: Consolidar Productos (agrupar por nombre y sumar cantidades)
// ═══════════════════════════════════════════════════════════════════════════════

function consolidarProductos(componentesTexto) {
  try {
    if (!componentesTexto) return [];

    const componentes = componentesTexto.toString().split(";");
    const productosMap = {};

    componentes.forEach(comp => {
      const compLimpio = comp.trim();
      if (!compLimpio) return;

      // Normalizar nombre
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

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIÓN: Buscar Código Odoo en Catálogo
// ═══════════════════════════════════════════════════════════════════════════════

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
      const codigoOdoo = datos[i][2]; // Columna C = Código Odoo

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

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIÓN: Llamada XML-RPC a Odoo
// ═══════════════════════════════════════════════════════════════════════════════

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
      muteHttpExceptions: true,
      headers: {
        "X-API-KEY": "dummy" // Cambiar si Odoo requiere API key
      }
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

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIÓN: Buscar Cliente en Odoo
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIÓN: Crear Cliente en Odoo
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIÓN: Buscar Producto en Odoo
// ═══════════════════════════════════════════════════════════════════════════════

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

    // Si no encuentra, buscar por referencia interna
    const codigoOdoo = buscarCodigoOdooDelCatalogo(nombreProducto);
    if (codigoOdoo) {
      const resultadoCodigo = llamarOdooXMLRPC(
        "product.product",
        "search",
        [[["default_code", "=", codigoOdoo]]],
        creds
      );
      if (resultadoCodigo && resultadoCodigo.length > 0) {
        return resultadoCodigo[0];
      }
    }

    return null;

  } catch (e) {
    Logger.log("⚠️ Error buscando producto: " + e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIÓN: Escribir RMA en columna AC con LINK
// ═══════════════════════════════════════════════════════════════════════════════

function escribirRMAenHoja(hoja, fila, numeroRMA, linkRMA) {
  try {
    // Columna AC = 29
    const celdaRMA = hoja.getRange(fila, 29);

    // Escribir número RMA
    celdaRMA.setValue(numeroRMA);

    // Agregar hipervínculo
    celdaRMA.setFormula('=HYPERLINK("' + linkRMA + '", "' + numeroRMA + '")');

    // Formato: azul, subrayado
    celdaRMA.setFontColor("#0000FF");
    celdaRMA.setFontLine("underline");

    Logger.log("✅ RMA escrito en columna AC: " + numeroRMA + " con link");

  } catch (e) {
    Logger.log("❌ Error escribiendo RMA: " + e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODIFICACIÓN: onEdit() - Agregar creación de RMA
// ═══════════════════════════════════════════════════════════════════════════════

// Reemplazar la función onEdit() existente con esta versión mejorada:
// (Agregar esto después de la función onEdit() original)

function onEditConOdoo(e) {
  try {
    const ss = e.source;
    const sheet = e.range.getSheet();
    if (sheet.getName() !== "DIAGNÓSTICOS_2026") return;

    const col = e.range.getColumn();
    const fila = e.range.getRow();
    const valor = e.value;

    // Si se escribe "aprobado" en la columna AE (27)
    if (col === 27 && valor && valor.toString().toLowerCase().includes("aprobado")) {
      // 1. Asignar EYM si aún no tiene
      const celdaEYM = sheet.getRange(fila, 5);
      const numeroEYM = celdaEYM.getValue();

      if (!numeroEYM || numeroEYM.toString().trim() === "") {
        const nuevoEYM = obtenerProximoEYM(sheet);
        celdaEYM.setValue(nuevoEYM);
        celdaEYM.setBackground("#FFFF00");
        celdaEYM.setFontColor("#0000FF");
        Logger.log("✅ Nuevo EYM asignado al aprobar: " + nuevoEYM);
      }

      // 2. Rellenar fecha de aprobación en AB (28)
      sheet.getRange(fila, 28).setValue(new Date());

      // 3. NUEVO: Crear RMA en Odoo
      try {
        const cliente = sheet.getRange(fila, 3).getValue();
        const numeroEYMFinal = sheet.getRange(fila, 5).getValue();
        const componentes = sheet.getRange(fila, 14).getValue();
        const totalPresupuesto = sheet.getRange(fila, 24).getValue();

        const datosRMA = {
          cliente: cliente,
          numeroEyM: numeroEYMFinal,
          componentes: componentes,
          total: totalPresupuesto,
          hojaDiag: sheet,
          fila: fila
        };

        const resultadoRMA = crearRMAenOdoo(datosRMA);

        if (resultadoRMA.exito) {
          // Escribir RMA en columna AC con link
          escribirRMAenHoja(sheet, fila, resultadoRMA.referenciaRMA, resultadoRMA.linkRMA);
          Logger.log("✅ RMA creada en Odoo: " + resultadoRMA.referenciaRMA);
        } else {
          Logger.log("❌ Error creando RMA: " + resultadoRMA.error);
          sheet.getRange(fila, 29).setValue("ERROR: " + resultadoRMA.error);
        }

      } catch (rmaError) {
        Logger.log("⚠️ Error en integración Odoo: " + rmaError);
        sheet.getRange(fila, 29).setValue("ERROR RMA");
      }

      // 4. Crear OP automáticamente
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
    Logger.log("❌ Error en onEditConOdoo: " + e);
  }
}
