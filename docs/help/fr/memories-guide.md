**En bref :** lisez la radio, modifiez le tableau, puis écrivez les changements. Rien n’arrive à la radio avant d’appuyer sur **Écrire les changements**, vous pouvez donc essayer librement jusque-là.

### Lire et écrire
- **Lire depuis la radio** charge les 1024 canaux, les VFO et les noms des listes de scan dans la page.
- Modifiez autant que vous voulez. Le résumé compte vos changements, et les cellules modifiées sont mises en évidence.
- **Écrire les changements** n’envoie que ce qui a changé, puis redémarre la radio pour qu’elle les prenne en compte.
- Faites d’abord une sauvegarde (ci-dessous), surtout avant une grosse importation.

### Sauvegardes (.bin)
- **Enregistrer une sauvegarde (.bin)** conserve une copie exacte de la zone mémoire de la radio : canaux, noms, listes de scan et VFO.
- **Ouvrir une sauvegarde (.bin)** la charge dans le tableau. Appuyez sur Écrire pour la mettre dans la radio.
- Les sauvegardes servent à annuler une erreur. Elles ne conviennent qu’aux UV-K1 / UV-K5 V3 sous firmware F4HWN.

### Importer et exporter en CSV
Les fichiers CSV suivent le format CHIRP : vous pouvez échanger des listes de canaux avec CHIRP, un tableur ou des sites comme RepeaterBook.
- **Exporter en CSV** enregistre les canaux dans un fichier CSV.
- **Importer un CSV** en lit un. Le menu à côté décide où vont les lignes :
  - **Aux emplacements du CSV** : chaque ligne va au numéro de canal de sa colonne Location. Les autres canaux ne bougent pas.
  - **Ajouter à la fin** : les lignes vont après votre dernier canal utilisé, dans l’ordre du fichier.
  - **Ajouter au début** : les lignes vont en tête (à partir du canal 1) et vos canaux existants descendent.
  - **Tout remplacer** : tous les canaux sont effacés, puis les lignes vont à leurs emplacements.
- **Ignorer les doublons** écarte les lignes ayant la même fréquence, le même duplex, décalage, mode et les mêmes tonalités qu’un canal existant. Les noms ne sont pas comparés.

### Importer depuis une URL
Collez l’adresse web d’un fichier CSV, ou choisissez une liste proposée, puis appuyez sur **Importer depuis l’URL**. Le mode d’importation et Ignorer les doublons s’appliquent comme pour Importer un CSV.

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
La section **VFO** sous le tableau contient les fréquences libres de la radio, une paire par bande. Voir [VFO](vfo.md).
