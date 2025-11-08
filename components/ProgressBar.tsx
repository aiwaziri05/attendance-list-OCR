import React, { useState, useEffect, useMemo } from 'react';
import type { ProcessingFile } from '../types';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

interface FileProcessingProgressProps {
  files: ProcessingFile[];
}

const FileStatusIcon: React.FC<{ status: ProcessingFile['status'] }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return <Icon name="clock" className="h-6 w-6 text-gray-500 flex-shrink-0" />;
    case 'processing':
      return <Spinner size="sm" />;
    case 'completed':
      return <Icon name="check-circle" className="h-6 w-6 text-green-500 flex-shrink-0" />;
    case 'error':
      return <Icon name="exclamation-circle" className="h-6 w-6 text-red-500 flex-shrink-0" />;
    default:
      return null;
  }
};

export const FileProcessingProgress: React.FC<FileProcessingProgressProps> = ({ files }) => {
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const currentlyProcessingFile = useMemo(() => files.find(f => f.status === 'processing'), [files]);

  useEffect(() => {
    // If a file is processing, start the simulation.
    if (currentlyProcessingFile) {
      // Reset progress for the new file that just started processing.
      setSimulatedProgress(0);

      const interval = setInterval(() => {
        setSimulatedProgress(prev => {
          // Stay at 99% until the file is truly complete.
          if (prev >= 99) {
            clearInterval(interval);
            return 99;
          }
          // Simulate a non-linear progress, slowing down as it gets closer to the end.
          const remaining = 100 - prev;
          const increment = Math.max(1, Math.floor(remaining / 10 + Math.random() * 3));
          return Math.min(prev + increment, 99);
        });
      }, 500); // Update every half a second.

      // Cleanup function to clear the interval when the component unmounts or the processing file changes.
      return () => clearInterval(interval);
    }
    // If no file is processing (either all done or one just finished), reset simulation.
    else {
      setSimulatedProgress(0);
    }
  }, [currentlyProcessingFile]); // This effect re-runs whenever the file being processed changes.


  const totalCount = files.length;
  const completedCount = files.filter(f => f.status === 'completed' || f.status === 'error').length;
  const pendingCount = files.filter(f => f.status === 'pending').length;

  // Calculate the overall progress.
  // Base progress from completed files.
  const baseProgress = (completedCount / totalCount) * 100;
  // Add the simulated progress of the current file, scaled by the total number of files.
  const currentFileProgressContribution = currentlyProcessingFile ? (simulatedProgress / totalCount) : 0;
  
  const overallProgress = baseProgress + currentFileProgressContribution;
  // Use floor to avoid showing 100% before the last file is truly complete.
  const roundedProgress = totalCount === completedCount ? 100 : Math.floor(overallProgress);

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl text-center">Analyzing Documents</h2>
      <p className="mt-3 text-lg text-gray-400 text-center">
        Gemini is extracting data from your files. Please wait.
      </p>

      <div className="mt-8">
        <div className="flex justify-between mb-1">
          <span className="text-base font-medium text-indigo-300">Overall Progress</span>
          <span className="text-sm font-medium text-indigo-300">{`${roundedProgress}%`}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500 ease-linear"
            style={{ width: `${roundedProgress}%` }}
          ></div>
        </div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-gray-700 text-center">
            <div className="px-2">
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-xl font-bold text-white">{completedCount}</p>
            </div>
            <div className="px-2">
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-xl font-bold text-white">{pendingCount}</p>
            </div>
            <div className="px-2">
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-xl font-bold text-white">{totalCount}</p>
            </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg max-h-64 overflow-y-auto">
          <ul className="divide-y divide-gray-700">
            {files.map(file => (
              <li key={file.hash} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <FileStatusIcon status={file.status} />
                  <span className="text-gray-300 truncate min-w-0">{file.file.name}</span>
                </div>
                <span className="text-xs font-medium uppercase tracking-wider px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                  {file.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};