import React, { useState, useEffect, useRef } from 'react';

function SearchBar({ value, onChange, placeholder = 'Rechercher...', debounceMs = 300 }) {
  const [localValue, setLocalValue] = useState(value || '');
  const debounceTimer = useRef(null);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  };

  const handleClear = () => {
    setLocalValue('');
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    onChange('');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className="search-bar" role="search">
      <input
        type="search"
        className="search-input"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        spellCheck="false"
      />
      {localValue && (
        <button
          className="search-clear"
          onClick={handleClear}
          aria-label="Effacer la recherche"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default SearchBar;
