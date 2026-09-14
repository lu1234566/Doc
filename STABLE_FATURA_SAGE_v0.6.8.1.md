# Fatura → Sage 50 v0.6.8.1 — checkpoint estável

Esta branch preserva a build validada pelo utilizador em 14/09/2026.

## Recuperação rápida

- Branch: `stable/fatura-sage-v0.6.8.1`
- Commit-base funcional: `4065f01e2cd810702b53bb3a826de351f411f915`
- Documentação completa: `docs/HANDOFF_FATURA_SAGE_v0.6.8.1.md`
- Matriz de regressão: `docs/TEST_MATRIX_FATURA_SAGE_v0.6.8.1.md`

## Regras

- não usar esta branch para experiências;
- não alterar visual ou configuração OCR sem regressão;
- não hardcodar valores de faturas;
- manter comparação fora da app;
- testar Layout #1 (BIMBO) e Layout #2 (talão estreito inclinado) antes de aceitar qualquer alteração.

Se uma versão futura quebrar, voltar a este checkpoint e reaplicar as mudanças de forma isolada.
