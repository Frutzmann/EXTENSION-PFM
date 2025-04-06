# Crypto Portfolio Manager

Une extension Chrome pour la gestion de portefeuille de cryptomonnaies avec intégration TradingView.

## Fonctionnalités

- Suivi des transactions (achats/ventes)
- Intégration avec TradingView pour les prix en temps réel
- Export des données en format Excel/CSV
- Visualisation du portefeuille
- Historique des transactions

## Installation

1. Clonez ce repository
2. Installez les dépendances :
```bash
npm install
```

3. Compilez le projet :
```bash
npm run build
```

4. Chargez l'extension dans Chrome :
   - Ouvrez Chrome et allez à `chrome://extensions/`
   - Activez le "Mode développeur"
   - Cliquez sur "Charger l'extension non empaquetée"
   - Sélectionnez le dossier `dist` du projet

## Développement

Pour le développement en mode watch :
```bash
npm run watch
```

## Structure du Projet

```
/
├── public/              # Fichiers statiques
├── src/                 # Code source
│   ├── background/      # Service worker
│   ├── content/         # Content scripts
│   ├── popup/          # Interface utilisateur
│   └── utils/          # Utilitaires
└── dist/               # Fichiers compilés
```

## Technologies Utilisées

- React
- Webpack
- XLSX (pour l'export Excel)
- TradingView API

## Licence

MIT 