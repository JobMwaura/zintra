/**
 * ============================================================================
 * SOUTH AFRICA LOCATIONS MASTER DATA
 * ============================================================================
 * Complete list of South Africa's 9 provinces and major cities/towns
 * Last Updated: December 17, 2025
 *
 * Usage:
 *   import { SA_PROVINCES, SA_CITIES_BY_PROVINCE, SA_POPULAR_CITIES } from '@/lib/southAfricaLocations';
 *
 * ============================================================================
 */

// ============================================================================
// ALL 9 SOUTH AFRICAN PROVINCES
// ============================================================================
// Organized alphabetically with regional groupings
// ============================================================================

export const SA_PROVINCES = [
  { value: 'eastern_cape', label: 'Eastern Cape', region: 'Eastern', code: 'EC' },
  { value: 'free_state', label: 'Free State', region: 'Central', code: 'FS' },
  { value: 'gauteng', label: 'Gauteng', region: 'Central', code: 'GP' },
  { value: 'kwazulu_natal', label: 'KwaZulu-Natal', region: 'Eastern', code: 'KZN' },
  { value: 'limpopo', label: 'Limpopo', region: 'Northern', code: 'LP' },
  { value: 'mpumalanga', label: 'Mpumalanga', region: 'Eastern', code: 'MP' },
  { value: 'northern_cape', label: 'Northern Cape', region: 'Western', code: 'NC' },
  { value: 'north_west', label: 'North West', region: 'Western', code: 'NW' },
  { value: 'western_cape', label: 'Western Cape', region: 'Western', code: 'WC' },
];

// ============================================================================
// MAJOR CITIES AND TOWNS BY PROVINCE
// ============================================================================
// Each province has an array of major urban centers
// Listed in approximate order of size/importance
// ============================================================================

