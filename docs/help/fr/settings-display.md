> 💡 **En bref :** ce qu’affiche l’écran et le comportement du rétroéclairage. Rien ici n’affecte les performances radio : essayez librement.

### ChDisp
Affichage des canaux mémoire : fréquence, numéro de canal, nom, ou nom avec la fréquence en dessous.

### POnMsg
Ce qui se passe à l’allumage : un son, vos messages, la tension de la batterie, le logo, tout (**ALL**) ou rien.

### Message 1
Première ligne du message d’accueil (16 caractères maximum). Votre indicatif est un choix courant.

### Message 2
Deuxième ligne du message d’accueil (16 caractères maximum), affichée sous **Message 1** quand **POnMsg** inclut les messages.

### BLTime
Durée du rétroéclairage après un appui. **OFF** ne s’allume jamais. **ON** reste toujours allumé et consomme le plus.

### BLMin
Luminosité quand le rétroéclairage est « éteint » (après **BLTime**), de **0** (noir complet, le plus économe) à **9**. Une valeur basse comme 1 garde l’écran lisible la nuit.

### BLMax
Luminosité quand le rétroéclairage est allumé, de **1** à **10** (le plus lumineux). Une valeur plus basse économise la batterie et fatigue moins les yeux dans le noir.

### BLTxRx
Allume aussi l’écran pendant l’émission (**TX**), la réception (**RX**) ou les deux.

### BatTxt
Affiche la batterie en tension, en pourcentage, ou pas du tout dans la barre d’état.

### MicBar
Affiche une barre de niveau micro pendant l’émission, pour voir à quel volume vous parlez.

### SetCtr
Contraste de l’écran. Augmentez-le si le texte est pâle, baissez-le si le fond paraît gris.

### SetInv
Inverse l’écran : texte clair sur fond sombre.

### SetMet
Style du S-mètre, la barre qui montre la force du signal reçu. **TINY** est une barre compacte qui laisse plus de place au reste ; **CLASSIC** est l’indicateur traditionnel, plus grand. Pure question de goût.

### SetGUI
Disposition de l’écran des fréquences (VFO). **TINY** utilise un texte plus petit pour afficher plus de détails comme la puissance, les tonalités et le pas ; **CLASSIC** garde la disposition plus grande et plus simple. Essayez les deux et gardez la plus lisible.

### SetSav
Économiseur d’écran. Quand le rétroéclairage s’éteint (voir **BLTime**), l’écran affiche une image au lieu de l’affichage des fréquences :
- **OFF** : pas d’économiseur ; l’affichage normal reste, simplement non éclairé.
- **LOGO** : votre logo de démarrage (modifiable dans la page Logo de démarrage).
- **LOGO+** : le logo de démarrage qui défile lentement sur le côté.
- **MATRIX** : une « pluie numérique » de caractères qui tombent, comme dans le film.

Un appui sur une touche, ou un signal reçu, ramène l’affichage normal. La touche qui réveille l’écran ne fait rien d’autre : impossible de changer un réglage par accident. Il faut un **BLTime** différent de OFF et de ON, car il attend l’extinction du rétroéclairage.
