import type { AttendanceRecord } from '../types';

export interface SummaryData {
    totalAttendees: number;
    totalPWDs: number;
    totalEmployed: number;
    totalUnemployed: number;
    totalSelfEmployed: number;
}

export function calculateSummary(data: AttendanceRecord[]): SummaryData {
    if (!data) {
        return { totalAttendees: 0, totalPWDs: 0, totalEmployed: 0, totalUnemployed: 0, totalSelfEmployed: 0 };
    }
    
    const totalAttendees = data.length;
    
    const totalPWDs = data.filter(
        record => record.do_you_have_any_disability?.trim().toUpperCase() === 'YES'
    ).length;

    const totalEmployed = data.filter(
        record => record.employment_status?.trim().toUpperCase() === 'EMPLOYED'
    ).length;
    
    const totalUnemployed = data.filter(
        record => record.employment_status?.trim().toUpperCase() === 'UNEMPLOYED'
    ).length;

    const totalSelfEmployed = data.filter(
        record => record.employment_status?.trim().toUpperCase() === 'SELF-EMPLOYED'
    ).length;

    return {
        totalAttendees,
        totalPWDs,
        totalEmployed,
        totalUnemployed,
        totalSelfEmployed
    };
}