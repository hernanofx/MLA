'use client';

import { useState, useEffect, useRef } from 'react';

interface Location {
  id: string;
  name: string;
  warehouse: { name: string };
}

interface SearchableLocationSelectProps {
  locations: Location[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

export default function SearchableLocationSelect({
  locations,
  value,
  onChange,
  placeholder = 'Buscar ubicación...',
  required = false,
  className = '',
  id,
}: SearchableLocationSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Update display value when value prop changes
  useEffect(() => {
    if (value) {
      const location = locations.find(loc => loc.id === value);
      if (location) {
        setDisplayValue(`${location.warehouse.name} - ${location.name}`);
        setSearchTerm(`${location.warehouse.name} - ${location.name}`);
      }
    } else {
      setDisplayValue('');
      setSearchTerm('');
    }
  }, [value, locations]);

  // Filter locations based on search term
  const filteredLocations = locations.filter(location => {
    const fullName = `${location.warehouse.name} - ${location.name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search term to display value if no selection made
        if (!value && searchTerm) {
          setSearchTerm('');
        } else if (value) {
          setSearchTerm(displayValue);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, displayValue, searchTerm]);

  const handleSelect = (location: Location) => {
    const fullName = `${location.warehouse.name} - ${location.name}`;
    setDisplayValue(fullName);
    setSearchTerm(fullName);
    onChange(location.id);
    setIsOpen(false);
  };

  const handleClear = () => {
    setDisplayValue('');
    setSearchTerm('');
    onChange('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    // Clear selection if user is typing
    if (value) {
      onChange('');
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pr-8"
          autoComplete="off"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {filteredLocations.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-sm">
              No se encontraron ubicaciones
            </div>
          ) : (
            filteredLocations.map((location) => {
              const fullName = `${location.warehouse.name} - ${location.name}`;
              return (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => handleSelect(location)}
                  className={`w-full text-left px-3 py-2 hover:bg-indigo-50 cursor-pointer ${
                    value === location.id ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'
                  }`}
                >
                  <div className="flex justify-between">
                    <span>{fullName}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
