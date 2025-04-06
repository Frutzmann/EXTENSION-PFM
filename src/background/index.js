// Configuration
const CONFIG = {
    PRICE_HISTORY_LIMIT: 1000, // Nombre maximum de prix à conserver par ticker
    PRICE_CACHE_DURATION: 5 * 60 * 1000 // 5 minutes en millisecondes
};

// Cache pour les prix
let priceCache = new Map();

// Gestion des messages entre les différentes parties de l'extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'PRICE_UPDATE':
            handlePriceUpdate(message.data);
            break;
            
        case 'GET_PRICE':
            handleGetPrice(message.symbol, sendResponse);
            break;
        
        case 'SAVE_TRANSACTION':
            handleSaveTransaction(message.transaction, sendResponse);
            break;
        
        case 'EXPORT_DATA':
            handleExportData(message.data, sendResponse);
            break;
        
        case 'START_PRICE_UPDATES':
            handleStartPriceUpdates(sender.tab.id);
            sendResponse({ success: true });
            break;
        
        case 'STOP_PRICE_UPDATES':
            handleStopPriceUpdates(sender.tab.id);
            sendResponse({ success: true });
            break;
        
        default:
            console.warn('Message type non reconnu:', message.type);
    }
    return true;
});

// Gestion des mises à jour de prix
function handlePriceUpdate(priceData) {
    const { ticker, price, timestamp } = priceData;
    
    // Mise à jour du cache
    if (!priceCache.has(ticker)) {
        priceCache.set(ticker, []);
    }
    
    const tickerHistory = priceCache.get(ticker);
    tickerHistory.push({ price, timestamp });
    
    // Limiter l'historique
    if (tickerHistory.length > CONFIG.PRICE_HISTORY_LIMIT) {
        tickerHistory.shift();
    }
    
    // Stocker dans le storage local
    chrome.storage.local.set({
        [`price_${ticker}`]: {
            current: price,
            timestamp,
            history: tickerHistory
        }
    });
    
    // Notifier les popups ouverts
    chrome.runtime.sendMessage({
        type: 'PRICE_UPDATED',
        data: { ticker, price, timestamp }
    });
}

// Gestion de la récupération des prix
async function handleGetPrice(symbol, sendResponse) {
    try {
        const result = await chrome.storage.local.get(`price_${symbol}`);
        const priceData = result[`price_${symbol}`];
        
        if (priceData) {
            // Vérifier si le prix est récent
            const age = Date.now() - new Date(priceData.timestamp).getTime();
            if (age < CONFIG.PRICE_CACHE_DURATION) {
                sendResponse({ success: true, data: priceData });
            } else {
                sendResponse({ success: false, error: 'Prix expiré' });
            }
        } else {
            sendResponse({ success: false, error: 'Prix non trouvé' });
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du prix:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Gestion de la sauvegarde des transactions
async function handleSaveTransaction(transaction, sendResponse) {
    try {
        const result = await chrome.storage.local.get('transactions');
        const transactions = result.transactions || [];
        
        transactions.push({
            ...transaction,
            id: Date.now().toString(),
            timestamp: new Date().toISOString()
        });
        
        await chrome.storage.local.set({ transactions });
        sendResponse({ success: true });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la transaction:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Gestion de l'export des données
async function handleExportData(data, sendResponse) {
    try {
        // TODO: Implémenter la logique d'export
        sendResponse({ success: true });
    } catch (error) {
        console.error('Erreur lors de l\'export des données:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Gestion du démarrage des mises à jour de prix
function handleStartPriceUpdates(tabId) {
    chrome.tabs.sendMessage(tabId, { type: 'START_PRICE_UPDATES' });
}

// Gestion de l'arrêt des mises à jour de prix
function handleStopPriceUpdates(tabId) {
    chrome.tabs.sendMessage(tabId, { type: 'STOP_PRICE_UPDATES' });
}

// Initialisation de l'extension
chrome.runtime.onInstalled.addListener(() => {
    // Initialisation du storage
    chrome.storage.local.set({
        transactions: [],
        settings: {
            defaultCurrency: 'USD',
            showNotes: true,
            autoSync: true
        }
    });
    
    console.log('Extension installée');
});

// Ajouter ceci au début du fichier background/index.js
chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: 400,
    height: 600,
    focused: true
  });
}); 