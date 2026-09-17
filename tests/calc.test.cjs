const test = require('node:test');
const assert = require('node:assert');
const Calc = require('../js/calc.js');

const base = {
  hoy: '2026-01-01',
  fechaViaje: '2026-11-01',
  fondosReferencia: 30000000,
  monedaFondos: 'COP',
  valorPrograma: 20000000,
  monedaPrograma: 'COP',
  ahorros: 8000000,
  capacidadMensual: 1000000,
  apoyoFamiliar: false,
  aportePatrocinador: 5000000,
  otrosRecursos: 0,
  pagoInicial: 0,
  tasaUsd: 4000,
  tasaEur: 4400
};

test('mesesEntre cuenta meses completos y nunca es negativo', () => {
  assert.strictEqual(Calc.mesesEntre('2026-01-01', '2026-11-01'), 10);
  assert.strictEqual(Calc.mesesEntre('2026-11-01', '2026-01-01'), 0);
  assert.strictEqual(Calc.mesesEntre('', '2026-11-01'), 0);
});

test('diferencia y ahorro mensual del ejemplo de la asesoría', () => {
  const r = Calc.diagnosticar(base);
  assert.strictEqual(r.fondosReferencia, 30000000);
  assert.strictEqual(r.recursosActuales, 8000000);
  assert.strictEqual(r.diferencia, 22000000);
  assert.strictEqual(r.meses, 10);
  assert.strictEqual(r.ahorroMensualReferencia, 2200000);
});

test('el apoyo familiar solo suma cuando está activado', () => {
  assert.strictEqual(Calc.diagnosticar(base).recursos.patrocinador, 0);
  const con = Calc.diagnosticar({ ...base, apoyoFamiliar: true });
  assert.strictEqual(con.recursos.patrocinador, 5000000);
  assert.strictEqual(con.recursosActuales, 13000000);
  assert.strictEqual(con.diferencia, 17000000);
});

test('la diferencia nunca es negativa y el estado marca cubierto', () => {
  const r = Calc.diagnosticar({ ...base, ahorros: 40000000 });
  assert.strictEqual(r.diferencia, 0);
  assert.strictEqual(r.estado, 'cubierto');
});

test('convierte fondos y programa con las tasas editables', () => {
  const r = Calc.diagnosticar({ ...base, fondosReferencia: 10000, monedaFondos: 'EUR', valorPrograma: 5000, monedaPrograma: 'USD' });
  assert.strictEqual(r.fondosReferencia, 44000000);
  assert.strictEqual(r.valorPrograma, 20000000);
});

test('sin tasa digitada la conversión da cero en vez de inventar un valor', () => {
  const r = Calc.diagnosticar({ ...base, tasaUsd: 0, valorPrograma: 5000, monedaPrograma: 'USD' });
  assert.strictEqual(r.valorPrograma, 0);
  assert.strictEqual(r.reserva, 0);
});

test('reserva usa el porcentaje editable y por defecto 25 %', () => {
  assert.strictEqual(Calc.diagnosticar(base).reserva, 5000000);
  assert.strictEqual(Calc.diagnosticar({ ...base, porcentajeReserva: 30 }).reserva, 6000000);
  assert.strictEqual(Calc.diagnosticar({ ...base, porcentajeReserva: '' }).porcentajeReserva, 25);
});

test('cierre en USD se convierte con la tasa y deja el saldo de la reserva', () => {
  const r = Calc.diagnosticar(base);
  assert.strictEqual(r.cierreUsdCOP, 800000);
  assert.strictEqual(r.saldoDespuesCierreUsd, 4200000);
});

test('la ruta comercial prioriza la reserva y deja USD como último recurso', () => {
  assert.strictEqual(Calc.rutaComercial(Calc.diagnosticar({ ...base, pagoInicial: 5000000 })), 'reserva');
  assert.strictEqual(Calc.rutaComercial(Calc.diagnosticar({ ...base, pagoInicial: 900000 })), 'cierre_usd');
  assert.strictEqual(Calc.rutaComercial(Calc.diagnosticar({ ...base, pagoInicial: 100000 })), 'seguimiento');
});

test('meses puede sobrescribirse manualmente', () => {
  const r = Calc.diagnosticar({ ...base, mesesOverride: 4 });
  assert.strictEqual(r.meses, 4);
  assert.strictEqual(r.mesesCalculados, 10);
  assert.strictEqual(r.ahorroMensualReferencia, 5500000);
});

test('sin meses de preparación el ahorro de referencia es la diferencia completa', () => {
  const r = Calc.diagnosticar({ ...base, mesesOverride: 0 });
  assert.strictEqual(r.ahorroMensualReferencia, 22000000);
});

test('proyección y estados según el ritmo de ahorro', () => {
  const enRuta = Calc.diagnosticar({ ...base, capacidadMensual: 2200000 });
  assert.strictEqual(enRuta.brechaProyectada, 0);
  assert.strictEqual(enRuta.estado, 'en_ruta');

  const menor = Calc.diagnosticar({ ...base, capacidadMensual: 1800000 });
  assert.strictEqual(menor.estado, 'ajuste_menor');

  const ajuste = Calc.diagnosticar({ ...base, capacidadMensual: 200000 });
  assert.strictEqual(ajuste.estado, 'requiere_ajuste');
  assert.strictEqual(ajuste.mesesNecesarios, 110);
});

test('sin fondos de referencia no hay diagnóstico', () => {
  const r = Calc.diagnosticar({ ...base, fondosReferencia: 0 });
  assert.strictEqual(r.estado, 'sin_referencia');
  assert.strictEqual(Calc.interpretar(r).acciones.length, 0);
});

test('entradas sucias o vacías no rompen el cálculo', () => {
  const r = Calc.diagnosticar({});
  assert.strictEqual(r.diferencia, 0);
  assert.strictEqual(r.meses, 0);
  assert.strictEqual(Calc.num('$ 1.200.000'.replace(/\./g, '')), 1200000);
  assert.strictEqual(Calc.num('abc'), 0);
  assert.strictEqual(Calc.diagnosticar({ ...base, ahorros: -500 }).recursos.ahorros, 0);
});

test('fechaSugerida avanza los meses necesarios al ritmo declarado', () => {
  const r = Calc.diagnosticar({ ...base, capacidadMensual: 11000000 });
  assert.strictEqual(r.mesesNecesarios, 2);
  assert.strictEqual(r.fechaSugerida, '2026-03-01');
});
