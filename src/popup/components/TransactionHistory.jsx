import React, { useState, useEffect } from 'react';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    // TODO: Charger l'historique des transactions depuis le storage
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    // TODO: Implémenter le chargement des transactions
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="transaction-history">
      <h2>Historique des Transactions</h2>
      <div className="transaction-filters">
        <button onClick={() => handleSort('date')}>
          Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button onClick={() => handleSort('symbol')}>
          Symbole {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>
      <div className="transaction-list">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="transaction-item">
            <span className="date">{new Date(transaction.date).toLocaleDateString()}</span>
            <span className="type">{transaction.type === 'buy' ? 'Achat' : 'Vente'}</span>
            <span className="symbol">{transaction.symbol}</span>
            <span className="amount">{transaction.amount}</span>
            <span className="price">{transaction.price}</span>
            <span className="total">{transaction.total}</span>
            {transaction.notes && (
              <span className="notes">{transaction.notes}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory; 