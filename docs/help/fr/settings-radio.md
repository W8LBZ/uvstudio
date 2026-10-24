**En bref :** comment la radio reçoit, émet et sonne. Si vous débutez, les valeurs par défaut conviennent. **Sql** est le réglage que l’on change le plus.

### Sql
Squelch : le niveau de signal nécessaire pour ouvrir le haut-parleur. **0** reste toujours ouvert (souffle permanent). Plus le chiffre est haut, plus c’est silencieux, au risque de couper les stations faibles. 3 à 5 convient à la plupart.

### TxTOut
Temporisation d’émission : la durée maximale d’un appui sur PTT avant que la radio coupe d’elle-même. Protège contre un bouton coincé ; beaucoup de relais coupent de toute façon vers 3 minutes.

### Mic
Gain du micro. Augmentez-le si l’on vous trouve faible, baissez-le si l’on vous trouve saturé.

### VOX
Émission déclenchée par la voix : parler lance l’émission sans appuyer sur PTT. **OFF** est le plus sûr. Plus le chiffre est haut, plus il faut parler fort pour déclencher.

### RxMode
Comment la radio écoute avec ses deux VFO (A et B) :
- **MAIN ONLY** : écoute seulement le VFO sélectionné.
- **DUAL RX RESPOND** : surveille les deux et émet sur celui qui a reçu en dernier.
- **CROSS BAND** : écoute sur un VFO, émet toujours sur l’autre.
- **MAIN TX DUAL RX** : surveille les deux, émet toujours sur le VFO sélectionné.
- **FULL RX RESPOND** : surveille A, B et les deux canaux prioritaires (**PriCh1**, **PriCh2** dans Scan) et répond sur celui qui a reçu.
- **MAIN TX FULL RX** : surveille tout cela, émet toujours sur le VFO sélectionné.
- Les deux modes FULL ne sont pas présents dans toutes les éditions du firmware.

### BatSav
Économiseur de batterie : le récepteur dort une partie du temps au repos. **1:5** économise le plus mais peut couper la première syllabe d’un appel. **OFF** ne dort jamais.

### BatTyp
Le modèle de batterie installé, pour que la jauge soit juste.

### 1 Call
Un canal favori que la radio rappelle avec un raccourci sur la touche **9**.

### Roger
Un son envoyé quand vous relâchez PTT. **ROGER** est un bip court. **MDC** envoie une salve de données MDC-1200, utilisée par certains systèmes professionnels. **OFF** est normal en radioamateur.

### STE
Suppression de la queue de squelch : en fin d’émission, la radio envoie un signal qui fait taire immédiatement les radios utilisant une tonalité, sans rafale de bruit. Utile seulement avec une tonalité TX.

### RP STE
Suppression de la queue de squelch du relais : après le relâchement de PTT, la radio continue d’émettre pendant cette durée en envoyant le signal de fin, pour que les relais compatibles se ferment sans rafale de bruit. **OFF** est normal sauf si votre relais le demande.

### SetNFM
Largeur des canaux NFM : **NARROW** (12,5 kHz standard) ou **NARROWER** (encore plus étroit). Gardez NARROW sauf besoin précis.

### SetRxA FM
Profil audio en réception FM : de **FLAT** (sans traitement) à **MAX** (plus fort, plus traité). Choisissez ce qui vous semble le plus clair.

### SetRxA AM
Filtre audio en réception AM : **SHARP** coupe plus de bruit, **OPEN** laisse passer plus d’audio, **STOCK** est entre les deux.
