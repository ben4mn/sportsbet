import { createContext, useContext, useState, useCallback } from 'react';

const ParlayContext = createContext(null);

export function ParlayProvider({ children }) {
  const [legs, setLegs] = useState([]);
  const [stake, setStake] = useState(10);

  const addLeg = useCallback((leg) => {
    if (legs.length >= 12) {
      throw new Error('Maximum 12 legs allowed');
    }

    // Check for duplicate
    const isDuplicate = legs.some(
      l => l.gameId === leg.gameId && l.type === leg.type && l.selection === leg.selection
    );

    if (isDuplicate) {
      throw new Error('This selection is already in your parlay');
    }

    setLegs(prev => [...prev, { ...leg, id: Date.now() }]);
  }, [legs]);

  const removeLeg = useCallback((legId) => {
    setLegs(prev => prev.filter(l => l.id !== legId));
  }, []);

  const clearParlay = useCallback(() => {
    setLegs([]);
    setStake(10);
  }, []);

  const calculateOdds = useCallback(() => {
    if (legs.length < 2) return { decimalOdds: 0, americanOdds: 0, payout: 0 };

    let decimalOdds = 1;

    for (const leg of legs) {
      const american = leg.price;
      let decimal;

      if (american > 0) {
        decimal = (american / 100) + 1;
      } else {
        decimal = (100 / Math.abs(american)) + 1;
      }

      decimalOdds *= decimal;
    }

    // Convert back to American
    let americanOdds;
    if (decimalOdds >= 2) {
      americanOdds = Math.round((decimalOdds - 1) * 100);
    } else {
      americanOdds = Math.round(-100 / (decimalOdds - 1));
    }

    const payout = stake * decimalOdds;

    return {
      decimalOdds: Math.round(decimalOdds * 100) / 100,
      americanOdds: americanOdds > 0 ? `+${americanOdds}` : americanOdds,
      payout: Math.round(payout * 100) / 100,
      profit: Math.round((payout - stake) * 100) / 100
    };
  }, [legs, stake]);

  const value = {
    legs,
    stake,
    setStake,
    addLeg,
    removeLeg,
    clearParlay,
    calculateOdds,
    legCount: legs.length,
    isValid: legs.length >= 2 && legs.length <= 12
  };

  return (
    <ParlayContext.Provider value={value}>
      {children}
    </ParlayContext.Provider>
  );
}

export function useParlay() {
  const context = useContext(ParlayContext);
  if (!context) {
    throw new Error('useParlay must be used within ParlayProvider');
  }
  return context;
}

export default ParlayContext;
