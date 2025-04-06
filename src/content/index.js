// Configuration
const CONFIG = {
    PRICE_UPDATE_INTERVAL: 5000, // 5 secondes
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
};

// Cache pour les prix
let priceCache = new Map();

// Observer pour détecter les changements de prix sur TradingView
let priceObserver = null;

// Fonction pour extraire le ticker
function extractTicker() {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
        const text = btn.innerText.trim();
        if (/^(?=.*USD)[A-Z]{3,}[A-Z0-9.\-]*$/.test(text)) {
            return text;
        }
    }
    return null;
}

// Fonction pour extraire le prix
function extractPrice() {
    const divs = document.querySelectorAll('div');
    for (let i = 0; i < divs.length - 1; i++) {
        if (divs[i].innerText?.trim().toLowerCase() === 'c') {
            const next = divs[i + 1];
            if (next && next.innerText) {
                const priceStr = next.innerText.replace(/\s/g, '').replace(',', '.');
                const price = parseFloat(priceStr);
                if (!isNaN(price)) {
                    return price;
                }
            }
            break;
        }
    }
    return null;
}

// Fonction pour valider les données
function validatePriceData(ticker, price) {
    if (!ticker || !price) return false;
    if (isNaN(price) || price <= 0) return false;
    return true;
}

// Fonction pour récupérer le prix actuel
async function getCurrentPrice() {
    const ticker = extractTicker();
    if (!ticker) {
        console.warn('Ticker non trouvé');
        return null;
    }

    const price = extractPrice();
    if (!price) {
        console.warn('Prix non trouvé');
        return null;
    }

    if (!validatePriceData(ticker, price)) {
        console.warn('Données invalides');
        return null;
    }

    return { ticker, price };
}

// Fonction pour mettre à jour le prix
async function updatePrice() {
    const priceData = await getCurrentPrice();
    if (priceData) {
        const { ticker, price } = priceData;
        const cachedPrice = priceCache.get(ticker);
        
        // Ne mettre à jour que si le prix a changé
        if (cachedPrice !== price) {
            priceCache.set(ticker, price);
            chrome.runtime.sendMessage({
                type: 'PRICE_UPDATE',
                data: {
                    ticker,
                    price,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }
}

// Configuration de l'observer pour les prix
function setupPriceObserver() {
    // Observer les changements dans le DOM
    priceObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                updatePrice();
                break;
            }
        }
    });

    // Configuration de l'observer
    priceObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // Mise à jour initiale
    updatePrice();

    // Mise à jour périodique
    setInterval(updatePrice, CONFIG.PRICE_UPDATE_INTERVAL);
}

// Écoute des messages du background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'GET_PRICE':
            getCurrentPrice().then(priceData => {
                sendResponse({ success: true, data: priceData });
            }).catch(error => {
                console.error('Erreur lors de la récupération du prix:', error);
                sendResponse({ success: false, error: error.message });
            });
            break;
        
        case 'START_PRICE_UPDATES':
            setupPriceObserver();
            sendResponse({ success: true });
            break;
        
        case 'STOP_PRICE_UPDATES':
            if (priceObserver) {
                priceObserver.disconnect();
                priceObserver = null;
            }
            sendResponse({ success: true });
            break;
        
        case 'MANUAL_SCRAPE':
            try {
                // Récupérer le ticker
                let ticker = null;
                document.querySelectorAll('button').forEach(btn => {
                    let text = btn.innerText.trim();
                    if (/^(?=.*USD)[A-Z]{3,}[A-Z0-9.\-]*$/.test(text)) {
                        ticker = text;
                    }
                });

                if (!ticker) {
                    sendResponse({ 
                        success: false, 
                        error: 'Impossible de récupérer le ticker' 
                    });
                    return true;
                }

                // Récupérer le prix
                let price = null;
                const divs = document.querySelectorAll('div');
                for (let i = 0; i < divs.length - 1; i++) {
                    if (divs[i].innerText?.trim().toLowerCase() === 'c') {
                        let next = divs[i + 1];
                        if (next && next.innerText) {
                            price = next.innerText.replace(/\s/g, '').replace(',', '.');
                            break;
                        }
                    }
                }

                if (!price) {
                    sendResponse({ 
                        success: false, 
                        error: 'Impossible de récupérer le prix' 
                    });
                    return true;
                }

                sendResponse({ 
                    success: true, 
                    data: { ticker, price } 
                });
            } catch (error) {
                sendResponse({ 
                    success: false, 
                    error: error.message 
                });
            }
            return true;
        
        default:
            console.warn('Message type non reconnu:', message.type);
            sendResponse({ success: false, error: 'Message type non reconnu' });
    }
    return true; // Indique que la réponse sera envoyée de manière asynchrone
});

// Initialisation
console.log('Content script initialisé'); 