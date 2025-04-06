import React, { useState, useEffect } from 'react';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterType, setFilterType] = useState('all'); // 'all', 'buy', 'sell'

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const result = await chrome.storage.local.get(['transactions']);
      const storedTransactions = result.transactions || [];
      
      // Ajouter des IDs uniques si nécessaire
      const transactionsWithIds = storedTransactions.map((t, index) => ({
        ...t,
        id: t.id || `tx-${index}`
      }));
      
      setTransactions(transactionsWithIds);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleFilter = (type) => {
    setFilterType(type);
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formater les nombres pour l'affichage
  const formatNumber = (number, decimals = 2) => {
    const num = parseFloat(number).toFixed(decimals);
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Filtrer et trier les transactions
  const getFilteredAndSortedTransactions = () => {
    let filtered = [...transactions];
    
    // Appliquer le filtre par type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }
    
    // Appliquer le tri
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'date':
          valueA = new Date(a.timestamp).getTime();
          valueB = new Date(b.timestamp).getTime();
          break;
        case 'symbol':
          valueA = a.symbol;
          valueB = b.symbol;
          break;
        case 'amount':
          valueA = parseFloat(a.usdAmount);
          valueB = parseFloat(b.usdAmount);
          break;
        default:
          valueA = new Date(a.timestamp).getTime();
          valueB = new Date(b.timestamp).getTime();
      }
      
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });
    
    return filtered;
  };

  const filteredTransactions = getFilteredAndSortedTransactions();

  return (
    <div className="transaction-history">
      <h2>Historique des Transactions</h2>
      
      <div className="transaction-filters">
        <div className="filter-buttons">
          <button 
            className={filterType === 'all' ? 'active' : ''} 
            onClick={() => handleFilter('all')}
          >
            Toutes
          </button>
          <button 
            className={filterType === 'buy' ? 'active' : ''} 
            onClick={() => handleFilter('buy')}
          >
            Achats
          </button>
          <button 
            className={filterType === 'sell' ? 'active' : ''} 
            onClick={() => handleFilter('sell')}
          >
            Ventes
          </button>
        </div>
        
        <div className="sort-buttons">
          <button onClick={() => handleSort('date')}>
            Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button onClick={() => handleSort('symbol')}>
            Symbole {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button onClick={() => handleSort('amount')}>
            Montant {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>
      
      {filteredTransactions.length === 0 ? (
        <div className="no-transactions">
          Aucune transaction à afficher
        </div>
      ) : (
        <div className="transaction-list">
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
              <div className="transaction-main-info">
                <div className="transaction-symbol">{transaction.symbol}</div>
                <div className="transaction-amount">{formatNumber(transaction.amount, 2)}</div>
              </div>
              <div className="transaction-price-info">
                <div className="transaction-price">${formatNumber(transaction.price, 2)}</div>
                <div className="transaction-total">${formatNumber(transaction.usdAmount, 2)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory; 