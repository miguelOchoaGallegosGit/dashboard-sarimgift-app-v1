import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { OrderEntry } from './pages/OrderEntry/OrderEntry';
import { Dashboard } from './pages/Dashboard/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<OrderEntry />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
