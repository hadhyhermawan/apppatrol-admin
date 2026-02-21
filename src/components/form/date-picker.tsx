'use client';

import { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import Label from './Label';
import { Calendar } from 'lucide-react';
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  label?: string;
  placeholder?: string;
  enableTime?: boolean;
  dateFormat?: string;
  allowInput?: boolean;
  staticDisplay?: boolean;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  placeholder,
  enableTime = false,
  dateFormat = "Y-m-d",
  allowInput = true,
  staticDisplay = true,
}: PropsType) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const flatPickr = flatpickr(`#${id}`, {
      mode: mode || "single",
      static: staticDisplay,
      monthSelectorType: "static",
      dateFormat,
      enableTime,
      defaultDate,
      allowInput,
      time_24hr: true,
      minuteIncrement: 1,
      onChange: (selectedDates, dateStr, instance) => {
        if (onChangeRef.current) {
          if (Array.isArray(onChangeRef.current)) {
            onChangeRef.current.forEach(fn => fn(selectedDates, dateStr, instance));
          } else {
            (onChangeRef.current as Function)(selectedDates, dateStr, instance);
          }
        }
      }
    });

    return () => {
      if (!Array.isArray(flatPickr)) {
        flatPickr.destroy();
      }
    };
  }, [id, mode, staticDisplay, dateFormat, enableTime, allowInput]);

  useEffect(() => {
    const el = document.getElementById(id) as any;
    if (el && el._flatpickr && defaultDate) {
      if (el._flatpickr.input.value !== defaultDate) {
        el._flatpickr.setDate(defaultDate, false);
      }
    }
  }, [defaultDate, id]);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800"
        />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <Calendar className="size-6" />
        </span>
      </div>
    </div >
  );
}
