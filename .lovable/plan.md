

## Plan: DatasheetCheckDialog overflow fixen

### Probleem

De modal opent binnen een pagina die al een beperkte viewport heeft (de offerte-editor). De `DialogFooter` met meerdere knoppen (Hercontroleer, Alles overslaan, Annuleren, Overslaan & doorgaan) valt buiten het zichtbare dialoogvenster omdat:

1. De `DialogContent` heeft geen `overflow-y-auto` of `max-h` beperking op het geheel
2. De footer heeft `flex-col sm:flex-row` met veel knoppen die bij smalle viewports verticaal stapelen en buiten de card vallen
3. De productkaarten + footer samen overschrijden de beschikbare hoogte

### Oplossing

- `DialogContent` een maximale hoogte geven (`max-h-[85vh]`) en `overflow-hidden flex flex-col` zodat de inhoud binnen de card blijft
- De productlijst (`div.space-y-3`) krijgt `flex-1 overflow-y-auto` zodat alleen die sectie scrollt
- Footer knoppen compacter maken: "Hercontroleer" en "Alles overslaan" samenvoegen in een rij, en de actieknoppen rechts houden
- `gap-2` op footer behouden maar `flex-wrap` toevoegen voor smallere schermen

### Bestand

| Bestand | Wijziging |
|---------|-----------|
| `src/components/offertes/DatasheetCheckDialog.tsx` | `max-h-[85vh] overflow-hidden flex flex-col` op DialogContent; `flex-1 min-h-0` op scrollbare productlijst; `flex-wrap` op footer |

