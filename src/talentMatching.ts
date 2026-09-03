import { getTalentProfiles, type TalentProfile } from './hooraState'

export type TalentMatch = {
  profile: TalentProfile
  score: number
}

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2)
}

function expandQuery(words: string[]): string[] {
  const expansions: Record<string, string[]> = {
    pink: ['color', 'colors', 'creative'],
    blue: ['color', 'colors', 'creative'],

    bicycle: ['bike', 'customization'],
    bike: ['bicycle', 'customization'],

    room: ['space', 'home'],
    house: ['home'],

    fix: ['problem', 'practical'],
    repair: ['problem', 'fix'],

    food: ['meal', 'preparation'],
    cooking: ['food', 'meal', 'preparation'],

    talk: ['conversation', 'live'],
    talking: ['conversation', 'live'],
  }

  const expanded = new Set(words)

  for (const word of words) {
    expanded.add(word)

    const relatedWords = expansions[word] ?? []

    for (const relatedWord of relatedWords) {
      expanded.add(relatedWord)
    }
  }

  return [...expanded]
}

function scoreProfile(query: string, profile: TalentProfile): number {
  const queryWords = expandQuery(normalizeWords(query))

  const searchableText = [
    profile.headline,
    profile.canDo,
    profile.location,
    ...profile.serviceTypes,
  ]
    .join(' ')
    .toLowerCase()

  let score = 0

  for (const word of queryWords) {
    if (searchableText.includes(word)) {
      score += 1
    }
  }

  if (profile.availableNow) {
    score += 0.25
  }

  return score
}

export function discoverTalent(query: string): TalentMatch[] {
  const cleanedQuery = query.trim()

  if (!cleanedQuery) {
    return []
  }

  return getTalentProfiles()
    .map((profile) => ({
      profile,
      score: scoreProfile(cleanedQuery, profile),
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}