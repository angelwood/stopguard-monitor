// StopGuard Rights Analysis Engine — State-Aware
// Based on federal constitutional law (4th, 5th, 6th, 1st Amendments)
// overlaid with state-specific statutes. Decision-support, not legal advice.

import type { StateLaw } from "./stateLaws";

export type Severity = "critical" | "warning" | "info" | "success";

export interface RightsViolation {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  legalBasis: string;
  suggestion: string;
  timestamp: number;
  checkId: string;
}

export interface TranscriptLine {
  id: string;
  speaker: "officer" | "driver" | "unknown";
  text: string;
  timestamp: number;
  confidence?: number;
}

export interface AnalysisContext {
  transcript: TranscriptLine[];
  durationSec: number;
  stateLaw?: StateLaw;
}

function speakerLines(lines: TranscriptLine[], speaker: "officer" | "driver"): TranscriptLine[] {
  // Include "unknown" lines (auto-transcribed) in both officer and driver searches,
  // since speech recognition doesn't distinguish speakers. Pattern matching
  // on text content + timestamps preserves correct sequencing.
  return lines.filter((l) => l.speaker === speaker || l.speaker === "unknown");
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

interface RightsCheck {
  id: string;
  name: string;
  description: string;
  legalBasis: string;
  severity: Severity;
  check: (ctx: AnalysisContext, already: Set<string>) => RightsViolation | null;
}

export const RIGHTS_CHECKS: RightsCheck[] = [
  // 1. Reason for stop
  {
    id: "stop-reason",
    name: "Reason for Stop",
    description: "Officer must state reason for the traffic stop",
    legalBasis: "Fourth Amendment — Delaware v. Prouse (1979). All states require reasonable suspicion.",
    severity: "warning",
    check: (ctx, already) => {
      if (already.has("stop-reason") || ctx.durationSec < 120) return null;
      const officerText = speakerLines(ctx.transcript, "officer").map((l) => l.text).join(" ");
      const reasonPatterns: RegExp[] = [
        /pulled you over because/i, /reason I stopped you/i, /stopped you for/i,
        /you were speeding/i, /you ran (a|the) (stop sign|red light)/i,
        /failure to (yield|stop|signal|maintain)/i, /tail ?light/i, /head ?light/i,
        /expired (registration|plates?|sticker|tags)/i, /broken (taillight|headlight|mirror|windshield)/i,
        /lane (violation|change)/i, /following too close/i, /no seat ?belt/i,
        /cell ?phone/i, /tinted windows/i, /reckless driving/i,
        /your (speed|registration|license plate)/i,
        /I (observed|clocked|saw|noticed) (you|your)/i,
        /traffic (violation|offense|infraction)/i, /I'm stopping you for/i,
        /the reason (I|we) (pulled|stopped) you/i,
        /you (failed to|didn't|did not) (stop|yield|signal)/i,
        /stop sign/i, /red light/i, /speeding/i, /doing \d+ (in|mph)/i,
        /swerving/i, /weaving/i, /failure to maintain/i,
      ];
      if (!matchesAny(officerText, reasonPatterns)) {
        return {
          id: "v-stop-reason-" + Date.now(), checkId: "stop-reason", severity: "warning",
          title: "No reason for stop stated",
          description: "The officer has not articulated a reason for the traffic stop after 2 minutes. Law enforcement must have reasonable suspicion of a violation.",
          legalBasis: "Fourth Amendment — Delaware v. Prouse (1979). All US states require reasonable suspicion for traffic stops.",
          suggestion: 'Ask: "What is the reason for the stop?" You are not required to answer questions about where you are going or what you are doing.',
          timestamp: ctx.durationSec,
        };
      }
      return null;
    },
  },

  // 2. Search without consent or probable cause
  {
    id: "search-no-consent",
    name: "Search Without Consent",
    description: "Vehicle search without consent, warrant, or probable cause",
    legalBasis: "Fourth Amendment — Carroll v. U.S. (1925). Applies to all states.",
    severity: "critical",
    check: (ctx, already) => {
      if (already.has("search-no-consent")) return null;
      const officerLines = speakerLines(ctx.transcript, "officer");
      const driverLines = speakerLines(ctx.transcript, "driver");
      const searchPatterns: RegExp[] = [
        /\bsearch (your|the|my) (vehicle|car|truck|suv|auto)\b/i, /going to search/i,
        /I'll search/i, /let me search/i, /I need to search/i,
        /open (your |the )?(trunk|glove box|center console)/i,
        /I'm (going to|gonna) look (in|around|through)/i,
        /step out (of the car|of the vehicle)? .*(search|look)/i,
        /searching your/i, /conduct a search/i, /can I search/i, /may I search/i,
      ];
      const searchLine = officerLines.find((l) => searchPatterns.some((p) => p.test(l.text)));
      if (!searchLine) return null;

      const consentPatterns: RegExp[] = [
        /(yes|sure|go ahead|okay|fine)\b.*search/i, /you can search/i,
        /I (don't|do not) mind (you|if you) (search|look)/i,
      ];
      const consentGiven = driverLines.some((l) => consentPatterns.some((p) => p.test(l.text)));

      const pcPatterns: RegExp[] = [
        /I smell (marijuana|weed|alcohol|drugs|narcotics|cannabis|burnt)/i,
        /I see (open container|drugs|paraphernalia|weapon|contraband)/i,
        /in plain (view|sight)/i, /I observed (drugs|alcohol|weapon)/i,
        /probable cause/i, /plain view/i,
        /I (see|saw) (a |some )?(weapon|gun|drugs|pipe|needle)/i,
        /smell of (alcohol|burnt|cannabis)/i,
      ];
      const officerAllText = officerLines.map((l) => l.text).join(" ");
      const pcArticulated = matchesAny(officerAllText, pcPatterns);

      if (!consentGiven && !pcArticulated) {
        return {
          id: "v-search-" + Date.now(), checkId: "search-no-consent", severity: "critical",
          title: "Search without consent or probable cause",
          description: "The officer appears to be conducting a search of your vehicle without your consent or articulable probable cause. This may violate your Fourth Amendment protection against unreasonable searches.",
          legalBasis: "Fourth Amendment — Carroll v. U.S. (1925), Arizona v. Johnson (2009). Consent must be voluntary; you may refuse. Applies to all states.",
          suggestion: 'Clearly state: "I do not consent to any search of my vehicle." Remain calm. Do not physically resist. The recording documents the lack of consent.',
          timestamp: searchLine.timestamp,
        };
      }
      return null;
    },
  },

  // 3. Recording interference — state-aware
  {
    id: "recording-interference",
    name: "Recording Interference",
    description: "Officer ordering you to stop recording",
    legalBasis: "First Amendment — right to record police in public. State recording consent laws vary.",
    severity: "critical",
    check: (ctx, already) => {
      if (already.has("recording-interference")) return null;
      const officerText = speakerLines(ctx.transcript, "officer").map((l) => l.text).join(" ");
      const patterns: RegExp[] = [
        /stop (recording|filming|taping)/i, /turn (that|your phone|it) off/i,
        /put (your phone|that|it) (away|down)/i, /you can('?t| not) record/i,
        /no (recording|cameras|filming) (allowed|permitted)?/i,
        /recording is (not allowed|illegal|prohibited)/i,
        /confiscat(e|ing) (your |the )?(phone|camera|device)/i,
        /give me your phone/i, /I'll (need to )?take (your|that) phone/i,
        /turn off (your |the )?(camera|phone|device)/i,
      ];
      if (matchesAny(officerText, patterns)) {
        const stateLaw = ctx.stateLaw;
        const consentNote = stateLaw
          ? `${stateLaw.name} is a ${stateLaw.recordingConsent === "all-party" ? "all-party" : "one-party"} consent state. ${stateLaw.recordingPoliceNote}`
          : "";
        return {
          id: "v-recording-" + Date.now(), checkId: "recording-interference", severity: "critical",
          title: "Interference with right to record",
          description: "The officer is attempting to stop you from recording the interaction. Recording police in public is a First Amendment right, and this interference may be unconstitutional.",
          legalBasis: `First Amendment — ACLU v. Alvarez (7th Cir. 2012), Glik v. Cunniffe (1st Cir. 2011). Courts have held recording police in public is clearly established First Amendment conduct, regardless of state wiretapping laws. ${consentNote}`,
          suggestion: 'You may say: "I am exercising my First Amendment right to record." Do not resist physically. The cloud backup ensures the recording survives even if the phone is taken.',
          timestamp: ctx.durationSec,
        };
      }
      return null;
    },
  },

  // 4. Badge number / name refusal — state-aware
  {
    id: "badge-refusal",
    name: "Officer Identity Refusal",
    description: "Officer refuses to provide name or badge number when asked",
    legalBasis: "State law varies. Some states require officer identification during stops.",
    severity: "warning",
    check: (ctx, already) => {
      if (already.has("badge-refusal")) return null;
      const driverText = speakerLines(ctx.transcript, "driver").map((l) => l.text).join(" ");
      const officerText = speakerLines(ctx.transcript, "officer").map((l) => l.text).join(" ");
      const askedPatterns: RegExp[] = [
        /what'?s your (name|badge (number|ID))/i, /your (name|badge (number|ID))\??/i,
        /name and badge/i, /badge number/i, /who are you/i, /your (name|badge)/i,
        /can I (get|see) your (name|badge)/i,
      ];
      const asked = matchesAny(driverText, askedPatterns);
      if (!asked) return null;

      const refusalPatterns: RegExp[] = [
        /I don'?t (need to|have to) (give|provide) (you )?(that|my name|my badge)/i,
        /not (going to|gonna) (give|tell) you/i, /none of your business/i,
        /it'?s on (the|your) (citation|ticket)/i, /you'?ll get it on the ticket/i,
        /I don'?t have to tell you/i,
      ];
      const refused = matchesAny(officerText, refusalPatterns);
      const providedPatterns: RegExp[] = [
        /my name is/i, /officer \w+/i, /badge (number|ID) (is|:)\s*\d/i, /\b\d{3,5}\b/i,
      ];
      const provided = matchesAny(officerText, providedPatterns);

      if (refused || (asked && !provided && ctx.durationSec > 30)) {
        const sl = ctx.stateLaw;
        const stateRequires = sl?.officerMustIdentify ?? false;
        const legalBasis = stateRequires
          ? `${sl!.name} law requires officer identification. ${sl!.officerIDNote}`
          : `No state law in ${sl?.name || "this state"} requires officer identification, but many departments have policies requiring it. ${sl?.officerIDNote || ""}`;
        const severity: Severity = stateRequires ? "warning" : "info";
        return {
          id: "v-badge-" + Date.now(), checkId: "badge-refusal", severity,
          title: "Officer identity not provided",
          description: asked && !provided && !refused
            ? "You asked for the officer's name or badge number, and it has not been provided."
            : "The officer refused to provide their name or badge number.",
          legalBasis,
          suggestion: "Note the time of your request. The recording documents the refusal. You can file a complaint with the relevant police department's internal affairs division.",
          timestamp: ctx.durationSec,
        };
      }
      return null;
    },
  },

  // 5. Right to silence violation
  {
    id: "silence-violation",
    name: "Right to Silence Violation",
    description: "Officer continues questioning after you invoke your right to silence",
    legalBasis: "Fifth Amendment — Miranda v. Arizona (1966), Berghuis v. Thompkins (2010). Federal, applies to all states.",
    severity: "warning",
    check: (ctx, already) => {
      if (already.has("silence-violation")) return null;
      const driverLines = speakerLines(ctx.transcript, "driver");
      const officerLines = speakerLines(ctx.transcript, "officer");
      const invokePatterns: RegExp[] = [
        /I (invoke|exercise) my (right to |Fifth Amendment)/i,
        /I'?m (going to )?remain(ing)? silent/i, /I (want to |choose to )?remain silent/i,
        /I'?m not (going to |gonna )?(answer|talk|speak)/i,
        /I (decline to answer|won'?t answer|refuse to answer)/i,
        /Fifth Amendment/i, /right to remain silent/i, /I (don'?t|do not) have to answer/i,
        /not answering (any|your) questions/i, /I want to remain silent/i,
      ];
      const invokeLine = driverLines.find((l) => invokePatterns.some((p) => p.test(l.text)));
      if (!invokeLine) return null;

      const afterInvoke = officerLines.filter((l) => l.timestamp > invokeLine.timestamp);
      const questionPatterns: RegExp[] = [
        /\bwhere (are|were) you (going|coming from)\b/i, /what (are|were) you doing/i,
        /do you have (anything|drugs|weapons)/i, /why (are|were) you (here|there|driving)/i,
        /you need to answer/i, /answer my questions/i, /I asked you a question/i,
        /tell me (where|what|why)/i, /what'?s in the (trunk|glove box|bag)/i,
        /how much (have you|did you) (had to drink|been drinking)/i,
        /have you been drinking/i, /where are you coming from/i,
      ];
      const continued = afterInvoke.some((l) => questionPatterns.some((p) => p.test(l.text)));

      if (continued) {
        return {
          id: "v-silence-" + Date.now(), checkId: "silence-violation", severity: "warning",
          title: "Questioning after invocation of silence",
          description: "You invoked your right to remain silent, but the officer continued to question you. Once you explicitly invoke your Fifth Amendment right, questioning should cease.",
          legalBasis: "Fifth Amendment — Miranda v. Arizona (1966), Berghuis v. Thompkins (2010). Applies to all states.",
          suggestion: 'Continue to remain silent. Do not answer questions after invoking your right. Anything said after invocation can still be used against you in some circumstances.',
          timestamp: ctx.durationSec,
        };
      }
      return null;
    },
  },

  // 6. Extended detention
  {
    id: "extended-detention",
    name: "Extended Detention",
    description: "Stop extending beyond reasonable duration without new justification",
    legalBasis: "Fourth Amendment — Rodriguez v. U.S. (2015). Federal, applies to all states.",
    severity: "warning",
    check: (ctx, already) => {
      if (already.has("extended-detention") || ctx.durationSec < 1200) return null;
      const officerText = speakerLines(ctx.transcript, "officer").map((l) => l.text).join(" ");
      const justificationPatterns: RegExp[] = [
        /K-?9/i, /drug dog/i, /under arrest/i, /placing you under arrest/i,
        /you'?re being detained/i, /calling for (backup|a tow|a supervisor)/i,
        /waiting for (a |the )?(supervisor|K-?9|warrant)/i, /I'?m (getting|waiting for) a warrant/i,
      ];
      const hasJustification = matchesAny(officerText, justificationPatterns);
      if (!hasJustification) {
        return {
          id: "v-detention-" + Date.now(), checkId: "extended-detention", severity: "warning",
          title: "Detention exceeding reasonable duration",
          description: "The stop has lasted over 20 minutes. Routine traffic stops should be completed in the time reasonably needed to issue a citation or warning. Prolonging a stop without additional justification may violate the Fourth Amendment.",
          legalBasis: "Fourth Amendment — Rodriguez v. U.S. (2015). Police may not prolong a stop beyond the time reasonably needed to complete the stop's mission. Applies to all states.",
          suggestion: 'Ask: "Am I being detained, or am I free to go?" If the officer says you are free to go, you may leave. If detained, the officer must have reasonable suspicion for continued detention.',
          timestamp: ctx.durationSec,
        };
      }
      return null;
    },
  },

  // 7. Miranda not read before custodial interrogation
  {
    id: "miranda-not-read",
    name: "Miranda Warning Required",
    description: "Custodial interrogation without Miranda warning",
    legalBasis: "Fifth & Sixth Amendments — Miranda v. Arizona (1966). Federal, applies to all states.",
    severity: "critical",
    check: (ctx, already) => {
      if (already.has("miranda-not-read")) return null;
      const officerLines = speakerLines(ctx.transcript, "officer");
      const officerAllText = officerLines.map((l) => l.text).join(" ");
      const arrestPatterns: RegExp[] = [
        /under arrest/i, /placing you under arrest/i, /you'?re (being |under )?arrest/i,
        /I'?m arresting you/i, /put your hands behind your back/i, /cuff(ed|ing)? (you|them)/i,
      ];
      const arrestLine = officerLines.find((l) => arrestPatterns.some((p) => p.test(l.text)));
      if (!arrestLine) return null;

      const afterArrest = officerLines.filter((l) => l.timestamp > arrestLine.timestamp);
      const questionPatterns: RegExp[] = [
        /\bwhere\b/i, /\bwhat\b/i, /\bwhy\b/i, /\bhow\b/i, /tell me/i,
        /do you/i, /did you/i, /have you/i, /are you/i, /\?/,
      ];
      const asked = afterArrest.some((l) => questionPatterns.some((p) => p.test(l.text)));
      const mirandaPatterns: RegExp[] = [
        /right to remain silent/i, /anything you say (can|will) (and will)? be used/i,
        /right to an? attorney/i, /right to a lawyer/i, /if you cannot afford/i, /Miranda/i,
      ];
      const mirandaRead = matchesAny(officerAllText, mirandaPatterns);

      if (asked && !mirandaRead) {
        return {
          id: "v-miranda-" + Date.now(), checkId: "miranda-not-read", severity: "critical",
          title: "Custodial interrogation without Miranda warning",
          description: "You appear to have been placed under arrest and are being questioned without a Miranda warning. Statements made during custodial interrogation without Miranda may be inadmissible.",
          legalBasis: "Fifth & Sixth Amendments — Miranda v. Arizona (1966). Applies to all states.",
          suggestion: 'Say: "I am invoking my right to remain silent and my right to an attorney." Do not answer questions until you have spoken with an attorney.',
          timestamp: ctx.durationSec,
        };
      }
      return null;
    },
  },

  // 8. Detention without clear status
  {
    id: "detention-status",
    name: "Detention Status Unclear",
    description: "Unable to determine if you're detained or free to go",
    legalBasis: "Fourth Amendment — Florida v. Bostick (1991). Federal, applies to all states.",
    severity: "info",
    check: (ctx, already) => {
      if (already.has("detention-status") || ctx.durationSec < 90) return null;
      const driverText = speakerLines(ctx.transcript, "driver").map((l) => l.text).join(" ");
      const officerText = speakerLines(ctx.transcript, "officer").map((l) => l.text).join(" ");
      const driverAskedStatus = /free to go|am I being detained|can I leave|may I go/i.test(driverText);
      const officerClarified = /free to go|you'?re (not |being )?detained|you can leave|you'?re being detained|I'?m detaining you|not free to leave|you'?re not (free to go|able to leave)/i.test(officerText);
      if (!driverAskedStatus && !officerClarified) {
        return {
          id: "v-detention-status-" + Date.now(), checkId: "detention-status", severity: "info",
          title: "Ask about your detention status",
          description: "You have been stopped for over 90 seconds. If you're unsure whether you're being detained or are free to go, you have the right to ask.",
          legalBasis: "Fourth Amendment — Florida v. Bostick (1991). Applies to all states.",
          suggestion: 'Ask: "Am I being detained, or am I free to go?" If the officer says you are free to go, you may calmly leave.',
          timestamp: ctx.durationSec,
        };
      }
      return null;
    },
  },
];

export function analyzeTranscript(
  transcript: TranscriptLine[],
  durationSec: number,
  existingViolations: RightsViolation[],
  stateLaw?: StateLaw
): RightsViolation[] {
  const ctx: AnalysisContext = { transcript, durationSec, stateLaw };
  const alreadyTriggered = new Set(existingViolations.map((v) => v.checkId));
  const newViolations: RightsViolation[] = [];
  for (const check of RIGHTS_CHECKS) {
    if (alreadyTriggered.has(check.id)) continue;
    const result = check.check(ctx, alreadyTriggered);
    if (result) {
      alreadyTriggered.add(check.id);
      newViolations.push(result);
    }
  }
  return newViolations;
}

// --- Demo scenarios ----------------------------------------------------------

export interface DemoLine {
  delay: number;
  speaker: "officer" | "driver";
  text: string;
  simulatedTimestamp: number;
}

export const DEMO_SCENARIOS: Record<string, { title: string; description: string; lines: DemoLine[] }> = {
  "violation-scenario": {
    title: "Multiple Violations",
    description: "Search without consent, recording interference, badge refusal, and silence violation all in one stop.",
    lines: [
      { delay: 0, speaker: "officer", text: "License, registration, and proof of insurance, please.", simulatedTimestamp: 5 },
      { delay: 4, speaker: "driver", text: "Sure, here you go. Can I ask why I was pulled over?", simulatedTimestamp: 12 },
      { delay: 4, speaker: "officer", text: "Do you know why I pulled you over?", simulatedTimestamp: 18 },
      { delay: 4, speaker: "driver", text: "No, I don't.", simulatedTimestamp: 24 },
      { delay: 4, speaker: "officer", text: "Step out of the vehicle.", simulatedTimestamp: 30 },
      { delay: 4, speaker: "driver", text: "Why? Am I being detained?", simulatedTimestamp: 36 },
      { delay: 5, speaker: "officer", text: "I'm going to search your vehicle now.", simulatedTimestamp: 42 },
      { delay: 4, speaker: "driver", text: "I do not consent to any search.", simulatedTimestamp: 48 },
      { delay: 5, speaker: "officer", text: "Stop recording. Put your phone away.", simulatedTimestamp: 55 },
      { delay: 4, speaker: "driver", text: "I have a First Amendment right to record this interaction.", simulatedTimestamp: 61 },
      { delay: 4, speaker: "driver", text: "What's your name and badge number?", simulatedTimestamp: 64 },
      { delay: 5, speaker: "officer", text: "I don't need to give you that.", simulatedTimestamp: 68 },
      { delay: 5, speaker: "officer", text: "Where are you coming from? Where are you going tonight?", simulatedTimestamp: 74 },
      { delay: 5, speaker: "driver", text: "I'm going to remain silent. I invoke my Fifth Amendment right.", simulatedTimestamp: 81 },
      { delay: 5, speaker: "officer", text: "You need to answer my questions. Where are you coming from?", simulatedTimestamp: 88 },
    ],
  },
  "clean-scenario": {
    title: "Proper Stop",
    description: "Officer follows procedure: states reason, asks for consent, respects rights.",
    lines: [
      { delay: 0, speaker: "officer", text: "Good evening. I'm Officer Daniels, badge 4471. I pulled you over because you were doing 52 in a 35 mile per hour zone.", simulatedTimestamp: 5 },
      { delay: 5, speaker: "driver", text: "I understand, officer. Here's my license and registration.", simulatedTimestamp: 12 },
      { delay: 5, speaker: "officer", text: "Thank you. Do you consent to a search of your vehicle?", simulatedTimestamp: 20 },
      { delay: 4, speaker: "driver", text: "No, I do not consent to a search.", simulatedTimestamp: 26 },
      { delay: 5, speaker: "officer", text: "That's your right. I'm going to write you a citation for speeding. Please wait here.", simulatedTimestamp: 33 },
      { delay: 6, speaker: "officer", text: "Here's your citation. You're free to go. Drive safely.", simulatedTimestamp: 45 },
    ],
  },
};

// --- Rights reference data ---------------------------------------------------

export interface RightInfo {
  id: string;
  title: string;
  summary: string;
  details: string;
  legalBasis: string;
  whatToDo: string;
  category: "during-stop" | "search" | "silence" | "recording" | "after-stop";
}

// Federal rights — apply to all states (Constitution-based)
export const FEDERAL_RIGHTS: RightInfo[] = [
  {
    id: "reason-stop", title: "Officer Must State Reason for Stop",
    summary: "An officer must have reasonable suspicion that you committed a traffic violation to stop you.",
    details: "Police cannot pull you over randomly. They must observe a traffic violation or have reasonable suspicion. You may ask why you were stopped. Specific state vehicle codes vary, but the Fourth Amendment standard applies nationwide.",
    legalBasis: "Fourth Amendment — Delaware v. Prouse (1979). Applies to all states.",
    whatToDo: 'Ask: "What is the reason for the stop?" Note if the officer cannot or will not provide one.',
    category: "during-stop",
  },
  {
    id: "provide-docs", title: "You Must Provide License, Registration, Insurance",
    summary: "All states require you to hand over your driver's license, registration, and proof of insurance when stopped.",
    details: "Failure to produce these documents is a separate offense in every state. Do not reach for them suddenly — wait for the officer to ask, then move slowly and verbally indicate what you are doing. Specific statutes vary by state.",
    legalBasis: "All state vehicle codes require drivers to carry and display these documents on demand. Fourth Amendment stop authority.",
    whatToDo: "Keep documents accessible. When asked, say where they are before reaching. Move slowly.",
    category: "during-stop",
  },
  {
    id: "refuse-search", title: "You Can Refuse Consent to Search",
    summary: "You have the right to refuse consent for a search of your vehicle. Do so clearly and calmly.",
    details: "If the officer has probable cause (e.g., visible contraband, smell of drugs), they may search without consent. But without PC or consent, a search may be unconstitutional. Always state your refusal clearly: 'I do not consent to any search.' Do not physically resist, even if they search anyway. The recording preserves your non-consent.",
    legalBasis: "Fourth Amendment — Carroll v. U.S. (1925), Schneckloth v. Bustamonte (1973). Applies to all states.",
    whatToDo: 'Say clearly: "I do not consent to any search of my vehicle or person." Do not resist physically.',
    category: "search",
  },
  {
    id: "right-silence", title: "Right to Remain Silent",
    summary: "You are not required to answer questions beyond providing your documents. Invoke your right clearly.",
    details: "You must identify yourself and provide documents, but you do not have to answer questions about where you're going, what you're doing, or whether you've been drinking. To invoke, say clearly: 'I am invoking my right to remain silent.' Partial or ambiguous invocations may not be honored — be explicit.",
    legalBasis: "Fifth Amendment — Miranda v. Arizona (1966), Berghuis v. Thompkins (2010). Applies to all states.",
    whatToDo: 'Say: "I am invoking my right to remain silent." Then actually remain silent. Do not answer follow-up questions.',
    category: "silence",
  },
  {
    id: "right-attorney", title: "Right to an Attorney",
    summary: "If you are arrested or in custodial interrogation, you have the right to an attorney.",
    details: "If arrested, say: 'I want to speak with an attorney.' Once invoked, questioning must stop. If you cannot afford an attorney, one will be appointed. Do not answer questions without an attorney present after requesting one.",
    legalBasis: "Sixth Amendment — Gideon v. Wainwright (1963), Miranda v. Arizona (1966). Applies to all states.",
    whatToDo: 'Say: "I want to speak with an attorney, and I will not answer any more questions." Then stop talking.',
    category: "silence",
  },
  {
    id: "right-record", title: "Right to Record Police",
    summary: "You have a First Amendment right to record police officers performing their duties in public.",
    details: "Multiple federal circuit courts have ruled that recording police in public is clearly established First Amendment conduct. State wiretapping laws vary (one-party vs all-party consent), but courts have consistently held that recording public officials performing public duties in public is protected. Do not interfere with the officer's duties while recording.",
    legalBasis: "First Amendment — ACLU v. Alvarez (7th Cir. 2012), Glik v. Cunniffe (1st Cir. 2011), Turner v. Driver (5th Cir. 2017).",
    whatToDo: "You may openly record. Inform the officer you are recording. Keep the phone visible. Do not physically interfere with their duties.",
    category: "recording",
  },
  {
    id: "ask-leave", title: "You May Ask If You're Free to Go",
    summary: "If you are not being detained, you are free to leave. Ask to clarify your status.",
    details: "A traffic stop is a seizure under the Fourth Amendment, but it must be reasonable in duration. If the officer has completed the purpose of the stop (citation, warning), they must let you go. You can ask: 'Am I being detained, or am I free to go?' If free to go, you may leave calmly.",
    legalBasis: "Fourth Amendment — Florida v. Bostick (1991), Rodriguez v. U.S. (2015). Applies to all states.",
    whatToDo: 'Ask: "Am I being detained, or am I free to go?" If free to go, leave calmly and safely.',
    category: "during-stop",
  },
  {
    id: "miranda", title: "Miranda Rights Before Custodial Questioning",
    summary: "If you are arrested and interrogated, the officer must read your Miranda rights first.",
    details: "Miranda warnings must be given before custodial interrogation. If you are placed under arrest and questioned without Miranda, your statements may be inadmissible in court. However, failure to read Miranda does not invalidate the arrest itself.",
    legalBasis: "Fifth & Sixth Amendments — Miranda v. Arizona (1966). Applies to all states.",
    whatToDo: 'If arrested, say: "I am invoking my right to remain silent and my right to an attorney." Do not answer questions.',
    category: "silence",
  },
  {
    id: "complaint", title: "Filing a Complaint After a Stop",
    summary: "You can file a complaint with the police department's internal affairs or civilian oversight board.",
    details: "Many jurisdictions have civilian oversight boards. Keep your recording, note badge numbers, times, and witnesses. File complaints promptly — many jurisdictions have deadlines. Preserve evidence with cloud backup.",
    legalBasis: "State and local oversight laws vary. Most jurisdictions have formal complaint processes.",
    whatToDo: "Preserve your recording (cloud backup). Note badge numbers and times. File a complaint with the relevant oversight body within the jurisdiction's deadline.",
    category: "after-stop",
  },
  {
    id: "no-passenger-id", title: "Passengers Generally Don't Need to Show ID",
    summary: "Unless lawfully detained with reasonable suspicion, passengers are generally not required to provide identification during a traffic stop.",
    details: "Unless the officer has reasonable suspicion that a passenger committed a crime, passengers are generally not required to identify themselves. However, some states have stop-and-identify statutes that may apply. The passenger may ask: 'Am I being detained, or am I free to go?'",
    legalBasis: "Fourth Amendment — Hiibel v. Nevada (2004) applied narrowly. State stop-and-identify statutes vary.",
    whatToDo: 'Passengers may ask: "Am I being detained, or am I free to go?" If not detained, may decline to provide ID.',
    category: "during-stop",
  },
];

// Get state-specific rights based on the selected state's laws
export function getStateSpecificRights(stateLaw: StateLaw): RightInfo[] {
  const rights: RightInfo[] = [];

  // Officer identification
  if (stateLaw.officerMustIdentify) {
    rights.push({
      id: "state-officer-id",
      title: "Officers Must Identify Themselves",
      summary: stateLaw.officerIDNote,
      details: `${stateLaw.name} law requires officers to provide their name and badge number when asked during a stop. If they refuse, note the time of your request — the recording preserves this evidence.`,
      legalBasis: stateLaw.officerIDNote,
      whatToDo: 'Ask: "What is your name and badge number?" Note the time. If refused, the recording documents it.',
      category: "during-stop",
    });
  }

  // Recording consent
  rights.push({
    id: "state-recording",
    title: `Recording Laws in ${stateLaw.name}`,
    summary: `${stateLaw.name} is a ${stateLaw.recordingConsent === "all-party" ? "all-party (two-party)" : "one-party"} consent state for audio recording.`,
    details: stateLaw.recordingPoliceNote,
    legalBasis: stateLaw.recordingPoliceNote,
    whatToDo: "You may openly record police in public regardless of state consent laws. First Amendment protection applies. Keep the phone visible and do not interfere with duties.",
    category: "recording",
  });

  // Stop-and-identify
  if (stateLaw.hasStopAndIdentify) {
    rights.push({
      id: "state-stop-identify",
      title: `${stateLaw.name} Has a Stop-and-Identify Law`,
      summary: stateLaw.stopAndIdentifyNote,
      details: `${stateLaw.stopAndIdentifyNote} This means if you are lawfully detained, you may be required to provide identification. Drivers must always show a license. ${stateLaw.passengerMustID ? "This may also apply to passengers." : "This generally does not apply to passengers unless there is reasonable suspicion."}`,
      legalBasis: stateLaw.stopAndIdentifyNote,
      whatToDo: stateLaw.passengerMustID
        ? "If lawfully detained, provide your name and address as required. Drivers must always show license and registration."
        : "Drivers must show license. Passengers may ask if they are detained before providing any identification.",
      category: "during-stop",
    });
  }

  // State-specific rights from the state law data
  stateLaw.stateSpecificRights.forEach((right, idx) => {
    rights.push({
      id: `state-specific-${idx}`,
      title: `${stateLaw.name} Specific: ${right.split(":")[0] || right.substring(0, 50)}`,
      summary: right,
      details: right,
      legalBasis: stateLaw.keyStatutes.join(", "),
      whatToDo: "Consult a local attorney for guidance specific to your situation.",
      category: "after-stop",
    });
  });

  return rights;
}

// Get all rights for a state (federal + state-specific)
export function getAllRights(stateLaw: StateLaw): RightInfo[] {
  return [...FEDERAL_RIGHTS, ...getStateSpecificRights(stateLaw)];
}

// --- Formatting utilities ---------------------------------------------------

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
