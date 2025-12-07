import React, { useEffect, useRef, useState } from 'react';
import { GeminiLiveClient, LiveClientStatus } from '../services/liveClient';
import { MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, PhoneXIcon, SparklesIcon } from './Icons';

interface LiveSessionProps {
  onClose: () => void;
}

const LANGUAGES = ['English', 'Hindi', 'Bengali'];

export const LiveSession: React.FC<LiveSessionProps> = ({ onClose }) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [language, setLanguage] = useState('English');
  const [status, setStatus] = useState<LiveClientStatus>({ isConnected: false, error: null });
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const clientRef = useRef<GeminiLiveClient | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize Client
  useEffect(() => {
    clientRef.current = new GeminiLiveClient(setStatus);
    return () => {
      clientRef.current?.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startSession = async () => {
    try {
      setHasStarted(true);
      
      // Get User Media for Local Preview & Sending
      const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: { facingMode: 'environment' } // Prefer back camera for plants
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      await clientRef.current?.connect(language, stream);

    } catch (err) {
      console.error("Error starting session:", err);
      setStatus({ isConnected: false, error: "Camera/Mic access denied" });
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => t.enabled = isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => t.enabled = !isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const handleEndCall = () => {
    clientRef.current?.stop();
    onClose();
  };

  if (!hasStarted) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
           <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center animate-pulse">
                 <SparklesIcon className="w-10 h-10 text-emerald-400" />
              </div>
           </div>
           
           <h2 className="text-2xl font-bold text-white text-center mb-2">Live Plant Expert</h2>
           <p className="text-gray-400 text-center text-sm mb-8">
             Connect with our AI botanist for real-time video diagnosis. 
             Choose your preferred language.
           </p>

           <div className="space-y-3 mb-8">
             {LANGUAGES.map(lang => (
               <button 
                 key={lang}
                 onClick={() => setLanguage(lang)}
                 className={`w-full py-4 rounded-xl border font-medium transition-all ${
                   language === lang 
                     ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/50' 
                     : 'bg-black border-zinc-700 text-gray-400 hover:bg-zinc-800'
                 }`}
               >
                 {lang}
               </button>
             ))}
           </div>

           <button 
             onClick={startSession}
             className="w-full py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
           >
             Start Live Session
           </button>
           
           <button 
             onClick={onClose}
             className="w-full mt-4 text-gray-500 text-sm hover:text-white"
           >
             Cancel
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
       {/* Video Background */}
       <div className="relative flex-1 bg-black overflow-hidden">
         <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${!isVideoEnabled ? 'opacity-0' : 'opacity-100'}`}
         />
         {!isVideoEnabled && (
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center">
               <VideoOffIcon className="w-10 h-10 text-gray-500" />
             </div>
           </div>
         )}
         
         {/* Status Overlay */}
         <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${status.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
               <span className="text-xs font-bold text-white uppercase tracking-wider">
                 {status.isConnected ? 'Live Expert' : 'Connecting...'}
               </span>
            </div>
            
            <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs text-white">
               {language}
            </div>
         </div>

         {/* Visualizer Overlay (Fake for UI feel) */}
         {status.isConnected && (
            <div className="absolute bottom-32 left-0 right-0 h-16 flex items-center justify-center gap-1 opacity-60">
               {[...Array(10)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-emerald-400 rounded-full animate-wave" 
                    style={{ 
                      height: '20%', 
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.8s' 
                    }}
                  ></div>
               ))}
            </div>
         )}
       </div>

       {/* Controls */}
       <div className="h-28 bg-black/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-center gap-8 pb-4">
          <button 
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${!isVideoEnabled ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
          >
             {isVideoEnabled ? <VideoIcon className="w-6 h-6" /> : <VideoOffIcon className="w-6 h-6" />}
          </button>

          <button 
            onClick={handleEndCall}
            className="p-5 bg-red-500 rounded-full text-white shadow-lg shadow-red-900/50 hover:scale-105 transition-transform"
          >
             <PhoneXIcon className="w-8 h-8" />
          </button>

          <button 
            onClick={toggleMute}
            className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
          >
             {isMuted ? <MicOffIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
          </button>
       </div>
    </div>
  );
};
