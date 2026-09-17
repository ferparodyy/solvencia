const test = require('node:test');
const assert = require('node:assert');
const Calc = require('../js/calc.js');
globalThis.SolvenciaCalc = Calc;
const Ruta = require('../js/ruta.js');

const base = {
  hoy: '2026-01-01',
  fechaViaje: '2026-11-01',
  fondosReferencia: 30000000,
  valorPrograma: 20000000,
  ahorros: 8000000,
  capacidadMensual: 1000000,
  pagoInicial: 0,
  tasaUsd: 4000
};
const dx = (extra) => Calc.diagnosticar({ ...base, ...extra });

test('veredicto: alcanza para la reserva hoy', () => {
  const v = Ruta.veredicto(dx({ pagoInicial: 5000000 }));
  assert.strictEqual(v.nivel, 'puede');
  assert.strictEqual(v.meta, 5000000);
  assert.strictEqual(v.falta, 0);
  assert.strictEqual(v.cubierto, 1);
});

test('veredicto: cerca cuando cubre 60 % o más de la reserva', () => {
  assert.strictEqual(Ruta.veredicto(dx({ pagoInicial: 3000000 })).nivel, 'cerca');
  assert.strictEqual(Ruta.veredicto(dx({ pagoInicial: 2999999 })).nivel, 'no_hoy');
});

test('veredicto: sin valor de programa no inventa una meta', () => {
  const v = Ruta.veredicto(dx({ valorPrograma: 0, pagoInicial: 1000000 }));
  assert.strictEqual(v.nivel, 'sin_valor');
  assert.strictEqual(v.meta, 0);
  assert.strictEqual(v.cubierto, 0);
});

test('plazo para completar la reserva en semanas cuando falta menos de un mes de ahorro', () => {
  const v = Ruta.veredicto(dx({ pagoInicial: 4500000 }));
  assert.strictEqual(v.falta, 500000);
  assert.strictEqual(v.plazo.unidad, 'semanas');
  assert.strictEqual(v.plazo.cantidad, 3);
  assert.strictEqual(v.fechaPosible, '2026-02-01');
});

test('plazo en meses y fecha proyectada cuando falta más', () => {
  const v = Ruta.veredicto(dx({ pagoInicial: 1000000 }));
  assert.strictEqual(v.falta, 4000000);
  assert.deepStrictEqual(v.plazo, { unidad: 'meses', cantidad: 4, meses: 4 });
  assert.strictEqual(v.fechaPosible, '2026-05-01');
});

test('sin capacidad de ahorro no se promete un plazo', () => {
  assert.strictEqual(Ruta.veredicto(dx({ capacidadMensual: 0, pagoInicial: 1000000 })).plazo, null);
});

test('la ruta tiene los seis pasos en orden y con montos', () => {
  const r = dx({ pagoInicial: 5000000 });
  const pasos = Ruta.pasos({ fechaViaje: base.fechaViaje, destinoFinal: 'Irlanda' }, r);
  assert.strictEqual(pasos.length, 6);
  assert.deepStrictEqual(pasos.map(p => p.n), [1, 2, 3, 4, 5, 6]);
  assert.strictEqual(pasos[0].monto, 5000000);
  assert.strictEqual(pasos[0].estado, 'listo');
  assert.strictEqual(pasos[1].monto, 15000000);
  assert.strictEqual(pasos[2].monto, 30000000);
  assert.strictEqual(pasos[5].fecha, '2026-11-01');
});

test('el paso de la reserva queda pendiente si el pago inicial no alcanza', () => {
  const pasos = Ruta.pasos({}, dx({ pagoInicial: 100000 }));
  assert.strictEqual(pasos[0].estado, 'pendiente');
});

test('el paso de fondos se marca listo cuando ya están cubiertos', () => {
  const pasos = Ruta.pasos({}, dx({ ahorros: 40000000 }));
  assert.strictEqual(pasos[2].estado, 'listo');
  assert.match(pasos[2].detalle, /ya cubres/);
});

test('alcanceHoy dice exactamente qué se puede pagar con lo disponible', () => {
  const a = Ruta.alcanceHoy(dx({ pagoInicial: 1000000 }));
  assert.strictEqual(a[0].alcanza, false);
  assert.strictEqual(a[0].monto, 5000000);
  assert.strictEqual(a[1].alcanza, true);
  assert.strictEqual(a[1].monto, 800000);
});

test('un mes justo de ahorro se dice en meses, no en semanas', () => {
  const v = Ruta.veredicto(dx({ pagoInicial: 3500000, capacidadMensual: 1500000 }));
  assert.strictEqual(v.falta, 1500000);
  assert.deepStrictEqual(v.plazo, { unidad: 'meses', cantidad: 1, meses: 1 });
});
