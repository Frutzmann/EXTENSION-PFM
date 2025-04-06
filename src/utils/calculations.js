// Calcul du coût moyen d'acquisition
export const calculateAverageCost = (transactions, symbol) => {
  const symbolTransactions = transactions.filter(t => t.symbol === symbol);
  let totalCost = 0;
  let totalAmount = 0;

  symbolTransactions.forEach(transaction => {
    if (transaction.type === 'buy') {
      totalCost += transaction.amount * transaction.price;
      totalAmount += transaction.amount;
    } else {
      totalCost -= transaction.amount * transaction.price;
      totalAmount -= transaction.amount;
    }
  });

  return totalAmount > 0 ? totalCost / totalAmount : 0;
};

// Calcul du profit/perte
export const calculatePnL = (holding, currentPrice) => {
  const { amount, averageCost } = holding;
  return (currentPrice - averageCost) * amount;
};

// Calcul du pourcentage de profit/perte
export const calculatePnLPercentage = (holding, currentPrice) => {
  const { averageCost } = holding;
  return ((currentPrice - averageCost) / averageCost) * 100;
};

// Calcul de la valeur totale du portefeuille
export const calculatePortfolioValue = (portfolio, currentPrices) => {
  return portfolio.reduce((total, holding) => {
    const currentPrice = currentPrices[holding.symbol] || 0;
    return total + (holding.amount * currentPrice);
  }, 0);
};

// Calcul de la répartition par crypto
export const calculateAllocation = (portfolio, currentPrices) => {
  const totalValue = calculatePortfolioValue(portfolio, currentPrices);
  
  return portfolio.map(holding => {
    const currentPrice = currentPrices[holding.symbol] || 0;
    const value = holding.amount * currentPrice;
    return {
      symbol: holding.symbol,
      value,
      percentage: (value / totalValue) * 100
    };
  });
};

// Calcul des métriques de performance
export const calculatePerformanceMetrics = (transactions, currentPrices) => {
  const metrics = {
    totalInvested: 0,
    currentValue: 0,
    totalPnL: 0,
    pnlPercentage: 0
  };

  transactions.forEach(transaction => {
    if (transaction.type === 'buy') {
      metrics.totalInvested += transaction.amount * transaction.price;
    }
  });

  // Calcul de la valeur actuelle basée sur les prix actuels
  const portfolio = calculatePortfolioFromTransactions(transactions);
  metrics.currentValue = calculatePortfolioValue(portfolio, currentPrices);
  
  metrics.totalPnL = metrics.currentValue - metrics.totalInvested;
  metrics.pnlPercentage = (metrics.totalPnL / metrics.totalInvested) * 100;

  return metrics;
};

// Conversion d'un montant d'une devise à une autre
export const convertCurrency = (amount, fromCurrency, toCurrency, rates) => {
  if (fromCurrency === toCurrency) return amount;
  const rate = rates[`${fromCurrency}_${toCurrency}`];
  return amount * rate;
}; 