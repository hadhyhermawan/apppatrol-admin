import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import clsx from 'clsx';

interface Option {
    value: string;
    label: string;
    description?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Pilih...",
    className,
    disabled = false
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

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
    }, []);

    // Filter options based on search
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        (opt.description && opt.description.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div ref={wrapperRef} className={clsx("relative w-full", className)}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={clsx(
                    "flex min-h-[42px] w-full items-center justify-between rounded-lg border bg-transparent px-4 py-2 outline-none transition disabled:cursor-not-allowed disabled:bg-whiter dark:bg-meta-4",
                    isOpen ? "border-brand-500 ring-1 ring-brand-500/20" : "border-stroke dark:border-strokedark",
                    disabled ? "opacity-70" : "cursor-pointer hover:border-brand-500 dark:hover:border-strokedark"
                )}
            >
                <div className="flex-1 truncate text-sm text-black dark:text-white">
                    {selectedOption ? (
                        <span className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
                            <span className="font-medium">{selectedOption.label}</span>
                            {selectedOption.description && (
                                <span className="text-xs text-gray-500 sm:text-sm">
                                    {selectedOption.description}
                                </span>
                            )}
                        </span>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <div className="ml-2 flex items-center gap-2">
                    {value && !disabled && (
                        <div
                            className="bg-gray-200 dark:bg-meta-4 rounded-full p-0.5 hover:bg-gray-300 dark:hover:bg-strokedark cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange('');
                                setSearch('');
                            }}
                        >
                            <X className="h-3 w-3 text-gray-500" />
                        </div>
                    )}
                    <ChevronDown className={clsx("h-4 w-4 text-gray-500 transition-transform", isOpen && "rotate-180")} />
                </div>
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-stroke bg-white py-1 shadow-lg dark:border-strokedark dark:bg-boxdark animate-in fade-in zoom-in-95 duration-100">
                    <div className="sticky top-0 bg-white p-2 dark:bg-boxdark border-b border-stroke dark:border-strokedark">
                        <input
                            type="text"
                            autoFocus
                            placeholder="Cari..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded border border-stroke bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    {filteredOptions.length === 0 ? (
                        <div className="px-4 py-3 text-center text-sm text-gray-500">
                            Tidak ditemukan "{search}"
                        </div>
                    ) : (
                        filteredOptions.map((opt) => (
                            <div
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                                className={clsx(
                                    "flex cursor-pointer items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-meta-4",
                                    value === opt.value && "bg-brand-50 dark:bg-meta-4/50 text-brand-600 font-medium"
                                )}
                            >
                                <div className="flex flex-col">
                                    <span className="text-black dark:text-white">{opt.label}</span>
                                    {opt.description && (
                                        <span className="text-xs text-gray-500">{opt.description}</span>
                                    )}
                                </div>
                                {value === opt.value && <Check className="h-4 w-4 text-brand-500" />}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
