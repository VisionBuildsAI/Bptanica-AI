
import React, { useEffect, useRef, useState } from 'react';
import { GeminiLiveClient, LiveClientStatus } from '../services/liveClient';
import { MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, PhoneXIcon, SparklesIcon, WarningIcon } from './Icons';

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
      setStatus({ isConnected: false, error: null });

      const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      await clientRef.current?.connect(language, stream);

    } catch (err: any) {
      console.error("Session start error:", err);
      let errorMsg = "Camera/Mic access denied.";
      if (err.name === 'NotAllowedError') errorMsg = "Please enable Camera and Mic permissions in your browser settings.";
      setStatus({ isConnected: false, error: errorMsg });
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted; // Toggle based on current state
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const handleEndCall = () => {
    clientRef.current?.stop();
    onClose();
  };

  if (!hasStarted) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 animate-fade-in overflow-hidden">
        <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
           <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                 <SparklesIcon className="w-10 h-10 text-emerald-400" />
              </div>
           </div>
           
           <h2 className="text-2xl font-bold text-white text-center mb-2">Live Expert</h2>
           <p className="text-gray-400 text-center text-sm mb-8 leading-relaxed">
             Get real-time garden arrangement tips and plant diagnosis. 
             Choose your language to begin.
           </p>

           <div className="space-y-3 mb-8">
             {LANGUAGES.map(lang => (
               <button 
                 key={lang}
                 onClick={() => setLanguage(lang)}
                 className={`w-full py-4 rounded-xl border font-medium transition-all active:scale-95 ${
                   language === lang 
                     ? 'bg-emerald-600 border-emerald-500 text-white' 
                     : 'bg-black border-zinc-700 text-gray-400'
                 }`}
               >
                 {lang}
               </button>
             ))}
           </div>

           <button 
             onClick={startSession}
             className="w-full py-5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors shadow-lg active:scale-95"
           >
             Start Live Session
           </button>
           
           <button 
             onClick={onClose}
             className="w-full mt-6 text-gray-500 text-sm font-medium"
           >
             Go Back
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
       {/* Error Toast */}
       {status.error && (
         <div className="absolute top-20 left-6 right-6 z-[60] animate-bounce">
            <div className="bg-red-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3">
               <WarningIcon className="w-5 h-5 flex-shrink-0" />
               <p className="text-xs font-bold leading-tight">{status.error}</p>
            </div>
         </div>
       )}

       {/* Video Background */}
       <div className="relative flex-1 bg-black">
         <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover transition-opacity duration-500 ${!isVideoEnabled ? 'opacity-0' : 'opacity-100'}`}
         />
         {!isVideoEnabled && (
           <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
             <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center">
               <VideoOffIcon className="w-10 h-10 text-zinc-700" />
             </div>
           </div>
         )}
         
         {/* Top Controls */}
         <div className="absolute top-[env(safe-area-inset-top,24px)] left-6 right-6 flex justify-between items-center">
            <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${status.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
               <span className="text-[10px] font-black text-white uppercase tracking-widest">
                 {status.isConnected ? 'Live Expert Online' : 'Connecting...'}
               </span>
            </div>
            <div className="bg-emerald-600/20 backdrop-blur-xl px-3 py-1 rounded-full border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">
               {language}
            </div>
         </div>

         {/* Audio Visualizer Overlay */}
         {status.isConnected && (
            <div className="absolute bottom-36 left-0 right-0 h-12 flex items-center justify-center gap-1.5 opacity-40">
               {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-white rounded-full animate-wave" 
                    style={{ 
                      height: '20%', 
                      animationDelay: `${i * 0.08}s`,
                      animationDuration: '0.6s' 
                    }}
                  ></div>
               ))}
            </div>
         )}
       </div>

       {/* Main Controls Area */}
       <div className="pb-[env(safe-area-inset-bottom,24px)] pt-6 bg-zinc-950 border-t border-white/5 flex items-center justify-center gap-6">
          <button 
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${!isVideoEnabled ? 'bg-white text-black' : 'bg-zinc-800 text-white'}`}
          >
             {isVideoEnabled ? <VideoIcon className="w-6 h-6" /> : <VideoOffIcon className="w-6 h-6" />}
          </button>

          <button 
            onClick={handleEndCall}
            className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white shadow-[0_0_50px_rgba(239,68,68,0.3)] active:scale-90 transition-transform"
          >
             <PhoneXIcon className="w-10 h-10" />
          </button>

          <button 
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-white text-black' : 'bg-zinc-800 text-white'}`}
          >
             {isMuted ? <MicOffIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
          </button>
       </div>
    </div>
  );
};
