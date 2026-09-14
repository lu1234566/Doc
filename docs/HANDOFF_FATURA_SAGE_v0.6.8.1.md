# Fatura → Sage 50 — Handoff técnico da build estável v0.6.8.1

## 1. Estado desta versão

Esta documentação descreve a build considerada **estável e funcional** pelo utilizador em 14/09/2026.

- Aplicação: **Fatura → Sage 50**
- Versão funcional da app: **v0.6.8.1**
- Repositório: `lu1234566/Doc`
- Branch preservada: `stable/fatura-sage-v0.6.8.1`
- Commit-base funcional preservado: `4065f01e2cd810702b53bb3a826de351f411f915`
- Projeto Vercel associado: `doc`
- Framework: Vite
- OCR: `@paddleocr/paddleocr-js@0.4.2`
- Modelos OCR: `PP-OCRv5_mobile_det` + `PP-OCRv5_mobile_rec`
- Backend OCR validado: WASM/CPU
- Parser: `multilayout_v4_block_geometry`
- Pipeline de relatório: `local_paddleocr_direct_v0681_block_geometry`

> Regra principal: esta branch é um **checkpoint de recuperação**. Não deve ser usada como branch de experimentação. Novos parsers, layouts ou mudanças visuais devem ser feitos noutra branch.

## 2. Objetivo da aplicação

A app recebe uma ou mais fotografias de uma fatura, executa OCR **localmente no navegador**, tenta identificar artigos e campos numéricos e gera um relatório técnico para auditoria externa.

A aplicação **não deve comparar automaticamente** os resultados com uma resposta esperada e não deve inventar valores. A comparação é feita externamente, usando a imagem original e o relatório exportado.

O objetivo final do projeto é permitir que os dados aprovados possam ser usados num fluxo ligado ao Sage 50, mantendo rastreabilidade e evitando escrita direta e insegura na base de dados.

## 3. Princípios que não devem ser quebrados

1. **OCR local primeiro.** A imagem não deve sair do computador no modo local.
2. **Nunca inventar artigo, quantidade, preço, referência ou total.**
3. **Manter OCR bruto no relatório.** O utilizador deve conseguir ver exatamente o que o motor leu.
4. **Guardar proveniência.** Cada campo extraído deve apontar para o bloco OCR que o originou.
5. **Comparação fora da app.** Não embutir valores esperados, fixtures ocultos ou respostas de referência.
6. **Base Sage separada do teste OCR.** A base não deve ser usada para “corrigir” silenciosamente o OCR durante a fase de diagnóstico.
7. **Não alterar o visual sem necessidade.** O visual desta família `.6.x` foi aprovado pelo utilizador.
8. **Não alterar a configuração PaddleOCR validada sem um motivo técnico comprovado.**

## 4. Fluxo funcional

### Nova Fatura

1. O utilizador adiciona JPG, PNG ou WebP.
2. Inicializa o OCR local.
3. Clica em **Analisar fatura**.
4. O PaddleOCR identifica blocos de texto e respetiva geometria.
5. A app reconstrói linhas apenas para visualização/diagnóstico.
6. O parser multi-layout trabalha diretamente com os blocos OCR quando necessário.
7. A app apresenta:
   - OCR bruto;
   - OCR reconstruído;
   - artigos encontrados;
   - blocos rejeitados;
   - diagnóstico.
8. O utilizador pode exportar:
   - JSON de diagnóstico;
   - TXT de relatório;
   - CSV de auditoria.

### Histórico

As últimas análises ficam guardadas em `localStorage` do navegador. Isto serve apenas para reabrir/reexportar diagnósticos locais. O histórico não “treina” automaticamente o OCR.

### Base Sage

CSV/TXT pode ser carregado para consulta futura, mas nesta build de diagnóstico a base permanece separada da avaliação do OCR.

## 5. OCR validado

A configuração que funcionou de forma consistente é:

```js
PaddleOCR.create({
  initialize: false,
  worker: false,
  textDetectionModelName: 'PP-OCRv5_mobile_det',
  textRecognitionModelName: 'PP-OCRv5_mobile_rec',
  ortOptions: {
    backend: 'wasm',
    wasmPaths: 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/',
    numThreads: /* calculado pelo navegador */,
    simd: true
  }
})
```

Parâmetros usados durante `predict`:

```js
{
  textDetThresh: 0.3,
  textDetBoxThresh: 0.55,
  textDetUnclipRatio: 1.5,
  textRecScoreThresh: 0.10
}
```

