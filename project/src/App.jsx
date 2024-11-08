import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './pages/Layout';
import Home from './pages/Home';
import Blogs from './pages/Blogs';
import NoPage from './pages/NoPage';
import PlacesRoute from './pages/PlacesRoute';
import About from './pages/About';
import BlogsDetails from './pages/BlogsDetails';
import Login from './components/Login/LoginForm';
import BookingPage from './components/Booking/BookingPage';
import HomeAdmin from './pages/HomeAdmin'; // Import the HomeAdmin component
import AOS from 'aos';
import 'aos/dist/aos.css';
import { AuthProvider } from './AuthContext';

const App = () => {
  React.useEffect(() => {
    AOS.init({
      offset: 100,
      duration: 900,
      easing: 'ease-in-sine',
      delay: 100,
    });
    AOS.refresh();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="blogs" element={<Blogs />} />
            <Route path="blogs/:id" element={<BlogsDetails />} />
            <Route path="best-places" element={<PlacesRoute />} />
            <Route path="about" element={<About />} />
            <Route path="login" element={<Login />} />
            <Route path="*" element={<NoPage />} />
            <Route path="/Booking" element={<BookingPage />} />
            <Route path="dashboard" element={<HomeAdmin />} /> {/* Add the route for HomeAdmin */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;