export const SA_CITIES_BY_PROVINCE = {
  // GAUTENG (Economic Hub)
  gauteng: [
    'Johannesburg',
    'Pretoria (Tshwane)',
    'Soweto',
    'Ekurhuleni',
    'Benoni',
    'Boksburg',
    'Brakpan',
    'Germiston',
    'Kempton Park',
    'Springs',
    'Alberton',
    'Randburg',
    'Roodepoort',
    'Sandton',
    'Midrand',
    'Centurion',
    'Krugersdorp',
    'Vanderbijlpark',
    'Vereeniging',
    'Carletonville',
  ],

  // KWAZULU-NATAL (Coastal Province)
  kwazulu_natal: [
    'Durban',
    'Pietermaritzburg',
    'Richards Bay',
    'Newcastle',
    'Ladysmith',
    'Empangeni',
    'Port Shepstone',
    'Pinetown',
    'Chatsworth',
    'Umlazi',
    'Phoenix',
    'Scottburgh',
    'Margate',
    'Kokstad',
    'Dundee',
    'Vryheid',
    'Stanger (KwaDukuza)',
    'Umhlanga',
    'Ballito',
    'Howick',
  ],

  // WESTERN CAPE (Tourism & Wine)
  western_cape: [
    'Cape Town',
    'George',
    'Stellenbosch',
    'Paarl',
    'Worcester',
    'Mossel Bay',
    'Knysna',
    'Oudtshoorn',
    'Hermanus',
    'Swellendam',
    'Somerset West',
    'Strand',
    'Bellville',
    'Mitchells Plain',
    'Khayelitsha',
    'Plettenberg Bay',
    'Saldanha',
    'Malmesbury',
    'Vredenburg',
    'Caledon',
  ],

  // EASTERN CAPE (Coastal & Industrial)
  eastern_cape: [
    'Port Elizabeth (Gqeberha)',
    'East London',
    'Mthatha',
    'Uitenhage',
    'Grahamstown (Makhanda)',
    'King Williams Town',
    'Queenstown',
    'Mdantsane',
    'Bhisho',
    'Port Alfred',
    'Graaff-Reinet',
    'Cradock',
    'Somerset East',
    'Stutterheim',
    'Aliwal North',
    'Fort Beaufort',
    'Jeffreys Bay',
    'Despatch',
    'Butterworth',
    'Ngcobo',
  ],

  // LIMPOPO (Northern Province)
  limpopo: [
    'Polokwane',
    'Thohoyandou',
    'Lebowakgomo',
    'Musina',
    'Mokopane',
    'Tzaneen',
    'Phalaborwa',
    'Giyani',
    'Louis Trichardt (Makhado)',
    'Modimolle',
    'Thabazimbi',
    'Bela-Bela',
    'Lephalale',
    'Hoedspruit',
    'Burgersfort',
    'Groblersdal',
    'Marble Hall',
    'Mookgophong',
    'Nkowakowa',
    'Seshego',
  ],

  // MPUMALANGA (Scenic Province)
  mpumalanga: [
    'Nelspruit (Mbombela)',
    'Witbank (Emalahleni)',
    'Middelburg',
    'Secunda',
    'Standerton',
    'Ermelo',
    'Bethal',
    'Piet Retief',
    'White River',
    'Barberton',
    'Sabie',
    'Graskop',
    'Hazyview',
    'Lydenburg',
    'Belfast',
    'Carolina',
    'Volksrust',
    'Komatipoort',
    'Burgersfort',
    'Hendrina',
  ],

  // FREE STATE (Central Plains)
  free_state: [
    'Bloemfontein',
    'Welkom',
    'Bethlehem',
    'Kroonstad',
    'Sasolburg',
    'Phuthaditjhaba',
    'Virginia',
    'Odendaalsrus',
    'Bothaville',
    'Parys',
    'Harrismith',
    'Ficksburg',
    'Ladybrand',
    'Thaba Nchu',
    'Hennenman',
    'Ventersburg',
    'Frankfort',
    'Heilbron',
    'Senekal',
    'Koffiefontein',
  ],

  // NORTH WEST (Platinum Belt)
  north_west: [
    'Rustenburg',
    'Mahikeng (Mafikeng)',
    'Klerksdorp',
    'Potchefstroom',
    'Brits',
    'Lichtenburg',
    'Mmabatho',
    'Stilfontein',
    'Orkney',
    'Vryburg',
    'Zeerust',
    'Schweizer-Reneke',
    'Koster',
    'Christiana',
    'Wolmaransstad',
    'Delareyville',
    'Taung',
    'Thabazimbi',
    'Madibeng',
    'Mooinooi',
  ],

  // NORTHERN CAPE (Desert & Mining)
  northern_cape: [
    'Kimberley',
    'Upington',
    'Springbok',
    'De Aar',
    'Kuruman',
    'Postmasburg',
    'Kathu',
    'Alexander Bay',
    'Prieska',
    'Calvinia',
    'Carnarvon',
    'Douglas',
    'Britstown',
    'Colesberg',
    'Richmond',
    'Victoria West',
    'Barkly West',
    'Hopetown',
    'Griquatown',
    'Sutherland',
  ],
};

// ============================================================================
// POPULAR CITIES (Most Searched/Used)
// ============================================================================
// Top 30 cities for quick access and autocomplete
// ============================================================================

export const SA_POPULAR_CITIES = [
  'Johannesburg',
  'Cape Town',
  'Durban',
  'Pretoria (Tshwane)',
  'Port Elizabeth (Gqeberha)',
  'Bloemfontein',
  'East London',
  'Nelspruit (Mbombela)',
  'Polokwane',
  'Rustenburg',
  'Pietermaritzburg',
  'Kimberley',
  'George',
  'Richards Bay',
  'Soweto',
  'Sandton',
  'Centurion',
  'Stellenbosch',
  'Paarl',
  'Newcastle',
  'Witbank (Emalahleni)',
  'Welkom',
  'Middelburg',
  'Ladysmith',
  'Mahikeng (Mafikeng)',
  'Klerksdorp',
  'Potchefstroom',
  'Upington',
  'Worcester',
  'Hermanus',
];

// ============================================================================
// MAJOR METROPOLITAN AREAS
// ============================================================================

