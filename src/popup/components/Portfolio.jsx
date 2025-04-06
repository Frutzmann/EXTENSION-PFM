import React, { useState, useEffect } from 'react';

const Portfolio = ({ onSelectCrypto }) => {
  const [holdings, setHoldings] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [usdBalance, setUsdBalance] = useState(100000); // Solde initial de 100,000 USD
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
      // Récupérer le solde USD stocké ou utiliser la valeur par défaut
      const storedUsdBalance = result.usdBalance ?? 100000;
      setUsdBalance(storedUsdBalance);

      const holdingsMap = new Map();

      transactions.forEach(transaction => {
        const { symbol, amount, type, price, usdAmount } = transaction;
        
        // Mettre à jour le solde USD
        if (type === 'buy') {
          setUsdBalance(prev => prev - usdAmount);
        } else {
          setUsdBalance(prev => prev + usdAmount);
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
        
        if (type === 'buy') {
          holding.totalCost += amount * price;
          holding.amount += amount;
        } else {
          holding.totalCost -= amount * price;
          holding.amount -= amount;
        }

        if (holding.amount > 0) {
          holding.averagePrice = holding.totalCost / holding.amount;
        }
      });

      const activeHoldings = Array.from(holdingsMap.values())
        .filter(holding => holding.amount > 0);

      setHoldings(activeHoldings);
      
      // Calculer la valeur totale initiale
      const initialTotal = activeHoldings.reduce((sum, holding) => {
        return sum + (holding.amount * holding.averagePrice);
      }, 0);
      setTotalValue(initialTotal);
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

  // Ajouter un useEffect pour surveiller les changements de holdings
  useEffect(() => {
    // Recalculer la valeur totale quand holdings change
    const total = holdings.reduce((sum, holding) => {
      const price = holding.symbol === currentTradingViewData.ticker 
        ? currentTradingViewData.price 
        : holding.averagePrice;
      return sum + (holding.amount * price);
    }, 0);
    setTotalValue(total);
  }, [holdings, currentTradingViewData]);

  useEffect(() => {
    const init = async () => {
      await loadPortfolio();
      await fetchTradingViewData();
    };
    
    init();
    const updateInterval = setInterval(fetchTradingViewData, 1000);
    return () => clearInterval(updateInterval);
  }, []);

  return (
    <div className="portfolio">
      <div className="portfolio-summary">
        <div className="balance-card">
          <h3>Solde USD</h3>
          <div className="usd-balance">${formatNumber(usdBalance.toFixed(2))}</div>
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