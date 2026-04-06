'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2 } from 'lucide-react';

export default function CompanyAutocomplete({ value, onChange, placeholder = "e.g. Stripe", style }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const isSelecting = useRef(false);

  // Update internal query if value prop changes externally
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    
    // Skip fetching if the change was triggered by selecting a dropdown item
    if (isSelecting.current) {
        isSelecting.current = false;
        return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsOpen(data.length > 0);
        }
      } catch (err) {
        console.error('Failed to fetch companies', err);
      }
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [query, value]);

  const handleSelect = (company) => {
    isSelecting.current = true;
    setQuery(company.name);
    setIsOpen(false);
    // Mimic standard input event for parent onChange
    onChange({ target: { value: company.name } });
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    onChange(e); // Propagate text changes normally
    if (!isOpen && e.target.value.trim().length > 0) {
        setIsOpen(true);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', ...style }}>
      <input
        className="input"
        value={query}
        onChange={handleInputChange}
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        placeholder={placeholder}
        autoComplete="off"
      />
      
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: 'var(--bg-card)',
              border: 'var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              zIndex: 50,
              maxHeight: '260px',
              overflowY: 'auto'
            }}
          >
            {results.map((company, index) => (
              <div
                key={company.domain + index}
                onClick={() => handleSelect(company)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  borderBottom: 'var(--border-soft)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {company.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={company.logo} alt={company.name} style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'contain', background: 'white' }} />
                ) : (
                  <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={14} color="var(--text-muted)" />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{company.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{company.domain}</div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
