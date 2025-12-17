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

export const KENYA_COUNTIES = [
  // NAIROBI REGION
  { value: 'nairobi', label: 'Nairobi County', region: 'Nairobi', code: '047' },

  // CENTRAL REGION
  { value: 'kiambu', label: 'Kiambu County', region: 'Central', code: '022' },
  { value: 'muranga', label: "Murang'a County", region: 'Central', code: '021' },
  { value: 'nyeri', label: 'Nyeri County', region: 'Central', code: '019' },
  { value: 'kirinyaga', label: 'Kirinyaga County', region: 'Central', code: '020' },
  { value: 'nyandarua', label: 'Nyandarua County', region: 'Central', code: '018' },

  // COAST REGION
  { value: 'mombasa', label: 'Mombasa County', region: 'Coast', code: '001' },
  { value: 'kwale', label: 'Kwale County', region: 'Coast', code: '002' },
  { value: 'kilifi', label: 'Kilifi County', region: 'Coast', code: '003' },
  { value: 'tana_river', label: 'Tana River County', region: 'Coast', code: '004' },
  { value: 'lamu', label: 'Lamu County', region: 'Coast', code: '005' },
  { value: 'taita_taveta', label: 'Taita-Taveta County', region: 'Coast', code: '006' },

  // EASTERN REGION
  { value: 'machakos', label: 'Machakos County', region: 'Eastern', code: '016' },
  { value: 'makueni', label: 'Makueni County', region: 'Eastern', code: '017' },
  { value: 'kitui', label: 'Kitui County', region: 'Eastern', code: '015' },
  { value: 'embu', label: 'Embu County', region: 'Eastern', code: '014' },
  { value: 'tharaka_nithi', label: 'Tharaka-Nithi County', region: 'Eastern', code: '013' },
  { value: 'meru', label: 'Meru County', region: 'Eastern', code: '012' },

  // NORTH EASTERN REGION
  { value: 'marsabit', label: 'Marsabit County', region: 'North Eastern', code: '010' },
  { value: 'isiolo', label: 'Isiolo County', region: 'North Eastern', code: '011' },
  { value: 'garissa', label: 'Garissa County', region: 'North Eastern', code: '007' },
  { value: 'wajir', label: 'Wajir County', region: 'North Eastern', code: '008' },
  { value: 'mandera', label: 'Mandera County', region: 'North Eastern', code: '009' },

  // WESTERN REGION
  { value: 'kakamega', label: 'Kakamega County', region: 'Western', code: '037' },
  { value: 'vihiga', label: 'Vihiga County', region: 'Western', code: '038' },
  { value: 'bungoma', label: 'Bungoma County', region: 'Western', code: '039' },
  { value: 'busia', label: 'Busia County', region: 'Western', code: '040' },

  // NYANZA REGION
  { value: 'kisumu', label: 'Kisumu County', region: 'Nyanza', code: '042' },
  { value: 'siaya', label: 'Siaya County', region: 'Nyanza', code: '041' },
  { value: 'homa_bay', label: 'Homa Bay County', region: 'Nyanza', code: '043' },
  { value: 'migori', label: 'Migori County', region: 'Nyanza', code: '044' },
  { value: 'kisii', label: 'Kisii County', region: 'Nyanza', code: '045' },
  { value: 'nyamira', label: 'Nyamira County', region: 'Nyanza', code: '046' },

  // RIFT VALLEY REGION
  { value: 'nakuru', label: 'Nakuru County', region: 'Rift Valley', code: '032' },
  { value: 'uasin_gishu', label: 'Uasin Gishu County', region: 'Rift Valley', code: '027' },
  { value: 'trans_nzoia', label: 'Trans-Nzoia County', region: 'Rift Valley', code: '026' },
  { value: 'nandi', label: 'Nandi County', region: 'Rift Valley', code: '029' },
  { value: 'baringo', label: 'Baringo County', region: 'Rift Valley', code: '030' },
  { value: 'elgeyo_marakwet', label: 'Elgeyo-Marakwet County', region: 'Rift Valley', code: '028' },
  { value: 'west_pokot', label: 'West Pokot County', region: 'Rift Valley', code: '024' },
  { value: 'samburu', label: 'Samburu County', region: 'Rift Valley', code: '025' },
  { value: 'turkana', label: 'Turkana County', region: 'Rift Valley', code: '023' },
  { value: 'laikipia', label: 'Laikipia County', region: 'Rift Valley', code: '031' },
  { value: 'narok', label: 'Narok County', region: 'Rift Valley', code: '033' },
  { value: 'kajiado', label: 'Kajiado County', region: 'Rift Valley', code: '034' },
  { value: 'kericho', label: 'Kericho County', region: 'Rift Valley', code: '035' },
  { value: 'bomet', label: 'Bomet County', region: 'Rift Valley', code: '036' },
];

