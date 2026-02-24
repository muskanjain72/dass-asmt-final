import { useState, useRef, useEffect } from 'react';
import { generateGoogleCalendarUrl, generateOutlookCalendarUrl, downloadICS } from '../utils/calendar';

const AddToCalendarButton = ({ event, className, compact = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [reminder, setReminder] = useState(30); // Default 30 mins
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!event) return null;

    const reminderOptions = [
        { label: 'at time of event', value: 0 },
        { label: '5 minutes before', value: 5 },
        { label: '15 minutes before', value: 15 },
        { label: '30 minutes before', value: 30 },
        { label: '1 hour before', value: 60 },
        { label: '2 hours before', value: 120 },
        { label: '1 day before', value: 1440 },
    ];

    return (
        <div className={`relative inline-block text-left ${className || ''}`} ref={dropdownRef}>
            {compact ? (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    type="button"
                    title="Add to Calendar"
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '36px', height: '36px', borderRadius: '10px',
                        border: '1.5px solid #e5e7eb', background: 'white',
                        cursor: 'pointer', transition: 'all 0.2s', color: '#6d28d9'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.borderColor = '#c4b5fd'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </button>
            ) : (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    type="button"
                    className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                >
                    📅 Add to Calendar
                    <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            )}

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-2 px-4 border-b border-gray-100">
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Set Reminder</label>
                        <select
                            value={reminder}
                            onChange={(e) => setReminder(Number(e.target.value))}
                            className="w-full text-xs border border-gray-200 rounded p-1 focus:ring-1 focus:ring-purple-500 outline-none font-medium text-gray-600"
                        >
                            {reminderOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <a
                            href={generateGoogleCalendarUrl(event, reminder)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium"
                            role="menuitem"
                        >
                            Google Calendar
                        </a>
                        <a
                            href={generateOutlookCalendarUrl(event, reminder)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium"
                            role="menuitem"
                        >
                            Outlook
                        </a>
                        <button
                            onClick={() => downloadICS(event, reminder)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium"
                            role="menuitem"
                        >
                            Download .ics
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddToCalendarButton;
