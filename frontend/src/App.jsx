import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ServiceList from './pages/ServiceList/ServiceList';
import ServiceDetail from './pages/ServiceDetail/ServiceDetail';
import ServiceManagement from './pages/Admin/Services';
import CategoryManagement from './pages/Admin/Categories';
import Booking from "./pages/Booking/Booking";
import BookingManagement from "./pages/Admin/Bookings";


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
        <Route path="/admin" element={<Navigate to="/admin/services" />} />
        <Route path="/admin/service" element={<ServiceManagement />} />
        <Route path="/admin/services" element={<ServiceManagement />} />
        <Route path="/admin/categories" element={<CategoryManagement />} />
        <Route path="/admin/booking" element={<BookingManagement />} />
        <Route path="/admin/bookings" element={<BookingManagement />} />
        <Route path="/booking" element={<Booking />} />

        {/* Thêm các route khác ở đây */}
      </Routes>
    </Router>
  );
}

export default App;
