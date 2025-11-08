import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { AttendanceRecord } from '../types';
import { Icon } from './Icon';
import { Modal } from './Modal';
import * as XLSX from 'xlsx';


interface DataTableProps {
  data: AttendanceRecord[];
  setData: React.Dispatch<React.SetStateAction<AttendanceRecord[] | null>>;
}

export const DataTable: React.FC<DataTableProps> = ({ data, setData }) => {
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: keyof AttendanceRecord } | null>(null);
  const [cellValue, setCellValue] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [filename, setFilename] = useState('');
  const [exportFileType, setExportFileType] = useState<'csv' | 'xlsx' | null>(null);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const uniqueQualifications = useMemo(() => {
    if (!data) return [];
    const allQuals = data.map(row => row.highest_qualification).filter(Boolean);
    return Array.from(new Set(allQuals));
  }, [data]);

  const handleCellClick = (rowId: string, columnId: keyof AttendanceRecord, value: string) => {
    setEditingCell({ rowId, columnId });
    setCellValue(value || '');
  };

  const handleCellValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCellValue(e.target.value);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, rowId: string, columnId: keyof AttendanceRecord) => {
    const newValue = e.target.value;
    const newData = data.map(row => {
        if (row.id === rowId) {
            return { ...row, [columnId]: newValue };
        }
        return row;
    });
    setData(newData);
    setEditingCell(null);
  };

  const handleUpdate = () => {
    if (editingCell) {
      const { rowId, columnId } = editingCell;
      const newData = data.map(row => {
        if (row.id === rowId) {
          return { ...row, [columnId]: cellValue };
        }
        return row;
      });
      setData(newData);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUpdate();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const headers: { key: keyof AttendanceRecord; label: string }[] = [
    { key: 'id', label: 'ID' },
    { key: 'firstname', label: 'First Name' },
    { key: 'middle', label: 'Middle' },
    { key: 'lastname', label: 'Last Name' },
    { key: 'sex', label: 'Sex' },
    { key: 'do_you_have_any_disability', label: 'Disability?' },
    { key: 'if_yes_type_of_disability', label: 'Disability Type' },
    { key: 'home_address', label: 'Address' },
    { key: 'phone_no', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'highest_qualification', label: 'Qualification' },
    { key: 'employment_type', label: 'Employment Type' },
    { key: 'employment_status', label: 'Employment Status' },
  ];

  const downloadFile = (content: any, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleCopyToClipboard = () => {
    const sanitizeCell = (value: any): string => {
      if (value === null || value === undefined) return '';
      // Replace any tab or newline characters with a space to prevent breaking TSV format
      return String(value).replace(/[\t\n\r]/g, ' ').trim();
    };

    const headerRow = headers.map(h => h.label).join('\t');
    const rows = data.map(row =>
      headers.map(h => sanitizeCell(row[h.key])).join('\t')
    );
    const tsvContent = [headerRow, ...rows].join('\n');
    navigator.clipboard.writeText(tsvContent);
    setIsExportDropdownOpen(false);
  };

  const triggerExport = (type: 'csv' | 'xlsx') => {
    const date = new Date().toISOString().split('T')[0];
    setFilename(`attendance_data_${date}`);
    setExportFileType(type);
    setIsSaveModalOpen(true);
    setIsExportDropdownOpen(false);
  };
  
  const handleSaveFile = () => {
    if (!filename || !exportFileType) return;

    if (exportFileType === 'csv') {
      const headerRow = headers.map(h => `"${h.label}"`).join(',');
      const rows = data.map(row => 
        headers.map(h => {
          const cell = row[h.key];
          const cellString = cell === null || cell === undefined ? '' : String(cell);
          return `"${cellString.replace(/"/g, '""')}"`;
        }).join(',')
      );
      const csvContent = [headerRow, ...rows].join('\n');
      downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
    } else if (exportFileType === 'xlsx') {
        const workbook = XLSX.utils.book_new();
        
        const dataForSheet = data.map(row => {
            const newRow: { [key: string]: any } = {};
            headers.forEach(h => {
                newRow[h.label] = row[h.key];
            });
            return newRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataForSheet, { 
            header: headers.map(h => h.label) 
        });

        const getCol = (key: keyof AttendanceRecord) => XLSX.utils.encode_col(headers.findIndex(h => h.key === key));
        const getSqref = (key: keyof AttendanceRecord) => `${getCol(key)}2:${getCol(key)}${data.length + 1}`;

        const validations = [
            { key: 'sex', formula: '"M,F"' },
            { key: 'do_you_have_any_disability', formula: '"Yes,No"' },
            { key: 'employment_status', formula: '"Employed,Unemployed,Self-Employed"' },
            { key: 'highest_qualification', formula: `"${uniqueQualifications.join(',')}"` }
        ];
        
        worksheet['!dataValidation'] = validations.map(v => ({
            sqref: getSqref(v.key as keyof AttendanceRecord),
            type: 'list',
            formula1: v.formula,
            showDropDown: true
        }));
        
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const headerAddress = XLSX.utils.encode_cell({c: C, r: 0});
            if(worksheet[headerAddress]) {
                worksheet[headerAddress].s = {
                    font: { bold: true, color: { rgb: "FFFFFFFF" } },
                    fill: { fgColor: { rgb: "FF4F46E5" } } 
                };
            }

            const headerKey = headers[C]?.key;
            if (headerKey === 'email' || headerKey === 'phone_no') {
                for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                    const cellAddress = XLSX.utils.encode_cell({c: C, r: R});
                    const cell = worksheet[cellAddress];
                    if (cell && cell.v) {
                        const prefix = headerKey === 'email' ? 'mailto:' : 'tel:';
                        cell.l = { Target: `${prefix}${cell.v}`, Tooltip: `Click to ${headerKey === 'email' ? 'email' : 'call'}` };
                        cell.s = { font: { color: { rgb: "FF818CF8" }, underline: true } };
                    }
                }
            }
        }

        const colWidths = headers.map(h => {
            let width = 15;
            if (h.key === 'id') width = 5;
            if (h.key === 'home_address') width = 40;
            if (h.key === 'email' || h.key === 'if_yes_type_of_disability' || h.key === 'highest_qualification') width = 25;
            return { wch: width };
        });
        worksheet['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        downloadFile(excelBuffer, `${filename}.xlsx`, 'application/octet-stream');
    }

    setIsSaveModalOpen(false);
    setFilename('');
    setExportFileType(null);
  };

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-indigo-400">Extracted Data</h3>
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsExportDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900"
          >
            <Icon name="export" className="h-5 w-5" />
            <span>Export</span>
            <Icon name="chevron-down" className="h-4 w-4" />
          </button>
          {isExportDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20 animate-fade-in">
              <div className="py-1">
                <button onClick={handleCopyToClipboard} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                  <Icon name="copy" className="h-5 w-5" /> Copy Table Data
                </button>
                <button onClick={() => triggerExport('csv')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                  <Icon name="download" className="h-5 w-5" /> Export to CSV
                </button>
                <button onClick={() => triggerExport('xlsx')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                  <Icon name="excel" className="h-5 w-5" /> Export to Excel (.xlsx)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto relative shadow-md sm:rounded-lg max-h-[60vh]">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-300 uppercase bg-gray-700/50 sticky top-0">
            <tr>
              {headers.map(header => (
                <th key={header.key} scope="col" className="px-6 py-3 whitespace-nowrap">{header.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                {headers.map(header => {
                  const columnId = header.key;
                  const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === columnId;
                  const currentValue = row[columnId];
                  const isDropdownColumn = ['sex', 'do_you_have_any_disability', 'highest_qualification', 'employment_status'].includes(columnId);

                  return (
                    <td key={columnId} className="px-6 py-4 overflow-hidden whitespace-nowrap" onClick={() => !isEditing && handleCellClick(row.id, columnId, currentValue)}>
                      {isEditing ? (
                        <>
                          {columnId === 'sex' ? (
                            <select
                              value={currentValue}
                              onChange={(e) => handleSelectChange(e, row.id, columnId)}
                              onBlur={() => setEditingCell(null)}
                              autoFocus
                              className="w-full bg-gray-900 text-white rounded px-2 py-1 border border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            >
                              <option value="M">Male</option>
                              <option value="F">Female</option>
                            </select>
                          ) : columnId === 'do_you_have_any_disability' ? (
                            <select
                              value={currentValue}
                              onChange={(e) => handleSelectChange(e, row.id, columnId)}
                              onBlur={() => setEditingCell(null)}
                              autoFocus
                              className="w-full bg-gray-900 text-white rounded px-2 py-1 border border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          ) : columnId === 'highest_qualification' ? (
                            <select
                              value={currentValue}
                              onChange={(e) => handleSelectChange(e, row.id, columnId)}
                              onBlur={() => setEditingCell(null)}
                              autoFocus
                              className="w-full bg-gray-900 text-white rounded px-2 py-1 border border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            >
                              {uniqueQualifications.map(qual => (
                                <option key={qual} value={qual}>{qual}</option>
                              ))}
                            </select>
                           ) : columnId === 'employment_status' ? (
                            <select
                              value={currentValue}
                              onChange={(e) => handleSelectChange(e, row.id, columnId)}
                              onBlur={() => setEditingCell(null)}
                              autoFocus
                              className="w-full bg-gray-900 text-white rounded px-2 py-1 border border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            >
                              <option value="">Select...</option>
                              <option value="Employed">Employed</option>
                              <option value="Unemployed">Unemployed</option>
                              <option value="Self-Employed">Self-Employed</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={cellValue}
                              onChange={handleCellValueChange}
                              onBlur={handleUpdate}
                              onKeyDown={handleKeyDown}
                              autoFocus
                              className="w-full bg-gray-900 text-white rounded px-2 py-1 border border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            />
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                           {columnId === 'email' && currentValue ? (
                            <a href={`mailto:${currentValue}`} className="text-indigo-400 hover:underline truncate">{currentValue}</a>
                          ) : columnId === 'phone_no' && currentValue ? (
                            <a href={`tel:${currentValue}`} className="text-indigo-400 hover:underline truncate">{currentValue}</a>
                          ) : (
                            <span className="min-h-[20px] block truncate">{currentValue}</span>
                          )}
                          {isDropdownColumn && <Icon name="chevron-down" className="h-4 w-4 text-gray-600 ml-2 flex-shrink-0" />}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} title={`Save File as ${exportFileType?.toUpperCase()}`}>
        <div className="mt-4">
          <label htmlFor="filename" className="block text-sm font-medium text-gray-300">Filename</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">.{exportFileType}</span>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setIsSaveModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md">
            Cancel
          </button>
          <button type="button" onClick={handleSaveFile} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
};