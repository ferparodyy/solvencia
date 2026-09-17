/*
 * Traduce el diagnóstico en una respuesta concreta: ¿se puede iniciar hoy?
 * y ¿cuál es la ruta, paso por paso, hasta el viaje?
 */
(function (root, factory) {
  var api = factory(root.SolvenciaCalc);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SolvenciaRuta = api;
})(typeof self !== 'undefined' ? self : globalThis, function (Calc) {
  'use strict';

  var SEMANAS_MES = 4.345;

  /** ¿El pago inicial declarado alcanza para la reserva, hoy? */
  function veredicto(r) {
    var meta = r.reserva;
    var tiene = r.pagoInicial;
    var falta = Math.max(0, meta - tiene);
    var cubierto = meta > 0 ? Math.min(1, tiene / meta) : 0;

    var nivel;
    if (meta <= 0) nivel = 'sin_valor';
    else if (falta <= 0) nivel = 'puede';
    else if (cubierto >= 0.6) nivel = 'cerca';
    else nivel = 'no_hoy';

    // ¿En cuánto tiempo juntaría lo que falta al ritmo de ahorro declarado?
    var plazo = null;
    if (falta > 0 && r.capacidadMensual > 0) {
      var meses = falta / r.capacidadMensual;
      plazo = meses < 0.9
        ? { unidad: 'semanas', cantidad: Math.max(1, Math.ceil(meses * SEMANAS_MES)), meses: 1 }
        : { unidad: 'meses', cantidad: Math.ceil(meses), meses: Math.ceil(meses) };
    }

    return {
      nivel: nivel,
      meta: meta,
      tiene: tiene,
      falta: falta,
      cubierto: cubierto,
      plazo: plazo,
      fechaPosible: plazo ? Calc.sumarMeses(r.hoy || new Date().toISOString().slice(0, 10), plazo.meses) : ''
    };
  }

  var TITULOS = {
    sin_valor: 'Falta el valor del programa',
    puede: 'Sí puedes iniciar hoy',
    cerca: 'Estás muy cerca de poder iniciar hoy',
    no_hoy: 'Hoy todavía no alcanza para la reserva'
  };

  /** Los pasos de la ruta, en orden, con monto y momento. */
  function pasos(datos, r) {
    var d = datos || {};
    var v = veredicto(r);
    var saldoPrograma = Math.max(0, r.valorPrograma - r.reserva);
    var lista = [];

    lista.push({
      n: 1,
      titulo: 'Reservar tu cupo',
      cuando: 'Hoy',
      monto: r.reserva,
      estado: v.nivel === 'puede' ? 'listo' : 'pendiente',
      detalle: r.porcentajeReserva + ' % del valor del programa. Confirma el cupo, inicia el proceso y permite congelar el valor del curso, según las condiciones comerciales.'
    });

    lista.push({
      n: 2,
      titulo: 'Completar el valor del programa',
      cuando: 'Antes del viaje, según las condiciones de pago',
      monto: saldoPrograma,
      estado: 'pendiente',
      detalle: 'Es el saldo del curso después de la reserva. Se define el plan de pagos en el contrato.'
    });

    lista.push({
      n: 3,
      titulo: 'Acreditar los fondos de referencia',
      cuando: r.meses > 0 ? 'En los próximos ' + r.meses + ' meses' : 'Antes de radicar',
      monto: r.fondosReferencia,
      estado: r.diferencia <= 0 ? 'listo' : 'pendiente',
      detalle: r.diferencia <= 0
        ? 'Con lo que tienes hoy ya cubres la cifra de referencia.'
        : 'Te faltan ' + Math.round(r.diferencia) + ' — son ' + Math.round(r.ahorroMensualReferencia) + ' al mes durante ' + r.meses + ' meses. Este dinero no se paga: se demuestra.'
    });

    lista.push({
      n: 4,
      titulo: 'Organizar tus documentos',
      cuando: 'Mientras ahorras',
      monto: 0,
      estado: (d.documentos && d.documentos.length) ? 'en_curso' : 'pendiente',
      detalle: (d.documentos && d.documentos.length)
        ? 'Empieza por: ' + d.documentos.join(', ') + '.'
        : 'Pasaporte, certificados de estudio, soportes de ingresos y del apoyo económico.'
    });

    lista.push({
      n: 5,
      titulo: 'Procesos y visado',
      cuando: 'Cuando los fondos y los documentos estén listos',
      monto: 0,
      estado: 'pendiente',
      detalle: 'El departamento de procesos revisa tu caso y arma la radicación.'
    });

    lista.push({
      n: 6,
      titulo: 'Viajar',
      cuando: d.fechaViaje ? 'Fecha estimada' : 'Fecha por definir',
      fecha: d.fechaViaje,
      monto: 0,
      estado: 'meta',
      detalle: [d.destinoFinal, d.programa].filter(Boolean).join(' · ') || 'Destino por confirmar'
    });

    return lista;
  }

  /** Qué alcanza a hacer HOY con el pago inicial declarado. */
  function alcanceHoy(r) {
    return [
      { id: 'reserva', etiqueta: 'Reservar el cupo (' + r.porcentajeReserva + ' %)', monto: r.reserva, alcanza: r.reserva > 0 && r.pagoInicial >= r.reserva },
      { id: 'cierre_usd', etiqueta: 'Inicio con USD ' + r.montoCierreUsd, monto: r.cierreUsdCOP, alcanza: r.cierreUsdCOP > 0 && r.pagoInicial >= r.cierreUsdCOP }
    ];
  }

  return { veredicto: veredicto, pasos: pasos, alcanceHoy: alcanceHoy, TITULOS: TITULOS };
});
