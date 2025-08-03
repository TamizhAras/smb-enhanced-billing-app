import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineToast, setShowOfflineToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineToast(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineToast(true);
      // Hide toast after 5 seconds
      setTimeout(() => setShowOfflineToast(false), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showOfflineToast) {
    return null;
  }

  return (
    <>
      {/* Offline Toast */}
      {showOfflineToast && (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 mx-auto max-w-md">
            <WifiOff className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">You're offline</p>
              <p className="text-sm">Don't worry, the app works offline! Your data is saved locally.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Persistent offline indicator in top bar */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-yellow-900 text-center py-2 text-sm font-medium z-40">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            Offline Mode - All features available
            <Wifi className="h-4 w-4 opacity-50" />
          </div>
        </div>
      )}
    </>
  );
};

// Add CSS for fade-in animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
`;
document.head.appendChild(style);
