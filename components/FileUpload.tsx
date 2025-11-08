import React, { useState, useCallback, useRef } from 'react';
import { Icon } from './Icon';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  addNotification: (message: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, addNotification }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((files: FileList) => {
    const allowedTypes = ['application/pdf'];
    const validFiles: File[] = [];

    Array.from(files).forEach(file => {
      // Check if it's an image or a PDF
      if (file.type.startsWith('image/') || allowedTypes.includes(file.type)) {
        validFiles.push(file);
      } else {
        addNotification(`Unsupported file: '${file.name}'. Please upload images or PDFs.`);
      }
    });
    
    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    }
  }, [onFileSelect, addNotification]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow re-selecting the same file after it's been removed
    e.target.value = ''; 
  };

  const handleClick = () => {
    inputRef.current?.click();
  };
  
  const baseClasses = "relative block w-full h-full rounded-lg border-2 border-dashed flex items-center justify-center p-12 text-center transition-all duration-300 cursor-pointer";
  const draggingClasses = "border-indigo-400 bg-gray-700/50";
  const idleClasses = "border-gray-600 hover:border-indigo-500 bg-gray-800/30 hover:bg-gray-800/50";

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`${baseClasses} ${isDragging ? draggingClasses : idleClasses}`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        multiple
      />
      <div className="flex flex-col items-center">
        <Icon name="upload" className="mx-auto h-16 w-16 text-gray-500 group-hover:text-indigo-400 transition-colors" />
        <span className="mt-4 block text-lg font-medium text-gray-300">
          Drag and drop files, or click to browse
        </span>
        <p className="mt-1 text-sm text-gray-500">PNG, JPG, or PDF documents</p>
      </div>
    </div>
  );
};