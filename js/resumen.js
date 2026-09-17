/* Formatos y armado del resumen de la asesoría (texto plano para WhatsApp, correo y descarga). */
(function (root, factory) {
  var api = factory(root.SolvenciaCalc, root.SolvenciaConfig, root.SolvenciaRuta);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SolvenciaResumen = api;
})(typeof self !== 'undefined' ? self : globalThis, function (Calc, Config, Ruta) {
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

  /** Reemplaza montos crudos por moneda formateada dentro de un texto. */
  function conMoneda(txt) {
    return String(txt).replace(/(\d{4,})/g, function (m) { return money(parseInt(m, 10)); });
  }

  /** Resumen en texto plano. `datos` = formulario, `r` = resultado de diagnosticar(). */
  function texto(datos, r, opciones) {
    var o = opciones || {};
    var i = Calc.interpretar(r);
    var v = Ruta.veredicto(r);
    var L = [];
    L.push('TU RUTA DE ESTUDIO EN EL EXTERIOR');
    L.push('');
    L.push((datos.estudiante || 'Estudiante') + ' · ' + (datos.destinoFinal || 'destino por definir'));
    L.push('Asesor: ' + (datos.asesor || '—') + ' · ' + fecha(datos.hoy));
    L.push('');
    L.push('PARA INICIAR HOY: ' + (v.meta > 0 ? money(v.meta) : 'falta el valor del programa'));
    L.push('(reserva del ' + r.porcentajeReserva + ' % sobre ' + money(r.valorPrograma) + ')');
    L.push('Disponible hoy: ' + money(v.tiene) + (v.falta > 0 ? ' · faltan ' + money(v.falta) : ' · alcanza'));
    L.push('> ' + Ruta.TITULOS[v.nivel]);
    if (v.falta > 0 && v.plazo) {
      L.push('> Ahorrando ' + money(r.capacidadMensual) + ' al mes, lo completas en unas ' + v.plazo.cantidad + ' ' + v.plazo.unidad + ' (cerca del ' + fecha(v.fechaPosible) + ').');
    }
    L.push('');
    L.push('TU RUTA, PASO A PASO');
    Ruta.pasos(datos, r).forEach(function (p) {
      var cuando = p.fecha ? fecha(p.fecha) : p.cuando;
      L.push(p.n + '. ' + p.titulo + (p.monto > 0 ? ' — ' + money(p.monto) : '') + '  [' + cuando + ']');
      L.push('   ' + conMoneda(p.detalle));
    });
    L.push('');
    L.push('LOS NÚMEROS DETRÁS');
    L.push('- Valor del programa: ' + money(r.valorPrograma) + (datos.duracion ? ' (' + datos.duracion + ' ' + datos.duracionUnidad + ')' : ''));
    L.push('- Fondos de referencia: ' + money(r.fondosReferencia) + (datos.fuenteFondos ? ' (' + datos.fuenteFondos + ')' : ''));
    L.push('- Recursos actuales: ' + money(r.recursosActuales) + ' · ' + pct(r.cobertura) + ' de la referencia');
    L.push('   ahorros ' + money(r.recursos.ahorros)
      + ' · apoyo familiar ' + (datos.apoyoFamiliar ? money(r.recursos.patrocinador) : 'no')
      + ' · otros ' + money(r.recursos.otros));
    L.push('- Diferencia por preparar: ' + money(r.diferencia));
    L.push('- Meses hasta el viaje: ' + r.meses + ' (viaje estimado ' + fecha(datos.fechaViaje) + ')');
    L.push('- Ahorro mensual de referencia: ' + money(r.ahorroMensualReferencia));
    L.push('- Capacidad declarada: ' + money(r.capacidadMensual) + ' al mes');
    L.push('- Proyección a la fecha de viaje: ' + money(r.proyeccionAlViaje));
    if (r.brechaProyectada > 0) L.push('- Faltante proyectado: ' + money(r.brechaProyectada));
    L.push('');
    L.push('INTERPRETACIÓN');
    L.push('- ' + i.etiqueta + ': ' + i.texto);
    i.acciones.forEach(function (a) { L.push('- ' + conMoneda(a)); });
    L.push('');
    L.push('OPCIONES PARA AVANZAR');
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
    var v = Ruta.veredicto(r);
    var L = [];
    L.push('Tu ruta' + (datos.estudiante ? ', ' + datos.estudiante.split(' ')[0] : '') + ' — ' + (datos.destinoFinal || 'tu destino'));
    L.push('');
    L.push('PARA INICIAR HOY: ' + money(v.meta) + ' (reserva del ' + r.porcentajeReserva + ' %)');
    L.push('Tienes disponible: ' + money(v.tiene) + (v.falta > 0 ? ' · faltan ' + money(v.falta) : ' · alcanza'));
    L.push(Ruta.TITULOS[v.nivel] + '.');
    if (v.falta > 0 && v.plazo) L.push('Ahorrando ' + money(r.capacidadMensual) + '/mes lo completas en unas ' + v.plazo.cantidad + ' ' + v.plazo.unidad + '.');
    L.push('');
    L.push('Después de reservar:');
    L.push('2) Saldo del programa: ' + money(Math.max(0, r.valorPrograma - r.reserva)));
    L.push('3) Acreditar fondos: ' + money(r.fondosReferencia) + (r.diferencia > 0 ? ' — te faltan ' + money(r.diferencia) + ', son ' + money(r.ahorroMensualReferencia) + '/mes por ' + r.meses + ' meses' : ' — ya los cubres'));
    L.push('4) Documentos, procesos y visado');
    L.push('5) Viaje: ' + fecha(datos.fechaViaje));
    if (o.incluirUsd) {
      L.push('');
      L.push('Alternativa de inicio con USD ' + r.montoCierreUsd + ': ' + money(r.cierreUsdCOP));
    }
    if (datos.proximaGestion) {
      L.push('');
      L.push('Próxima revisión: ' + fecha(datos.proximaGestion));
    }
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
