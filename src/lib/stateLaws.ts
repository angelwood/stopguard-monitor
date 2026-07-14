// StopGuard State Laws Database
// All 50 US states + DC with traffic-stop-relevant legal info.
// This is reference data, not legal advice. Laws change. Consult a local attorney.

export interface StateLaw {
  code: string;
  name: string;
  recordingConsent: "one-party" | "all-party";
  recordingPoliceNote: string;
  hasStopAndIdentify: boolean;
  stopAndIdentifyNote: string;
  officerMustIdentify: boolean;
  officerIDNote: string;
  passengerMustID: boolean;
  passengerIDNote: string;
  keyStatutes: string[];
  stateSpecificRights: string[];
}

// Helper: one-party consent state with defaults
function oneParty(
  code: string,
  name: string,
  overrides: Partial<StateLaw> = {}
): StateLaw {
  return {
    code,
    name,
    recordingConsent: "one-party",
    recordingPoliceNote:
      "One-party consent state. You may record any conversation you are part of. Recording police in public is First Amendment protected.",
    hasStopAndIdentify: false,
    stopAndIdentifyNote:
      "No stop-and-identify statute. You are not required to identify yourself unless lawfully arrested or driving (drivers must show license).",
    officerMustIdentify: false,
    officerIDNote:
      "No state law requiring officer identification during stops. Check local department policies.",
    passengerMustID: false,
    passengerIDNote:
      "Passengers are not required to provide ID unless there is reasonable suspicion of criminal activity.",
    keyStatutes: [],
    stateSpecificRights: [],
    ...overrides,
  };
}

// Helper: all-party consent state
function allParty(
  code: string,
  name: string,
  overrides: Partial<StateLaw> = {}
): StateLaw {
  return oneParty(code, name, {
    recordingConsent: "all-party",
    recordingPoliceNote:
      "All-party consent state. However, courts have held that recording police performing official duties in public is First Amendment protected, regardless of state wiretapping laws. See ACLU v. Alvarez (7th Cir. 2012), Glik v. Cunniffe (1st Cir. 2011).",
    ...overrides,
  });
}

// Helper: state with stop-and-identify statute
function withStopAndIdentify(note: string, statute: string): Partial<StateLaw> {
  return {
    hasStopAndIdentify: true,
    stopAndIdentifyNote: note,
    keyStatutes: [statute],
  };
}

