import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

export function Preferences() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-400 to-sky-300">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/vst-panel')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold">Preferences</h1>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/translation-history')}
              className="w-full px-6 py-4 bg-sky-200 text-left font-semibold rounded hover:bg-sky-300 transition-colors"
            >
              Translation History
            </button>

            <button
              onClick={() => navigate('/saved-phrases')}
              className="w-full px-6 py-4 bg-sky-200 text-left font-semibold rounded hover:bg-sky-300 transition-colors"
            >
              Saved Phrases
            </button>

            <button
              onClick={() => navigate('/language-pairs')}
              className="w-full px-6 py-4 bg-sky-200 text-left font-semibold rounded hover:bg-sky-300 transition-colors"
            >
              Language Pairs
            </button>

            <button
              onClick={() => navigate('/review-mode')}
              className="w-full px-6 py-4 bg-sky-200 text-left font-semibold rounded hover:bg-sky-300 transition-colors"
            >
              Review Mode
            </button>
          </div>

          <div className="flex justify-center pt-6">
            <button
              onClick={() => navigate('/vst-panel')}
              className="px-8 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
            >
              Back to VST Panel
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
