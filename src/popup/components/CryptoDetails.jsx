import React, { useState, useEffect } from 'react';

const CryptoDetails = ({ crypto, onBack }) => {
    const [details, setDetails] = useState({
        totalValue: 0,
        transactions: [],
        portfolioPercentage: 0,
        totalPnL: 0,
        averageBuyPrice: 0,
        currentHoldings: 0,
        totalSpent: 0
    });
    const [currentMarketPrice, setCurrentMarketPrice] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadCryptoDetails();
    }, [crypto]);

    useEffect(() => {
        fetchTradingViewData();
        const interval = setInterval(fetchTradingViewData, 1000);
        return () => clearInterval(interval);
    }, [crypto.symbol]);

    const loadCryptoDetails = async () => {
        try {
            const result = await chrome.storage.local.get(['transactions']);
            const allTransactions = result.transactions || [];
            const cryptoTransactions = allTransactions.filter(t => t.symbol === crypto.symbol);

            let totalSpent = 0;
            let currentHoldings = 0;

            cryptoTransactions.forEach(t => {
                if (t.type === 'buy') {
                    totalSpent += t.amount * t.price;
                    currentHoldings += t.amount;
                } else {
                    totalSpent -= t.amount * t.price;
                    currentHoldings -= t.amount;
                }
            });

            const averageBuyPrice = currentHoldings > 0 ? totalSpent / currentHoldings : 0;

            setDetails({
                transactions: cryptoTransactions,
                averageBuyPrice,
                currentHoldings,
                totalSpent,
                totalValue: 0,
                totalPnL: 0,
                portfolioPercentage: 0
            });

        } catch (error) {
            console.error('Erreur lors du chargement des détails:', error);
        }
    };

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
                    if (ticker === crypto.symbol) {
                        setCurrentMarketPrice(parseFloat(price));
                        setError(null);
                    } else {
                        setError(`Erreur: Le symbole sur TradingView (${ticker}) ne correspond pas à la crypto sélectionnée (${crypto.symbol})`);
                    }
                }
            }
        } catch (error) {
            setError("Erreur lors de la récupération du prix actuel");
        }
    };

    useEffect(() => {
        if (currentMarketPrice && details.currentHoldings > 0) {
            const currentValue = details.currentHoldings * currentMarketPrice;
            const totalPnL = currentValue - details.totalSpent;
            
            setDetails(prev => ({
                ...prev,
                totalValue: currentValue,
                totalPnL: totalPnL
            }));
        }
    }, [currentMarketPrice, details.currentHoldings, details.totalSpent]);

    return (
        <div className="crypto-details">
            <header className="details-header">
                <button className="back-button" onClick={onBack}>
                    ← Retour
                </button>
                <h2>{crypto.symbol}</h2>
                {error && <div className="error-message">{error}</div>}
            </header>

            <div className="details-summary">
                <div className="summary-card">
                    <h3>Quantité Totale</h3>
                    <div className="value">{details.currentHoldings.toFixed(4)} {crypto.symbol}</div>
                </div>

                <div className="summary-card">
                    <h3>Prix Moyen d'Achat</h3>
                    <div className="value">${details.averageBuyPrice.toFixed(4)}</div>
                </div>

                <div className="summary-card">
                    <h3>Prix Actuel</h3>
                    <div className="value">
                        {currentMarketPrice ? `$${currentMarketPrice.toFixed(4)}` : 'Chargement...'}
                    </div>
                </div>

                <div className="summary-card">
                    <h3>Valeur Totale</h3>
                    <div className="value">${details.totalValue.toFixed(2)}</div>
                </div>

                <div className="summary-card">
                    <h3>P&L Total</h3>
                    <div className={`value ${details.totalPnL >= 0 ? 'positive' : 'negative'}`}>
                        ${details.totalPnL.toFixed(2)}
                        {currentMarketPrice && (
                            <span className="pnl-percentage">
                                ({((details.totalPnL / details.totalSpent) * 100).toFixed(2)}%)
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="transactions-history">
                <h3>Historique des Transactions</h3>
                <div className="transactions-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Montant</th>
                                <th>Prix</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {details.transactions.map((transaction, index) => (
                                <tr key={index} className={transaction.type}>
                                    <td>
                                        <span className={`type-badge ${transaction.type}`}>
                                            {transaction.type === 'buy' ? 'Achat' : 'Vente'}
                                        </span>
                                    </td>
                                    <td>{transaction.amount.toFixed(8)} {crypto.symbol}</td>
                                    <td>${transaction.price.toFixed(2)}</td>
                                    <td>${(transaction.amount * transaction.price).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CryptoDetails; 