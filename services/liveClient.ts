
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';

export interface LiveClientStatus {
  isConnected: boolean;
  error: string | null;
}

export class GeminiLiveClient {
  private audioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;
  private sessionPromise: Promise<any> | null = null;
  private statusChangeCallback: (status: LiveClientStatus) => void;
  private videoInterval: number | null = null;
  private currentStream: MediaStream | null = null;
  
  constructor(statusCallback: (status: LiveClientStatus) => void) {
    this.statusChangeCallback = statusCallback;
  }

  async connect(language: string, videoStream: MediaStream | null) {
    // Always use the latest injected key
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      this.statusChangeCallback({ isConnected: false, error: "API Key unavailable. Please wait and retry." });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    this.stop(); 
    this.currentStream = videoStream;
    this.statusChangeCallback({ isConnected: false, error: null });

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      await this.audioContext.resume();

      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.inputSource = this.audioContext.createMediaStreamSource(micStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      const systemInstruction = `You are 'Botanica Live', a master garden architect and plant pathologist. 
      The user is showing you their plants or garden in real-time. 
      Your mission:
      1. DIAGNOSE: If shown a leaf, identify pests, diseases, or nutrient deficiencies immediately. Explain how to cure it clearly.
      2. ARRANGE: If shown a garden space, look at empty spots and lighting. Suggest aesthetic and functional improvements (e.g., 'Move the succulents to that sunny corner', 'Add a trellis here').
      3. IMPROVE: Recommend specific plants to add based on the environment you see (sun/shade/size).
      4. FIND: When you recommend a plant or treatment, use Google Search to find where the user can find or buy it online or in major nurseries.
      User Language: ${language}. Be conversational, expert, and encouraging. Respond with audio.`;

      this.sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO], 
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: systemInstruction,
          tools: [{ googleSearch: {} }]
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live: Connected");
            this.statusChangeCallback({ isConnected: true, error: null });
            this.startAudioInput();
            if (this.currentStream) {
               this.startVideoInput(this.currentStream);
            }
          },
          onmessage: (message: LiveServerMessage) => this.handleMessage(message),
          onclose: () => {
            this.statusChangeCallback({ isConnected: false, error: null });
            this.stop();
          },
          onerror: (err) => {
            console.error("Gemini Live Error:", err);
            this.statusChangeCallback({ isConnected: false, error: "Connection lost. Please retry." });
            this.stop();
          }
        }
      });

    } catch (e) {
      console.error("Gemini Live Setup Failed:", e);
      this.statusChangeCallback({ isConnected: false, error: "Microphone/API access failed." });
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
            mimeType: "audio/pcm;rate=24000",
            data: base64Data
          }
        });
      }).catch(() => {});
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.audioContext!.destination);
  }

  private startVideoInput(stream: MediaStream) {
     const video = document.createElement('video');
     video.srcObject = stream;
     video.muted = true;
     video.playsInline = true;
     video.play().catch(() => {});
     
     const canvas = document.createElement('canvas');
     const ctx = canvas.getContext('2d', { alpha: false });
     
     this.videoInterval = window.setInterval(() => {
        if (!ctx || video.readyState !== 4) return;
        
        const scale = Math.min(640 / video.videoWidth, 480 / video.videoHeight);
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
        
        this.sessionPromise?.then(session => {
           session.sendRealtimeInput({
              media: {
                 mimeType: "image/jpeg",
                 data: base64Data
              }
           });
        }).catch(() => {});

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
    if (!this.audioContext || this.audioContext.state === 'suspended') return;
    
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
    this.nextStartTime = 0;
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
