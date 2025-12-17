/**
 * ============================================================================
 * KENYA LOCATIONS MASTER DATA
 * ============================================================================
 * Complete list of Kenya's 47 counties and their major towns/cities
 * Last Updated: December 17, 2025
 *
 * Usage:
 *   import { KENYA_COUNTIES, KENYA_TOWNS_BY_COUNTY, POPULAR_TOWNS } from '@/lib/kenyaLocations';
 *
 * ============================================================================
 */

// ============================================================================
// ALL 47 KENYA COUNTIES
// ============================================================================
// Organized by region for easier management and regional analytics
// ============================================================================

// Sorted alphabetically by label for better UX
export const KENYA_COUNTIES = [
  { value: 'baringo', label: 'Baringo County', region: 'Rift Valley', code: '030' },
  { value: 'bomet', label: 'Bomet County', region: 'Rift Valley', code: '036' },
  { value: 'bungoma', label: 'Bungoma County', region: 'Western', code: '039' },
  { value: 'busia', label: 'Busia County', region: 'Western', code: '040' },
  { value: 'elgeyo_marakwet', label: 'Elgeyo-Marakwet County', region: 'Rift Valley', code: '028' },
  { value: 'embu', label: 'Embu County', region: 'Eastern', code: '014' },
  { value: 'garissa', label: 'Garissa County', region: 'North Eastern', code: '007' },
  { value: 'homa_bay', label: 'Homa Bay County', region: 'Nyanza', code: '043' },
  { value: 'isiolo', label: 'Isiolo County', region: 'North Eastern', code: '011' },
  { value: 'kajiado', label: 'Kajiado County', region: 'Rift Valley', code: '034' },
  { value: 'kakamega', label: 'Kakamega County', region: 'Western', code: '037' },
  { value: 'kericho', label: 'Kericho County', region: 'Rift Valley', code: '035' },
  { value: 'kiambu', label: 'Kiambu County', region: 'Central', code: '022' },
  { value: 'kilifi', label: 'Kilifi County', region: 'Coast', code: '003' },
  { value: 'kirinyaga', label: 'Kirinyaga County', region: 'Central', code: '020' },
  { value: 'kisii', label: 'Kisii County', region: 'Nyanza', code: '045' },
  { value: 'kisumu', label: 'Kisumu County', region: 'Nyanza', code: '042' },
  { value: 'kitui', label: 'Kitui County', region: 'Eastern', code: '015' },
  { value: 'kwale', label: 'Kwale County', region: 'Coast', code: '002' },
  { value: 'laikipia', label: 'Laikipia County', region: 'Rift Valley', code: '031' },
  { value: 'lamu', label: 'Lamu County', region: 'Coast', code: '005' },
  { value: 'machakos', label: 'Machakos County', region: 'Eastern', code: '016' },
  { value: 'makueni', label: 'Makueni County', region: 'Eastern', code: '017' },
  { value: 'mandera', label: 'Mandera County', region: 'North Eastern', code: '009' },
  { value: 'marsabit', label: 'Marsabit County', region: 'North Eastern', code: '010' },
  { value: 'meru', label: 'Meru County', region: 'Eastern', code: '012' },
  { value: 'migori', label: 'Migori County', region: 'Nyanza', code: '044' },
  { value: 'mombasa', label: 'Mombasa County', region: 'Coast', code: '001' },
  { value: 'muranga', label: "Murang'a County", region: 'Central', code: '021' },
  { value: 'nairobi', label: 'Nairobi County', region: 'Nairobi', code: '047' },
  { value: 'nakuru', label: 'Nakuru County', region: 'Rift Valley', code: '032' },
  { value: 'nandi', label: 'Nandi County', region: 'Rift Valley', code: '029' },
  { value: 'narok', label: 'Narok County', region: 'Rift Valley', code: '033' },
  { value: 'nyandarua', label: 'Nyandarua County', region: 'Central', code: '018' },
  { value: 'nyamira', label: 'Nyamira County', region: 'Nyanza', code: '046' },
  { value: 'nyeri', label: 'Nyeri County', region: 'Central', code: '019' },
  { value: 'samburu', label: 'Samburu County', region: 'Rift Valley', code: '025' },
  { value: 'siaya', label: 'Siaya County', region: 'Nyanza', code: '041' },
  { value: 'taita_taveta', label: 'Taita-Taveta County', region: 'Coast', code: '006' },
  { value: 'tana_river', label: 'Tana River County', region: 'Coast', code: '004' },
  { value: 'tharaka_nithi', label: 'Tharaka-Nithi County', region: 'Eastern', code: '013' },
  { value: 'trans_nzoia', label: 'Trans-Nzoia County', region: 'Rift Valley', code: '026' },
  { value: 'turkana', label: 'Turkana County', region: 'Rift Valley', code: '023' },
  { value: 'uasin_gishu', label: 'Uasin Gishu County', region: 'Rift Valley', code: '027' },
  { value: 'vihiga', label: 'Vihiga County', region: 'Western', code: '038' },
  { value: 'wajir', label: 'Wajir County', region: 'North Eastern', code: '008' },
  { value: 'west_pokot', label: 'West Pokot County', region: 'Rift Valley', code: '024' },
];

