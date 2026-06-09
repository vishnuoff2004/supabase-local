import React, { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SocketProvider } from './contexts/SocketContext';
import { BookingProvider } from './contexts/BookingContext';
import AnnouncementBanner from './components/AnnouncementBanner';
import './styles/design-system.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <NotificationProvider>
        <AuthProvider>
          <SocketProvider>
            <BookingProvider>
              <AnnouncementBanner />
              <AppRoutes />
            </BookingProvider>
          </SocketProvider>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;
