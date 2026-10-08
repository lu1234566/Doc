import test from 'node:test';
import assert from 'node:assert/strict';
import { replayReport, replayCsv, replayText } from '../scripts/replay-report.mjs';

const block = () => ({ id: 'P1-B001', page: 1, text: 'Texto sintético; "teste"', score: 0.9,
  bounds: { left: 10, right: 110, top: 20, bottom: 40, cx: 60, cy: 30, w: 100, h: 20 } });

test('report bounds are read without mutating original OCR or reusing saved articles', () => {
  const input = { ocr_blocks: [block()], articles: [{ description: 'não reutilizar' }] };
  const before = structuredClone(input);
  const result = replayReport(input);
  assert.deepEqual(input, before);
  assert.deepEqual(result.ocr_blocks, input.ocr_blocks);
  assert.deepEqual(result.articles, []);
  assert.equal(result.parser.page_meta[0].layout_mode, 'unknown');
  assert.equal(result.rejected[0].source, input.ocr_blocks[0].id);
  assert.match(replayText(result), /Texto sintético/);
  assert.match(replayCsv(result), /"field_sources"/);
});

test('missing geometry, duplicate IDs and empty reports fail explicitly', () => {
  assert.throws(() => replayReport({ ocr_blocks: [] }), /não vazio/);
  assert.throws(() => replayReport({ ocr_blocks: [block(), block()] }), /duplicado/);
  const b = block(); delete b.bounds;
  assert.throws(() => replayReport({ ocr_blocks: [b] }), /geometria/);
});

test('polygon-only reports preserve source geometry and can be replayed', () => {
  const b = block(); delete b.bounds;
  b.poly = [[10, 20], [110, 20], [110, 40], [10, 40]];
  const result = replayReport({ ocr_blocks: [b] });
  assert.deepEqual(result.ocr_blocks[0].poly, b.poly);
  assert.equal(result.reconstructed_rows[0].cells[0].cx, 60);
});

test('CSV preserves quoting and provenance without calculating values', () => {
  const csv = replayCsv({ articles: [{ description: 'A; "B"', quantity: '0',
    source_ids: ['P1-B001'], field_sources: { qty: 'P1-B001' } }] });
  assert.ok(csv.startsWith('\ufeff'));
  assert.ok(csv.includes('"A; ""B"""'));
  assert.ok(csv.includes('"0"'));
  assert.ok(csv.includes('P1-B001'));
});
