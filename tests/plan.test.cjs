const test = require('node:test');
const assert = require('node:assert');
const Calc = require('../js/calc.js');
globalThis.SolvenciaCalc = Calc;
const Plan = require('../js/plan.js');

const base = {
  hoy: '2026-01-01',
  fechaViaje: '2026-11-01',
  fondosReferencia: 30000000,
  valorPrograma: 20000000,
  ahorros: 8000000,
  capacidadMensual: 1000000,
  apoyoFamiliar: true,
  aportePatrocinador: 2000000,
  tasaUsd: 4000
};
const dx = (extra) => Calc.diagnosticar({ ...base, ...extra });

test('la composición separa lo que ya hay de lo que falta construir', () => {
  const c = Plan.composicion(dx());
  assert.deepStrictEqual(c.partes.map(p => p.id), ['ahorros', 'patrocinador', 'construir']);
  assert.strictEqual(c.cubierto, 10000000);
  assert.strictEqual(c.porConstruir, 20000000);
  assert.strictEqual(Math.round(c.pctCubierto * 100), 33);
  assert.strictEqual(Math.round(c.partes.reduce((a, p) => a + p.pct, 0)), 1);
});

test('la composición omite las fuentes en cero', () => {
  const c = Plan.composicion(dx({ apoyoFamiliar: false }));
  assert.deepStrictEqual(c.partes.map(p => p.id), ['ahorros', 'construir']);
});

test('sin diferencia no hay parte por construir', () => {
  const c = Plan.composicion(dx({ ahorros: 40000000 }));
  assert.ok(!c.partes.some(p => p.id === 'construir'));
  assert.strictEqual(c.pctCubierto, 1);
});

test('el monto mensual también se dice por semana y por día', () => {
  const eq = Plan.equivalencias(2000000);
  assert.strictEqual(Math.round(eq.semanal), 460299);
  assert.strictEqual(Math.round(eq.diario), 65708);
  assert.strictEqual(Plan.equivalencias(0).diario, 0);
});

test('el cronograma llega exactamente a la meta en el último hito', () => {
  const r = dx();
  const f = Plan.cronograma(r);
  assert.ok(f.length <= 7);
  const ultimo = f[f.length - 1];
  assert.strictEqual(ultimo.mes, r.meses);
  assert.strictEqual(ultimo.esMeta, true);
  assert.strictEqual(Math.round(ultimo.objetivo), r.fondosReferencia);
  assert.strictEqual(Math.round(ultimo.faltante), 0);
  assert.strictEqual(ultimo.fecha, '2026-11-01');
});

test('el cronograma se condensa cuando hay muchos meses', () => {
  const f = Plan.cronograma(dx({ fechaViaje: '2029-01-01' }));
  assert.ok(f.length <= 7, 'no debería listar 36 filas');
  assert.strictEqual(f[f.length - 1].esMeta, true);
});

test('sin diferencia o sin meses no hay cronograma', () => {
  assert.deepStrictEqual(Plan.cronograma(dx({ ahorros: 40000000 })), []);
  assert.deepStrictEqual(Plan.cronograma(dx({ mesesOverride: 0 })), []);
});

test('la palanca de fecha calcula cuándo alcanzaría al ritmo actual', () => {
  const r = dx();
  const p = Plan.palancas({}, r).find(x => x.id === 'fecha');
  assert.strictEqual(p.valor, 1000000);
  assert.strictEqual(p.fecha, '2027-09-01');
  assert.match(p.texto, /20 meses/);
});

test('la palanca de apoyo calcula el aporte exacto que haría viable el plan', () => {
  const p = Plan.palancas({}, dx()).find(x => x.id === 'apoyo');
  // faltan 20.000.000 y en 10 meses ahorra 10.000.000 -> necesita 10.000.000 de apoyo
  assert.strictEqual(p.valor, 10000000);
});

test('la palanca de ahorro extra dice el faltante mensual y semanal', () => {
  const p = Plan.palancas({}, dx()).find(x => x.id === 'extra');
  assert.strictEqual(p.valor, 1000000); // 2.000.000 de referencia - 1.000.000 declarado
  assert.match(p.texto, /a la semana/);
});

test('si el plan ya cabe en la capacidad declarada no se ofrecen palancas de ajuste', () => {
  const lista = Plan.palancas({}, dx({ capacidadMensual: 3000000 }));
  assert.ok(!lista.some(p => p.id === 'extra'));
  assert.ok(!lista.some(p => p.id === 'apoyo'));
});

test('sin diferencia no hay palancas', () => {
  assert.deepStrictEqual(Plan.palancas({}, dx({ ahorros: 40000000 })), []);
});

test('el encuadre nunca alarma y cambia con el avance', () => {
  assert.strictEqual(Plan.encuadre(dx({ fondosReferencia: 0 })).titulo, 'Definamos tu meta');
  assert.strictEqual(Plan.encuadre(dx({ ahorros: 40000000 })).tono, 'ok');
  assert.match(Plan.encuadre(dx({ ahorros: 18000000 })).titulo, /más de la mitad/);
  assert.match(Plan.encuadre(dx({ ahorros: 6000000, apoyoFamiliar: false })).titulo, /Tienes con qué empezar/);
  assert.match(Plan.encuadre(dx({ ahorros: 1000000, apoyoFamiliar: false })).titulo, /Empecemos por el plan/);
});

test('ningún texto de palanca deja una fecha cruda que el formateador pueda romper', () => {
  for (const p of Plan.palancas({}, dx())) {
    assert.doesNotMatch(p.texto, /\d{4}-\d{2}-\d{2}/, p.id + ' trae una fecha ISO dentro del texto');
  }
});
