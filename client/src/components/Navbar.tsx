import { useState, useEffect, useRef } from "react";
import { LogIn, LogOut, Menu, X, User, Calendar, PlusCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import toast from "react-hot-toast";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    closeMobileMenu();
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (menuRef.current && isMenuOpen && !menuRef.current.contains(event.target as Node)) {
        closeMobileMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
            EventHub
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/events"
              className="text-gray-700 hover:text-indigo-600 transition-colors flex items-center"
            >
              <Calendar className="w-5 h-5 mr-1" />
              Events
            </Link>

            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="User menu"
                  aria-expanded={isDropdownOpen}
                >
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-700" />
                    {user?.role === 'organizer' && user?.organizerInfo?.verified && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500"></span>
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">
                    {user?.name || user?.email.split('@')[0]}
                  </span>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 divide-y divide-gray-100">
                    <div className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                      {user?.role === 'organizer' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                          {user?.organizerInfo?.verified ? "Organizer" : "Pending Verification"}
                        </span>
                      )}
                    </div>
                    <div className="py-0.5">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        My Profile
                      </Link>
                      {user?.role === 'organizer' && user?.organizerInfo?.verified && (
                        <Link
                          to="organizer/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Go to Dashboard
                        </Link>
                      )}
                      <Link
                        to="/events"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Browse Events
                      </Link>
                    </div>
                    <div className="py-1 border-gray-200">
                      <Link
                        to={user?.organizerInfo?.verified ? "/create-event" : "/register-organization"}
                        className="px-5 py-2.5 rounded text-sm font-semibold bg-blue-600 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border-2 border-transparent hover:border-blue-600/30 shadow-sm hover:shadow-md active:bg-blue-800"
                      >
                        <PlusCircle className="w-5 h-5" />
                        <span>
                          {user?.organizerInfo?.verified ? "Create Event" : "Become an Organizer"}
                        </span>
                      </Link>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm rounded text-white transition-colors flex items-center bg-red-500"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="px-4 py-2 flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-100 transition-colors rounded-md"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-md"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        ref={menuRef}
        className={`md:hidden px-4 pt-2 pb-4 space-y-2 bg-white shadow-lg transition-all duration-300 ease-in-out ${isMenuOpen ? "block" : "hidden"
          }`}
      >
        <Link
          to="/events"
          onClick={closeMobileMenu}
          className="px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
        >
          <Calendar className="w-5 h-5 mr-2" />
          Events
        </Link>

        {isAuthenticated ? (
          <>
            <div className="px-3 py-3 flex items-center bg-gray-50 rounded-lg">
              <div className="bg-indigo-100 p-2 rounded-full">
                <User className="w-5 h-5 text-indigo-600" />
                {user?.role === 'organizer' && user?.organizerInfo?.verified && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500"></span>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.name || "My Account"}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                {user?.role === 'organizer' && (
                  <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {user?.organizerInfo?.verified ? "Organizer" : "Pending Verification"}
                  </span>
                )}
              </div>
            </div>

            <Link
              to="/profile"
              onClick={closeMobileMenu}
              className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              My Profile
            </Link>
            <Link
              to={user?.organizerInfo?.verified ? "/create-event" : "/register-organization"}
              onClick={closeMobileMenu}
              className="px-3 py-3 rounded-md text-base font-medium text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              {user?.organizerInfo?.verified ? "Create Event" : "Complete Organizer Profile"}
            </Link>
            <button
              onClick={handleLogout}
              className="w-full px-3 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              onClick={closeMobileMenu}
              className="px-3 py-3 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Login
            </Link>
            <Link
              to="/register"
              onClick={closeMobileMenu}
              className="px-3 py-3 rounded-md text-base font-medium text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center"
            >
              Create Account
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}