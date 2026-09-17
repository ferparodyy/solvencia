/* Formatos y armado del resumen de la asesoría (texto plano para WhatsApp, correo y descarga). */
(function (root, factory) {
  var api = factory(root.SolvenciaCalc, root.SolvenciaConfig);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SolvenciaResumen = api;
})(typeof self !== 'undefined' ? self : globalThis, function (Calc, Config) {
  'use strict';

  var fmtCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  var fmtNum = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

  function money(n) { return fmtCOP.format(Math.round(n || 0)); }
  function miles(n) { return fmtNum.format(Math.round(n || 0)); }
  function pct(n) { return Math.round((n || 0) * 100) + ' %'; }

  function fecha(iso) {
    if (!iso) return '—';
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function etiquetaDecision(id) {
    var d = (Config.decisiones || []).find(function (x) { return x.id === id; });
    return d ? d.etiqueta : 'Sin decisión en esta asesoría';
  }

  /** Resumen en texto plano. `datos` = formulario, `r` = resultado de diagnosticar(). */
  function texto(datos, r, opciones) {
    var o = opciones || {};
    var i = Calc.interpretar(r);
    var L = [];
    L.push('DIAGNÓSTICO DE SOLVENCIA — RESUMEN DE ASESORÍA');
    L.push('');
    L.push('Estudiante: ' + (datos.estudiante || '—'));
    L.push('Asesor: ' + (datos.asesor || '—'));
    L.push('Fecha de la asesoría: ' + fecha(datos.hoy));
    L.push('');
    L.push('PROYECTO');
    L.push('- Destino: ' + (datos.destinoFinal || '—'));
    L.push('- Programa: ' + [datos.tipoPrograma, datos.programa].filter(Boolean).join(' · ') + (datos.duracion ? ' (' + datos.duracion + ' ' + datos.duracionUnidad + ')' : ''));
    L.push('- Fecha estimada de viaje: ' + fecha(datos.fechaViaje));
    L.push('- Meses hasta el viaje: ' + r.meses);
    L.push('- Valor estimado del programa: ' + money(r.valorPrograma));
    L.push('- Fondos de referencia: ' + money(r.fondosReferencia) + (datos.fuenteFondos ? ' (' + datos.fuenteFondos + ')' : ''));
    L.push('');
    L.push('SITUACIÓN ACTUAL');
    L.push('- Ahorros disponibles: ' + money(r.recursos.ahorros));
    L.push('- Apoyo familiar: ' + (datos.apoyoFamiliar ? money(r.recursos.patrocinador) + (datos.patrocinadorRelacion ? ' (' + datos.patrocinadorRelacion + ')' : '') : 'No'));
    L.push('- Otros recursos: ' + money(r.recursos.otros) + (datos.otrosDetalle ? ' (' + datos.otrosDetalle + ')' : ''));
    L.push('- Recursos actuales: ' + money(r.recursosActuales) + ' · ' + pct(r.cobertura) + ' de la referencia');
    L.push('- Diferencia por preparar: ' + money(r.diferencia));
    L.push('');
    L.push('PLAN DE PREPARACIÓN');
    L.push('- Ahorro mensual de referencia: ' + money(r.ahorroMensualReferencia) + ' durante ' + r.meses + ' meses');
    L.push('- Capacidad de ahorro declarada: ' + money(r.capacidadMensual) + ' al mes');
    L.push('- Proyección a la fecha de viaje: ' + money(r.proyeccionAlViaje));
    if (r.brechaProyectada > 0) L.push('- Faltante proyectado: ' + money(r.brechaProyectada));
    if (r.mesesNecesarios != null) L.push('- Al ritmo declarado la diferencia se cubre en ' + r.mesesNecesarios + ' meses (aprox. ' + fecha(r.fechaSugerida) + ')');
    L.push('');
    L.push('INTERPRETACIÓN');
    L.push('- ' + i.etiqueta + ': ' + i.texto);
    i.acciones.forEach(function (a) { L.push('- ' + a.replace(/(\d{4,})/g, function (m) { return miles(m); })); });
    L.push('');
    L.push('CÓMO AVANZAR');
    L.push('- Opción A · reserva del ' + r.porcentajeReserva + '%: ' + money(r.reserva));
    if (o.incluirUsd) {
      L.push('- Opción B · inicio con USD ' + r.montoCierreUsd + ': ' + money(r.cierreUsdCOP) + ' (saldo hasta completar la reserva: ' + money(r.saldoDespuesCierreUsd) + ')');
    }
    L.push('- Opción C · plan de preparación' + (datos.proximaGestion ? ', próxima revisión ' + fecha(datos.proximaGestion) : ''));
    if (datos.metaAhorro) L.push('  Meta de ahorro a esa fecha: ' + money(Calc.num(datos.metaAhorro)));
    if (datos.documentos && datos.documentos.length) L.push('  Documentos a organizar: ' + datos.documentos.join(', '));
    if (datos.proximoContacto) L.push('  Próximo contacto: ' + datos.proximoContacto);
    L.push('');
    L.push('Decisión registrada: ' + etiquetaDecision(datos.decision));
    L.push('');
    L.push(Config.aviso);
    return L.join('\n');
  }

  /** Versión corta, pensada para WhatsApp. */
  function textoCorto(datos, r, opciones) {
    var o = opciones || {};
    var L = [];
    L.push('Resumen de tu asesoría' + (datos.estudiante ? ', ' + datos.estudiante.split(' ')[0] : ''));
    L.push('');
    L.push('Destino: ' + (datos.destinoFinal || '—'));
    L.push('Viaje estimado: ' + fecha(datos.fechaViaje) + ' (' + r.meses + ' meses)');
    L.push('Fondos de referencia: ' + money(r.fondosReferencia));
    L.push('Recursos actuales: ' + money(r.recursosActuales));
    L.push('Diferencia por preparar: ' + money(r.diferencia));
    L.push('Ahorro mensual de referencia: ' + money(r.ahorroMensualReferencia));
    L.push('');
    L.push('Para avanzar:');
    L.push('A) Reserva del ' + r.porcentajeReserva + '%: ' + money(r.reserva));
    if (o.incluirUsd) L.push('B) Inicio con USD ' + r.montoCierreUsd + ': ' + money(r.cierreUsdCOP));
    if (datos.proximaGestion) L.push('C) Próxima revisión: ' + fecha(datos.proximaGestion));
    L.push('');
    L.push(Config.aviso);
    return L.join('\n');
  }

  function csv(registros) {
    var cols = ['id', 'fecha', 'asesor', 'estudiante', 'destino', 'programa', 'fechaViaje', 'meses',
      'valorPrograma', 'fondosReferencia', 'recursosActuales', 'diferencia', 'ahorroMensualReferencia',
      'capacidadMensual', 'pagoInicial', 'reserva', 'puedeIniciar', 'decision', 'proximaGestion',
      'pagoGenerado', 'fechaPago'];
    var esc = function (v) {
      var s = v == null ? '' : String(v);
      return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    var filas = registros.map(function (r) { return cols.map(function (c) { return esc(r[c]); }).join(';'); });
    return [cols.join(';')].concat(filas).join('\n');
  }

  return { money: money, miles: miles, pct: pct, fecha: fecha, texto: texto, textoCorto: textoCorto, csv: csv, etiquetaDecision: etiquetaDecision };
});
