**En bref :** le squelch garde le haut-parleur muet tant que le signal n’est pas assez fort. Les tonalités (CTCSS/DCS) ajoutent un second contrôle : le bon code doit aussi être présent.

### Squelch
- Le réglage **[Sql](settings-radio.md#sql)** de la radio fixe la force de signal nécessaire pour ouvrir le haut-parleur.
- Souffle permanent : squelch trop bas. Stations faibles qui coupent : squelch trop haut.

### Tonalités
- La **[tonalité TX](tx-tone.md)** est un code que vous envoyez, en général pour ouvrir un relais.
- La **[tonalité RX](rx-tone.md)** est un code exigé avant d’entendre quoi que ce soit.
- Les tonalités **CTCSS** sont des nombres comme `88.5`. Les codes **DCS** ressemblent à `D023N`.

### Dépannage
- **Vous n’entendez rien sur un canal actif** : videz la tonalité RX, ou baissez Sql.
- **Le relais vous ignore** : vérifiez la tonalité TX et le [décalage](offset.md).
- **Vous entendez d’autres groupes sur votre canal** : réglez une tonalité RX correspondant à votre groupe.
- Les tonalités ne rendent pas une conversation privée. Toute personne sans tonalité entend tout.

Pour aller plus loin : [CTCSS](https://fr.wikipedia.org/wiki/CTCSS) · [Squelch (en anglais)](https://en.wikipedia.org/wiki/Squelch)
