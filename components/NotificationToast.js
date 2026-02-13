'use client';

/**
 * Notification Toast Component
 * 
 * Auto-dismissing toast notifications for real-time updates
 * Features:
 * - Auto-dismiss after 5 seconds
 * - Custom icons and colors by type
 * - Stack multiple toasts
 * - Sound alerts (optional)
 * - Smooth animations
 * 
 * @usage
 * Place <ToastContainer /> in your root layout
 * System will automatically emit notifications via custom events
 */

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, Bell } from 'lucide-react';

/**
 * Individual Toast Component
 */
export function NotificationToast({ notification, onClose, index }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  /**
   * Auto-dismiss toast after 5 seconds
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      // Wait for exit animation before removing
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  /**
   * Handle manual close
   */
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  /**
   * Get icon component based on notification type
   */
  const getIcon = (type) => {
    switch (type) {
      case 'quote_received':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'quote_accepted':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'quote_rejected':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  /**
   * Get styling classes based on notification type
   */
  const getStyles = (type) => {
    switch (type) {
      case 'quote_received':
        return {
          container: 'bg-blue-50 border-blue-200',
          title: 'text-blue-900',
          text: 'text-blue-700'
        };
      case 'quote_accepted':
        return {
          container: 'bg-green-50 border-green-200',
          title: 'text-green-900',
          text: 'text-green-700'
        };
      case 'quote_rejected':
        return {
          container: 'bg-red-50 border-red-200',
          title: 'text-red-900',
          text: 'text-red-700'
        };
      case 'success':
        return {
          container: 'bg-green-50 border-green-200',
          title: 'text-green-900',
          text: 'text-green-700'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200',
          title: 'text-red-900',
          text: 'text-red-700'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          title: 'text-yellow-900',
          text: 'text-yellow-700'
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200',
          title: 'text-blue-900',
          text: 'text-blue-700'
        };
    }
  };

  const styles = getStyles(notification.type);

  /**
   * Play optional sound alert
   */
  const playSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set frequency and duration for a pleasant notification sound
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (err) {
      // Audio not supported or user denied permission - silently fail
      console.debug('Audio notification not available');
    }
  };

  // Play sound on mount (optional - can be disabled)
  useEffect(() => {
    // Uncomment to enable sound alerts
    // playSound();
  }, []);

  return (
    <div
      className={`transform transition-all duration-300 ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
      style={{
        animation: isExiting ? 'slideOut 0.3s ease-out' : 'slideIn 0.3s ease-out'
      }}
    >
      <div
        className={`max-w-sm p-4 rounded-lg shadow-lg border ${styles.container} pointer-events-auto`}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(notification.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${styles.title}`}>
              {notification.title}
            </p>
            {(notification.body || notification.message) && (
              <p className={`text-sm mt-1 ${styles.text}`}>
                {notification.body || notification.message}
              </p>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className={`flex-shrink-0 transition ${
              notification.type === 'quote_received'
                ? 'text-blue-400 hover:text-blue-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            aria-label="Close notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              notification.type === 'quote_accepted'
                ? 'bg-green-500'
                : notification.type === 'quote_rejected'
                ? 'bg-red-500'
                : 'bg-blue-500'
            }`}
            style={{
              animation: 'shrink 5s linear forwards'
            }}
          ></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }

        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Toast Container Component
 * 
 * Place this in your root layout to enable toast notifications
 * Listens for 'notification:new' events from useNotifications hook
 * 
 * @usage
 * // In your root layout
 * <ToastContainer />
 */
export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  /**
   * Listen for notification events
   */
  useEffect(() => {
    function handleNotification(e) {
      const notification = e.detail;
      const id = Date.now() + Math.random(); // Unique ID with timestamp

      setToasts(prev => [...prev, { id, ...notification }]);
    }

    window.addEventListener('notification:new', handleNotification);

    return () => {
      window.removeEventListener('notification:new', handleNotification);
    };
  }, []);

  /**
   * Remove toast by ID
   */
  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <>
      {/* Animations and Styles */}
      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-3 pointer-events-none">
        {toasts.map((toast, index) => (
          <div key={toast.id} className="pointer-events-auto">
            <NotificationToast
              notification={toast}
              onClose={() => removeToast(toast.id)}
              index={index}
            />
          </div>
        ))}
      </div>
    </>
  );
}
