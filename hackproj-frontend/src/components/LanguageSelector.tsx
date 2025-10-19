/**
 * Language Selector Component with Autocomplete
 * Provides an autocomplete dropdown for selecting languages from Google Translate's supported languages
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { LANGUAGES, filterLanguages, getLanguageNameByCode, type Language } from '../constants/languages';

interface LanguageSelectorProps {
  value: string;
  onChange: (languageCode: string) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export function LanguageSelector({
  value,
  onChange,
  disabled = false,
  error = '',
  required = false,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLanguages, setFilteredLanguages] = useState<Language[]>(LANGUAGES);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const filtered = filterLanguages(searchQuery);
    setFilteredLanguages(filtered);
    setHighlightedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && dropdownRef.current && highlightedIndex >= 0) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (languageCode: string) => {
    onChange(languageCode);
    setIsOpen(false);
    setSearchQuery('');
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredLanguages.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredLanguages[highlightedIndex]) {
          handleSelect(filteredLanguages[highlightedIndex].code);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        inputRef.current?.blur();
        break;
    }
  };

  const displayValue = value ? getLanguageNameByCode(value) : '';

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder=" "
          value={isOpen ? searchQuery : displayValue}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required}
          autoComplete="off"
          className={`peer w-full px-4 py-3 pr-20 border-2 rounded-lg focus:outline-none transition-colors ${
            error
              ? 'border-red-300 focus:border-red-500'
              : 'border-gray-300 focus:border-[#5BA4CF]'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        <label className="absolute left-2 -top-3 bg-white px-2 text-sm font-medium text-gray-700">
          Preferred Language{required && <span className="text-red-500 ml-1">*</span>}
        </label>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredLanguages.length > 0 ? (
            filteredLanguages.map((language, index) => (
              <button
                key={language.code}
                type="button"
                onClick={() => handleSelect(language.code)}
                className={`w-full px-4 py-2.5 text-left hover:bg-[#5BA4CF] hover:text-white transition-colors ${
                  index === highlightedIndex
                    ? 'bg-[#5BA4CF] text-white'
                    : value === language.code
                    ? 'bg-blue-50'
                    : ''
                }`}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="font-medium">{language.name}</div>
                <div className="text-xs opacity-75">{language.code}</div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-center text-gray-500">
              No languages found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
