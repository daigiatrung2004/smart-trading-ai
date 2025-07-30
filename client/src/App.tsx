import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Smart Trading AI Dashboard</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/trading" element={<div>Trading Panel</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
