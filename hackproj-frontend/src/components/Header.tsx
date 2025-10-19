import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import iconLogo from '../assets/OmniVST_icon.png';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={iconLogo}
              alt="OmniVST"
              className="w-12 h-12"
            />
            <span className="text-2xl font-bold text-[#2B5F8F]">OmniVST</span>
          </Link>

          <nav className="flex gap-10 items-center">
            <Link
              to="/"
              className={`text-base font-medium ${isActive('/') ? 'text-[#2B5F8F]' : 'text-gray-700 hover:text-[#2B5F8F]'} transition-colors`}
            >
              Home
            </Link>
            {user && (
              <>
                <Link
                  to="/vst-panel"
                  className={`text-base font-medium ${isActive('/vst-panel') ? 'text-[#2B5F8F]' : 'text-gray-700 hover:text-[#2B5F8F]'} transition-colors`}
                >
                  VST Panel
                </Link>
                <Link
                  to="/profile"
                  className={`text-base font-medium ${isActive('/profile') ? 'text-[#2B5F8F]' : 'text-gray-700 hover:text-[#2B5F8F]'} transition-colors`}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 text-base font-medium text-gray-700 hover:text-red-600 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
