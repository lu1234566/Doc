import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseAll, reconstruct, boxOf } from '../src/parser0681.js';

// Developer-only replay: no OCR, network, Sage data, or expected invoice answers.
export function replayReport(report) {
  if (!Array.isArray(report?.ocr_blocks) || !report.ocr_blocks.length) {
    throw new Error('O relatório deve conter ocr_blocks não vazio.');
  }
  const ids = new Set();
  const blocks = report.ocr_blocks.map((b, i) => {
    if (typeof b.id !== 'string' || !b.id || ids.has(b.id)) {
      throw new Error(`Bloco ${i}: ID ausente ou duplicado.`);
    }
    ids.add(b.id);
    if (!Number.isInteger(b.page) || b.page < 1 || typeof b.text !== 'string') {
      throw new Error(`Bloco ${b.id}: página ou texto inválido.`);
    }
    const polygonValid = Array.isArray(b.poly) && b.poly.length >= 4 &&
      b.poly.every(p => Array.isArray(p) && p.length >= 2 && p.slice(0, 2).every(Number.isFinite));
    const box = b.bounds ?? b.box ?? (polygonValid ? boxOf(b) : null);
    const keys = ['left', 'right', 'top', 'bottom', 'cx', 'cy', 'w', 'h'];
    if (!box || keys.some(k => !Number.isFinite(box[k])) ||
        box.right <= box.left || box.bottom <= box.top || box.w <= 0 || box.h <= 0) {
      throw new Error(`Bloco ${b.id}: geometria ausente ou inválida; não será inventada.`);
    }
    return { ...b, box };
  });
  const parsed = parseAll(blocks);
  return {
    kind: 'parser_replay',
    generated_at: new Date().toISOString(),
    source_app: report.app ?? null,
    source_generated_at: report.generated_at ?? null,
    parser: { name: 'multilayout_v4_block_geometry', module: 'src/parser0681.js', page_meta: parsed.page_meta },
    ocr_blocks: report.ocr_blocks,
    reconstructed_rows: reconstruct(blocks),
    articles: parsed.items,
    rejected: parsed.rejected,
    notes: ['Reprocessamento do OCR guardado; não executa OCR nem valida a imagem.',
      'Sem comparação com respostas esperadas. Avaliação da imagem e do resultado no ChatGPT.'],
  };
}

export function replayText(result) {
  return ['FATURA → SAGE 50 — REPROCESSAMENTO DO PARSER',
    ...result.notes, '', '== LAYOUTS ==',
    ...result.parser.page_meta.map(p => `P${p.page}: ${p.layout_mode}`),
    '', '== OCR GUARDADO ==', ...result.ocr_blocks.map(b => `${b.id}\t${b.text}`),
    '', '== ARTIGOS ==', ...result.articles.map(a => JSON.stringify(a)),
    '', '== REJEITADOS ==', ...result.rejected.map(r => JSON.stringify(r)), ''].join('\n');
}

export function replayCsv(result) {
  const keys = ['source', 'layout_mode', 'reference', 'description', 'vat', 'quantity',
    'unit_price', 'total', 'confidence', 'math_check', 'source_ids', 'field_sources'];
  const quote = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
  const rows = [keys, ...result.articles.map(a => keys.map(k =>
    typeof a[k] === 'object' && a[k] !== null ? JSON.stringify(a[k]) : a[k]))];
  return '\ufeff' + rows.map(row => row.map(quote).join(';')).join('\r\n');
}

async function main() {
  const [input, output, ...extra] = process.argv.slice(2);
  if (!input || !output || extra.length) throw new Error('Uso: npm run replay -- <relatorio.json> <nova-pasta-saida>');
  const result = replayReport(JSON.parse(await readFile(resolve(input), 'utf8')));
  // Refuse existing destinations so original evidence cannot be overwritten.
  const dir = resolve(output);
  await mkdir(dir, { recursive: false });
  await writeFile(join(dir, 'replay.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  await writeFile(join(dir, 'replay.txt'), replayText(result), { flag: 'wx' });
  await writeFile(join(dir, 'replay.csv'), replayCsv(result), { flag: 'wx' });
  console.log(`${result.articles.length} artigos; ${result.rejected.length} blocos rejeitados. Saída: ${dir}`);
  console.log('Reprocessamento concluído; validação das faturas reais continua pendente.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