export const SA_METRO_AREAS = [
  {
    name: 'Greater Johannesburg',
    province: 'gauteng',
    cities: ['Johannesburg', 'Soweto', 'Sandton', 'Randburg', 'Roodepoort'],
  },
  {
    name: 'Pretoria Metro (Tshwane)',
    province: 'gauteng',
    cities: ['Pretoria (Tshwane)', 'Centurion', 'Soshanguve'],
  },
  {
    name: 'Ekurhuleni Metro',
    province: 'gauteng',
    cities: ['Benoni', 'Boksburg', 'Germiston', 'Kempton Park', 'Springs'],
  },
  {
    name: 'eThekwini Metro',
    province: 'kwazulu_natal',
    cities: ['Durban', 'Pinetown', 'Chatsworth', 'Umlazi', 'Phoenix'],
  },
  {
    name: 'Nelson Mandela Bay Metro',
    province: 'eastern_cape',
    cities: ['Port Elizabeth (Gqeberha)', 'Uitenhage', 'Despatch'],
  },
  {
    name: 'Cape Town Metro',
    province: 'western_cape',
    cities: ['Cape Town', 'Bellville', 'Mitchells Plain', 'Khayelitsha', 'Somerset West'],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get province by value
 * @param {string} provinceValue - Province value (e.g., 'gauteng')
 * @returns {Object|null} Province object or null if not found
 */
export function getProvinceByValue(provinceValue) {
  return SA_PROVINCES.find(province => province.value === provinceValue) || null;
}

/**
 * Get cities for a specific province
 * @param {string} provinceValue - Province value (e.g., 'gauteng')
 * @returns {Array} Array of city names
 */
export function getCitiesByProvince(provinceValue) {
  return SA_CITIES_BY_PROVINCE[provinceValue] || [];
}

/**
 * Get all provinces by region
 * @param {string} region - Region name (e.g., 'Central', 'Western')
 * @returns {Array} Array of province objects
 */
export function getProvincesByRegion(region) {
  return SA_PROVINCES.filter(province => province.region === region);
}

/**
 * Search cities across all provinces
 * @param {string} query - Search query
 * @returns {Array} Array of matching cities with province info
 */
export function searchCities(query) {
  const results = [];
  const lowerQuery = query.toLowerCase();

  for (const [provinceValue, cities] of Object.entries(SA_CITIES_BY_PROVINCE)) {
    const matchingCities = cities.filter(city =>
      city.toLowerCase().includes(lowerQuery)
    );

    if (matchingCities.length > 0) {
      const province = getProvinceByValue(provinceValue);
      matchingCities.forEach(city => {
        results.push({
          city,
          province: province?.label,
          provinceValue: provinceValue,
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
  return [...new Set(SA_PROVINCES.map(province => province.region))];
}

/**
 * Validate if a province value exists
 * @param {string} provinceValue - Province value to validate
 * @returns {boolean} True if province exists
 */
export function isValidProvince(provinceValue) {
  return SA_PROVINCES.some(province => province.value === provinceValue);
}

/**
 * Validate if a city exists in a specific province
 * @param {string} provinceValue - Province value
 * @param {string} cityName - City name
 * @returns {boolean} True if city exists in province
 */
export function isValidCity(provinceValue, cityName) {
  const cities = getCitiesByProvince(provinceValue);
  return cities.some(city => city.toLowerCase() === cityName.toLowerCase());
}

// ============================================================================
// PROVINCES BY REGION
// ============================================================================

export const SA_PROVINCES_BY_REGION = {
  'Central': getProvincesByRegion('Central'),
  'Eastern': getProvincesByRegion('Eastern'),
  'Northern': getProvincesByRegion('Northern'),
  'Western': getProvincesByRegion('Western'),
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  SA_PROVINCES,
  SA_CITIES_BY_PROVINCE,
  SA_POPULAR_CITIES,
  SA_METRO_AREAS,
  SA_PROVINCES_BY_REGION,
  getProvinceByValue,
  getCitiesByProvince,
  getProvincesByRegion,
  searchCities,
  getAllRegions,
  isValidProvince,
  isValidCity,
};