Não trocar estes modelos ou limiares sem repetir os testes de regressão.

## 6. Arquitetura do parser v0.6.8.1

A versão v0.6.8.1 tem dois caminhos principais.

### 6.1 `horizontal`

Pensado para faturas tradicionais em que referência, descrição, IVA, quantidade, preço e total aparecem alinhados horizontalmente.

Caso de referência validado: fatura BIMBO.

O parser:

- identifica o cabeçalho;
- cria âncoras X para as colunas;
- procura blocos numéricos próximos da descrição/referência;
- associa cada valor à coluna mais próxima;
- valida `quantidade × preço ≈ total` quando os três valores estão disponíveis;
- rejeita trocas, descontos, resumos fiscais e outros elementos fora da tabela principal.

### 6.2 `two_line_tilted`

Criado para talões/faturas estreitas fotografadas com inclinação/perspetiva, em que uma linha lógica pode aparecer diagonalmente no espaço OCR.

O parser:

- identifica o cabeçalho diretamente pelos blocos OCR;
- aceita erros OCR previsíveis no cabeçalho, por exemplo:
  - `duant.` / `OUANT` → quantidade;
  - `TVA` / `TWA` → IVA;
  - variantes de `Pr. Unit.` → preço unitário;
- usa as coordenadas X do cabeçalho como âncoras;
- considera descrições e blocos numéricos próximos geometricamente;
- testa combinações possíveis de quantidade, preço e total;
- privilegia combinações em que `quantidade × preço ≈ total`;
- não corrige valores quando a conta falha — apenas reduz confiança ou rejeita a associação.

Caso de referência validado: talão estreito de frutas/legumes fotografado em perspetiva.

## 7. Detetor de cabeçalho tolerante

A função `aliasKind()` traduz variantes OCR em tipos semânticos:

- `COD`, `CODIGO`, `REF`, `REFERENCIA` → `ref`
- `PRODUT...`, `DESCR...`, `ARTIGO` → `desc`
- `IVA`, `TVA`, `TWA` → `vat`
- `QUANT...`, `QTD`, `UNID`, `DUANT`, `OUANT` → `qty`
- `PRECO`, `PVP`, `UNITARIO`, `PUNIT`, `PRUNIT` → `price`
- `TOTAL`, `IMPORT...`, `VALOR` → `total`

O cabeçalho é inferido por uma banda de blocos geometricamente próximos. Isto evita depender de o OCR reconstruir todo o cabeçalho numa única linha textual perfeita.

## 8. Relatório técnico

O JSON exportado é a principal ferramenta de diagnóstico.

Campos importantes:

- `app.version`
- `pipeline`
- `engine`
- `parser.name`
- `parser.page_meta`
- `ocr_blocks`
- `reconstructed_rows`
- `articles`
- `rejected`

Cada artigo pode conter:

- `reference`
- `description`
- `vat`
- `quantity`
- `unit_price`
- `total`
- `confidence`
- `layout_mode`
- `math_check`
- `field_sources`
- `source_ids`

`field_sources` e `source_ids` são essenciais para auditoria e não devem ser removidos.

## 9. Testes de regressão obrigatórios

Antes de aceitar qualquer mudança no parser, testar no mínimo:

### Layout #1 — BIMBO / horizontal

Critério atual de referência:

- deve encontrar exatamente os **5 artigos principais**;
- trocas não entram como compras normais;
- descontos não viram artigos;
- resumo de IVA não vira artigo;
- os valores extraídos devem manter proveniência OCR;
- validação matemática deve continuar coerente.

### Layout #2 — talão estreito / `two_line_tilted`

Critério:

- cabeçalho deve ser identificado mesmo com `duant.` e `TVA`;
- descrições de frutas/legumes devem gerar artigos;
- `Itens`, `Total`, resumo fiscal, ATCUD e saldo não podem virar produtos;
- a app não pode regressar para `layout_mode: unknown` quando o cabeçalho está legível nos blocos;
- associações numéricas devem ser justificadas por geometria e/ou validação matemática.

### Meta antes da v0.7

A v0.7 só deve ser considerada quando **3 ou 4 famílias de layout distintas** forem validadas com bom resultado.

## 10. Desenvolvimento local

Requisitos:

- Node.js moderno compatível com Vite 6;
- npm;
- navegador moderno;
- internet para descarregar os modelos OCR/ONNX na primeira utilização.

