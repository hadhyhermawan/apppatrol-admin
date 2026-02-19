'use client';

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

interface Option {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = "Select...",
    className = "",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    // Find selected label
    const selectedLabel = options.find((o) => o.value === value)?.label || placeholder;

    // Filter options
    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between rounded-lg border-[1.5px] border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 text-left sm:text-sm text-black dark:text-white"
            >
                <span className={!value ? "text-gray-500" : ""}>{selectedLabel}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-meta-4 sm:text-sm">
                    <div className="sticky top-0 bg-white dark:bg-meta-4 p-2 border-b border-gray-100 dark:border-gray-700 z-10">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                className="w-full rounded-md border border-gray-300 bg-transparent py-2 pl-8 pr-3 text-sm placeholder-gray-500 focus:border-brand-500 focus:outline-none dark:border-strokedark dark:text-white"
                                placeholder="Cari..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {/* Option: Semua / Clear */}
                        <div
                            className={`relative cursor-default select-none py-2 pl-10 pr-4 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700`}
                            onClick={() => {
                                onChange("");
                                setIsOpen(false);
                                setSearchTerm("");
                            }}
                        >
                            <span className={`block truncate ${value === "" ? 'font-medium' : 'font-normal'}`}>
                                {placeholder}
                            </span>
                            {value === "" ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-600 dark:text-brand-400">
                                    <Check className="h-4 w-4" aria-hidden="true" />
                                </span>
                            ) : null}
                        </div>

                        {filteredOptions.length === 0 ? (
                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300 text-center">
                                Tidak ditemukan.
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={`relative cursor-default select-none py-2 pl-10 pr-4 ${value === option.value ? 'bg-brand-50 text-brand-900 dark:bg-brand-900/20 dark:text-brand-100' : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                >
                                    <span className={`block truncate ${value === option.value ? 'font-medium' : 'font-normal'}`}>
                                        {option.label}
                                    </span>
                                    {value === option.value ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-600 dark:text-brand-400">
                                            <Check className="h-4 w-4" aria-hidden="true" />
                                        </span>
                                    ) : null}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
