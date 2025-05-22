import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/Authcontext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import VerifyOrganization from './components/VerifyOrganization';
import Login from './pages/Login';
import VerifyEmail from './components/VerifyEmail';
import Profile from './pages/Profile';
import RegisterOrganization from './pages/RegisterOrganization';
import EventDashboard from './components/ODashboard';
import ProtectedRoute from './api/PrivateRoute';
import PrivateRoute from './api/PrivateRoute';
import {PaymentProcessing} from './components/PAY/PaymentProcessing';
import {PaymentSuccess} from './components/PAY/PaymentSuccess';
import Register from './pages/Register';
import EventDetailsPage from './components/EventDetails';
import Events from './pages/Events';
import OrgDashboard from './pages/OrgDashboard';
import ErrorBoundary from './api/ErrorBoundary';
import CreateEvent from './components/CreateEvent';

const stripePromise = loadStripe(import.meta.env.VITE_SRIPE_PUBLIC_KEY);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/events" element={<Events />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/event-dashboard" element={<PrivateRoute><EventDashboard /></PrivateRoute>} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-organization" element={<VerifyOrganization />} />
          <Route path="/payment-processing" element={<PaymentProcessing />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/create-event" element={<PrivateRoute><CreateEvent /></PrivateRoute>} />
          <Route
            path="/event/:eventId"
            element={
              <ErrorBoundary>
                <Elements stripe={stripePromise}>
                  <EventDetailsPage />
                </Elements>
              </ErrorBoundary>
            }
          />
          <Route
            path="/organizer/dashboard"
            element={<PrivateRoute>
              <OrgDashboard />
            </PrivateRoute>}
          />
          <Route path="/register-organization" element={<ProtectedRoute><RegisterOrganization /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;