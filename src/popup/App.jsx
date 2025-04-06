import React, { useState } from 'react';
import Portfolio from './components/Portfolio';
import TradeForm from './components/TradeForm';
import CryptoDetails from './components/CryptoDetails';
import './index.css';

const App = () => {
    const [activeTab, setActiveTab] = useState('portfolio');
    const [selectedCrypto, setSelectedCrypto] = useState(null);

    if (selectedCrypto) {
        return <CryptoDetails 
            crypto={selectedCrypto} 
            onBack={() => setSelectedCrypto(null)}
        />;
    }

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>Crypto Portfolio</h1>
                <div className="price-update-info">
                    Dernière mise à jour: {new Date().toLocaleTimeString()}
                </div>
            </header>

            <nav className="app-nav">
                <button 
                    className={`nav-button ${activeTab === 'portfolio' ? 'active' : ''}`}
                    onClick={() => setActiveTab('portfolio')}
                >
                    Portfolio
                </button>
                <button 
                    className={`nav-button ${activeTab === 'trade' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trade')}
                >
                    Trade
                </button>
            </nav>

            <main className="app-content">
                {activeTab === 'portfolio' ? (
                    <Portfolio onSelectCrypto={setSelectedCrypto} />
                ) : (
                    <TradeForm />
                )}
            </main>
        </div>
    );
};

export default App; 