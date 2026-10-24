> 💡 **En bref :** comment la radio reçoit, émet et sonne. Si vous débutez, les valeurs par défaut conviennent. **Sql** est le réglage que l’on change le plus.

### Sql
Squelch : le niveau de signal nécessaire pour ouvrir le haut-parleur. **0** reste toujours ouvert (souffle permanent). Plus le chiffre est haut, plus c’est silencieux, au risque de couper les stations faibles. 3 à 5 convient à la plupart.

### TxTOut
Temporisation d’émission : la durée maximale d’un appui sur PTT, de 30 secondes à 15 minutes. À l’échéance, la radio coupe l’émission d’elle-même (voir **SetTOT** dans Émission pour l’alerte).
- Protège contre un PTT coincé ou une radio qui émet au fond d’un sac.
- Beaucoup de relais coupent vers 3 minutes : 2 à 3 minutes est un choix raisonnable.

### Mic
Gain du micro, de **+1,5 dB** (le plus faible) à **+31,5 dB** (le plus fort). Augmentez-le si l’on vous trouve faible, baissez-le si l’on vous trouve saturé. Changez d’un cran à la fois et demandez un report. **MicBar** (dans Affichage) montre votre niveau pendant que vous parlez.

### VOX
Émission déclenchée par la voix : parler dans la radio lance l’émission sans appuyer sur PTT, et elle s’arrête peu après le silence.
- **OFF** (conseillé pour débuter) : vous appuyez toujours sur PTT.
- **1 à 10** : le volume sonore nécessaire pour déclencher l’émission. Si elle se déclenche sur le bruit de fond ou la respiration, changez le niveau d’un cran ; si elle coupe le début de vos mots, allez dans l’autre sens.
- ⚠️ Le VOX peut émettre par accident (une toux, une pièce bruyante). Coupez-le quand vous posez la radio.

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
Économiseur de batterie. Quand la radio reste inactive sur l’écran principal une dizaine de secondes, le récepteur fait de petites siestes : il se réveille brièvement pour chercher un signal, se rendort, et recommence.

**1:N** est le rapport entre éveil et sommeil. Le récepteur est toujours éveillé 1 part (100 ms, un dixième de seconde), puis endormi N parts :

| Réglage | Éveil | Sommeil | Récepteur éteint |
|---|---|---|---|
| **1:1** | 100 ms | 100 ms | la moitié du temps |
| **1:2** | 100 ms | 200 ms | 2/3 du temps |
| **1:3** | 100 ms | 300 ms | 3/4 du temps |
| **1:4** | 100 ms | 400 ms | 4/5 du temps |
| **1:5** | 100 ms | 500 ms | 5/6 du temps |

- 🔋 Plus N est grand, plus la batterie dure, mais un appel peut arriver pendant le sommeil : le premier mot peut être coupé (jusqu’à une demi-seconde à 1:5).
- **OFF** : le récepteur ne dort jamais. Consomme le plus, ne manque rien.
- Il ne dort que lorsqu’il ne se passe rien : pas pendant une réception, un scan, une émission, dans un menu ou en écoute de la radio FM.
- 👍 **1:4** est la valeur par défaut du firmware et un bon compromis.

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
