// StopGuard Speech Recognition Engine
// Wraps the Web Speech API with legal-term grammar tuning for high accuracy.
// Includes auto-restart (Chrome stops after ~60s), interim results, and error handling.

export type RecognitionStatus = "idle" | "listening" | "error" | "unsupported";

export interface SpeechConfig {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

// JSGF grammar of legal terms to bias the speech recognizer toward
// precise legal language during traffic stops. This dramatically improves
// accuracy for critical terms like "consent", "search", "detained", etc.
const LEGAL_GRAMMAR = `#JSGF V1.0;
grammar legalTerms;
public <term> = consent | search | seizure | detain | detained | detention |
arrest | arrested | attorney | lawyer | badge | badge number |
Miranda | fourth amendment | fifth amendment | first amendment |
probable cause | reasonable suspicion | free to go | remain silent |
silent | registration | license | insurance | proof of insurance |
speeding | speeding ticket | tail light | headlight | broken taillight |
broken headlight | stop sign | red light | seatbelt | seat belt |
cell phone | open container | tinted windows | tinted window |
reckless driving | failure to yield | failure to stop |
following too close | expired registration | expired plates |
expired sticker | K-9 | K9 | drug dog | narcotics |
supervisor | warrant | plain view | pat down | frisk |
citation | warning | ticket | pull over | pullover |
step out | step out of the car | step out of the vehicle |
license and registration | license registration and insurance |
do not consent | I do not consent | don't consent |
invoke my right | invoking my right | I invoke |
right to remain silent | right to an attorney | right to a lawyer |
am I being detained | am I free to go | am I under arrest |
I want a lawyer | I want an attorney | give me a lawyer |
stop recording | stop filming | put the phone down |
turn off the camera | turn off your phone | no cameras |
name and badge | your name | your badge number |
what is your name | what is your badge number |
where are you going | where are you coming from |
what are you doing | what's in the trunk | what's in the glove box |
have you been drinking | how much did you drink |
open the trunk | open the glove box | open the center console |
you're being detained | you're under arrest | you're not free to go |
I'm going to search | I need to search | let me search |
I smell | I see | I observed | I noticed |
marijuana | weed | cannabis | alcohol | drugs | contraband |
weapon | gun | knife | firearm |
reasonable | unreasonable | voluntary | permission |
can I search | may I search | do you mind if I search |
you have the right | anything you say |
afford an attorney | appointed an attorney |
 sheriffs | deputy | trooper | officer | sergeant | lieutenant |
highway patrol | state police | local police | county mountie |
give me your license | hand me your license |
stay in the car | keep your hands | hands on the wheel |
registration please | driver's license please |
turn off the engine | keys out of the ignition |
passenger ID | passenger identification |
dispatch | radio | backup | supervisor on scene;`;

export interface SpeechTranscriberCallbacks {
  onInterim?: (text: string, confidence: number) => void;
  onFinal?: (text: string, confidence: number) => void;
  onError?: (error: string, message: string) => void;
  onStatusChange?: (status: RecognitionStatus) => void;
}

export class SpeechTranscriber {
  private recognition: any = null;
  private isListening = false;
  private restartTimer: number | null = null;
  private lang: string;
  private callbacks: SpeechTranscriberCallbacks;
  private supported: boolean;

  constructor(lang: string, callbacks: SpeechTranscriberCallbacks) {
    this.lang = lang;
    this.callbacks = callbacks;

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      this.supported = false;
      this.callbacks.onStatusChange?.("unsupported");
      return;
    }

    this.supported = true;
    this.recognition = new SR();
    this.configureRecognition();

    this.recognition.onresult = (event: any) => {
      let interimText = "";
      let interimConf = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alt = result[0];
        const transcript = alt.transcript;
        const confidence = alt.confidence || 0;

        if (result.isFinal) {
          const clean = transcript.trim();
          if (clean) {
            this.callbacks.onFinal?.(clean, confidence);
          }
        } else {
          interimText = transcript;
          interimConf = confidence;
        }
      }

      if (interimText) {
        this.callbacks.onInterim?.(interimText, interimConf);
      }
    };

