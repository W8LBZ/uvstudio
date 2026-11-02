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
- **Exporter en CSV** enregistre les canaux dans un fichier CSV. Avec **Inclure les colonnes supplémentaires** cochée, il enregistre aussi la liste de scan, le verrouillage TX et le verrouillage occupé de chaque canal, ainsi que vos propres colonnes (voir Colonnes supplémentaires ci-dessous), après les colonnes CHIRP standard. CHIRP signale les colonnes qu’il ne connaît pas mais ouvre quand même le fichier. Décochez-la pour un fichier CHIRP simple.
- L’import se fait en trois étapes :
  1. **Choisir un fichier CSV**, ou collez une adresse web (ou choisissez une liste proposée) et appuyez sur **Charger depuis l'URL**. La ligne en dessous indique quel CSV est prêt. Rien ne change encore.
  2. Choisissez dans le menu où vont les lignes, la liste de scan des nouveaux canaux, et cochez **Ignorer les doublons exacts** si besoin.
  3. Appuyez sur **Importer dans le tableau**. Les canaux apparaissent dans le tableau, et **Écrire les changements** pulse jusqu’à ce que vous les écriviez. La radio n’est pas touchée avant.
- Où vont les lignes :
  - **Aux emplacements du CSV** : chaque ligne va au numéro de canal de sa colonne Location. Les autres canaux ne bougent pas.
  - **Ajouter à la fin** : les lignes vont après votre dernier canal utilisé, dans l’ordre du fichier.
  - **Ajouter au début** : les lignes vont en tête (à partir du canal 1) et vos canaux existants descendent.
  - **Tout remplacer** : tous les canaux sont effacés, puis les lignes vont à leurs emplacements.
- **Liste de scan des nouveaux canaux** : la liste des canaux quand le fichier ne l’indique pas. Un fichier avec une colonne ScanList (comme l’écrit **Inclure les colonnes supplémentaires**) garde ses propres listes. Une liste nommée dans le fichier (par exemple `2 EST`) prend ce nom seulement si elle n’en a pas encore.
- **Ignorer les doublons exacts** écarte les lignes ayant la même fréquence, le même duplex, décalage, mode et les mêmes tonalités qu’un canal existant. Les noms ne sont pas comparés. Une ligne sur la même fréquence avec d’autres tonalités est quand même importée, et reçoit le contour orange des doublons.
- Les erreurs probables d’un fichier sont entourées d’orange (survolez ou touchez pour savoir pourquoi) et signalées dans le journal d’import. Vérifiez-les avant d’écrire :
  - **Décalage :** + ou − avec un décalage de 0 (le canal émettrait sur sa fréquence de réception), un relais 2 m avec 5 MHz, ou un relais 70 cm avec 0,6 MHz.
  - **Mode :** un canal de la bande aviation (108–137 MHz) qui n’est pas en AM.
- La radio affiche des noms de 10 lettres, chiffres et symboles simples au maximum. Les noms plus longs sont coupés, et les lettres accentuées ou les autres écritures (comme le chinois) sont omises ; le journal d’import montre le nom tel qu’enregistré.

### Colonnes supplémentaires
Des colonnes que la radio ne peut pas enregistrer, comme **Comment** ou les colonnes propres à un fichier (ville, réseau, source, date de vérification…).
- L’import d’un CSV les garde, et elles s’affichent dans le tableau après PTT ID, avec leur nom en italique. **+** dans l’en-tête du tableau ajoute une colonne, et **✕** à côté du nom d’une colonne la supprime (sur un téléphone, ils s’affichent en pastilles sous **Tout sélectionner (affichés)**). **Supprimer les colonnes vides** apparaît au-dessus du tableau quand une colonne n’a aucune valeur. Supprimer une colonne qui a des valeurs demande d’abord confirmation : elles ne sont pas dans Annuler.
- **Elles ne sont pas enregistrées dans la radio.** Elles restent sur cette page et partent dans **Exporter en CSV** (Comment toujours, les autres avec **Inclure les colonnes supplémentaires** cochée). Gardez le CSV exporté, par exemple dans git, pour les conserver.
- Elles suivent le canal par sa fréquence et son nom : elles restent avec lui quand vous déplacez, triez ou relisez les canaux. Changer la fréquence ou le nom d’un canal dans le tableau les emporte aussi.
- Quitter la page avec des changements de colonnes supplémentaires non exportés demande d’abord confirmation.

### Trier par
Affiche les canaux par numéro, fréquence ou nom. Seul l’ordre de cette page change : les numéros de canaux dans la radio restent les mêmes. Monter, Descendre et Insérer un vide au-dessus agissent sur les numéros de canaux, ils sont donc désactivés pendant un autre tri.

### Doublons
Une fréquence ou un nom utilisé par plusieurs canaux est entouré d’orange. Survolez-le pour voir quels autres canaux l’utilisent. Les doublons sont permis (par exemple un relais avec deux tonalités) : le contour n’est qu’un rappel. Décochez **Signaler les doublons** pour le masquer.

### Afficher les canaux vides
Affiche aussi les numéros de canal inutilisés, pour saisir un nouveau canal à un emplacement précis.

### Combler les trous
Remonte les canaux dans les numéros de canal vides, dans le même ordre : les canaux 1, 2, 5 deviennent 1, 2, 3. Le bouton pulse après la suppression d’un canal qui laisse un trou. Annuler remet les canaux en place.

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