// ============================================================================
// MAJOR TOWNS BY COUNTY
// ============================================================================
// Each county has an array of major towns, cities, and urban centers
// Towns are listed in approximate order of size/importance
// ============================================================================

export const KENYA_TOWNS_BY_COUNTY = {
  // NAIROBI REGION
  nairobi: [
    'Nairobi City',
    'Embakasi',
    'Kasarani',
    'Westlands',
    'Dagoretti',
    'Kibera',
    'Mathare',
    'Langata',
    'Karen',
    'Parklands',
    'Kilimani',
    'Lavington',
  ],

  // CENTRAL REGION
  kiambu: [
    'Thika',
    'Kikuyu',
    'Ruiru',
    'Limuru',
    'Karuri',
    'Kiambu Town',
    'Juja',
    'Ruaka',
    'Kahawa',
    'Githunguri',
    'Gatundu',
    'Githurai',
    'Kiambu',
  ],

  muranga: [
    "Murang'a Town",
    'Kenol',
    'Sagana',
    'Maragua',
    'Kandara',
    'Kigumo',
    'Gaturi',
  ],

  nyeri: [
    'Nyeri Town',
    'Karatina',
    'Othaya',
    'Mukurweini',
    'Nanyuki',
  ],

  kirinyaga: [
    'Kerugoya',
    'Kutus',
    'Baricho',
    'Kianyaga',
    'Sagana',
    'Wang\'uru',
  ],

  nyandarua: [
    'Ol Kalou',
    'Ndaragwa',
    'Kinangop',
    'Engineer',
    'Nyahururu',
  ],

  // COAST REGION
  mombasa: [
    'Mombasa City',
    'Likoni',
    'Changamwe',
    'Nyali',
    'Bamburi',
    'Kisauni',
    'Mkomani',
  ],

  kwale: [
    'Kwale Town',
    'Ukunda',
    'Diani Beach',
    'Msambweni',
    'Kinango',
    'Shimoni',
    'Lunga Lunga',
  ],

  kilifi: [
    'Kilifi Town',
    'Malindi',
    'Watamu',
    'Mariakani',
    'Kaloleni',
    'Gede',
    'Mtwapa',
  ],

  tana_river: [
    'Hola',
    'Garsen',
    'Bura',
    'Madogo',
  ],

  lamu: [
    'Lamu Town',
    'Mpeketoni',
    'Mokowe',
    'Faza',
    'Kiunga',
  ],

  taita_taveta: [
    'Voi',
    'Wundanyi',
    'Taveta',
    'Mwatate',
    'Bura',
  ],

  // EASTERN REGION
  machakos: [
    'Machakos Town',
    'Athi River',
    'Kangundo',
    'Matungulu',
    'Mwala',
    'Kathiani',
    'Mavoko',
  ],

  makueni: [
    'Wote',
    'Makindu',
    'Mtito Andei',
    'Kibwezi',
    'Sultan Hamud',
    'Emali',
  ],

  kitui: [
    'Kitui Town',
    'Mwingi',
    'Mutomo',
    'Ikutha',
    'Kyuso',
  ],

  embu: [
    'Embu Town',
    'Runyenjes',
    'Siakago',
    'Ishiara',
    'Kirimari',
  ],

  tharaka_nithi: [
    'Chuka',
    'Kathwana',
    'Marimanti',
    'Chogoria',
    'Karingani',
  ],

  meru: [
    'Meru Town',
    'Maua',
    'Nkubu',
    'Timau',
    'Mikinduri',
    'Kianjai',
  ],

  // NORTH EASTERN REGION
  marsabit: [
    'Marsabit Town',
    'Moyale',
    'Sololo',
    'Laisamis',
    'North Horr',
  ],

  isiolo: [
    'Isiolo Town',
    'Garbatulla',
    'Merti',
    'Kinna',
  ],

  garissa: [
    'Garissa Town',
    'Dadaab',
    'Hulugho',
    'Masalani',
    'Balambala',
  ],

  wajir: [
    'Wajir Town',
    'Habaswein',
    'Buna',
    'Diff',
  ],

  mandera: [
    'Mandera Town',
    'Elwak',
    'Rhamu',
    'Banisa',
    'Takaba',
  ],

  // WESTERN REGION
  kakamega: [
    'Kakamega Town',
    'Mumias',
    'Butere',
    'Khayega',
    'Malava',
    'Lugari',
    'Kimilili',
  ],

  vihiga: [
    'Vihiga Town',
    'Mbale',
    'Hamisi',
    'Majengo',
    'Luanda',
  ],

  bungoma: [
    'Bungoma Town',
    'Webuye',
    'Chwele',
    'Kimilili',
    'Sirisia',
    'Malakisi',
  ],

  busia: [
    'Busia Town',
    'Malaba',
    'Funyula',
    'Port Victoria',
    'Nambale',
  ],

  // NYANZA REGION
  kisumu: [
    'Kisumu City',
    'Ahero',
    'Maseno',
    'Muhoroni',
    'Kombewa',
    'Katito',
  ],

  siaya: [
    'Siaya Town',
    'Bondo',
    'Yala',
    'Ugunja',
    'Ukwala',
    'Usenge',
  ],

  homa_bay: [
    'Homa Bay Town',
    'Mbita',
    'Ndhiwa',
    'Oyugis',
    'Kendu Bay',
    'Rongo',
  ],

  migori: [
    'Migori Town',
    'Awendo',
    'Rongo',
    'Kehancha',
    'Isebania',
    'Uriri',
  ],

  kisii: [
    'Kisii Town',
    'Ogembo',
    'Keroka',
    'Nyamache',
    'Suneka',
    'Keumbu',
  ],

  nyamira: [
    'Nyamira Town',
    'Keroka',
    'Nyansiongo',
    'Kebirigo',
    'Ekerenyo',
  ],

  // RIFT VALLEY REGION
  nakuru: [
    'Nakuru City',
    'Naivasha',
    'Gilgil',
    'Molo',
    'Njoro',
    'Rongai',
    'Subukia',
    'Bahati',
  ],

  uasin_gishu: [
    'Eldoret',
    'Turbo',
    'Burnt Forest',
    'Soy',
    'Ainabkoi',
    'Ziwa',
  ],

  trans_nzoia: [
    'Kitale',
    'Kiminini',
    'Endebess',
    'Kwanza',
    'Cherangany',
  ],

  nandi: [
    'Kapsabet',
    'Mosoriot',
    'Nandi Hills',
    'Kabiyet',
    'Kobujoi',
  ],

  baringo: [
    'Kabarnet',
    'Marigat',
    'Mogotio',
    'Eldama Ravine',
    'Kabartonjo',
  ],

  elgeyo_marakwet: [
    'Iten',
    'Kapcherop',
    'Tambach',
    'Cheptongei',
  ],

  west_pokot: [
    'Kapenguria',
    'Makutano',
    'Chepareria',
    'Sigor',
  ],

  samburu: [
    'Maralal',
    'Baragoi',
    'Wamba',
    'Archers Post',
  ],

  turkana: [
    'Lodwar',
    'Kakuma',
    'Lokichoggio',
    'Kalokol',
    'Lokichar',
  ],

  laikipia: [
    'Nanyuki',
    'Nyahururu',
    'Rumuruti',
    'Doldol',
    'Sipili',
  ],

  narok: [
    'Narok Town',
    'Kilgoris',
    'Ololulunga',
    'Suswa',
    'Mau Narok',
  ],

  kajiado: [
    'Kajiado Town',
    'Ongata Rongai',
    'Kitengela',
    'Ngong',
    'Bissil',
    'Namanga',
    'Loitokitok',
    'Kimana',
  ],

  kericho: [
    'Kericho Town',
    'Litein',
    'Londiani',
    'Kipkelion',
    'Fort Ternan',
    'Sosiot',
  ],

  bomet: [
    'Bomet Town',
    'Sotik',
    'Mulot',
    'Longisa',
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
