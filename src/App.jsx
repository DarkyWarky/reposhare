import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Sidebar from './components/Sidebar';
import FileControl from './utils/FileControl';

const App = () => {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-900 ">
        <Sidebar />
        <div className="flex-1">
          <Routes>
            <Route path='/' element={<Home />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
