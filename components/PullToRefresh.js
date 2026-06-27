'use client';
import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

const RefreshContext = createContext(null);

const THRESHOLD = 70;
const MAX_PULL = 100;
const RESISTANCE = 0.5;

export function PullToRefreshProvider({ children }) {
  const mainRef = useRef(null);
  const refreshFnRef = useRef(null);
  const drag = useRef({ startY: 0, active: false });
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const register = useCallback((fn) => {
    refreshFnRef.current = fn;
    return () => { if (refreshFnRef.current === fn) refreshFnRef.current = null; };
  }, []);

  const onTouchStart = useCallback((e) => {
    if (refreshing || !refreshFnRef.current) return;
    // Bail while a modal (BottomSheet/ConfirmDialog) has body scroll locked, or mid-list.
    if (document.body.style.overflow === 'hidden') return;
    if (mainRef.current.scrollTop > 0) return;
    drag.current = { startY: e.touches[0].clientY, active: true };
  }, [refreshing]);

  const onTouchMove = useCallback((e) => {
    if (!drag.current.active) return;
    const dy = e.touches[0].clientY - drag.current.startY;
    if (dy <= 0 || mainRef.current.scrollTop > 0) {
      drag.current.active = false;
      setPull(0);
      return;
    }
    setPull(Math.min(dy * RESISTANCE, MAX_PULL));
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (pull >= THRESHOLD && refreshFnRef.current) {
      setRefreshing(true);
      setPull(THRESHOLD);
      Promise.resolve(refreshFnRef.current())
        .catch(console.error)
        .finally(() => { setRefreshing(false); setPull(0); });
    } else {
      setPull(0);
    }
  }, [pull]);

  return (
    <RefreshContext.Provider value={register}>
      <main
        ref={mainRef}
        style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            height: pull,
            overflow: 'hidden',
            transition: drag.current.active ? 'none' : 'height 0.25s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <div
            className={refreshing ? 'animate-spin' : ''}
            style={{
              width: 20,
              height: 20,
              marginBottom: 12,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.15)',
              borderTopColor: 'rgba(255,255,255,0.65)',
              opacity: Math.min(pull / THRESHOLD, 1),
              transform: refreshing ? 'none' : `rotate(${(pull / THRESHOLD) * 360}deg)`,
            }}
          />
        </div>
        {children}
      </main>
    </RefreshContext.Provider>
  );
}

/** Register a refresh handler so pulling down at the top of the page (while it's the active route) re-fetches data. */
export function usePullToRefresh(onRefresh) {
  const register = useContext(RefreshContext);
  useEffect(() => {
    if (!register) return;
    return register(onRefresh);
  }, [register, onRefresh]);
}
