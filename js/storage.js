/*
 * Persistencia local (localStorage). No se guardan números de cuenta,
 * extractos ni información bancaria: la herramienta no los pide.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SolvenciaStore = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  var KEY_REGISTROS = 'solvencia.registros.v1';
  var KEY_BORRADOR = 'solvencia.borrador.v1';
  var KEY_PREFS = 'solvencia.prefs.v1';

  function disponible() {
    try {
      localStorage.setItem('__t', '1');
      localStorage.removeItem('__t');
      return true;
    } catch (e) {
      return false;
    }
  }

  function leer(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function escribir(key, valor) {
    try {
      localStorage.setItem(key, JSON.stringify(valor));
      return true;
    } catch (e) {
      return false;
    }
  }

  function id() {
    return 'dx-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function registros() {
    var r = leer(KEY_REGISTROS, []);
    return Array.isArray(r) ? r : [];
  }

  function guardarRegistro(reg) {
    var lista = registros();
    var i = lista.findIndex(function (x) { return x.id === reg.id; });
    if (i >= 0) lista[i] = reg; else lista.unshift(reg);
    escribir(KEY_REGISTROS, lista);
    return reg;
  }

  function borrarRegistro(idReg) {
    escribir(KEY_REGISTROS, registros().filter(function (x) { return x.id !== idReg; }));
  }

  function marcarPago(idReg, pago) {
    var lista = registros();
    var reg = lista.find(function (x) { return x.id === idReg; });
    if (!reg) return null;
    reg.pagoGenerado = !!pago;
    reg.fechaPago = pago ? new Date().toISOString().slice(0, 10) : '';
    escribir(KEY_REGISTROS, lista);
    return reg;
  }

  /** Indicadores comerciales agregados. */
  function indicadores(lista) {
    var regs = lista || registros();
    var cuenta = function (f) { return regs.filter(f).length; };
    var total = regs.length;
    var conCapacidad = cuenta(function (r) { return r.puedeIniciar; });
    return {
      total: total,
      conCapacidad: conCapacidad,
      reserva: cuenta(function (r) { return r.decision === 'reserva'; }),
      cierreUsd: cuenta(function (r) { return r.decision === 'cierre_usd'; }),
      seguimiento: cuenta(function (r) { return r.decision === 'seguimiento'; }),
      sinDecision: cuenta(function (r) { return !r.decision || r.decision === 'sin_decision'; }),
      pagos: cuenta(function (r) { return r.pagoGenerado; }),
      conversion: total ? cuenta(function (r) { return r.decision === 'reserva' || r.decision === 'cierre_usd'; }) / total : 0,
      pagoSobreDiagnostico: total ? cuenta(function (r) { return r.pagoGenerado; }) / total : 0,
      proximasGestiones: regs
        .filter(function (r) { return r.proximaGestion; })
        .sort(function (a, b) { return a.proximaGestion < b.proximaGestion ? -1 : 1; })
    };
  }

  return {
    disponible: disponible,
    id: id,
    registros: registros,
    guardarRegistro: guardarRegistro,
    borrarRegistro: borrarRegistro,
    marcarPago: marcarPago,
    indicadores: indicadores,
    leerBorrador: function () { return leer(KEY_BORRADOR, null); },
    guardarBorrador: function (d) { return escribir(KEY_BORRADOR, d); },
    limpiarBorrador: function () { try { localStorage.removeItem(KEY_BORRADOR); } catch (e) {} },
    leerPrefs: function () { return leer(KEY_PREFS, {}); },
    guardarPrefs: function (p) { return escribir(KEY_PREFS, p); },
    importar: function (lista) {
      if (!Array.isArray(lista)) return false;
      var actuales = registros();
      var ids = {};
      actuales.forEach(function (r) { ids[r.id] = true; });
      lista.forEach(function (r) { if (r && r.id && !ids[r.id]) actuales.push(r); });
      return escribir(KEY_REGISTROS, actuales);
    }
  };
});
