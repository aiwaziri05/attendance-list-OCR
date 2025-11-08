import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataTable } from './components/DataTable';
import { extractDataFromImage } from './services/geminiService';
import type { AttendanceRecord, ProcessingFile } from './types';
import { Icon } from './components/Icon';
import { Summary } from './components/Summary';
import { FileProcessingProgress } from './components/ProgressBar';

type AppState = 'upload' | 'preview' | 'loading' | 'results' | 'error';

// Helper function to calculate SHA-256 hash of a file
async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

function App() {
  const [appState, setAppState] = useState<AppState>('upload');
  const [selectedFiles, setSelectedFiles] = useState<ProcessingFile[]>([]);
  const [extractedData, setExtractedData] = useState<AttendanceRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
        setNotifications(prev => prev.slice(1));
    }, 3000);
  };

  const handleFileSelect = useCallback(async (newFiles: File[]) => {
    setExtractedData(null);
    setError(null);

    const existingHashes = new Set(selectedFiles.map(f => f.hash));
    
    const processedFiles = await Promise.all(
        newFiles.map(async file => {
            const hash = await calculateFileHash(file);
            if (existingHashes.has(hash)) {
                addNotification(`Duplicate file ignored: ${file.name}`);
                return null;
            }
            existingHashes.add(hash);

            return new Promise<ProcessingFile>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({ file, url: reader.result as string, hash, status: 'pending' });
                };
                reader.readAsDataURL(file);
            });
        })
    );
    
    const validFiles = processedFiles.filter((f): f is ProcessingFile => f !== null);

    if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
        setAppState('preview');
    }
  }, [selectedFiles]);
  
  const handleRemoveFile = (hashToRemove: string) => {
    const updatedFiles = selectedFiles.filter(f => f.hash !== hashToRemove);
    setSelectedFiles(updatedFiles);
    if (updatedFiles.length === 0) {
        setAppState('upload');
    }
  };

  const resetState = useCallback(() => {
    setSelectedFiles([]);
    setExtractedData(null);
    setError(null);
    setNotifications([]);
    setAppState('upload');
  }, []);

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one file.");
      setAppState('error');
      return;
    }

    setAppState('loading');
    setExtractedData(null);
    
    const allExtractedData: AttendanceRecord[] = [];
    
    for (const fileToProcess of selectedFiles) {
        const currentFileHash = fileToProcess.hash;

        setSelectedFiles(prevFiles => 
            prevFiles.map(f => f.hash === currentFileHash ? { ...f, status: 'processing' } : f)
        );

        try {
            const base64String = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(fileToProcess.file);
                reader.onload = () => {
                    const result = (reader.result as string)?.split(',')[1];
                    if (result) resolve(result);
                    else reject(new Error('Could not read the file content.'));
                };
                reader.onerror = () => reject(new Error('Error reading file.'));
            });

            const result = await extractDataFromImage(base64String, fileToProcess.file.type);
            allExtractedData.push(...result);

            setSelectedFiles(prevFiles => 
                prevFiles.map(f => f.hash === currentFileHash ? { ...f, status: 'completed' } : f)
            );
        } catch (err) {
            console.error(`Error processing file ${fileToProcess.file.name}:`, err);
            setSelectedFiles(prevFiles => 
                prevFiles.map(f => f.hash === currentFileHash ? { ...f, status: 'error' } : f)
            );
        }
    }

    const failedFiles = selectedFiles.filter(f => f.status === 'error').length;
    if (failedFiles > 0) {
        addNotification(`${failedFiles} file(s) could not be processed.`);
    }

    setExtractedData(allExtractedData);
    setAppState('results');
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-200 font-sans flex flex-col">
       {appState !== 'upload' && (
         <button
            onClick={resetState}
            className="fixed top-6 right-6 z-30 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600/80 hover:bg-red-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-900"
          >
            <Icon name="reset" className="h-5 w-5"/>
            <span>Start Over</span>
          </button>
      )}

      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
            {notifications.map((msg, index) => (
                <div key={index} className="bg-yellow-500/20 border border-yellow-600 text-yellow-300 px-4 py-2 rounded-md animate-fade-in text-sm">
                    {msg}
                </div>
            ))}
      </div>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
        <div className="w-full transition-all duration-500 ease-in-out">
            {appState === 'upload' && (
                <div className="flex flex-col items-center text-center">
                    <Icon name="scan" className="h-12 w-12 text-indigo-400 mb-4" />
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Attendance List OCR</h2>
                    <p className="mt-4 max-w-2xl text-lg text-gray-400">
                        Instantly convert attendance sheets from images or PDFs into structured data with the power of Gemini.
                    </p>
                    <div className="mt-10 w-full max-w-3xl h-80">
                        <FileUpload onFileSelect={handleFileSelect} addNotification={addNotification} />
                    </div>
                </div>
            )}

            {appState === 'preview' && (
                <div className="flex flex-col items-center gap-8 animate-fade-in w-full max-w-6xl">
                    <h2 className="text-2xl font-semibold text-center text-gray-300">Ready to analyze your documents?</h2>
                    <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-h-[50vh] overflow-y-auto p-4 bg-black/10 rounded-lg border border-gray-700">
                        {selectedFiles.map(({ file, url, hash }) => (
                            <div key={hash} className="relative group aspect-square bg-gray-800/50 rounded-lg overflow-hidden flex flex-col items-center justify-center p-2 border border-gray-700">
                                {file.type.startsWith('image/') ? (
                                    <img src={url} alt={file.name} className="w-full h-full object-contain" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <Icon name="document-text" className="h-16 w-16 text-indigo-400" />
                                    </div>
                                )}
                                <p className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs text-center truncate px-2 py-1">{file.name}</p>
                                <button
                                    onClick={() => handleRemoveFile(hash)}
                                    className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Remove file"
                                >
                                    <Icon name="reset" className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleAnalyze}
                        className="flex items-center justify-center gap-3 px-8 py-4 text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 shadow-lg hover:shadow-indigo-500/50"
                    >
                        <Icon name="sparkles" className="h-6 w-6" />
                        <span>Extract Data from {selectedFiles.length} File(s)</span>
                    </button>
                </div>
            )}

            {appState === 'loading' && (
                <div className="flex flex-col items-center justify-center text-center animate-fade-in w-full">
                    <FileProcessingProgress files={selectedFiles} />
                </div>
            )}
            
            {appState === 'results' && extractedData && (
                <div className="animate-fade-in w-full max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 flex flex-col gap-4">
                            <h3 className="text-lg font-semibold text-indigo-400">Source Documents ({selectedFiles.length})</h3>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-black/20 p-2 rounded-lg border border-gray-700">
                                {selectedFiles.map(({ url, hash, file }) => (
                                     <div key={hash} className="aspect-video rounded-md overflow-hidden bg-gray-800/50 flex items-center justify-center">
                                         {file.type.startsWith('image/') ? (
                                             <img src={url} alt={file.name} className="w-full h-full object-contain" />
                                         ) : (
                                             <Icon name="document-text" className="h-10 w-10 text-indigo-400" />
                                         )}
                                     </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            <Summary data={extractedData} />
                            <DataTable data={extractedData} setData={setExtractedData} />
                        </div>
                    </div>
                </div>
            )}

            {appState === 'error' && (
                <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800/50 rounded-lg border border-red-700 max-w-lg mx-auto animate-fade-in">
                    <Icon name="reset" className="h-12 w-12 text-red-400" />
                    <h3 className="mt-4 text-xl font-bold text-red-300">An Error Occurred</h3>
                    <p className="mt-2 text-red-300">{error}</p>
                    <button
                        onClick={resetState}
                        className="mt-6 flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900"
                    >
                        <Icon name="reset" className="h-5 w-5" />
                        <span>Try Again</span>
                    </button>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}

export default App;