> 💡 **En bref :** lisez la radio, modifiez le tableau, puis écrivez les changements. Rien n’arrive à la radio avant d’appuyer sur **Écrire les changements**, vous pouvez donc essayer librement jusque-là.

### Lire et écrire
- **Lire depuis la radio** charge les 1024 canaux, les VFO et les noms des listes de scan dans la page.
- Modifiez autant que vous voulez. Le résumé compte vos changements, et les cellules modifiées sont mises en évidence.
- **Écrire les changements** n’envoie que ce qui a changé, puis redémarre la radio pour qu’elle les prenne en compte.
- **Annuler** revient en arrière d’un changement à la fois.
- **Abandonner les changements** remet tout comme dans la radio. Aucune confirmation n’est demandée : en cas d’erreur, Annuler rétablit les changements.
- Faites d’abord une sauvegarde (ci-dessous), surtout avant une grosse importation.

### Sauvegardes (.bin)
- **Enregistrer une sauvegarde (.bin)** conserve une copie exacte de la zone mémoire de la radio : canaux, noms, listes de scan et VFO.
- **Ouvrir une sauvegarde (.bin)** (sous **Importer et exporter**) la charge dans le tableau. Appuyez sur Écrire pour la mettre dans la radio.
- Les sauvegardes servent à annuler une erreur. Elles ne conviennent qu’aux UV-K1 / UV-K5 V3 sous firmware F4HWN.

### Importer et exporter en CSV
Ces boutons sont sous **Importer et exporter**. Les fichiers CSV suivent le format CHIRP : vous pouvez échanger des listes de canaux avec CHIRP, un tableur ou des sites comme RepeaterBook.
- **Exporter en CSV** enregistre les canaux dans un fichier CSV.
- L’import se fait en trois étapes :
  1. **Choisir un fichier CSV**, ou collez une adresse web (ou choisissez une liste proposée) et appuyez sur **Charger depuis l'URL**. La ligne en dessous indique quel CSV est prêt. Rien ne change encore.
  2. Choisissez dans le menu où vont les lignes, et cochez **Ignorer les doublons** si besoin.
  3. Appuyez sur **Importer dans le tableau**. Les canaux apparaissent dans le tableau, et **Écrire les changements** pulse jusqu’à ce que vous les écriviez. La radio n’est pas touchée avant.
- Où vont les lignes :
  - **Aux emplacements du CSV** : chaque ligne va au numéro de canal de sa colonne Location. Les autres canaux ne bougent pas.
  - **Ajouter à la fin** : les lignes vont après votre dernier canal utilisé, dans l’ordre du fichier.
  - **Ajouter au début** : les lignes vont en tête (à partir du canal 1) et vos canaux existants descendent.
  - **Tout remplacer** : tous les canaux sont effacés, puis les lignes vont à leurs emplacements.
- **Ignorer les doublons** écarte les lignes ayant la même fréquence, le même duplex, décalage, mode et les mêmes tonalités qu’un canal existant. Les noms ne sont pas comparés.

### Trier par
Affiche les canaux par numéro, fréquence ou nom. Seul l’ordre de cette page change : les numéros de canaux dans la radio restent les mêmes. Monter, Descendre et Insérer un vide au-dessus agissent sur les numéros de canaux, ils sont donc désactivés pendant un autre tri.

### Doublons
Une fréquence ou un nom utilisé par plusieurs canaux est entouré d’orange. Survolez-le pour voir quels autres canaux l’utilisent. Les doublons sont permis (par exemple un relais avec deux tonalités) : le contour n’est qu’un rappel. Décochez **Signaler les doublons** pour le masquer.

### Afficher les canaux vides
Affiche aussi les numéros de canal inutilisés, pour saisir un nouveau canal à un emplacement précis.

### Modifier plusieurs canaux
Cochez les cases à gauche pour sélectionner des canaux. Une barre apparaît avec :
- **Monter** / **Descendre** : réordonne la sélection.
- **Insérer un vide au-dessus** : fait de la place en décalant les canaux suivants.
- **Supprimer et remonter** : supprime la sélection et referme le trou.
- **Copier** / **Coller** : duplique des canaux ailleurs.
- **Définir pour la sélection** : change une colonne (par exemple la Puissance) sur tous les canaux sélectionnés d’un coup.

### Noms des listes de scan
- S’ouvre avec le bouton **Noms des listes de scan** au-dessus du tableau.
- Donnez à chacune des 24 listes un nom court, comme **RPT** ou **AIR**. La radio n’affiche que 3 caractères.
- Ces noms vous aident sur l’écran de la radio. La liste d’un canal se choisit dans la colonne [Liste de scan](scan-list.md).

### VFO
La section **VFO**, après **Canaux mémoire**, est le relevé que tient la radio de l’endroit où vous avez laissé chaque bande en accord libre (mode VFO), par opposition aux canaux mémoire.
- La radio a 7 bandes fixes et deux VFO (A et B) : d’où 14 lignes, une par bande et par VFO.
- Chaque ligne contient ce que ce VFO avait réglé dans cette bande : fréquence, décalage, tonalités, puissance, verrou TX, etc. En revenant sur la bande, la radio repart de cette ligne.
- **La radio remplit ce tableau elle-même.** Chaque fois que vous accordez ou changez un réglage en mode VFO, elle l’enregistre dans la ligne correspondante. **Lire depuis la radio** montre ce qu’elle a enregistré.
- **Vous pouvez aussi le modifier.** Modifiez une ligne, appuyez sur **Écrire les changements**, et la radio repart de vos valeurs, jusqu’à ce que vous les changiez sur la radio.
- Une ligne est une position mémorisée, pas une règle pour toute la bande. Pour garder une fréquence durablement, enregistrez-la dans un canal mémoire.

Voir [VFO](vfo.md).
