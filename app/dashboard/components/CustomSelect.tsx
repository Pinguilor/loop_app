import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder: string;
    disabled?: boolean;
    required?: boolean;
    name?: string;
}

export function CustomSelect({
    id,
    value,
    onChange,
    options,
    placeholder,
    disabled = false,
    required = false,
    name
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Native hidden select for standard form submission validation */}
            {name && (
                <select name={name} value={value} onChange={() => { }} required={required} className="hidden">
                    <option value="" disabled></option>
                    {options.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            )}

            <button
                type="button"
                id={id}
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-between w-full px-3 py-2.5 
                    bg-white border rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 border-gray-200' : 'cursor-pointer border-gray-300 hover:border-gray-400'}
                    ${isOpen ? 'ring-2 ring-brand-primary border-transparent' : ''}
                `}
            >
                <span className={`block truncate text-[13px] ${!selectedOption ? 'text-slate-400' : 'text-slate-900 font-medium'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-primary' : ''}`} />
            </button>

            {isOpen && !disabled && (
                <div className="absolute z-20 w-full mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <ul className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                        {options.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <li
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        px-3 py-2 text-[13px] cursor-pointer transition-colors
                                        ${isSelected ? 'bg-brand-primary/10 text-brand-primary font-bold' : 'text-slate-700 hover:bg-slate-100'}
                                    `}
                                >
                                    {option.label}
                                </li>
                            );
                        })}
                        {options.length === 0 && (
                            <li className="px-4 py-3 text-sm text-slate-500 text-center italic">No hay opciones disponibles</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
