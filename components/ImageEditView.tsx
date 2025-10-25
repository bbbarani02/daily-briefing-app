import React, { useState, useRef } from 'react';
import { editImage } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: {
        data: await base64EncodedDataPromise,
        mimeType: file.type,
      },
    };
};

const ImageEditView: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
    const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (file: File | undefined) => {
        if (file && file.type.startsWith('image/')) {
            setOriginalImage(file);
            setOriginalImageUrl(URL.createObjectURL(file));
            setEditedImageUrl(null);
            setError(null);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 1500); // Visual feedback for 1.5s
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files?.[0]);
    };

    const handleClearImage = () => {
        setOriginalImage(null);
        setOriginalImageUrl(null);
        setEditedImageUrl(null);
        setPrompt('');
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleGenerate = async () => {
        if (!originalImage || !prompt.trim()) {
            setError("Please upload an image and enter a prompt.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setEditedImageUrl(null);

        try {
            const part = await fileToGenerativePart(originalImage);
            const generatedData = await editImage(part.inlineData.data, part.inlineData.mimeType, prompt);
            setEditedImageUrl(`data:image/png;base64,${generatedData}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to edit image.");
        } finally {
            setIsLoading(false);
        }
    };

    // Drag and Drop Handlers
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        handleFileSelect(e.dataTransfer.files?.[0]);
    };

    return (
        <div className="p-4 space-y-4">
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`relative p-4 rounded-xl border-2 border-dashed transition-all duration-300 ease-in-out transform flex items-center justify-center min-h-[200px] 
                ${isDraggingOver ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-slate-700 scale-105 shadow-lg' : 'border-gray-300 dark:border-gray-600'}
                ${uploadSuccess ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-slate-800'}`}
            >
                {!originalImageUrl ? (
                    <div className="flex flex-col items-center justify-center space-y-3 text-center text-gray-500 dark:text-gray-400">
                        <svg className={`w-12 h-12 text-gray-400 transition-transform duration-300 ease-in-out ${isDraggingOver ? 'scale-110' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="font-semibold">Drag & drop your image here</p>
                        <p className="text-sm">or</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Browse Files
                        </button>
                    </div>
                ) : (
                     <div className="relative w-full h-full max-h-64 group">
                        <img src={originalImageUrl} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center space-x-4 rounded-lg">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-4">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Change
                                </button>
                                <button
                                    onClick={handleClearImage}
                                    className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                 <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {originalImageUrl && (
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm">
                        <h3 className="text-center font-semibold text-gray-600 dark:text-gray-400 mb-2">Original</h3>
                        <img src={originalImageUrl} alt="Original" className="rounded-lg w-full h-auto object-cover" />
                    </div>
                )}
                {isLoading && (
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm flex flex-col justify-center items-center h-64">
                         <LoadingSpinner />
                         <p className="mt-2 text-gray-500 dark:text-gray-400">Generating...</p>
                    </div>
                )}
                 {editedImageUrl && !isLoading && (
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm">
                        <h3 className="text-center font-semibold text-gray-600 dark:text-gray-400 mb-2">Edited</h3>
                        <img src={editedImageUrl} alt="Edited" className="rounded-lg w-full h-auto object-cover" />
                    </div>
                )}
            </div>

            {originalImage && (
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm space-y-3">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your edits, e.g., 'add a retro filter'"
                        className="w-full p-2 border border-gray-300 dark:bg-slate-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt.trim()}
                        className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400"
                    >
                        {isLoading ? 'Generating...' : 'Generate'}
                    </button>
                </div>
            )}
             {error && (
                <div className="text-center p-4 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-lg">
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
};

export default ImageEditView;
