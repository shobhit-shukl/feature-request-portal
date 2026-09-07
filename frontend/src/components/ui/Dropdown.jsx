import { useState, useRef, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';

export default function Dropdown({ value, options, onChange, className, buttonClassName }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (e, option) => {
    e.stopPropagation();
    onChange(option.value);
    setIsOpen(false);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className={`relative inline-block text-left ${className || ''}`} ref={containerRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className={`flex items-center justify-between gap-2 appearance-none focus:outline-none focus:ring-1 focus:ring-brand-500/50 cursor-pointer ${buttonClassName || ''}`}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <FiChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full min-w-[140px] flex flex-col rounded-xl glass-card py-1 shadow-xl animate-scale-in origin-top-right right-0 border border-white/[0.08]">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={(e) => handleSelect(e, option)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                value === option.value
                  ? 'bg-brand-500/10 text-brand-300'
                  : 'text-white/80 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
