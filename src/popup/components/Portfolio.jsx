import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const Portfolio = ({ onSelectCrypto }) => {
  const [holdings, setHoldings] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [usdBalance, setUsdBalance] = useState(100000); // Solde initial de 100,000 USD
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [currentTradingViewData, setCurrentTradingViewData] = useState({
    ticker: '',
    price: 0
  });

  const formatNumber = (number) => {
    const [integerPart, decimalPart] = number.toString().split('.');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  };

  const updateBySymbol = (symbol, price) => {
    setHoldings(currentHoldings => {
      return currentHoldings.map(holding => {
        if (holding.symbol === symbol) {
          return {
            ...holding,
            currentPrice: price // Ajouter le prix actuel
          };
        }
        return holding;
      });
    });

    // Mettre à jour les prix actuels
    setCurrentTradingViewData(prev => ({
      ...prev,
      ticker: symbol,
      price: price
    }));
  };

  // Simplifier en une seule fonction de mise à jour
  const updatePortfolioValue = (ticker, currentPrice) => {
    // Mettre à jour les données TradingView
    setCurrentTradingViewData(prevData => {
      const newData = {
        ticker,
        price: currentPrice
      };
      
      // Utiliser une fonction de callback pour setTotalValue pour avoir accès aux holdings à jour
      setTotalValue(currentValue => {
        return holdings.reduce((sum, holding) => {
          const price = holding.symbol === ticker ? currentPrice : holding.averagePrice;
          return sum + (holding.amount * price);
        }, 0);
      });

      return newData;
    });
  };

  const loadPortfolio = async () => {
    try {
      const result = await chrome.storage.local.get(['transactions', 'usdBalance']);
      const transactions = result.transactions || [];
      let currentBalance = result.usdBalance ?? 100000;

      const holdingsMap = new Map();

      // Traiter les transactions dans l'ordre chronologique
      transactions.sort((a, b) => a.timestamp - b.timestamp);

      transactions.forEach(transaction => {
        const { symbol, amount, type, price, usdAmount } = transaction;
        
        // Mettre à jour le solde USD
        if (type === 'buy') {
          currentBalance -= usdAmount;
        } else {
          currentBalance += usdAmount;
        }

        if (!holdingsMap.has(symbol)) {
          holdingsMap.set(symbol, {
            symbol,
            amount: 0,
            averagePrice: 0,
            totalCost: 0,
            currentPrice: price
          });
        }

        const holding = holdingsMap.get(symbol);
        
        // Vérifier si la vente est possible
        if (type === 'sell' && holding.amount < amount) {
          // Ignorer la transaction de vente si pas assez d'actifs
          return;
        }

        // Mettre à jour le holding
        if (type === 'buy') {
          holding.totalCost += amount * price;
          holding.amount += amount;
        } else {
          holding.totalCost = (holding.amount - amount) * holding.averagePrice;
          holding.amount -= amount;
        }

        if (holding.amount > 0) {
          holding.averagePrice = holding.totalCost / holding.amount;
        } else {
          // Réinitialiser le holding si plus d'actifs
          holding.averagePrice = 0;
          holding.totalCost = 0;
        }
      });

      // Mettre à jour le solde USD
      setUsdBalance(currentBalance);

      const activeHoldings = Array.from(holdingsMap.values())
        .filter(holding => holding.amount > 0);

      setHoldings(activeHoldings);
      
      // La valeur totale sera mise à jour par le useEffect
    } catch (error) {
      console.error('Erreur lors du chargement du portfolio:', error);
    }
  };

  // Fonction pour récupérer les données de TradingView
  const fetchTradingViewData = async () => {
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
          const { ticker, price } = response.data;
          // Utiliser directement updatePortfolioValue
          updatePortfolioValue(ticker, parseFloat(price));
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
    }
  };

  // Ajouter un useEffect pour surveiller les changements de holdings et usdBalance
  useEffect(() => {
    // Calculer la valeur des actifs
    const holdingsValue = holdings.reduce((sum, holding) => {
      const price = holding.symbol === currentTradingViewData.ticker 
        ? currentTradingViewData.price 
        : holding.averagePrice;
      return sum + (holding.amount * price);
    }, 0);

    // La valeur totale est la somme du solde USD et de la valeur des actifs
    setTotalValue(usdBalance + holdingsValue);
  }, [holdings, currentTradingViewData, usdBalance]);

  useEffect(() => {
    const init = async () => {
      await loadPortfolio();
      await fetchTradingViewData();
    };
    
    init();
    const updateInterval = setInterval(fetchTradingViewData, 1000);
    return () => clearInterval(updateInterval);
  }, []);

  // Fonction pour gérer la modification du solde
  const handleBalanceEdit = async () => {
    const balance = parseFloat(newBalance);
    if (isNaN(balance) || balance < 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    try {
      await chrome.storage.local.set({ usdBalance: balance });
      setUsdBalance(balance);
      setIsEditingBalance(false);
      setNewBalance('');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du solde:', error);
      alert('Erreur lors de la mise à jour du solde');
    }
  };

  const handleResetPortfolio = async () => {
    if (showResetConfirm) {
      try {
        // Réinitialiser le solde USD à 100,000
        await chrome.storage.local.set({ 
          usdBalance: 100000,
          transactions: [] 
        });
        
        // Réinitialiser l'état local
        setUsdBalance(100000);
        setHoldings([]);
        setTotalValue(0);
        setShowResetConfirm(false);
      } catch (error) {
        console.error('Erreur lors de la réinitialisation du portefeuille:', error);
      }
    } else {
      setShowResetConfirm(true);
      // Cacher la confirmation après 3 secondes si l'utilisateur ne confirme pas
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  const exportToExcel = async () => {
    try {
      // Récupérer toutes les transactions
      const result = await chrome.storage.local.get(['transactions']);
      const transactions = result.transactions || [];

      // Créer un nouveau workbook
      const wb = XLSX.utils.book_new();

      // Feuille de résumé du portfolio
      const summaryData = [
        ['Portfolio Summary'],
        ['USD Balance', `$${formatNumber(usdBalance.toFixed(2))}`],
        ['Total Portfolio Value', `$${formatNumber(totalValue.toFixed(2))}`],
        [],
        ['Active Holdings'],
        ['Asset', 'Amount', 'Average Price', 'Current Value']
      ];

      // Ajouter les holdings actifs au résumé
      holdings.forEach(holding => {
        const currentPrice = holding.symbol === currentTradingViewData.ticker 
          ? currentTradingViewData.price 
          : holding.averagePrice;
        
        summaryData.push([
          holding.symbol,
          formatNumber(holding.amount.toFixed(8)),
          `$${formatNumber(holding.averagePrice.toFixed(2))}`,
          `$${formatNumber((holding.amount * currentPrice).toFixed(2))}`
        ]);
      });

      // Créer la feuille de résumé
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Portfolio Summary');

      // Grouper les transactions par symbole
      const transactionsBySymbol = transactions.reduce((acc, transaction) => {
        if (!acc[transaction.symbol]) {
          acc[transaction.symbol] = [];
        }
        acc[transaction.symbol].push(transaction);
        return acc;
      }, {});

      // Créer une feuille pour chaque actif
      Object.entries(transactionsBySymbol).forEach(([symbol, assetTransactions]) => {
        const assetData = [
          [`${symbol} Transactions`],
          ['Date', 'Type', 'Amount', 'Price', 'Total USD', 'Portfolio Balance After']
        ];

        let runningBalance = 0;
        assetTransactions
          .sort((a, b) => a.timestamp - b.timestamp)
          .forEach(transaction => {
            if (transaction.type === 'buy') {
              runningBalance += transaction.amount;
            } else {
              runningBalance -= transaction.amount;
            }

            assetData.push([
              new Date(transaction.timestamp).toLocaleString(),
              transaction.type.toUpperCase(),
              formatNumber(transaction.amount.toFixed(8)),
              `$${formatNumber(transaction.price.toFixed(2))}`,
              `$${formatNumber(transaction.usdAmount.toFixed(2))}`,
              formatNumber(runningBalance.toFixed(8))
            ]);
          });

        const assetSheet = XLSX.utils.aoa_to_sheet(assetData);
        XLSX.utils.book_append_sheet(wb, assetSheet, symbol);
      });

      // Générer et télécharger le fichier
      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `portfolio_export_${date}.xlsx`);
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
    }
  };

  return (
    <div className="portfolio">
      <button 
        className="export-button-large"
        onClick={exportToExcel}
        title="Exporter vers Excel"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M2.859 2.877l12.57-1.795a.5.5 0 0 1 .571.495v20.846a.5.5 0 0 1-.57.495L2.858 21.123a1 1 0 0 1-.859-.99V3.867a1 1 0 0 1 .859-.99zM17 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4V3zm-6.8 9L13 8h-2.4L9 10.286 7.4 8H5l2.8 4L5 16h2.4L9 13.714 10.6 16H13l-2.8-4z"/>
        </svg>
        <span>Exporter le portfolio</span>
      </button>

      <div className="portfolio-summary">
        <div className="balance-card">
          <div className="balance-header">
            <h3>Solde USD</h3>
            <button 
              className="reset-portfolio-button"
              onClick={handleResetPortfolio}
              style={{ backgroundColor: showResetConfirm ? 'var(--danger-color)' : '#f7931a' }}
            >
              {showResetConfirm ? 'Confirmer la réinitialisation' : 'Réinitialiser le portefeuille'}
            </button>
          </div>
          {isEditingBalance ? (
            <div className="balance-edit-form">
              <input
                type="number"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="Nouveau solde"
                min="0"
                step="0.01"
              />
              <div className="balance-edit-buttons">
                <button onClick={handleBalanceEdit}>Sauvegarder</button>
                <button onClick={() => {
                  setIsEditingBalance(false);
                  setNewBalance('');
                }}>Annuler</button>
              </div>
            </div>
          ) : (
            <div className="usd-balance-container">
              <div className="usd-balance">${formatNumber(usdBalance.toFixed(2))}</div>
              <button 
                className="edit-balance-button"
                onClick={() => {
                  setIsEditingBalance(true);
                  setNewBalance(usdBalance.toString());
                }}
                title="Modifier le solde"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
            </div>
          )}
        </div>
        <div className="total-value-card">
          <h3>Valeur Totale du Portfolio</h3>
          <div className="total-value">${formatNumber(totalValue.toFixed(2))}</div>
        </div>
      </div>

      <div className="holdings-list">
        {holdings.length === 0 ? (
          <div className="no-holdings">
            Aucun actif en portefeuille
          </div>
        ) : (
          holdings.map(holding => (
            <div 
              key={holding.symbol} 
              className="holding-card"
              onClick={() => onSelectCrypto(holding)}
            >
              <div className="holding-header">
                <h4>{holding.symbol}</h4>
                <span className="holding-value">
                  ${formatNumber((holding.amount * (
                    holding.symbol === currentTradingViewData.ticker 
                      ? currentTradingViewData.price 
                      : holding.averagePrice
                  )).toFixed(2))}
                </span>
              </div>
              <div className="holding-details">
                <div className="holding-amount">
                  {formatNumber(holding.amount.toFixed(2))} {holding.symbol}
                </div>
                <div className="holding-price">
                  <div>Prix moyen: ${formatNumber(holding.averagePrice.toFixed(4))}</div>
                  {holding.symbol === currentTradingViewData.ticker && (
                    <div>Prix actuel: ${formatNumber(currentTradingViewData.price.toFixed(4))}</div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Portfolio; 