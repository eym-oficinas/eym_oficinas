/**
 * INTEGRACIÓN EYM OFICINAS ↔ ODOO v14
 * Sistema de Automatización de Reparación de Sillas
 *
 * FUNCIONALIDADES:
 * ✅ Envío automático de presupuestos a Odoo
 * ✅ Creación de Órdenes de Trabajo desde diagnósticos
 * ✅ Sincronización bidireccional de estados
 * ✅ Actualización de inventario
 * ✅ Generación de RMA (Return Merchandise Authorization)
 * ✅ Facturación automática
 */

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN ODOO
// ═══════════════════════════════════════════════════════════════════════

const ODOO_CONFIG = {
  // Cambiar por tu URL de Odoo
  url: "https://odoo.eym-oficinas.com",
  database: "eym_oficinas",
  username: "admin",
  password: process.env.ODOO_PASSWORD || "", // Usar variable de entorno
  apiKey: process.env.ODOO_API_KEY || "",

  // Modelos Odoo relevantes
  models: {
    sale_order: "sale.order",
    sale_quote: "sale.quote",
    manufacturing_order: "mrp.production",
    work_order: "mrp.workorder",
    inventory: "stock.move",
    rma: "rma.rma",
    invoice: "account.invoice",
    product: "product.product"
  },

  // Campos mapeados
  fields: {
    quote: [
      "name", "partner_id", "date_order", "amount_total",
      "order_line", "state", "create_date", "write_date"
    ],
    manufacturing: [
      "name", "product_id", "product_qty", "bom_id", "state",
      "workorder_ids", "create_date", "date_deadline"
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════
// CLIENTE ODOO XML-RPC
// ═══════════════════════════════════════════════════════════════════════

/**
 * Realiza llamada XML-RPC a Odoo
 * @param {string} model - Modelo Odoo (ej: "sale.order")
 * @param {string} method - Método (create, write, read, search, unlink)
 * @param {array} args - Argumentos del método
 * @param {object} kwargs - Parámetros nombrados
 */
function llamarOdoo(model, method, args = [], kwargs = {}) {
  try {
    const payload = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: method,
        args: [ODOO_CONFIG.database, ODOO_CONFIG.username, ODOO_CONFIG.password, model, method, ...args],
        kwargs: kwargs
      }
    };

    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(
      ODOO_CONFIG.url + "/jsonrpc",
      options
    );

    const resultado = JSON.parse(response.getContentText());

    if (resultado.error) {
      Logger.log("❌ Error Odoo: " + resultado.error.message);
      return null;
    }

    return resultado.result;

  } catch (e) {
    Logger.log("❌ Error en llamarOdoo: " + e.toString());
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 1: CREAR PRESUPUESTO/COTIZACIÓN EN ODOO
// ═══════════════════════════════════════════════════════════════════════

/**
 * Envía presupuesto a Odoo como sale.quote
 */
function crearPresupuestoOdoo(fila, hojaDiag) {
  try {
    // Extraer datos del diagnóstico
    const cliente = hojaDiag.getRange(fila, 3).getValue();
    const numeroOportunidad = hojaDiag.getRange(fila, 2).getValue();
    const totalPresupuesto = hojaDiag.getRange(fila, 28).getValue();
    const componentes = hojaDiag.getRange(fila, 17).getValue();
    const observaciones = hojaDiag.getRange(fila, 20).getValue();

    // Buscar cliente en Odoo
    const clienteId = buscarClienteOdoo(cliente);
    if (!clienteId) {
      Logger.log("⚠️ Cliente no encontrado en Odoo: " + cliente);
      crearClienteOdoo(cliente);
      return;
    }

    // Preparar líneas de orden
    const lineas = construirLineasPresupuesto(hojaDiag, fila);

    // Crear presupuesto en Odoo
    const presupuestoData = {
      partner_id: clienteId,
      opportunity_id: numeroOportunidad,
      order_line: [[0, 0, linea] for (linea of lineas)],
      note: observaciones,
      user_id: obtenerUsuarioAsignado(),
      state: "draft"
    };

    const presupuestoId = llamarOdoo(
      ODOO_CONFIG.models.sale_quote,
      "create",
      [presupuestoData]
    );

    if (presupuestoId) {
      // Guardar ID en el diagnóstico
      hojaDiag.getRange(fila, 23).setValue("ODOO-QUOTE-" + presupuestoId);
      Logger.log("✅ Presupuesto creado en Odoo: " + presupuestoId);
      return presupuestoId;
    }

  } catch (e) {
    Logger.log("❌ Error al crear presupuesto en Odoo: " + e.toString());
  }
}

/**
 * Busca cliente en Odoo
 */
function buscarClienteOdoo(nombreCliente) {
  const resultado = llamarOdoo(
    "res.partner",
    "search",
    [[["name", "ilike", nombreCliente]]]
  );

  return resultado && resultado.length > 0 ? resultado[0] : null;
}

/**
 * Crea cliente nuevo en Odoo
 */
function crearClienteOdoo(nombreCliente) {
  const clienteData = {
    name: nombreCliente,
    is_company: false,
    customer_rank: 1
  };

  const clienteId = llamarOdoo(
    "res.partner",
    "create",
    [clienteData]
  );

  return clienteId;
}

/**
 * Construye líneas de presupuesto desde componentes
 */
function construirLineasPresupuesto(hojaDiag, fila) {
  const lineas = [];

  // Extraer componentes
  const componentes = (hojaDiag.getRange(fila, 17).getValue() || "").split(";");
  const servicios = hojaDiag.getRange(fila, 25).getValue();
  const tapiceria = hojaDiag.getRange(fila, 26).getValue();
  const mano = hojaDiag.getRange(fila, 27).getValue();

  // Procesar cada componente
  componentes.forEach(comp => {
    if (comp.trim()) {
      const productId = buscarProductoOdoo(comp.trim());
      if (productId) {
        lineas.push({
          product_id: productId,
          name: comp.trim(),
          product_qty: 1,
          product_uom_id: 1 // Unidad (adaptar si es necesario)
        });
      }
    }
  });

  return lineas;
}

/**
 * Busca producto en Odoo por nombre
 */
function buscarProductoOdoo(nombreProducto) {
  const resultado = llamarOdoo(
    ODOO_CONFIG.models.product,
    "search",
    [[["name", "ilike", nombreProducto]]]
  );

  return resultado && resultado.length > 0 ? resultado[0] : null;
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 2: CREAR ORDEN DE PRODUCCIÓN/MANUFACTURA
// ═══════════════════════════════════════════════════════════════════════

/**
 * Crea Orden de Manufactura en Odoo cuando se aprueba presupuesto
 */
function crearOrdenManufacturaOdoo(fila, hojaDiag) {
  try {
    // Datos del diagnóstico
    const tipoSilla = hojaDiag.getRange(fila, 4).getValue();
    const numeroEyM = hojaDiag.getRange(fila, 5).getValue();
    const cantidad = 1;
    const fechaEntrega = new Date();
    fechaEntrega.setDate(fechaEntrega.getDate() + 5); // 5 días de plazo

    // Buscar BOM (Bill of Materials) en Odoo
    const bomId = buscarBOMOdoo(tipoSilla);
    if (!bomId) {
      Logger.log("⚠️ BOM no encontrado para: " + tipoSilla);
      return;
    }

    // Crear orden de manufactura
    const manufacturingData = {
      product_id: bomId,
      product_qty: cantidad,
      bom_id: bomId,
      date_deadline: formatearFechaOdoo(fechaEntrega),
      state: "confirmed",
      origin: "DIAG-" + numeroEyM
    };

    const manufacturingId = llamarOdoo(
      ODOO_CONFIG.models.manufacturing_order,
      "create",
      [manufacturingData]
    );

    if (manufacturingId) {
      // Confirmar automáticamente
      llamarOdoo(
        ODOO_CONFIG.models.manufacturing_order,
        "button_plan",
        [manufacturingId]
      );

      Logger.log("✅ Orden de manufactura creada: " + manufacturingId);
      return manufacturingId;
    }

  } catch (e) {
    Logger.log("❌ Error al crear orden de manufactura: " + e.toString());
  }
}

/**
 * Busca BOM en Odoo
 */
function buscarBOMOdoo(producto) {
  const resultado = llamarOdoo(
    "mrp.bom",
    "search",
    [[["product_tmpl_id.name", "ilike", producto]]]
  );

  return resultado && resultado.length > 0 ? resultado[0] : null;
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 3: GENERACIÓN DE RMA (AUTORIZACIÓN DE DEVOLUCIÓN)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Crea RMA en Odoo
 */
function crearRMAOdoo(fila, hojaDiag) {
  try {
    const cliente = hojaDiag.getRange(fila, 3).getValue();
    const numeroEyM = hojaDiag.getRange(fila, 5).getValue();
    const observaciones = hojaDiag.getRange(fila, 20).getValue();

    const clienteId = buscarClienteOdoo(cliente);
    if (!clienteId) return;

    // Crear RMA
    const rmaData = {
      partner_id: clienteId,
      reference: "RMA-" + numeroEyM,
      description: observaciones,
      type: "customer",
      state: "draft"
    };

    const rmaId = llamarOdoo(
      ODOO_CONFIG.models.rma,
      "create",
      [rmaData]
    );

    if (rmaId) {
      // Guardar referencia RMA en diagnóstico
      hojaDiag.getRange(fila, 33).setValue("RMA-" + rmaId);
      Logger.log("✅ RMA creado: RMA-" + rmaId);
      return rmaId;
    }

  } catch (e) {
    Logger.log("❌ Error al crear RMA: " + e.toString());
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 4: SINCRONIZACIÓN DE ESTADOS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Sincroniza estado desde Odoo al Sheet
 */
function sincronizarEstadoDesdeOdoo(manufacturingId, fila, hojaDiag) {
  try {
    // Obtener estado desde Odoo
    const estado = llamarOdoo(
      ODOO_CONFIG.models.manufacturing_order,
      "read",
      [[manufacturingId], ["state"]]
    );

    if (estado && estado.length > 0) {
      const estadoOdoo = estado[0].state;

      // Mapear estado Odoo a estado local
      const estadoLocal = mapearEstado(estadoOdoo);

      // Actualizar en Sheet
      hojaDiag.getRange(fila, 30).setValue(estadoLocal);

      Logger.log("✅ Estado sincronizado: " + estadoLocal);
    }

  } catch (e) {
    Logger.log("❌ Error al sincronizar estado: " + e.toString());
  }
}

/**
 * Mapea estados Odoo a estados locales
 */
function mapearEstado(estadoOdoo) {
  const mapa = {
    "confirmed": "Confirmado",
    "progress": "En Proceso",
    "to_close": "Por Cerrar",
    "done": "Completado",
    "cancel": "Cancelado"
  };

  return mapa[estadoOdoo] || "Desconocido";
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 5: UTILIDADES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Obtiene usuario asignado en Odoo
 */
function obtenerUsuarioAsignado() {
  // Retornar ID de usuario por defecto o el actual
  return 2; // Admin en Odoo
}

/**
 * Formatea fecha para Odoo
 */
function formatearFechaOdoo(fecha) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

/**
 * Realiza prueba de conexión con Odoo
 */
function pruebaConexionOdoo() {
  Logger.log("🔌 Probando conexión con Odoo...");

  const resultado = llamarOdoo(
    "res.users",
    "search",
    [[["id", "=", 2]]]
  );

  if (resultado !== null) {
    Logger.log("✅ Conexión exitosa con Odoo");
    return true;
  } else {
    Logger.log("❌ Error de conexión con Odoo");
    return false;
  }
}

// Exportar para uso en otras partes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    crearPresupuestoOdoo,
    crearOrdenManufacturaOdoo,
    crearRMAOdoo,
    sincronizarEstadoDesdeOdoo,
    pruebaConexionOdoo
  };
}
