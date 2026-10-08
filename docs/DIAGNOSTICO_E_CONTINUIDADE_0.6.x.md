# Diagnóstico e continuidade da família 0.6.x

## Base inspecionada

- Commit funcional: `4065f01e2cd810702b53bb3a826de351f411f915`.
- Snapshot estável lida: `a7891bbf21edbb7c4204590258edd6c5f107d33b`.
- A diferença entre ambos contém apenas os três documentos de checkpoint/handoff/testes.
- Desenvolvimento isolado: `dev/fatura-sage-0.6-layout-validation`.

## Estado real do código

A entrada efetiva é `index.html → src/main.js → src/app0681.js → src/parser0681.js`.
Os componentes TSX de jogo, os assets de jogo e os antigos chunks não fazem parte
desse fluxo. Não foram removidos nesta etapa.

O código confirma PaddleOCR.js 0.4.2, PP-OCRv5 mobile det/rec, WASM, worker desativado
e os limiares descritos no handoff. A rotação da imagem é apenas CSS: o OCR recebe
o ficheiro original. Não há transformação da imagem pela rotação do visualizador.

JSON guarda blocos, geometria, artigos, rejeições e proveniência. TXT contém o
resumo textual; CSV contém os campos de artigos, mas não todas as coordenadas ou
`field_sources`. O JSON continua necessário para investigação. A Base Sage apenas
carrega texto para consulta; não corrige OCR nem escreve no Sage.

Há três versões de metadata: package.json 0.6.7, interface 0.6.8, relatório 0.6.8.1.
São inconsistências pré-existentes, preservadas para não apresentar uma nova
build como validada. Também não existe lockfile no checkpoint: dependências
transitivas e recursos CDN não estão integralmente congelados.

## Limitações encontradas por leitura do parser

1. `parseHorizontal` exige referência e descrição juntas no mesmo bloco. Referência
   separada e descrição multiline não têm suporte explícito.
2. Esse caminho não contém exclusão explícita de TROCAS/descontos/rodapé. A aprovação
   da BIMBO pelo utilizador é evidência daquele documento; não garante a exclusão
   genérica de secções noutras geometrias.
3. Cabeçalho e associações usam tolerâncias absolutas (55, 35, 48, 95, 125 píxeis).
   Resolução e escala diferentes podem mudar o resultado.
4. `two_line_tilted` exige quantidade, preço e total com erro aritmético pequeno.
   Descontos por linha podem impedir extração mesmo com OCR correto. Não calcula
   valores em falta, o que deve continuar a ser preservado.
5. O corte de rodapé do talão só considera marcadores mais de 180 píxeis abaixo do
   cabeçalho; recibos curtos podem não ter esse corte.
6. A confiança é heurística. No horizontal, inclui blocos numéricos próximos que
   podem não ter sido escolhidos. Não é uma probabilidade calibrada de acerto.
7. Os números aceites são simples: separadores de milhares, moeda no mesmo bloco
   e números partidos entre blocos não são tratados genericamente.
8. Não há imagens de faturas, JSON de OCR real ou regressões executáveis dos dois
   layouts no repositório. A matriz documenta critérios, não execuções de testes.

Estes pontos são riscos identificados no código, não resultados observados em
faturas ainda não fornecidas. Nenhuma alteração ao parser foi aceite nesta etapa.

## Trabalho implementado nesta branch

Adicionada ferramenta de desenvolvimento externa ao frontend para reprocessar o
OCR guardado. Não inicializa PaddleOCR, não faz pedidos de rede, não consulta Sage,
não usa `articles` antigos como resposta e não compara com valores esperados.
O código da interface, OCR, parser e exportações da aplicação permanece intacto.

```bash
npm test
mkdir -p local-reports
# Guardar o JSON exportado da aplicação em local-reports/layout-1.json.
npm run replay -- local-reports/layout-1.json local-reports/replay-layout-1
```

A pasta de saída deve ser nova. São produzidos `replay.json`, `replay.txt` e
`replay.csv`. O CSV de replay inclui IDs e fontes dos campos. O relatório identifica
explicitamente que se trata de replay do parser, sem nova execução de OCR.
Geometria ausente/inválida, IDs duplicados e relatórios vazios causam erro explícito.
`local-reports/` está ignorada no Git para manter faturas locais fora dos commits.

Os testes sintéticos verificam apenas o contrato da ferramenta, não representam
faturas reais nem certificam os Layouts #1–#4. A comparação com as imagens e a
avaliação de artigos/valores continuam no ChatGPT.

## Próxima etapa e critérios de aceitação

Solicitar imagem original e JSON da 0.6.8.1 para cada layout:

| Família | Estado | Evidência necessária |
| --- | --- | --- |
| #1 BIMBO horizontal | Validada anteriormente pelo utilizador; regressão nesta sessão pendente | Imagem + JSON, incluindo os 5 artigos e secções posteriores |
| #2 talão inclinado | Validada anteriormente pelo utilizador; regressão nesta sessão pendente | Imagem + JSON com geometria |
| #3 | Não testada | Fatura de família diferente + JSON |
| #4 | Não testada | Outra família, idealmente multiline/descontos + JSON |

Primeiro identificar se cada falha pertence ao OCR ou à associação geométrica.
Só então implementar uma mudança genérica isolada, manter os valores OCR originais
e a proveniência, e repetir #1 e #2 antes de aceitar a mudança. Não corrigir dados
com respostas esperadas, nomes de fornecedores ou Base Sage.

Continuar em 0.6.x. Não publicar 0.7 nem promover uma alteração de extração antes
da validação satisfatória de 3–4 famílias. Não implementar escrita direta no Sage.
