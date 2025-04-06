// Clés de stockage
const STORAGE_KEYS = {
  PORTFOLIO: 'crypto_portfolio',
  TRANSACTIONS: 'crypto_transactions',
  SETTINGS: 'crypto_settings'
};

// Fonctions de base pour le stockage
export const saveToStorage = async (key, data) => {
  try {
    await chrome.storage.local.set({ [key]: data });
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    return false;
  }
};

export const getFromStorage = async (key) => {
  try {
    const result = await chrome.storage.local.get(key);
    return result[key];
  } catch (error) {
    console.error('Erreur lors de la récupération:', error);
    return null;
  }
};

// Fonctions spécifiques pour le portefeuille
export const savePortfolio = async (portfolio) => {
  return saveToStorage(STORAGE_KEYS.PORTFOLIO, portfolio);
};

export const getPortfolio = async () => {
  return getFromStorage(STORAGE_KEYS.PORTFOLIO) || [];
};

// Fonctions spécifiques pour les transactions
export const saveTransactions = async (transactions) => {
  return saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
};

export const getTransactions = async () => {
  return getFromStorage(STORAGE_KEYS.TRANSACTIONS) || [];
};

export const addTransaction = async (transaction) => {
  const transactions = await getTransactions();
  transactions.push({
    ...transaction,
    id: Date.now().toString(),
    timestamp: new Date().toISOString()
  });
  return saveTransactions(transactions);
};

// Fonctions spécifiques pour les paramètres
export const saveSettings = async (settings) => {
  return saveToStorage(STORAGE_KEYS.SETTINGS, settings);
};

export const getSettings = async () => {
  return getFromStorage(STORAGE_KEYS.SETTINGS) || {
    defaultCurrency: 'USD',
    showNotes: true,
    autoSync: true
  };
}; 