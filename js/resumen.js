/* Formatos y armado del resumen de la asesoría (texto plano para WhatsApp, correo y descarga). */
(function (root, factory) {
  var api = factory(root.SolvenciaCalc, root.SolvenciaConfig, root.SolvenciaRuta, root.SolvenciaPlan);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SolvenciaResumen = api;
})(typeof self !== 'undefined' ? self : globalThis, function (Calc, Config, Ruta, Plan) {
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

  /** Texto de una palanca, con montos y fecha ya formateados. */
  function textoPalanca(p) {
    return conMoneda(p.texto).replace('{fecha}', p.fecha ? fecha(p.fecha) : '');
  }

  /** Resumen en texto plano: el plan, no el diagnóstico. */
  function texto(datos, r, opciones) {
    var o = opciones || {};
    var e = Plan.encuadre(r);
    var c = Plan.composicion(r);
    var eq = Plan.equivalencias(r.ahorroMensualReferencia);
    var v = Ruta.veredicto(r);
    var L = [];

    L.push('TU PLAN DE SOLVENCIA');
    L.push('');
    L.push((datos.estudiante || 'Estudiante') + ' · ' + (datos.destinoFinal || 'destino por definir'));
    L.push('Asesor: ' + (datos.asesor || '—') + ' · ' + fecha(datos.hoy));
    L.push('');
    L.push('LO QUE DEBES DEMOSTRAR: ' + money(r.fondosReferencia));
    if (r.fondosReferencia > 0) L.push(Config.noSePaga);
    L.push('');
    L.push(e.titulo.toUpperCase());
    L.push(e.texto);

    if (c.partes.length) {
      L.push('');
      L.push('DE DÓNDE SALE');
      c.partes.forEach(function (p) {
        L.push('- ' + p.etiqueta + ': ' + money(p.monto) + ' (' + Math.round(p.pct * 100) + ' %)');
      });
    }

    if (r.diferencia > 0 && r.meses > 0) {
      L.push('');
      L.push('TU PLAN, MES A MES');
      L.push('- ' + money(eq.mensual) + ' al mes · ' + money(eq.semanal) + ' a la semana · ' + money(eq.diario) + ' al día');
      L.push('- Durante ' + r.meses + ' meses, hasta ' + fecha(datos.fechaViaje));
      Plan.cronograma(r).forEach(function (f) {
        L.push('   ' + fecha(f.fecha) + ' → ' + money(f.objetivo) + (f.faltante > 0 ? ' (faltarían ' + money(f.faltante) + ')' : ' — meta cumplida'));
      });
    }

    var palancas = Plan.palancas(datos, r);
    if (palancas.length) {
      L.push('');
      L.push('SI EL AHORRO MENSUAL TE APRIETA');
      palancas.forEach(function (p) { L.push('- ' + p.titulo + ': ' + textoPalanca(p)); });
    }

    L.push('');
    L.push('CON QUÉ SE RESPALDA CADA FUENTE');
    Config.fuentesSolvencia.forEach(function (f) { L.push('- ' + f.fuente + ': ' + f.soporte); });
    L.push('(El departamento de procesos confirma los soportes exactos de tu destino.)');

    L.push('');
    L.push('TU RUTA, PASO A PASO');
    Ruta.pasos(datos, r).forEach(function (p) {
      var cuando = p.fecha ? fecha(p.fecha) : p.cuando;
      L.push(p.n + '. ' + p.titulo + (p.monto > 0 ? ' — ' + money(p.monto) : '') + '  [' + cuando + ']');
      L.push('   ' + conMoneda(p.detalle));
    });

    L.push('');
    L.push('PARA RESERVAR TU CUPO: ' + (v.meta > 0 ? money(v.meta) : 'falta el valor del programa'));
    L.push('(reserva del ' + r.porcentajeReserva + ' % sobre ' + money(r.valorPrograma) + ')');
    L.push('Disponible hoy: ' + money(v.tiene) + (v.falta > 0 ? ' · faltan ' + money(v.falta) : ' · alcanza'));
    if (v.falta > 0 && v.plazo) {
      L.push('Ahorrando ' + money(r.capacidadMensual) + ' al mes lo completas en unas ' + v.plazo.cantidad + ' ' + v.plazo.unidad + ' (cerca del ' + fecha(v.fechaPosible) + ').');
    }
    if (o.incluirUsd) {
      L.push('Alternativa de inicio con USD ' + r.montoCierreUsd + ': ' + money(r.cierreUsdCOP) + ' (saldo hasta completar la reserva: ' + money(r.saldoDespuesCierreUsd) + ')');
    }
    if (datos.proximaGestion) L.push('Próxima revisión: ' + fecha(datos.proximaGestion));
    if (datos.documentos && datos.documentos.length) L.push('Documentos a organizar: ' + datos.documentos.join(', '));
    if (datos.proximoContacto) L.push('Próximo contacto: ' + datos.proximoContacto);

    L.push('');
    L.push('LOS NÚMEROS DETRÁS');
    L.push('- Valor del programa: ' + money(r.valorPrograma) + (datos.duracion ? ' (' + datos.duracion + ' ' + datos.duracionUnidad + ')' : ''));
    L.push('- Fondos de referencia: ' + money(r.fondosReferencia) + (datos.fuenteFondos ? ' (' + datos.fuenteFondos + ')' : ''));
    L.push('- Recursos actuales: ' + money(r.recursosActuales) + ' · ' + pct(r.cobertura) + ' de la referencia');
    L.push('- Diferencia por construir: ' + money(r.diferencia));
    L.push('- Capacidad de ahorro declarada: ' + money(r.capacidadMensual) + ' al mes');
    L.push('- Proyección a la fecha de viaje: ' + money(r.proyeccionAlViaje));
    L.push('');
    L.push('Decisión registrada: ' + etiquetaDecision(datos.decision));
    L.push('');
    L.push(Config.aviso);
    return L.join('\n');
  }

  /** Versión corta, pensada para WhatsApp. */
  function textoCorto(datos, r, opciones) {
    var o = opciones || {};
    var e = Plan.encuadre(r);
    var eq = Plan.equivalencias(r.ahorroMensualReferencia);
    var v = Ruta.veredicto(r);
    var L = [];

    L.push('Tu plan' + (datos.estudiante ? ', ' + datos.estudiante.split(' ')[0] : '') + ' — ' + (datos.destinoFinal || 'tu destino'));
    L.push('');
    L.push('Lo que debes demostrar: ' + money(r.fondosReferencia));
    if (r.fondosReferencia > 0) L.push('Ojo: este dinero no se paga, se demuestra.');
    L.push('');
    L.push(e.titulo + '. Ya tienes ' + money(r.recursosActuales) + ' (' + pct(r.cobertura) + ').');
    if (r.diferencia > 0 && r.meses > 0) {
      L.push('Falta construir ' + money(r.diferencia) + ':');
      L.push('· ' + money(eq.mensual) + ' al mes');
      L.push('· ' + money(eq.semanal) + ' a la semana');
      L.push('· ' + money(eq.diario) + ' al día, durante ' + r.meses + ' meses');
    }
    var palancas = Plan.palancas(datos, r);
    if (palancas.length) {
      L.push('');
      L.push('Si te aprieta: ' + textoPalanca(palancas[0]));
    }
    L.push('');
    L.push('Para reservar tu cupo: ' + money(v.meta) + ' (' + r.porcentajeReserva + ' %)');
    if (o.incluirUsd) L.push('Alternativa de inicio con USD ' + r.montoCierreUsd + ': ' + money(r.cierreUsdCOP));
    if (datos.proximaGestion) L.push('Próxima revisión: ' + fecha(datos.proximaGestion));
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

  return { money: money, miles: miles, pct: pct, fecha: fecha, conMoneda: conMoneda, textoPalanca: textoPalanca, texto: texto, textoCorto: textoCorto, csv: csv, etiquetaDecision: etiquetaDecision };
});
