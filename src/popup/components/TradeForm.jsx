import React, { useState, useEffect } from 'react';

const TradeForm = () => {
  const [currentData, setCurrentData] = useState({
    ticker: '',
    price: 0
  });
  const [usdAmount, setUsdAmount] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState(0);
  const [transactionType, setTransactionType] = useState('buy');

  // Fonction pour récupérer les données actuelles
  const fetchCurrentData = async () => {
    try {
      const [tab] = await chrome.tabs.query({ 
        active: true, 
        currentWindow: true,
        url: "*://*.tradingview.com/*"
      });

      if (tab) {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'MANUAL_SCRAPE'
        });

        if (response.success) {
          setCurrentData({
            ticker: response.data.ticker,
            price: parseFloat(response.data.price)
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
    }
  };

  useEffect(() => {
    // Récupération initiale
    fetchCurrentData();

    // Mettre en place l'intervalle de mise à jour
    const updateInterval = setInterval(fetchCurrentData, 1000);

    // Écouter également les mises à jour de prix
    const handlePriceUpdate = (message) => {
      if (message.type === 'PRICE_UPDATED') {
        setCurrentData({
          ticker: message.data.ticker,
          price: message.data.price
        });
      }
    };

    chrome.runtime.onMessage.addListener(handlePriceUpdate);
    
    // Nettoyer l'intervalle et le listener lors du démontage
    return () => {
      clearInterval(updateInterval);
      chrome.runtime.onMessage.removeListener(handlePriceUpdate);
    };
  }, []);

  // Nouvelle fonction pour calculer la quantité de crypto
  const calculateCryptoAmount = (usdValue, price) => {
    if (!price || !usdValue) return 0;
    return usdValue / price;
  };

  // Mettre à jour quand le montant USD change
  useEffect(() => {
    const amount = calculateCryptoAmount(parseFloat(usdAmount), currentData.price);
    setCryptoAmount(amount);
  }, [usdAmount, currentData.price]);

  const handleTransaction = async (type) => {
    if (!usdAmount || parseFloat(usdAmount) <= 0) {
      alert('Veuillez entrer un montant USD valide');
      return;
    }

    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_TRANSACTION',
        transaction: {
          type,
          symbol: currentData.ticker,
          amount: cryptoAmount,
          price: currentData.price,
          usdAmount: parseFloat(usdAmount),
          timestamp: new Date().toISOString()
        }
      });

      // Réinitialiser le formulaire
      setUsdAmount('');
      setCryptoAmount(0);
      alert(`${type === 'buy' ? 'Achat' : 'Vente'} effectué avec succès`);
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    }
  };

  return (
    <div className="trade-form">
      <div className="current-price-card">
        <h3>{currentData.ticker || 'Aucune crypto sélectionnée'}</h3>
        <div className="price-value">${currentData.price.toFixed(4)}</div>
      </div>

      <div className="form-group">
        <label>Montant USD à {transactionType === 'buy' ? 'investir' : 'récupérer'}</label>
        <div className="amount-input-container">
          <input
            type="number"
            value={usdAmount}
            onChange={(e) => setUsdAmount(e.target.value)}
            step="any"
            placeholder="0.00"
          />
          <span className="currency-label">USD</span>
        </div>
      </div>

      <div className="form-group">
        <label>Quantité de {currentData.ticker} estimée</label>
        <div className="amount-display">
          {cryptoAmount.toFixed(8)} {currentData.ticker}
        </div>
      </div>

      <div className="transaction-buttons">
        <button 
          className="buy-button"
          onClick={() => {
            setTransactionType('buy');
            handleTransaction('buy');
          }}
          disabled={!currentData.ticker}
        >
          Acheter
        </button>
        <button 
          className="sell-button"
          onClick={() => {
            setTransactionType('sell');
            handleTransaction('sell');
          }}
          disabled={!currentData.ticker}
        >
          Vendre
        </button>
      </div>
    </div>
  );
};

export default TradeForm; 