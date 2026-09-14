# Matriz de testes — Fatura → Sage 50 v0.6.8.1

Este documento define os testes mínimos antes de alterar a build estável.

## Regra de aprovação

Uma alteração só deve ser aceite se:

- não piorar um layout já validado;
- não inventar artigos ou valores;
- mantiver `field_sources` / `source_ids`;
- mantiver exportação JSON/CSV funcional;
- não transformar cabeçalhos, totais, IVA, ATCUD ou rodapé em artigos;
- mantiver a interface atual, salvo pedido explícito.

## Layout #1 — Horizontal / BIMBO

### Estrutura

Tabela com colunas alinhadas horizontalmente:

`COD | PRODUTOS | COD IVA | UNIDS | PREÇO | IMPORTÂNCIA/TOTAL`

### Resultado de referência

A análise validada deve produzir os 5 artigos principais da compra e excluir secções posteriores de trocas/descontos.

### Verificações

- [ ] layout identificado como `horizontal`
- [ ] 5 artigos principais
- [ ] referência presente nos 5 artigos
- [ ] descrição presente nos 5 artigos
- [ ] quantidade presente
- [ ] preço presente
- [ ] total presente
- [ ] `math_check` coerente
- [ ] secção TROCAS não entra como compra
- [ ] descontos não entram como artigos
- [ ] resumo fiscal não entra como artigo
- [ ] relatório JSON exporta corretamente
- [ ] CSV exporta corretamente

## Layout #2 — Talão estreito inclinado

### Estrutura

Cabeçalho semelhante a:

`Quant. | Pr. Unit. | IVA | Desc. | Total`

A fotografia pode estar inclinada, fazendo com que os elementos de uma linha física tenham valores Y diferentes.

### Erros OCR conhecidos que o parser deve tolerar

- `duant.` / `DUANT` / `OUANT` → quantidade
- `TVA` / `TWA` → IVA
- variações de `Pr. Unit.` → preço unitário
- palavras de descrição com pequenos erros OCR

### Verificações

- [ ] cabeçalho identificado pelos blocos OCR
- [ ] layout identificado como `two_line_tilted`
- [ ] não retorna `unknown` quando as colunas estão visíveis
- [ ] descrições de produtos são identificadas
- [ ] quantidade, preço e total são associados por geometria
- [ ] combinação numérica usa validação `qtd × preço ≈ total`
- [ ] IVA é associado quando disponível
- [ ] `Itens:` não vira artigo
- [ ] `Total` não vira artigo
- [ ] `Base Imp` não vira artigo
- [ ] `Valor Iva` não vira artigo
- [ ] `ATCUD` não vira artigo
- [ ] saldo/rodapé não vira artigo
- [ ] relatório JSON exporta corretamente
- [ ] CSV exporta corretamente

## Layout #3 — Ainda por validar

Sugestão de próximo teste:

- fatura A4 ou térmica com colunas deslocadas;
- referência separada da descrição;
- subtotais intermédios;
- sem a mesma geometria da BIMBO.

Critério: criar suporte genérico sem hardcode de fornecedor.

## Layout #4 — Ainda por validar

Sugestão:

- fatura com descontos por linha, portes ou múltiplas taxas de IVA;
- descrição multiline;
- totais/subtotais misturados com a tabela.

## Teste técnico rápido antes de deploy

```bash
npm install
npm run build
npm run preview
```

Depois:

1. abrir a app;
2. inicializar OCR;
3. testar Layout #1;
4. exportar JSON e CSV;
5. testar Layout #2;
6. exportar JSON e CSV;
7. comparar com as imagens originais;
8. confirmar que o parser não inventou valores.

## Quando abrir uma nova versão

- correção pequena da mesma estratégia: `0.6.8.x`
- nova família de layout ainda experimental: continuar em `.6.x`
- `0.7` apenas após 3–4 famílias de layout validadas.

## Snapshot de recuperação

- branch: `stable/fatura-sage-v0.6.8.1`
- commit-base funcional: `4065f01e2cd810702b53bb3a826de351f411f915`

Não substituir este checkpoint por uma versão experimental.
