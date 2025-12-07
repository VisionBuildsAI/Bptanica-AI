import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

export interface LiveClientStatus {
  isConnected: boolean;
  error: string | null;
}

export class GeminiLiveClient {
  private ai: GoogleGenAI;
  private audioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;
  private sessionPromise: Promise<any> | null = null;
  private statusChangeCallback: (status: LiveClientStatus) => void;
  private videoInterval: number | null = null;
  private currentStream: MediaStream | null = null;
  
  constructor(statusCallback: (status: LiveClientStatus) => void) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.statusChangeCallback = statusCallback;
  }

  async connect(language: string, videoStream: MediaStream | null) {
    this.stop(); // Ensure clean state
    this.currentStream = videoStream;
    this.statusChangeCallback({ isConnected: false, error: null });

    try {
      // 1. Initialize Audio Contexts (must be done after user gesture)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      await this.audioContext.resume();

      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      await inputAudioContext.resume();

      // 2. Setup Audio Input
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.inputSource = inputAudioContext.createMediaStreamSource(micStream);
      this.processor = inputAudioContext.createScriptProcessor(4096, 1, 1);

      // 3. Define Config
      // We explicitly follow the prompt's Live API example structure.
      const systemInstruction = `You are 'Sprout', a gardening expert. User language: ${language}. Answer concisely.`;

      this.sessionPromise = this.ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO], 
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: systemInstruction,
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live: Connected");
            this.statusChangeCallback({ isConnected: true, error: null });
            
            // Start processing audio input
            this.startAudioInput();
            
            // Start processing video input if available
            if (this.currentStream) {
               this.startVideoInput(this.currentStream);
            }
          },
          onmessage: (message: LiveServerMessage) => this.handleMessage(message),
          onclose: () => {
            console.log("Gemini Live: Closed");
            this.statusChangeCallback({ isConnected: false, error: null });
            this.stop();
          },
          onerror: (err) => {
            console.error("Gemini Live: Error", err);
            this.statusChangeCallback({ isConnected: false, error: "Connection failed. Please retry." });
            this.stop();
          }
        }
      });

    } catch (e) {
      console.error("Gemini Live: Setup Failed", e);
      this.statusChangeCallback({ isConnected: false, error: "Failed to start audio/video. Check permissions." });
      this.stop();
    }
  }

  private startAudioInput() {
    if (!this.processor || !this.inputSource || !this.sessionPromise) return;

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = this.float32ToInt16(inputData);
      const base64Data = this.arrayBufferToBase64(pcmData.buffer);
      
      this.sessionPromise?.then(session => {
        session.sendRealtimeInput({
          media: {
            mimeType: "audio/pcm;rate=16000",
            data: base64Data
          }
        });
      }).catch(err => {
        // Suppress errors if session is closed/closing
        console.debug("Error sending audio input:", err);
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputSource.context.destination);
  }

  private startVideoInput(stream: MediaStream) {
     const videoTrack = stream.getVideoTracks()[0];
     if (!videoTrack) return;

     const video = document.createElement('video');
     video.srcObject = stream;
     video.muted = true;
     video.play().catch(e => console.error("Video play error", e));
     
     const canvas = document.createElement('canvas');
     const ctx = canvas.getContext('2d');
     
     // Send frames at 1 FPS
     this.videoInterval = window.setInterval(() => {
        if (!ctx || video.readyState !== 4) return;
        
        // Downscale to 640px max width for bandwidth optimization
        const scale = Math.min(640 / video.videoWidth, 480 / video.videoHeight);
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Quality 0.6 is sufficient for AI analysis
        const base64Data = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
        
        this.sessionPromise?.then(session => {
           session.sendRealtimeInput({
              media: {
                 mimeType: "image/jpeg",
                 data: base64Data
              }
           });
        }).catch(err => {
           console.debug("Error sending video frame:", err);
        });

     }, 1000); 
  }

  private async handleMessage(message: LiveServerMessage) {
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData && this.audioContext) {
      try {
        const audioBuffer = await this.decodeAudioData(audioData);
        this.playAudio(audioBuffer);
      } catch (e) {
        console.error("Audio decoding error:", e);
      }
    }
  }

  private async decodeAudioData(base64: string): Promise<AudioBuffer> {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Convert raw PCM 24kHz mono to AudioBuffer
    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 32768.0;
    }

    const buffer = this.audioContext!.createBuffer(1, floatData.length, 24000);
    buffer.copyToChannel(floatData, 0);
    return buffer;
  }

  private playAudio(buffer: AudioBuffer) {
    if (!this.audioContext) return;
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    
    const currentTime = this.audioContext.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
  }

  stop() {
    if (this.processor) {
        this.processor.disconnect();
        this.processor.onaudioprocess = null;
        this.processor = null;
    }
    if (this.inputSource) {
        this.inputSource.disconnect();
        this.inputSource = null;
    }
    if (this.videoInterval) {
        clearInterval(this.videoInterval);
        this.videoInterval = null;
    }
    if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
    }
    this.sessionPromise = null;
    this.currentStream = null;
  }

  private float32ToInt16(float32: Float32Array): Int16Array {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}