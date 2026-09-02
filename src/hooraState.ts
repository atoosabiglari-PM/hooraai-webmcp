export type HooraMode = 'need' | 'talent' | 'surprise' | null

export type TalentProfile = {
  id: string
  name: string
  headline: string
  canDo: string
  serviceTypes: Array<'live' | 'onsite' | 'hybrid'>
  availableNow: boolean
  location: string
}

export type HooraSession = {
  mode: HooraMode
  humanInput: string
  confirmed: boolean
}

const talentProfiles: TalentProfile[] = [
  {
    id: 'talent-001',
    name: 'Maya',
    headline: 'Color & Space Creative',
    canDo:
      'I can help people figure out how to use colors they love in rooms, clothing, objects, celebrations, and creative projects.',
    serviceTypes: ['live', 'onsite'],
    availableNow: true,
    location: 'San Francisco, CA',
  },
  {
    id: 'talent-002',
    name: 'Leo',
    headline: 'Bike Customization Artist',
    canDo:
      'I can transform bicycles with custom colors, artwork, decoration, and event-inspired designs.',
    serviceTypes: ['onsite'],
    availableNow: false,
    location: 'Oakland, CA',
  },
  {
    id: 'talent-003',
    name: 'Nina',
    headline: 'Home Problem Solver',
    canDo:
      'I can look at everyday home problems and guide people through practical fixes using pictures, video, or live conversation.',
    serviceTypes: ['live', 'onsite', 'hybrid'],
    availableNow: true,
    location: 'San Jose, CA',
  },
  {
    id: 'talent-004',
    name: 'Marco',
    headline: 'Food Experience Creator',
    canDo:
      'I can take simple foods and turn them into meals people get excited about through preparation, presentation, and creative variations.',
    serviceTypes: ['live', 'onsite'],
    availableNow: true,
    location: 'Palo Alto, CA',
  },
]

let session: HooraSession = {
  mode: null,
  humanInput: '',
  confirmed: false,
}

export function getHooraSession(): HooraSession {
  return { ...session }
}

export function updateHooraSession(
  updates: Partial<HooraSession>,
): HooraSession {
  session = {
    ...session,
    ...updates,
  }

  return getHooraSession()
}

export function resetHooraSession(): HooraSession {
  session = {
    mode: null,
    humanInput: '',
    confirmed: false,
  }

  return getHooraSession()
}

export function getTalentProfiles(): TalentProfile[] {
  return talentProfiles.map((profile) => ({ ...profile }))
}