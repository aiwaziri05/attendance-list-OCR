import React from 'react';
import type { AttendanceRecord } from '../types';
import { calculateSummary } from '../utils/calculator';
import { Icon } from './Icon';

interface SummaryProps {
    data: AttendanceRecord[];
}

export const Summary: React.FC<SummaryProps> = ({ data }) => {
    const summary = calculateSummary(data);

    const summaryItems = [
        { label: 'Total Attendees', value: summary.totalAttendees, icon: 'users' },
        { label: "PWD's", value: summary.totalPWDs, icon: 'disability' },
        { label: 'Employed', value: summary.totalEmployed, icon: 'briefcase' },
        { label: 'Unemployed', value: summary.totalUnemployed, icon: 'user-minus' },
        { label: 'Self-Employed', value: summary.totalSelfEmployed, icon: 'user' },
    ];

    return (
        <div>
            <h3 className="text-lg font-semibold text-indigo-400 mb-4">Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {summaryItems.map(item => (
                    <div key={item.label} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex items-center">
                        <div className={`mr-4 p-2 bg-gray-700 rounded-full`}>
                             <Icon name={item.icon} className="h-6 w-6 text-indigo-300" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">{item.label}</p>
                            <p className="text-2xl font-bold text-white">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};