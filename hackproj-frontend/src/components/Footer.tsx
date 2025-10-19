import { Link } from 'react-router-dom';
import { Facebook, Youtube, Linkedin, Instagram } from 'lucide-react';
import iconLogo from '../assets/OmniVST_icon.png';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img
                src={iconLogo}
                alt="OmniVST"
                className="w-12 h-12"
              />
              <div>
                <div className="text-xl font-bold text-[#2B5F8F]">OmniVST</div>
                <div className="text-sm text-gray-600">Sign. Speak. Understand.</div>
              </div>
            </div>

            <div className="flex gap-4 mt-2">
              <a href="#" className="text-gray-500 hover:text-[#2B5F8F] transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-[#2B5F8F] transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-[#2B5F8F] transition-colors" aria-label="YouTube">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-[#2B5F8F] transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-base">
            <Link to="/how-to-omnivst" className="text-gray-700 hover:text-[#2B5F8F] transition-colors">
              How to OmniVST
            </Link>
            <Link to="/faq" className="text-gray-700 hover:text-[#2B5F8F] transition-colors">
              FQA
            </Link>
            <Link to="/learn-more" className="text-gray-700 hover:text-[#2B5F8F] transition-colors">
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
