import { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { Clock } from 'lucide-react';

interface TimePickerProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    className?: string;
}

export default function TimePicker({
    value,
    onChange,
    label,
    placeholder = "Pilih Jam",
    className = ""
}: TimePickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!inputRef.current) return;

        const fp = flatpickr(inputRef.current, {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
            defaultDate: value,
            static: true, // Position absolute to wrapper
            onChange: (selectedDates, dateStr) => {
                onChange(dateStr);
            },
        });

        return () => {
            fp.destroy();
        };
    }, []); // Run once on mount. If value changes externally, we might need to update fp. setDate()

    // Handle external value updates (e.g. form reset)
    useEffect(() => {
        if (inputRef.current && (inputRef.current as any)._flatpickr) {
            (inputRef.current as any)._flatpickr.setDate(value, false);
        }
    }, [value]);

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                    defaultValue={value}
                />
                <span className="absolute right-4 top-3 text-gray-500 pointer-events-none">
                    <Clock className="w-5 h-5" />
                </span>
            </div>
        </div>
    );
}
