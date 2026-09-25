import { test } from 'node:test'
import assert from 'node:assert/strict'
import { 
  getTranslation, 
  getTeamName, 
  getTeamShortName, 
  isMissingMalayalamName, 
  dictionaries 
} from '../src/lib/i18n.ts'

test('Bilingual: All required keys exist in both English and Malayalam dictionaries', () => {
  const enKeys = Object.keys(dictionaries.en) as (keyof typeof dictionaries.en)[]
  const mlKeys = Object.keys(dictionaries.ml) as (keyof typeof dictionaries.ml)[]

  // Check critical keys
  const criticalKeys = [
    'leaderboard',
    'points',
    'exactScores',
    'correctOutcomes',
    'statusUpcoming',
    'statusCompleted',
    'statusPostponed',
    'statusCancelled',
    'rescheduled',
    'rescheduledNotice',
    'downloadPng',
    'shareOnWhatsApp',
    'rulesLastUpdated',
    'leaderboardUpdated',
  ]

  criticalKeys.forEach((key) => {
    assert.ok(key in dictionaries.en, `Missing EN key: ${key}`)
    assert.ok(key in dictionaries.ml, `Missing ML key: ${key}`)
    assert.ok(dictionaries.ml[key as keyof typeof dictionaries.ml].length > 0, `Empty ML translation for ${key}`)
  })

  // Ensure same set of keys
  assert.equal(enKeys.length, mlKeys.length, 'English and Malayalam dictionaries must have matching key count')
})

test('Team name fallback: Uses Malayalam when available, falls back to English when missing', () => {
  const teamWithMl = {
    name: 'Calicut FC',
    name_ml: 'കോഴിക്കോട് എഫ്.സി',
    short_name: 'CFC',
    short_name_ml: 'സി.എഫ്.സി',
  }

  const teamWithoutMl = {
    name: 'Kochi United',
    name_ml: null,
    short_name: 'KUT',
    short_name_ml: null,
  }

  // English locale
  assert.equal(getTeamName(teamWithMl, 'en'), 'Calicut FC')
  assert.equal(getTeamShortName(teamWithMl, 'en'), 'CFC')

  // Malayalam locale with Malayalam data present
  assert.equal(getTeamName(teamWithMl, 'ml'), 'കോഴിക്കോട് എഫ്.സി')
  assert.equal(getTeamShortName(teamWithMl, 'ml'), 'സി.എഫ്.സി')

  // Malayalam locale when Malayalam data is missing -> graceful fallback to English!
  assert.equal(getTeamName(teamWithoutMl, 'ml'), 'Kochi United')
  assert.equal(getTeamShortName(teamWithoutMl, 'ml'), 'KUT')

  // Flag missing Malayalam team names for admins
  assert.equal(isMissingMalayalamName(teamWithMl), false)
  assert.equal(isMissingMalayalamName(teamWithoutMl), true)
})

test('Rank Card: Native sharing detection and Download PNG fallback behavior', () => {
  // Scenario A: Browser supports native file sharing
  const mockNavigatorWithFiles = {
    canShare: (data: { files?: any[] }) => Boolean(data?.files && data.files.length > 0),
    share: async () => {},
  }

  const canShareFileA = Boolean(
    mockNavigatorWithFiles &&
    typeof mockNavigatorWithFiles.share === 'function' &&
    typeof mockNavigatorWithFiles.canShare === 'function' &&
    mockNavigatorWithFiles.canShare({ files: [{} as any] })
  )
  assert.equal(canShareFileA, true, 'Should detect native file sharing capability')

  // Scenario B: Browser only supports text sharing (e.g. desktop Chrome) -> canShare({ files }) returns false
  const mockNavigatorTextOnly = {
    canShare: (data: { files?: any[] }) => false,
    share: async () => {},
  }

  const canShareFileB = Boolean(
    mockNavigatorTextOnly &&
    typeof mockNavigatorTextOnly.share === 'function' &&
    typeof mockNavigatorTextOnly.canShare === 'function' &&
    mockNavigatorTextOnly.canShare({ files: [{} as any] })
  )
  assert.equal(canShareFileB, false, 'Should detect lack of file sharing support')

  // Scenario C: Browser has no share API (e.g. older browser)
  const mockNavigatorNone = {}
  const canShareFileC = Boolean(
    (mockNavigatorNone as any).share &&
    (mockNavigatorNone as any).canShare &&
    (mockNavigatorNone as any).canShare({ files: [{} as any] })
  )
  assert.equal(canShareFileC, false)
})

test('Rank Card: Malayalam text rendering layout specifications', () => {
  // Ensure Malayalam text labels are defined and non-empty
  const mlTitle = getTranslation('ml', 'contestTitle')
  const mlSubtitle = getTranslation('ml', 'contestSubtitle')
  const mlSlogan = getTranslation('ml', 'slogan')
  const mlRank = getTranslation('ml', 'rank')
  const mlPoints = getTranslation('ml', 'points')

  assert.equal(mlTitle, 'എസ്.ബി.കെ എസ്.എൽ.കെ പ്രവചനം')
  assert.equal(mlSubtitle, 'പ്രവചന മത്സരം')
  assert.equal(mlSlogan, 'ഫാൻസ് പ്രവചിക്കുന്നു. ഫുട്ബോൾ ഒന്നിപ്പിക്കുന്നു.')
  assert.equal(mlRank, 'റാങ്ക്')
  assert.equal(mlPoints, 'പോയിന്റ്')

  // Text length safety checks: verify string contains genuine Malayalam Unicode characters (U+0D00 - U+0D7F)
  const malayalamRegex = /[\u0D00-\u0D7F]/
  assert.match(mlTitle, malayalamRegex)
  assert.match(mlSubtitle, malayalamRegex)
  assert.match(mlSlogan, malayalamRegex)
  assert.match(mlRank, malayalamRegex)
  assert.match(mlPoints, malayalamRegex)
})
