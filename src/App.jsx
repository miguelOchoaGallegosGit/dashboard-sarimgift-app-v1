import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext'; // Added import
import { Layout } from './components/Layout/Layout';
import { OrderEntry } from './pages/OrderEntry/OrderEntry';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Inventory } from './pages/Inventory/Inventory';
import { Bandeja } from './pages/Bandeja/Bandeja';
import { Cotizaciones } from './pages/Cotizaciones/Cotizaciones';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider> {/* Added ToastProvider */}
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/bandeja" element={<Bandeja />} />
              <Route path="/cotizaciones" element={<Cotizaciones />} />
              <Route path="/inventario" element={<Inventory />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ToastProvider> {/* Closed ToastProvider */}
    </ThemeProvider>
  );
}

export default App;