Instalação:

```bash
npm install
```

Desenvolvimento:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview local:

```bash
npm run preview
```

O `package.json` desta snapshot ainda apresenta `version: 0.6.7`. A versão funcional apresentada pela app e pelo relatório é **0.6.8.1**. Isto é apenas uma inconsistência de metadata histórica; não alterar a lógica funcional da snapshot apenas para a corrigir.

## 11. Deploy no Vercel

O projeto está ligado ao Vercel através do repositório GitHub.

Projeto conhecido:

- nome: `doc`
- framework: Vite

O deploy validado da v0.6.8.1 foi gerado a partir do commit-base funcional:

`4065f01e2cd810702b53bb3a826de351f411f915`

Ao recuperar a aplicação:

1. fazer checkout da branch `stable/fatura-sage-v0.6.8.1`;
2. confirmar que apenas documentação foi adicionada depois do commit-base;
3. correr `npm install`;
4. correr `npm run build`;
5. testar localmente;
6. fazer deploy Vercel em preview;
7. executar os Layouts #1 e #2 antes de promover qualquer alteração.

## 12. Estrutura relevante

Os ficheiros importantes para esta build são:

- `index.html` — interface aprovada;
- `src/main.js` — entrada da app;
- módulos auxiliares da v0.6.8.1 — parser/fluxo modular usado pela entrada validada;
- `package.json` — scripts e dependências;
- `vite.config.ts` — configuração de build Vite.

Evitar substituir `src/main.js` por loaders dinâmicos frágeis ou blobs truncados. Houve versões anteriores que falharam por este motivo.

## 13. Segurança

- Não incluir chaves Gemini no repositório, relatório ou frontend.
- Uma chave Gemini usada anteriormente deve ser considerada comprometida se tiver sido enviada em chat ou embutida no browser.
- O modo local não deve chamar Gemini.
- A base Sage não deve ser enviada para serviços externos no modo local.
- Futuras integrações Sage devem usar a API oficial e começar como **read-only**.
- Nunca escrever diretamente na base SQL do Sage.

## 14. Integração Sage — direção futura

Foi identificado um ambiente Sage 50 Portugal com interops e API oficial.

Direção prevista:

1. criar um Companion Windows local;
2. usar a API oficial Sage 50;
3. iniciar apenas com leitura de artigos;
4. disponibilizar ao frontend apenas os campos necessários;
5. usar allowlist de origem;
6. exigir confirmação humana antes de qualquer exportação/escrita futura.

Não implementar escrita automática no Sage sem uma fase dedicada de segurança e testes.

## 15. Como investigar uma falha

Quando uma fatura falhar:

1. exportar o **JSON** de diagnóstico — o CSV sozinho normalmente não basta;
2. verificar `parser.page_meta[].layout_mode`;
3. verificar se o cabeçalho foi identificado;
4. verificar os blocos OCR e as coordenadas do cabeçalho;
5. procurar a descrição no `ocr_blocks`;
6. identificar os blocos de quantidade, preço, IVA e total próximos;
7. verificar `math_check` e `field_sources`;
8. corrigir a estratégia de parser, nunca os dados esperados da fatura.

Se o OCR bruto estiver correto e os artigos estiverem errados, o problema é normalmente do parser, não do PaddleOCR.

## 16. Recovery / rollback

Se uma versão futura quebrar a aplicação:

- não tentar reconstruir a solução “de memória”;
- regressar a `stable/fatura-sage-v0.6.8.1`;
- o commit-base funcional é `4065f01e2cd810702b53bb3a826de351f411f915`;
- validar build;
- validar Layout #1 e Layout #2;
- só então reaplicar mudanças isoladamente.

## 17. Handoff rápido para outro programador

Entregar estas informações:

- Repo: `lu1234566/Doc`
- Snapshot: `stable/fatura-sage-v0.6.8.1`
- Base funcional: `4065f01e2cd810702b53bb3a826de351f411f915`
- OCR: PaddleOCR.js 0.4.2 / PP-OCRv5 mobile / WASM
- Não alterar visual nem OCR sem regressão comprovada
- Não hardcodar produtos ou valores esperados
- Comparação de resultados é externa à app
- Testar BIMBO e talão estreito antes de aceitar mudanças
- JSON de diagnóstico é a fonte principal para debugging
- Objetivo seguinte: validar Layout #3 e Layout #4 antes da v0.7

---

**Estado:** checkpoint estável documentado e preservado.
