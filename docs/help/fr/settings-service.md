> 💡 **En bref :** le menu Service caché de la radio : les fréquences sur lesquelles elle peut émettre, et la bande 350–400 MHz. N’y touchez pas sans savoir exactement pourquoi.

⚠️ Ces réglages décident où la radio a le droit d’émettre. Les changer ne change pas ce que votre licence autorise. Vous êtes responsable de n’émettre que là où vous y êtes autorisé. Voir [Bandes et licences](bands-and-licensing.md).

### F Lock
Le plan de bandes d’émission. Les canaux dont le **TX lock** est coché (par défaut) ne peuvent émettre qu’à l’intérieur ; la réception fonctionne partout.

| Option | Émission autorisée (MHz) |
|---|---|
| DEFAULT+ | 137–350 et 400–600, plus 350–400 si **350 En** est activé |
| FCC HAM | 144–148 et 420–450 (radioamateur États-Unis) |
| CA HAM | 144–148 et 430–450 (radioamateur Canada) |
| CE HAM | 144–146 et 430–440 (radioamateur Europe) |
| GB HAM | 144–148 et 430–440 (radioamateur Royaume-Uni) |
| 137-174, 400-430 / 400-438 | 137–174 et 400–430 ou 400–438 |
| PMR 446 | 446,00625–446,19375 |
| GMRS FRS MURS | 462,550–462,725, 467,550–467,725 et les cinq canaux MURS |
| DISABLE ALL | rien : réception seule |
| UNLOCK ALL | toutes les fréquences que la radio peut accorder |

- **DEFAULT+** : l’étiquette de la radio (« 137-174, 400-470 ») est plus étroite que ce que le firmware autorise vraiment ; le tableau donne les plages réelles.
- En Europe, **CE HAM** vous garde dans les bandes radioamateur.
- **GMRS FRS MURS** ne limite que les fréquences. GMRS et FRS exigent normalement une radio certifiée pour ce service, ce que cette radio n’est généralement pas, même avec une licence GMRS. La puissance et la largeur de canal ne sont pas limitées non plus.
- **UNLOCK ALL** supprime toute limite.
- F Lock ne s’applique qu’aux mémoires dont le **TX lock** est activé (par défaut). Une mémoire avec TX lock désactivé peut émettre hors du plan de bandes, par exemple un canal simplex hors de FCC HAM.

### 350 En
Active ou désactive la bande 350–400 MHz. **OFF** : la radio saute cette bande et déplace tout canal qui s’y trouve sur 433,000 MHz. **ON** (par défaut) : la radio y reçoit et, avec F Lock sur **DEFAULT+**, peut aussi y émettre.

Pour aller plus loin : [TX lock](tx-lock.md) · [Bandes et licences](bands-and-licensing.md)
