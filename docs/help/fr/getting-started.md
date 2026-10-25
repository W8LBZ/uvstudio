> 💡 **En bref :** sauvegardez d’abord, changez peu à la fois, et n’écrivez que lorsque vous êtes satisfait. Vous pouvez toujours restaurer une sauvegarde.

### 1. Connecter
Utilisez un câble USB de programmation qui transmet les données. Allumez la radio normalement, puis appuyez sur **Lire depuis la radio** sur n’importe quelle page et choisissez le port série de la radio.

**Android (expérimental) :** utilisez Chrome et reliez la radio au téléphone (câble USB-C, ou adaptateur OTG pour un câble USB-A). La radio apparaît comme **USB Serial**. Sous GrapheneOS, cherchez « USB » dans les Paramètres : le réglage *USB-C port* (sous *Exploit protection*) doit autoriser les données quand le téléphone est déverrouillé (*Charging-only when locked*). Déverrouillez le téléphone avant de brancher.

### 2. Sauvegarder
- **Calibration** : sauvegardez-la une fois et gardez le fichier pour toujours. Voir [Calibration](calibration-guide.md).
- **Mémoires** et **Réglages radio** : après la lecture, appuyez sur **Enregistrer une sauvegarde (.bin)** sur chaque page.

### 3. Ajouter des canaux
Dans **Mémoires**, tapez une fréquence dans une ligne vide (activez **Afficher les canaux vides**), ou importez une liste CSV de votre club ou de RepeaterBook. Pour un relais, voir [Relais](repeaters.md).

### 4. Écrire
Appuyez sur **Écrire les changements**. Seuls les canaux modifiés sont envoyés, et la radio redémarre.

### 5. Essayer
Écoutez vos nouveaux canaux. Si quelque chose sonne mal, voyez [Squelch et tonalités](squelch-and-tones.md), ou ouvrez votre sauvegarde et réécrivez-la.

Avant d’émettre, lisez [Bandes et licence](bands-and-licensing.md).
