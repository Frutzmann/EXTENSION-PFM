import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// Export des transactions vers Excel
export const exportTransactionsToExcel = (transactions) => {
  const worksheet = XLSX.utils.json_to_sheet(
    transactions.map(t => ({
      Date: format(new Date(t.date), 'dd/MM/yyyy'),
      Type: t.type === 'buy' ? 'Achat' : 'Vente',
      Symbole: t.symbol,
      Quantité: t.amount,
      Prix: t.price,
      Total: t.amount * t.price,
      Notes: t.notes || ''
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  
  return workbook;
};

// Export du portefeuille vers Excel
export const exportPortfolioToExcel = (portfolio, currentPrices) => {
  const worksheet = XLSX.utils.json_to_sheet(
    portfolio.map(h => ({
      Symbole: h.symbol,
      Quantité: h.amount,
      'Prix Moyen': h.averageCost,
      'Prix Actuel': currentPrices[h.symbol] || 0,
      'Valeur Totale': h.amount * (currentPrices[h.symbol] || 0),
      'P&L': (currentPrices[h.symbol] - h.averageCost) * h.amount,
      '% P&L': ((currentPrices[h.symbol] - h.averageCost) / h.averageCost) * 100
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Portefeuille');
  
  return workbook;
};

// Export des métriques de performance
export const exportPerformanceMetricsToExcel = (metrics) => {
  const worksheet = XLSX.utils.json_to_sheet([{
    'Total Investi': metrics.totalInvested,
    'Valeur Actuelle': metrics.currentValue,
    'P&L Total': metrics.totalPnL,
    '% P&L': metrics.pnlPercentage
  }]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Performance');
  
  return workbook;
};

// Fonction utilitaire pour sauvegarder un fichier Excel
export const saveExcelFile = (workbook, filename) => {
  XLSX.writeFile(workbook, filename);
};

// Export complet (toutes les données)
export const exportAllData = (transactions, portfolio, currentPrices, metrics) => {
  const workbook = XLSX.utils.book_new();
  
  // Ajout des feuilles
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(transactions.map(t => ({
      Date: format(new Date(t.date), 'dd/MM/yyyy'),
      Type: t.type === 'buy' ? 'Achat' : 'Vente',
      Symbole: t.symbol,
      Quantité: t.amount,
      Prix: t.price,
      Total: t.amount * t.price,
      Notes: t.notes || ''
    }))),
    'Transactions'
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(portfolio.map(h => ({
      Symbole: h.symbol,
      Quantité: h.amount,
      'Prix Moyen': h.averageCost,
      'Prix Actuel': currentPrices[h.symbol] || 0,
      'Valeur Totale': h.amount * (currentPrices[h.symbol] || 0),
      'P&L': (currentPrices[h.symbol] - h.averageCost) * h.amount,
      '% P&L': ((currentPrices[h.symbol] - h.averageCost) / h.averageCost) * 100
    }))),
    'Portefeuille'
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([{
      'Total Investi': metrics.totalInvested,
      'Valeur Actuelle': metrics.currentValue,
      'P&L Total': metrics.totalPnL,
      '% P&L': metrics.pnlPercentage
    }]),
    'Performance'
  );

  return workbook;
}; 