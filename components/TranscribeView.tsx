import React, { useState, useRef, useEffect } from 'react';
import { startTranscriptionSession, createAudioBlob } from '../services/geminiService';
import type { LiveSession } from '@google/genai';

const TranscribeView: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcripts, setTranscripts] = useState<{ text: string, isFinal: boolean }[]>([]);
    const [error, setError] = useState<string | null>(null);

    const sessionRef = useRef<LiveSession | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    
    // FIX: stopRecording logic updated to be more robust for cleanup.
    const stopRecording = () => {
        setIsRecording(false);
        
        sessionRef.current?.close();
        sessionRef.current = null;
        
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
        }
        audioContextRef.current = null;
        
        if(scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            stopRecording();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleTranscriptionUpdate = (text: string, isFinal: boolean) => {
        setTranscripts(prev => {
            const newTranscripts = [...prev];
            const last = newTranscripts[newTranscripts.length - 1];
            
            if (last && !last.isFinal) {
                // Update the last non-final transcript
                newTranscripts[newTranscripts.length - 1] = { text, isFinal };
            } else {
                // Add a new transcript
                newTranscripts.push({ text, isFinal });
            }

            if (isFinal) {
                newTranscripts.push({text: '', isFinal: false});
            }
            
            return newTranscripts;
        });
    };

    // FIX: Refactored to follow Gemini Live API guidelines more closely.
    const startRecording = async () => {
        if (isRecording) return;
        setIsRecording(true);
        setError(null);
        setTranscripts([{text: '', isFinal: false}]); // Reset transcripts

        try {
            const sessionPromise = startTranscriptionSession(handleTranscriptionUpdate, (err) => setError(err.message));
            
            sessionPromise.then(session => {
                sessionRef.current = session;
            }).catch((err) => {
                setError(err.message || 'Failed to connect to the transcription service.');
                stopRecording();
            });

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // FIX: Property 'webkitAudioContext' does not exist on type 'Window & typeof globalThis'. Did you mean 'AudioContext'?
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createAudioBlob(inputData);
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
            };

            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(audioContextRef.current.destination);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not start recording.');
            stopRecording();
        }
    };
    
    const handleToggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className="p-4 flex flex-col items-center h-[calc(100vh-170px)]">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm w-full flex-grow overflow-y-auto">
                 <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {transcripts.map((t, i) => (
                        <span key={i} className={t.isFinal ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
                            {t.text}{' '}
                        </span>
                    ))}
                </p>
            </div>
            {error && (
                <div className="mt-4 text-center p-2 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-lg w-full">
                    <p>{error}</p>
                </div>
            )}
            <div className="mt-6">
                <button 
                    onClick={handleToggleRecording}
                    className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-colors duration-300 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                >
                    {isRecording && <div className="absolute w-full h-full bg-white opacity-20 rounded-full animate-ping"></div>}
                    <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z" />
                    </svg>
                </button>
            </div>
             <p className="mt-4 text-gray-600 dark:text-gray-400 font-semibold">{isRecording ? 'Listening...' : 'Tap to start'}</p>
        </div>
    );
};

export default TranscribeView;