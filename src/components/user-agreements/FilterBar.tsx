'use client';

import { Search, Download, Filter } from 'lucide-react';
import { useState } from 'react';

type FilterBarProps = {
    onSearch: (value: string) => void;
    onDepartmentChange: (value: string) => void;
    onExportCSV: () => void;
    departments: { id: number; nama_dept: string }[];
};

export default function FilterBar({ onSearch, onDepartmentChange, onExportCSV, departments }: FilterBarProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        // Debounce can be added here
        onSearch(e.target.value);
    };

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4">
                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                        type="text"
                        placeholder="Cari nama, email, NIK..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>

                {/* Filter Departemen */}
                <div className="relative w-full sm:w-56">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter className="h-4 w-4 text-gray-400" />
                    </span>
                    <select
                        onChange={(e) => onDepartmentChange(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm appearance-none cursor-pointer transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="">Semua Departemen</option>
                        {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.nama_dept}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Export Button */}
            <button
                onClick={onExportCSV}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
            >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
            </button>
        </div>
    );
}
