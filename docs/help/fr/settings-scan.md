**En bref :** comment le scan choisit les canaux, et ce qu’il fait quand il trouve un signal.

### ScList
La liste scannée : une liste (**01** à **24**), **ALL** pour tous les canaux, ou **MIX** (les listes cochées dans **ScMix**). La liste d’un canal se règle dans le tableau Mémoires.

### ScPri
Scan prioritaire : pendant le scan, la radio revient régulièrement sur les canaux prioritaires (**PriCh1**, **PriCh2**) pour ne pas les manquer.

### PriCh1
Premier canal prioritaire, vérifié souvent pendant le scan quand **ScPri** est ON. Les modes FULL RX (**RxMode** dans Radio) le surveillent aussi.

### PriCh2
Deuxième canal prioritaire.

### ScnRev
Ce que fait le scan quand il trouve un signal :
- **STOP** : s’arrête jusqu’à ce que vous relanciez le scan.
- **CARRIER** : attend la fin du signal, plus la durée indiquée, puis repart. Idéal pour suivre une conversation.
- **TIMEOUT** : écoute pendant la durée indiquée, puis repart même si le signal est encore là.

### SetScn
Vitesse du scan. **FAST** passe les canaux plus vite mais peut manquer des signaux très faibles ou très brefs. **NORMAL** est plus minutieux.

### ScMix
Les listes qui composent **MIX** dans **ScList**. Cochez celles à scanner ensemble.
