import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ServiceList from './pages/ServiceList/ServiceList';
import ServiceDetail from './pages/ServiceDetail/ServiceDetail';
import './App.css';

function App() {
  console.log("App Rendering - Current URL:", window.location.pathname);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/services" />} />
        <Route path="/home" element={<Navigate to="/services" />} />
        <Route path="/services/detail/:id" element={<ServiceDetail />} />
        <Route path="/services/:categoryName" element={<ServiceList />} />
        <Route path="/services" element={<ServiceList />} />
        {/* Thêm các route khác ở đây */}
      </Routes>
    </Router>
  );
}

export default App;
