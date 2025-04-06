import { useState, useEffect } from 'react';

export const useTradingViewData = (interval = 1000) => {
  const [tradingViewData, setTradingViewData] = useState({
    ticker: '',
    price: 0,
    error: null,
    isLoading: true
  });

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
          setTradingViewData({
            ticker,
            price: parseFloat(price),
            error: null,
            isLoading: false
          });
          return { ticker, price: parseFloat(price) };
        }
      }
    } catch (error) {
      setTradingViewData(prev => ({
        ...prev,
        error: "Erreur lors de la récupération du prix",
        isLoading: false
      }));
    }
    return null;
  };

  useEffect(() => {
    fetchTradingViewData();
    const updateInterval = setInterval(fetchTradingViewData, interval);
    return () => clearInterval(updateInterval);
  }, [interval]);

  return {
    ...tradingViewData,
    refetch: fetchTradingViewData
  };
}; 