// ============================================================================
// MAJOR TOWNS BY COUNTY
// ============================================================================
// Each county has an array of major towns, cities, and urban centers
// Towns are listed in approximate order of size/importance
// ============================================================================

export const KENYA_TOWNS_BY_COUNTY = {
  // Baringo
  baringo: [
    'Eldama Ravine',
    'Kabarnet',
    'Kabartonjo',
    'Marigat',
    'Mogotio',
  ],

  // Bomet
  bomet: [
    'Bomet Town',
    'Kipkelion',
    'Longisa',
    'Mulot',
    'Sigor',
    'Sotik',
  ],

  // Bungoma
  bungoma: [
    'Bungoma Town',
    'Chwele',
    'Kimilili',
    'Malakisi',
    'Sirisia',
    'Webuye',
  ],

  // Busia
  busia: [
    'Busia Town',
    'Funyula',
    'Malaba',
    'Nambale',
    'Port Victoria',
  ],

  // Elgeyo-Marakwet
  elgeyo_marakwet: [
    'Cheptongei',
    'Iten',
    'Kapcherop',
    'Tambach',
  ],

  // Embu
  embu: [
    'Embu Town',
    'Ishiara',
    'Kirimari',
    'Runyenjes',
    'Siakago',
  ],

  // Garissa
  garissa: [
    'Balambala',
    'Dadaab',
    'Garissa Town',
    'Hulugho',
    'Masalani',
  ],

  // Homa Bay
  homa_bay: [
    'Homa Bay Town',
    'Kendu Bay',
    'Mbita',
    'Ndhiwa',
    'Oyugis',
    'Rongo',
  ],

  // Isiolo
  isiolo: [
    'Garbatulla',
    'Isiolo Town',
    'Kinna',
    'Merti',
  ],

  // Kajiado
  kajiado: [
    'Bissil',
    'Kajiado Town',
    'Kimana',
    'Kitengela',
    'Loitokitok',
    'Namanga',
    'Ngong',
    'Ongata Rongai',
  ],

  // Kakamega
  kakamega: [
    'Butere',
    'Kakamega Town',
    'Kimilili',
    'Khayega',
    'Lugari',
    'Malava',
    'Mumias',
  ],

  // Kericho
  kericho: [
    'Fort Ternan',
    'Kericho Town',
    'Kipkelion',
    'Litein',
    'Londiani',
    'Sosiot',
  ],

  // Kiambu
  kiambu: [
    'Gatundu',
    'Githrai',
    'Githunguri',
    'Githurai',
    'Juja',
    'Kahawa',
    'Karuri',
    'Kiambu',
    'Kiambu Town',
    'Kikuyu',
    'Limuru',
    'Ruaka',
    'Ruiru',
    'Thika',
  ],

  // Kilifi
  kilifi: [
    'Gede',
    'Kaloleni',
    'Kilifi Town',
    'Malindi',
    'Mariakani',
    'Mtwapa',
    'Watamu',
  ],

  // Kirinyaga
  kirinyaga: [
    'Baricho',
    'Kerugoya',
    'Kianyaga',
    'Kutus',
    'Sagana',
    "Wang'uru",
  ],

  // Kisii
  kisii: [
    'Kisii Town',
    'Keumbu',
    'Keroka',
    'Nyamache',
    'Ogembo',
    'Suneka',
  ],

  // Kisumu
  kisumu: [
    'Ahero',
    'Katito',
    'Kisumu City',
    'Kombewa',
    'Maseno',
    'Muhoroni',
  ],

  // Kitui
  kitui: [
    'Ikutha',
    'Kitui Town',
    'Kyuso',
    'Mutomo',
    'Mwingi',
  ],

  // Kwale
  kwale: [
    'Diani Beach',
    'Kinango',
    'Kwale Town',
    'Lunga Lunga',
    'Msambweni',
    'Shimoni',
    'Ukunda',
  ],

  // Laikipia
  laikipia: [
    'Doldol',
    'Nanyuki',
    'Nyahururu',
    'Rumuruti',
    'Sipili',
  ],

  // Lamu
  lamu: [
    'Faza',
    'Kiunga',
    'Lamu Town',
    'Mokowe',
    'Mpeketoni',
  ],

  // Machakos
  machakos: [
    'Athi River',
    'Kangundo',
    'Kathiani',
    'Machakos Town',
    'Matungulu',
    'Mavoko',
    'Mwala',
  ],

  // Makueni
  makueni: [
    'Emali',
    'Kibwezi',
    'Makindu',
    'Mtito Andei',
    'Sultan Hamud',
    'Wote',
  ],

  // Mandera
  mandera: [
    'Banisa',
    'Elwak',
    'Mandera Town',
    'Rhamu',
    'Takaba',
  ],

  // Marsabit
  marsabit: [
    'Laisamis',
    'Marsabit Town',
    'Moyale',
    'North Horr',
    'Sololo',
  ],

  // Meru
  meru: [
    'Kianjai',
    'Maua',
    'Meru Town',
    'Mikinduri',
    'Nkubu',
    'Timau',
  ],

  // Migori
  migori: [
    'Awendo',
    'Isebania',
    'Kehancha',
    'Migori Town',
    'Rongo',
    'Uriri',
  ],

  // Mombasa
  mombasa: [
    'Bamburi',
    'Changamwe',
    'Kisauni',
    'Likoni',
    'Mkomani',
    'Mombasa City',
    'Nyali',
  ],

  // Murang'a
  muranga: [
    'Gaturi',
    'Kandara',
    'Kigumo',
    'Kenol',
    'Maragua',
    "Murang'a Town",
    'Sagana',
  ],

  // Nairobi
  nairobi: [
    'Dagoretti',
    'Embakasi',
    'Karen',
    'Kasarani',
    'Kibera',
    'Kilimani',
    'Langata',
    'Lavington',
    'Mathare',
    'Nairobi City',
    'Parklands',
    'Westlands',
  ],

  // Nakuru
  nakuru: [
    'Bahati',
    'Gilgil',
    'Molo',
    'Nakuru City',
    'Naivasha',
    'Njoro',
    'Rongai',
    'Subukia',
  ],

  // Nandi
  nandi: [
    'Ainabkoi',
    'Kabiyet',
    'Kapsabet',
    'Kobujoi',
    'Mosoriot',
    'Nandi Hills',
  ],

  // Narok
  narok: [
    'Kilgoris',
    'Mau Narok',
    'Narok Town',
    'Ololulunga',
    'Suswa',
  ],

  // Nyandarua
  nyandarua: [
    'Engineer',
    'Kinangop',
    'Ndaragwa',
    'Nyahururu',
    'Ol Kalou',
  ],

  // Nyamira
  nyamira: [
    'Kebirigo',
    'Keroka',
    'Nyansiongo',
    'Nyamira Town',
  ],

  // Nyeri
  nyeri: [
    'Karatina',
    'Mukurweini',
    'Nanyuki',
    'Nyeri Town',
    'Othaya',
  ],

  // Samburu
  samburu: [
    'Archers Post',
    'Baragoi',
    'Maralal',
    'Wamba',
  ],

  // Siaya
  siaya: [
    'Bondo',
    'Siaya Town',
    'Ugunja',
    'Ukwala',
    'Usenge',
    'Yala',
  ],

  // Taita-Taveta
  taita_taveta: [
    'Bura',
    'Mwatate',
    'Taveta',
    'Voi',
    'Wundanyi',
  ],

  // Tana River
  tana_river: [
    'Bura',
    'Garsen',
    'Hola',
    'Madogo',
  ],

  // Tharaka-Nithi
  tharaka_nithi: [
    'Chogoria',
    'Chuka',
    'Karingani',
    'Kathwana',
    'Marimanti',
  ],

  // Trans-Nzoia
  trans_nzoia: [
    'Cherangany',
    'Endebess',
    'Kitale',
    'Kiminini',
    'Kwanza',
  ],

  // Turkana
  turkana: [
    'Kalokol',
    'Kakuma',
    'Lokichoggio',
    'Lokichar',
    'Lodwar',
  ],

  // Uasin Gishu
  uasin_gishu: [
    'Ainabkoi',
    'Burnt Forest',
    'Eldoret',
    'Soy',
    'Turbo',
    'Ziwa',
  ],

  // Vihiga
  vihiga: [
    'Hamisi',
    'Luanda',
    'Majengo',
    'Mbale',
    'Vihiga Town',
  ],

  // Wajir
  wajir: [
    'Buna',
    'Diff',
    'Habaswein',
    'Wajir Town',
  ],

  // West Pokot
  west_pokot: [
    'Chepareria',
    'Kapenguria',
    'Makutano',
    'Sigor',
  ],
};

