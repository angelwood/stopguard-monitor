// StopGuard Audio Recorder Engine
// Uses MediaRecorder API to capture actual audio during a traffic stop.

export type RecordingStatus = "idle" | "recording" | "stopped" | "error";

export interface RecordingResult {
  blob: Blob;
  url: string;
  durationSec: number;
  sizeBytes: number;
  mimeType: string;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private status: RecordingStatus = "idle";
  private onStatusChange?: (status: RecordingStatus) => void;
  private onLevel?: (level: number) => void;
  private analyser: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;
  private levelRaf: number | null = null;

  constructor(callbacks?: {
    onStatusChange?: (status: RecordingStatus) => void;
    onLevel?: (level: number) => void;
  }) {
    this.onStatusChange = callbacks?.onStatusChange;
    this.onLevel = callbacks?.onLevel;
  }

  isSupported(): boolean {
    return typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices;
  }

  async start(): Promise<void> {
    if (!this.isSupported()) {
      this.status = "error";
      this.onStatusChange?.(this.status);
      throw new Error("MediaRecorder not supported");
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      this.status = "error";
      this.onStatusChange?.(this.status);
      throw new Error("Microphone permission denied");
    }

    this.chunks = [];
    this.startTime = Date.now();

    const mimeType = this.getSupportedMimeType();
    this.mediaRecorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);

    this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      this.status = "stopped";
      this.onStatusChange?.(this.status);
    };

    // Audio level monitoring for the waveform indicator
    try {
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);
      this.monitorLevel();
    } catch { /* level monitoring optional */ }

    this.mediaRecorder.start(1000); // collect data every second
    this.status = "recording";
    this.onStatusChange?.(this.status);
  }

  private monitorLevel() {
    if (!this.analyser) return;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    const tick = () => {
      if (!this.analyser || this.status !== "recording") return;
      this.analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      this.onLevel?.(avg / 255);
      this.levelRaf = requestAnimationFrame(tick);
    };
    tick();
  }

  private getSupportedMimeType(): string | undefined {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return undefined;
  }

  stop(): RecordingResult | null {
    if (!this.mediaRecorder || this.status !== "recording") return null;

    this.mediaRecorder.stop();
    if (this.levelRaf) cancelAnimationFrame(this.levelRaf);
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }

    const blob = new Blob(this.chunks, {
      type: this.mediaRecorder.mimeType || "audio/webm",
    });
    const url = URL.createObjectURL(blob);
    const durationSec = Math.round((Date.now() - this.startTime) / 1000);

    this.status = "stopped";
    this.onStatusChange?.(this.status);

    return {
      blob,
      url,
      durationSec,
      sizeBytes: blob.size,
      mimeType: blob.type,
    };
  }

  getDurationSec(): number {
    if (this.startTime === 0) return 0;
    return Math.round((Date.now() - this.startTime) / 1000);
  }

  getStatus(): RecordingStatus {
    return this.status;
  }

  destroy() {
    if (this.levelRaf) cancelAnimationFrame(this.levelRaf);
    if (this.audioContext) this.audioContext.close().catch(() => {});
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try { this.mediaRecorder.stop(); } catch { /* ignore */ }
    }
    this.stream = null;
    this.mediaRecorder = null;
    this.audioContext = null;
    this.analyser = null;
    this.status = "idle";
  }
}