export const STATE_LAWS: StateLaw[] = [
  oneParty("AL", "Alabama", {
    ...withStopAndIdentify(
      "Alabama requires lawfully detained individuals to provide their name and address. Refusal is a crime (Ala. Code § 15-5-30).",
      "Ala. Code § 15-5-30"
    ),
    passengerMustID: true,
    passengerIDNote:
      "Alabama's stop-and-identify law may apply to passengers if lawfully detained. Provide name and address if asked.",
    keyStatutes: ["Ala. Code § 15-5-30", "Ala. Code § 32-5A-4 (seatbelt)"],
  }),
  oneParty("AK", "Alaska", {
    keyStatutes: ["Alaska Stat. § 28.35.031", "AS § 11.81.900"],
    stateSpecificRights: [
      "Alaska Constitution Article I, Section 14 provides broader search and seizure protections than the Fourth Amendment in some contexts.",
    ],
  }),
  oneParty("AZ", "Arizona", {
    ...withStopAndIdentify(
      "Arizona requires lawfully detained individuals to provide their true name and address. Refusal is a crime (Ariz. Rev. Stat. § 13-2412).",
      "Ariz. Rev. Stat. § 13-2412"
    ),
    passengerMustID: true,
    passengerIDNote:
      "Arizona's stop-and-identify statute (§ 13-2412) may apply to passengers if lawfully detained.",
    keyStatutes: ["Ariz. Rev. Stat. § 13-2412", "ARS § 28-1594"],
  }),
  oneParty("AR", "Arkansas", {
    ...withStopAndIdentify(
      "Arkansas requires lawfully detained individuals to provide their name and address (Ark. Code § 5-71-213).",
      "Ark. Code § 5-71-213"
    ),
    keyStatutes: ["Ark. Code § 5-71-213", "Ark. Code § 27-16-802"],
  }),
  allParty("CA", "California", {
    recordingPoliceNote:
      "All-party consent state (Cal. Penal Code § 632). However, recording police in public is First Amendment protected. People v. Howard (1988) and subsequent cases affirm right to record officers performing duties in public.",
    officerIDNote:
      "No state law, but many CA departments require officers to provide name and badge. LAPD policy requires it. Vehicle Code § 12801.5 covers license requirements.",
    keyStatutes: ["Cal. Penal Code § 632", "Cal. Veh. Code § 2800", "Cal. Veh. Code § 20012"],
    stateSpecificRights: [
      "California Constitution Article I, Section 13 provides search and seizure protections. Proposition 64 legalized recreational marijuana but driving under influence remains illegal.",
      "Cal. Veh. Code § 20012: officer must provide name and badge number on request after a traffic stop (state law requirement).",
    ],
    officerMustIdentify: true,
  }),
  oneParty("CO", "Colorado", {
    ...withStopAndIdentify(
      "Colorado requires lawfully detained individuals to provide their name and address (Colo. Rev. Stat. § 16-3-103).",
      "Colo. Rev. Stat. § 16-3-103"
    ),
    keyStatutes: ["Colo. Rev. Stat. § 16-3-103", "CRS § 42-4-1301"],
    stateSpecificRights: [
      "Colorado Constitution Article II, Section 7 provides search and seizure protections. Amendment 64 legalized recreational marijuana.",
    ],
  }),
  allParty("CT", "Connecticut", {
    keyStatutes: ["Conn. Gen. Stat. § 14-100", "CGS § 53a-189"],
    stateSpecificRights: [
      "CT requires drivers to carry registration and insurance. Connecticut has a mandatory seatbelt law (§ 14-100a).",
    ],
  }),
  allParty("DE", "Delaware", {
    ...withStopAndIdentify(
      "Delaware requires lawfully detained individuals to identify themselves (11 Del. Code § 1902).",
      "11 Del. Code § 1902"
    ),
    keyStatutes: ["11 Del. Code § 1902", "21 Del. Code § 2710"],
  }),
  oneParty("DC", "Washington D.C.", {
    keyStatutes: ["D.C. Code § 50-1401", "D.C. Code § 22-401"],
    stateSpecificRights: [
      "D.C. is a one-party consent jurisdiction. Recording police in public is protected.",
      "D.C. has community policing agreements that encourage officer identification.",
    ],
  }),
  allParty("FL", "Florida", {
    ...withStopAndIdentify(
      "Florida requires lawfully detained individuals to identify themselves (Fla. Stat. § 856.021). Refusal is a misdemeanor.",
      "Fla. Stat. § 856.021"
    ),
    passengerMustID: true,
    passengerIDNote:
      "Florida's stop-and-identify statute may apply to passengers who are lawfully detained.",
    keyStatutes: ["Fla. Stat. § 856.021", "Fla. Stat. § 316.062", "Fla. Stat. § 934.03"],
    stateSpecificRights: [
      "Florida is a 'Stand Your Ground' state (§ 776.012) but this does not apply to traffic stops. Florida requires drivers to carry registration and proof of insurance.",
      "Fla. Stat. § 316.062: driver must display license on demand. Refusal is a misdemeanor.",
    ],
  }),
  oneParty("GA", "Georgia", {
    ...withStopAndIdentify(
      "Georgia requires lawfully detained individuals to provide their name and address (Ga. Code § 16-11-90).",
      "Ga. Code § 16-11-90"
    ),
    keyStatutes: ["Ga. Code § 16-11-90", "O.C.G.A. § 40-5-29", "O.C.G.A. § 40-6-291"],
    stateSpecificRights: [
      "Georgia's seatbelt law is primary enforcement for drivers and front-seat passengers (§ 40-8-76.1).",
    ],
  }),
  oneParty("HI", "Hawaii", {
    keyStatutes: ["Haw. Rev. Stat. § 286-136", "HRS § 808-1"],
    stateSpecificRights: [
      "Hawaii Constitution Article I, Section 7 provides search and seizure protections.",
      "Hawaii has primary enforcement seatbelt laws (§ 291-11.6).",
    ],
  }),
  oneParty("ID", "Idaho", {
    keyStatutes: ["Idaho Code § 49-218", "IC § 19-601"],
    stateSpecificRights: [
      "Idaho Constitution Article I, Section 17 provides search and seizure protections.",
    ],
  }),
  allParty("IL", "Illinois", {
    recordingPoliceNote:
      "All-party consent state (720 ILCS 5/14-2). However, the 7th Circuit held in ACLU v. Alvarez (2012) that recording police in public is First Amendment protected. Illinois's eavesdropping law was amended in 2014 to exempt recording public officials performing public duties in public.",
    officerMustIdentify: true,
    officerIDNote:
      "Illinois Police Accountability Act (2021) requires officers to provide their name and badge number when asked during a stop. 50 ILCS 725/1-2.",
    keyStatutes: [
      "720 ILCS 5/14-2 (eavesdropping)",
      "50 ILCS 725/1-2 (officer ID)",
      "625 ILCS 5/11-203 (traffic stops)",
      "625 ILCS 5/11-212 (stop data collection)",
    ],
    stateSpecificRights: [
      "Illinois Police Accountability Act (2021): officers must provide name and badge number when asked. 50 ILCS 725/1-2.",
      "Illinois Traffic Stop Statistical Study Act: requires collection of data on all traffic stops including perceived race. 625 ILCS 5/11-212.",
      "Illinois requires front and rear license plates. 625 ILCS 5/3-413.",
      "Illinois bans handheld cell phone use while driving. 625 ILCS 5/12-610.2.",
      "Illinois legalized recreational cannabis (Cannabis Regulation and Tax Act), but driving under influence remains illegal and cannabis in a vehicle must be in a sealed container. 625 ILCS 5/12-813.",
    ],
  }),
  oneParty("IN", "Indiana", {
    keyStatutes: ["Ind. Code § 9-24-1-1", "IC § 35-33-5-2"],
    stateSpecificRights: [
      "Indiana Constitution Article I, Section 11 provides search and seizure protections. Indiana courts have interpreted this as broader than the Fourth Amendment in some cases (Litchfield v. State).",
    ],
  }),
  oneParty("IA", "Iowa", {
    keyStatutes: ["Iowa Code § 321.491", "Iowa Code § 804.1"],
    stateSpecificRights: [
      "Iowa requires drivers to carry license and registration. Iowa has primary enforcement seatbelt law (§ 321.449).",
    ],
  }),
  oneParty("KS", "Kansas", {
    ...withStopAndIdentify(
      "Kansas requires lawfully detained individuals to provide their name and address (Kan. Stat. § 22-4608).",
      "Kan. Stat. § 22-4608"
    ),
    keyStatutes: ["Kan. Stat. § 22-4608", "K.S.A. § 8-246"],
  }),
  oneParty("KY", "Kentucky", {
    keyStatutes: ["Ky. Rev. Stat. § 186.620", "KRS § 189.290"],
    stateSpecificRights: [
      "Kentucky Constitution Section 10 provides search and seizure protections.",
    ],
  }),
  oneParty("LA", "Louisiana", {
    ...withStopAndIdentify(
      "Louisiana requires lawfully detained individuals to provide their name, address, and other identifying information (La. Rev. Stat. § 14:108).",
      "La. Rev. Stat. § 14:108"
    ),
    keyStatutes: ["La. R.S. § 14:108", "La. R.S. § 32:411"],
  }),
  oneParty("ME", "Maine", {
    keyStatutes: ["29-A M.R.S. § 2101", "17-A M.R.S. § 15"],
    stateSpecificRights: [
      "Maine Constitution Article I, Section 5 provides search and seizure protections. Maine has primary enforcement seatbelt law.",
    ],
  }),
  allParty("MD", "Maryland", {
    keyStatutes: ["Md. Transp. § 16-303", "Md. Cts. & Jud. Proc. § 10-402"],
    stateSpecificRights: [
      "Maryland is an all-party consent state for recording, but recording police in public is protected ( ACLU of Maryland v. Annapolis).",
      "Maryland requires drivers to carry license and registration. Primary seatbelt enforcement (§ 27-1013).",
    ],
  }),
  allParty("MA", "Massachusetts", {
    recordingPoliceNote:
      "All-party consent state (Mass. Gen. Laws ch. 272 § 99). However, Glik v. Cunniffe (1st Cir. 2011) affirmed First Amendment right to record police in public. Massachusetts courts have also upheld this right.",
    keyStatutes: ["Mass. Gen. Laws ch. 272 § 99", "M.G.L. c. 90 § 11"],
    stateSpecificRights: [
      "Glik v. Cunniffe (1st Cir. 2011): clearly established right to record police in public in Massachusetts.",
      "Massachusetts requires drivers to carry license and registration. Primary seatbelt enforcement (c. 90 § 7P).",
    ],
  }),
  oneParty("MI", "Michigan", {
    recordingPoliceNote:
      "All-party consent state (Mich. Comp. Laws § 750.539c). However, recording police in public is First Amendment protected.",
    recordingConsent: "all-party",
    keyStatutes: ["Mich. Comp. Laws § 750.539c", "MCL § 257.324", "MCL § 257.625"],
    stateSpecificRights: [
      "Michigan requires drivers to carry license and registration. Primary seatbelt enforcement (§ 257.710e).",
    ],
  }),
  oneParty("MN", "Minnesota", {
    keyStatutes: ["Minn. Stat. § 169.91", "Minn. Stat. § 629.72"],
    stateSpecificRights: [
      "Minnesota Constitution Article I, Section 10 provides search and seizure protections. State v. Fort established broader protections in some contexts.",
      "Minnesota requires drivers to carry license and proof of insurance. Primary seatbelt enforcement (§ 169.686).",
    ],
  }),
  oneParty("MS", "Mississippi", {
    keyStatutes: ["Miss. Code § 63-1-11", "Miss. Code § 99-3-7"],
    stateSpecificRights: [
      "Mississippi requires drivers to carry license and registration. Primary seatbelt enforcement (§ 63-2-1).",
    ],
  }),
  oneParty("MO", "Missouri", {
    ...withStopAndIdentify(
      "Missouri requires lawfully detained individuals to provide their name and address (Mo. Rev. Stat. § 575.040). Refusal is a crime.",
      "Mo. Rev. Stat. § 575.040"
    ),
    keyStatutes: ["Mo. Rev. Stat. § 575.040", "RSMo § 302.181", "RSMo § 542.275"],
    stateSpecificRights: [
      "Missouri v. McNeely (2013): Missouri case establishing that police generally need a warrant for blood draws in DUI cases.",
    ],
  }),
  allParty("MT", "Montana", {
    ...withStopAndIdentify(
      "Montana requires lawfully detained individuals to provide their name and address (Mont. Code § 46-5-104).",
      "Mont. Code § 46-5-104"
    ),
    keyStatutes: ["Mont. Code § 46-5-104", "Mont. Code § 61-5-107", "Mont. Code § 45-8-213"],
  }),
  oneParty("NE", "Nebraska", {
    ...withStopAndIdentify(
      "Nebraska requires lawfully detained individuals to provide their name, address, and date of birth (Neb. Rev. Stat. § 28-1209).",
      "Neb. Rev. Stat. § 28-1209"
    ),
    keyStatutes: ["Neb. Rev. Stat. § 28-1209", "Neb. Rev. Stat. § 60-4,108"],
  }),
  oneParty("NV", "Nevada", {
    ...withStopAndIdentify(
      "Nevada requires lawfully detained individuals to provide their name. This was upheld in Hiibel v. Nevada (2004) by the US Supreme Court.",
      "Nev. Rev. Stat. § 171.123"
    ),
    passengerMustID: true,
    passengerIDNote:
      "Nevada's stop-and-identify statute (§ 171.123), upheld by Hiibel v. Nevada (2004), may apply to passengers if lawfully detained.",
    keyStatutes: ["Nev. Rev. Stat. § 171.123", "NRS § 483.350"],
    stateSpecificRights: [
      "Hiibel v. Sixth Judicial District Court of Nevada (2004): US Supreme Court upheld Nevada's stop-and-identify statute as constitutional.",
    ],
  }),
  oneParty("NH", "New Hampshire", {
    ...withStopAndIdentify(
      "New Hampshire requires lawfully detained individuals to provide their name and address (N.H. Rev. Stat. § 594:2).",
      "N.H. Rev. Stat. § 594:2"
    ),
    recordingConsent: "all-party",
    recordingPoliceNote:
      "All-party consent state (N.H. Rev. Stat. § 570-A:2). Recording police in public is still First Amendment protected.",
    keyStatutes: ["N.H. Rev. Stat. § 594:2", "N.H. Rev. Stat. § 570-A:2", "RSA § 263:1"],
  }),
  oneParty("NJ", "New Jersey", {
    keyStatutes: ["N.J.S.A. § 39:3-29", "N.J.S.A. § 2C:30-4"],
    stateSpecificRights: [
      "New Jersey requires drivers to carry license, registration, and insurance. N.J.S.A. § 39:3-29.",
      "New Jersey Constitution Article I, Paragraph 7 provides search and seizure protections. State v. Carty established broader protections for vehicle searches.",
    ],
  }),
  oneParty("NM", "New Mexico", {
    ...withStopAndIdentify(
      "New Mexico requires lawfully detained individuals to provide their name and address (N.M. Stat. § 30-22-3).",
      "N.M. Stat. § 30-22-3"
    ),
    keyStatutes: ["N.M. Stat. § 30-22-3", "NMSA § 66-5-9"],
  }),
  oneParty("NY", "New York", {
    officerMustIdentify: true,
    officerIDNote:
      "New York has the Right to Know Act in some jurisdictions (NYC, etc.) requiring officers to identify themselves. NYC requires officers to provide name and rank at the start of stops.",
    keyStatutes: ["N.Y. Veh. & Traf. Law § 507", "NYC Administrative Code § 14-154"],
    stateSpecificRights: [
      "New York City Right to Know Act: officers must identify themselves (name, rank, badge) at the start of certain stops and explain the reason for the stop.",
      "New York requires drivers to carry license and registration. N.Y. Veh. & Traf. Law § 507.",
      "New York bans handheld cell phone use while driving. VTL § 1225-c.",
    ],
  }),
  oneParty("NC", "North Carolina", {
    keyStatutes: ["N.C. Gen. Stat. § 20-29", "NCGS § 15A-301"],
    stateSpecificRights: [
      "North Carolina requires drivers to carry license and registration. Primary seatbelt enforcement (§ 20-135.2A).",
      "NC Constitution Article I, Section 20 provides search and seizure protections.",
    ],
  }),
  oneParty("ND", "North Dakota", {
    ...withStopAndIdentify(
      "North Dakota requires lawfully detained individuals to provide their name (N.D. Cent. Code § 29-29-12).",
      "N.D. Cent. Code § 29-29-12"
    ),
    keyStatutes: ["N.D. Cent. Code § 29-29-12", "N.D.C.C. § 39-06-18"],
  }),
  oneParty("OH", "Ohio", {
    keyStatutes: ["Ohio Rev. Code § 4507.02", "ORC § 2935.04"],
    stateSpecificRights: [
      "Ohio requires drivers to carry license and registration. Primary seatbelt enforcement (§ 4513.263).",
      "Ohio v. Robinette (1997): US Supreme Court held that officers do not need to inform you of your right to refuse consent to search.",
    ],
  }),
  oneParty("OK", "Oklahoma", {
    keyStatutes: ["Okla. Stat. § 47-6-205", "Okla. Stat. § 22-37"],
    stateSpecificRights: [
      "Oklahoma requires drivers to carry license and registration. Primary seatbelt enforcement (§ 47-12-417).",
    ],
  }),
  oneParty("OR", "Oregon", {
    keyStatutes: ["Or. Rev. Stat. § 807.570", "ORS § 133.005"],
    stateSpecificRights: [
      "Oregon Constitution Article I, Section 9 provides broader search and seizure protections than the Fourth Amendment in many contexts.",
      "State v. Dempsey (1999): Oregon requires officer to have reasonable suspicion for a traffic stop, not just a hunch.",
    ],
  }),
  allParty("PA", "Pennsylvania", {
    keyStatutes: ["75 Pa. Cons. Stat. § 1541", "18 Pa. Cons. Stat. § 5703"],
    stateSpecificRights: [
      "Pennsylvania is an all-party consent state for recording. Recording police in public is still First Amendment protected.",
      "PA requires drivers to carry license, registration, and proof of insurance. 75 Pa.C.S. § 1311.",
      "Pennsylvania v. Mimms (1977): US Supreme Court held that officers may order drivers out of a vehicle during a lawful traffic stop.",
    ],
  }),
  oneParty("RI", "Rhode Island", {
    ...withStopAndIdentify(
      "Rhode Island requires lawfully detained individuals to provide their identity (R.I. Gen. Laws § 12-7-1).",
      "R.I. Gen. Laws § 12-7-1"
    ),
    keyStatutes: ["R.I. Gen. Laws § 12-7-1", "RIGL § 31-10-1"],
  }),
  oneParty("SC", "South Carolina", {
    keyStatutes: ["S.C. Code § 56-5-1250", "S.C. Code § 17-13-10"],
    stateSpecificRights: [
      "South Carolina requires drivers to carry license and registration. Primary seatbelt enforcement (§ 56-5-6520).",
    ],
  }),
  oneParty("SD", "South Dakota", {
    keyStatutes: ["S.D. Codified Laws § 32-34-2", "SDCL § 23A-3-1"],
    stateSpecificRights: [
      "South Dakota requires drivers to carry license and registration.",
    ],
  }),
  oneParty("TN", "Tennessee", {
    keyStatutes: ["Tenn. Code § 55-50-101", "T.C.A. § 40-7-103"],
    stateSpecificRights: [
      "Tennessee requires drivers to carry license and registration. Primary seatbelt enforcement (§ 55-9-602).",
    ],
  }),
  oneParty("TX", "Texas", {
    keyStatutes: ["Tex. Transp. Code § 521.021", "Tex. Transp. Code § 543.001"],
    stateSpecificRights: [
      "Texas requires drivers to carry license and liability insurance. Tex. Transp. Code § 601.051.",
      "Texas allows open carry of handguns with a License to Carry (LTC). During a traffic stop, you must inform the officer if you are carrying. Tex. Gov. Code § 411.205.",
      "Texas bans handheld cell phone use in school zones. Tex. Transp. Code § 545.425.",
    ],
  }),
  oneParty("UT", "Utah", {
    ...withStopAndIdentify(
      "Utah requires lawfully detained individuals to provide their name and date of birth (Utah Code § 77-7-14).",
      "Utah Code § 77-7-14"
    ),
    keyStatutes: ["Utah Code § 77-7-14", "Utah Code § 53-10-202"],
  }),
  oneParty("VT", "Vermont", {
    ...withStopAndIdentify(
      "Vermont requires lawfully detained individuals to provide their name and address (Vt. Stat. § 3870).",
      "Vt. Stat. § 3870"
    ),
    keyStatutes: ["Vt. Stat. § 3870", "23 V.S.A. § 202"],
  }),
  oneParty("VA", "Virginia", {
    keyStatutes: ["Va. Code § 46.2-104", "Va. Code § 19.2-83"],
    stateSpecificRights: [
      "Virginia requires drivers to carry license and registration. Primary seatbelt enforcement (§ 46.2-1094).",
      "Virginia banned handheld cell phone use while driving (2020). § 46.2-818.2.",
    ],
  }),
  allParty("WA", "Washington", {
    keyStatutes: ["Wash. Rev. Code § 46.20.117", "RCW § 9.73.030"],
    stateSpecificRights: [
      "Washington is an all-party consent state for recording. RCW § 9.73.030. However, recording police in public is First Amendment protected.",
      "Washington Constitution Article I, Section 7 provides broader privacy protections than the Fourth Amendment. State v. Gunwall established factors for broader state constitutional protection.",
      "Washington legalized recreational marijuana (I-502), but driving under influence remains illegal. RCW § 46.61.502.",
    ],
  }),
  oneParty("WV", "West Virginia", {
    keyStatutes: ["W. Va. Code § 17B-2-6", "WVC § 62-1A-1"],
    stateSpecificRights: [
      "West Virginia requires drivers to carry license and registration. Primary seatbelt enforcement (§ 17C-15-49).",
    ],
  }),
  oneParty("WI", "Wisconsin", {
    ...withStopAndIdentify(
      "Wisconsin requires lawfully detained individuals to provide their name and address (Wis. Stat. § 968.24).",
      "Wis. Stat. § 968.24"
    ),
    keyStatutes: ["Wis. Stat. § 968.24", "Wis. Stat. § 343.18"],
  }),
  oneParty("WY", "Wyoming", {
    ...withStopAndIdentify(
      "Wyoming requires lawfully detained individuals to provide their name (Wyo. Stat. § 6-5-201).",
      "Wyo. Stat. § 6-5-201"
    ),
    keyStatutes: ["Wyo. Stat. § 6-5-201", "Wyo. Stat. § 31-7-107"],
  }),
];

export function getStateLaw(code: string): StateLaw {
  return (
    STATE_LAWS.find((s) => s.code === code) ||
    STATE_LAWS.find((s) => s.code === "IL")!
  );
}

export const ALL_PARTY_STATES = STATE_LAWS.filter(
  (s) => s.recordingConsent === "all-party"
).map((s) => s.code);

export const STOP_AND_IDENTIFY_STATES = STATE_LAWS.filter(
  (s) => s.hasStopAndIdentify
).map((s) => s.code);