// ============================================================================
// POPULAR TOWNS (Most Searched/Used)
// ============================================================================
// Pre-sorted list of most popular towns for quick access and autocomplete
// ============================================================================

export const POPULAR_TOWNS = [
  'Nairobi City',
  'Mombasa City',
  'Kisumu City',
  'Nakuru City',
  'Eldoret',
  'Thika',
  'Ruiru',
  'Kikuyu',
  'Malindi',
  'Kitale',
  'Machakos Town',
  'Nyeri Town',
  'Meru Town',
  'Kisii Town',
  'Kakamega Town',
  'Kajiado Town',
  'Naivasha',
  'Ongata Rongai',
  'Kitengela',
  'Ngong',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get county by value
 * @param {string} countyValue - County value (e.g., 'nairobi')
 * @returns {Object|null} County object or null if not found
 */
export function getCountyByValue(countyValue) {
  return KENYA_COUNTIES.find(county => county.value === countyValue) || null;
}

/**
 * Get towns for a specific county
 * @param {string} countyValue - County value (e.g., 'nairobi')
 * @returns {Array} Array of town names
 */
export function getTownsByCounty(countyValue) {
  return KENYA_TOWNS_BY_COUNTY[countyValue] || [];
}

/**
 * Get all counties by region
 * @param {string} region - Region name (e.g., 'Central', 'Coast')
 * @returns {Array} Array of county objects
 */
export function getCountiesByRegion(region) {
  return KENYA_COUNTIES.filter(county => county.region === region);
}

/**
 * Search towns across all counties
 * @param {string} query - Search query
 * @returns {Array} Array of matching towns with county info
 */
export function searchTowns(query) {
  const results = [];
  const lowerQuery = query.toLowerCase();

  for (const [countyValue, towns] of Object.entries(KENYA_TOWNS_BY_COUNTY)) {
    const matchingTowns = towns.filter(town =>
      town.toLowerCase().includes(lowerQuery)
    );

    if (matchingTowns.length > 0) {
      const county = getCountyByValue(countyValue);
      matchingTowns.forEach(town => {
        results.push({
          town,
          county: county?.label,
          countyValue: countyValue,
        });
      });
    }
  }

  return results;
}

/**
 * Get all unique regions
 * @returns {Array} Array of unique region names
 */
export function getAllRegions() {
  return [...new Set(KENYA_COUNTIES.map(county => county.region))];
}

/**
 * Validate if a county value exists
 * @param {string} countyValue - County value to validate
 * @returns {boolean} True if county exists
 */
export function isValidCounty(countyValue) {
  return KENYA_COUNTIES.some(county => county.value === countyValue);
}

/**
 * Validate if a town exists in a specific county
 * @param {string} countyValue - County value
 * @param {string} townName - Town name
 * @returns {boolean} True if town exists in county
 */
export function isValidTown(countyValue, townName) {
  const towns = getTownsByCounty(countyValue);
  return towns.some(town => town.toLowerCase() === townName.toLowerCase());
}

// ============================================================================
// COUNTY GROUPS BY REGION (For organized UI display)
// ============================================================================

export const COUNTIES_BY_REGION = {
  'Nairobi': getCountiesByRegion('Nairobi'),
  'Central': getCountiesByRegion('Central'),
  'Coast': getCountiesByRegion('Coast'),
  'Eastern': getCountiesByRegion('Eastern'),
  'North Eastern': getCountiesByRegion('North Eastern'),
  'Western': getCountiesByRegion('Western'),
  'Nyanza': getCountiesByRegion('Nyanza'),
  'Rift Valley': getCountiesByRegion('Rift Valley'),
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  KENYA_COUNTIES,
  KENYA_TOWNS_BY_COUNTY,
  POPULAR_TOWNS,
  COUNTIES_BY_REGION,
  getCountyByValue,
  getTownsByCounty,
  getCountiesByRegion,
  searchTowns,
  getAllRegions,
  isValidCounty,
  isValidTown,
};