    this.recognition.onerror = (event: any) => {
      const error = event.error;
      if (error === "no-speech" || error === "aborted") return;

      if (error === "not-allowed" || error === "service-not-allowed") {
        this.isListening = false;
        this.callbacks.onStatusChange?.("error");
        this.callbacks.onError?.(
          "permission-denied",
          "Microphone access denied. Enable microphone permissions in your browser settings to use live transcription."
        );
        return;
      }

      if (error === "network") {
        this.callbacks.onError?.(
          "network",
          "Speech recognition network error. Check your internet connection."
        );
        return;
      }

      if (error === "audio-capture") {
        this.isListening = false;
        this.callbacks.onStatusChange?.("error");
        this.callbacks.onError?.(
          "no-mic",
          "No microphone detected. Connect a microphone to use live transcription."
        );
        return;
      }
    };

    this.recognition.onend = () => {
      // Chrome stops recognition after ~60 seconds of continuous speech.
      // Auto-restart if we're still supposed to be listening.
      if (this.isListening) {
        this.restartTimer = window.setTimeout(() => {
          try {
            this.recognition.start();
          } catch {
            // Already started or transitioning
          }
        }, 150);
      }
    };
  }

  private configureRecognition() {
    if (!this.recognition) return;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.lang;
    this.recognition.maxAlternatives = 3;

    // Add legal-term grammar for better word detection
    const SGL =
      (window as any).SpeechGrammarList ||
      (window as any).webkitSpeechGrammarList;
    if (SGL) {
      try {
        const grammar = new SGL();
        grammar.addFromString(LEGAL_GRAMMAR, 0.8);
        this.recognition.grammars = grammar;
      } catch {
        // Grammar not supported on this browser, continue without it
      }
    }
  }

  isSupported(): boolean {
    return this.supported;
  }

  start() {
    if (!this.supported) {
      this.callbacks.onStatusChange?.("unsupported");
      return;
    }
    this.isListening = true;
    this.callbacks.onStatusChange?.("listening");
    try {
      this.recognition.start();
    } catch {
      // Already started
    }
  }

  stop() {
    this.isListening = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Already stopped
      }
    }
    this.callbacks.onStatusChange?.("idle");
  }

  setLanguage(lang: string) {
    this.lang = lang;
    const wasListening = this.isListening;
    if (wasListening) this.stop();
    if (this.recognition) {
      this.recognition.lang = lang;
    }
    if (wasListening) {
      setTimeout(() => this.start(), 300);
    }
  }

  destroy() {
    this.stop();
    this.recognition = null;
  }
}

// --- Language options -------------------------------------------------------

export interface LanguageOption {
  code: string;
  label: string;
  nativeName: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en-US", label: "English (US)", nativeName: "English" },
  { code: "es-US", label: "Spanish (US)", nativeName: "Español" },
  { code: "es-ES", label: "Spanish (Spain)", nativeName: "Español (España)" },
  { code: "fr-CA", label: "French (Canada)", nativeName: "Français" },
  { code: "fr-FR", label: "French (France)", nativeName: "Français" },
  { code: "de-DE", label: "German", nativeName: "Deutsch" },
  { code: "zh-CN", label: "Chinese (Mandarin)", nativeName: "中文" },
  { code: "zh-TW", label: "Chinese (Taiwan)", nativeName: "中文 (台灣)" },
  { code: "ko-KR", label: "Korean", nativeName: "한국어" },
  { code: "ja-JP", label: "Japanese", nativeName: "日本語" },
  { code: "vi-VN", label: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "ru-RU", label: "Russian", nativeName: "Русский" },
  { code: "ar-SA", label: "Arabic", nativeName: "العربية" },
  { code: "pt-BR", label: "Portuguese (Brazil)", nativeName: "Português" },
  { code: "hi-IN", label: "Hindi", nativeName: "हिन्दी" },
  { code: "fil-PH", label: "Tagalog (Filipino)", nativeName: "Filipino" },
  { code: "it-IT", label: "Italian", nativeName: "Italiano" },
  { code: "pl-PL", label: "Polish", nativeName: "Polski" },
  { code: "th-TH", label: "Thai", nativeName: "ไทย" },
  { code: "tr-TR", label: "Turkish", nativeName: "Türkçe" },
  { code: "uk-UA", label: "Ukrainian", nativeName: "Українська" },
  { code: "fa-AF", label: "Dari (Afghan Persian)", nativeName: "دری" },
];

export function getLanguageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label || "English (US)";
}
