**En bref :** le Multiboot permet à la radio de stocker plusieurs firmwares et d’en choisir un à l’allumage. Écrire un slot ne change pas le firmware en cours.

### Utiliser les slots
- Appuyez sur **Rafraîchir les slots** pour voir leur contenu. Il y a une sauvegarde **Main** protégée et quatre slots utilisateur.
- Pour remplir un slot, choisissez un firmware F4HWN compatible Multiboot (dans la liste ou en fichier), le slot cible, puis **Écrire dans le slot**.
- **Effacer** vide un slot. **Réinit. config** efface la banque de réglages propre à ce slot.

### Changer de firmware
Éteignez la radio, maintenez **MENU**, allumez-la et relâchez quand le sélecteur apparaît. **UP**/**DOWN** pour choisir, **MENU** pour démarrer, **EXIT** pour quitter. N’éteignez jamais la radio pendant la restauration d’un slot.

### Banques de réglages
Chaque slot a sa propre banque de canaux et de réglages : les firmwares n’écrasent pas la configuration des autres.

Pour aller plus loin : [Firmware F4HWN : Multiboot (en anglais)](https://github.com/armel/uv-k1-k5v3-firmware-custom#multiboot-and-multiconfig)
