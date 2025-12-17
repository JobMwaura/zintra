/**
 * ============================================================================
 * ZIMBABWE LOCATIONS MASTER DATA
 * ============================================================================
 * Complete list of Zimbabwe's 10 provinces and major cities/towns
 * Last Updated: December 17, 2025
 *
 * Usage:
 *   import { ZW_PROVINCES, ZW_CITIES_BY_PROVINCE, ZW_POPULAR_CITIES } from '@/lib/zimbabweLocations';
 *
 * ============================================================================
 */

// ============================================================================
// ALL 10 ZIMBABWE PROVINCES
// ============================================================================
// Organized by region for easier management
// ============================================================================

export const ZW_PROVINCES = [
  { value: 'bulawayo', label: 'Bulawayo Metropolitan', region: 'Western', code: 'BU' },
  { value: 'harare', label: 'Harare Metropolitan', region: 'Northern', code: 'HA' },
  { value: 'manicaland', label: 'Manicaland', region: 'Eastern', code: 'MA' },
  { value: 'mashonaland_central', label: 'Mashonaland Central', region: 'Northern', code: 'MC' },
  { value: 'mashonaland_east', label: 'Mashonaland East', region: 'Northern', code: 'ME' },
  { value: 'mashonaland_west', label: 'Mashonaland West', region: 'Northern', code: 'MW' },
  { value: 'masvingo', label: 'Masvingo', region: 'Southern', code: 'MV' },
  { value: 'matabeleland_north', label: 'Matabeleland North', region: 'Western', code: 'MN' },
  { value: 'matabeleland_south', label: 'Matabeleland South', region: 'Western', code: 'MS' },
  { value: 'midlands', label: 'Midlands', region: 'Central', code: 'MI' },
];

// ============================================================================
// MAJOR CITIES AND TOWNS BY PROVINCE
// ============================================================================
// Each province has an array of major urban centers
// Listed in approximate order of size/importance
// ============================================================================

export const ZW_CITIES_BY_PROVINCE = {
  // HARARE METROPOLITAN (Capital & Economic Center)
  harare: [
    'Harare',
    'Chitungwiza',
    'Epworth',
    'Norton',
    'Ruwa',
    'Mbare',
    'Highfield',
    'Warren Park',
    'Hatfield',
    'Borrowdale',
    'Mount Pleasant',
    'Avondale',
    'Greendale',
    'Marlborough',
  ],

  // BULAWAYO METROPOLITAN (Second City)
  bulawayo: [
    'Bulawayo',
    'Cowdray Park',
    'Pumula',
    'Nkulumane',
    'Entumbane',
    'Magwegwe',
    'Tshabalala',
    'Barbourfields',
    'Lobengula',
  ],

  // MANICALAND (Eastern Province)
  manicaland: [
    'Mutare',
    'Rusape',
    'Chipinge',
    'Chimanimani',
    'Nyanga',
    'Penhalonga',
    'Buhera',
    'Makoni',
    'Headlands',
    'Odzi',
    'Cashel',
    'Dorowa',
    'Biriwiri',
    'Mukandi',
  ],

  // MASHONALAND CENTRAL
  mashonaland_central: [
    'Bindura',
    'Mount Darwin',
    'Shamva',
    'Mazowe',
    'Guruve',
    'Centenary',
    'Mvurwi',
    'Glendale',
    'Concession',
    'Rushinga',
    'Muzarabani',
  ],

  // MASHONALAND EAST
  mashonaland_east: [
    'Marondera',
    'Mutoko',
    'Macheke',
    'Ruwa',
    'Hwedza',
    'Mudzi',
    'Seke',
    'UMP (Union Minière du Haut Katanga)',
    'Bromley',
    'Wedza',
  ],

  // MASHONALAND WEST
  mashonaland_west: [
    'Chinhoyi',
    'Karoi',
    'Kariba',
    'Chegutu',
    'Kadoma',
    'Norton',
    'Banket',
    'Alaska',
    'Mhangura',
    'Raffingora',
    'Makuti',
    'Murombedzi',
    'Chakari',
  ],

  // MASVINGO (Southern Province)
  masvingo: [
    'Masvingo',
    'Chiredzi',
    'Zvishavane',
    'Triangle',
    'Ngundu',
    'Gutu',
    'Mashava',
    'Bikita',
    'Zaka',
    'Mwenezi',
    'Rutenga',
    'Beitbridge',
  ],

  // MATABELELAND NORTH
  matabeleland_north: [
    'Hwange',
    'Victoria Falls',
    'Lupane',
    'Binga',
    'Dete',
    'Kamativi',
    'Tsholotsho',
    'Jotsholo',
    'Nkayi',
  ],

  // MATABELELAND SOUTH
  matabeleland_south: [
    'Gwanda',
    'Beitbridge',
    'Plumtree',
    'Esigodini',
    'Filabusi',
    'West Nicholson',
    'Matobo',
    'Insiza',
    'Umzingwane',
    'Mangwe',
  ],

  // MIDLANDS (Central Province)
  midlands: [
    'Gweru',
    'Kwekwe',
    'Zvishavane',
    'Redcliff',
    'Shurugwi',
    'Gokwe',
    'Lalapanzi',
    'Mvuma',
    'Chirumhanzu',
    'Mberengwa',
    'Silobela',
    'Zhombe',
    'Battlefields',
  ],
};

// ============================================================================
// POPULAR CITIES (Most Searched/Used)
// ============================================================================
// Top 25 cities for quick access and autocomplete
// ============================================================================

export const ZW_POPULAR_CITIES = [
  'Harare',
  'Bulawayo',
  'Mutare',
  'Gweru',
  'Kwekwe',
  'Kadoma',
  'Masvingo',
  'Chinhoyi',
  'Marondera',
  'Norton',
  'Chegutu',
  'Bindura',
  'Zvishavane',
  'Victoria Falls',
  'Hwange',
  'Rusape',
  'Chiredzi',
  'Kariba',
  'Karoi',
  'Chitungwiza',
  'Redcliff',
  'Gwanda',
  'Shurugwi',
  'Chipinge',
  'Beitbridge',
];

// ============================================================================
// MAJOR URBAN AREAS
// ============================================================================

export const ZW_URBAN_AREAS = [
  {
    name: 'Greater Harare',
    province: 'harare',
    cities: ['Harare', 'Chitungwiza', 'Epworth', 'Ruwa', 'Norton'],
    description: 'Capital and largest metropolitan area',
  },
  {
    name: 'Greater Bulawayo',
    province: 'bulawayo',
    cities: ['Bulawayo', 'Cowdray Park', 'Pumula'],
    description: 'Second largest city, industrial hub',
  },
  {
    name: 'Mutare Urban',
    province: 'manicaland',
    cities: ['Mutare', 'Penhalonga'],
    description: 'Eastern border city, gateway to Mozambique',
  },
  {
    name: 'Gweru-Kwekwe Area',
    province: 'midlands',
    cities: ['Gweru', 'Kwekwe', 'Redcliff'],
    description: 'Central industrial and mining region',
  },
];

// ============================================================================
// TOURIST DESTINATIONS
// ============================================================================

export const ZW_TOURIST_DESTINATIONS = [
  'Victoria Falls',
  'Hwange',
  'Kariba',
  'Nyanga',
  'Great Zimbabwe (Masvingo)',
  'Chimanimani',
  'Gonarezhou',
  'Mana Pools',
  'Bvumba',
  'Matobo',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get province by value
 * @param {string} provinceValue - Province value (e.g., 'harare')
 * @returns {Object|null} Province object or null if not found
 */
export function getProvinceByValue(provinceValue) {
  return ZW_PROVINCES.find(province => province.value === provinceValue) || null;
}

/**
 * Get cities for a specific province
 * @param {string} provinceValue - Province value (e.g., 'harare')
 * @returns {Array} Array of city names
 */
export function getCitiesByProvince(provinceValue) {
  return ZW_CITIES_BY_PROVINCE[provinceValue] || [];
}

/**
 * Get all provinces by region
 * @param {string} region - Region name (e.g., 'Northern', 'Western')
 * @returns {Array} Array of province objects
 */
export function getProvincesByRegion(region) {
  return ZW_PROVINCES.filter(province => province.region === region);
}

/**
 * Search cities across all provinces
 * @param {string} query - Search query
 * @returns {Array} Array of matching cities with province info
 */
export function searchCities(query) {
  const results = [];
  const lowerQuery = query.toLowerCase();

  for (const [provinceValue, cities] of Object.entries(ZW_CITIES_BY_PROVINCE)) {
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
  return [...new Set(ZW_PROVINCES.map(province => province.region))];
}

/**
 * Validate if a province value exists
 * @param {string} provinceValue - Province value to validate
 * @returns {boolean} True if province exists
 */
export function isValidProvince(provinceValue) {
  return ZW_PROVINCES.some(province => province.value === provinceValue);
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

export const ZW_PROVINCES_BY_REGION = {
  'Northern': getProvincesByRegion('Northern'),
  'Eastern': getProvincesByRegion('Eastern'),
  'Southern': getProvincesByRegion('Southern'),
  'Western': getProvincesByRegion('Western'),
  'Central': getProvincesByRegion('Central'),
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  ZW_PROVINCES,
  ZW_CITIES_BY_PROVINCE,
  ZW_POPULAR_CITIES,
  ZW_URBAN_AREAS,
  ZW_TOURIST_DESTINATIONS,
  ZW_PROVINCES_BY_REGION,
  getProvinceByValue,
  getCitiesByProvince,
  getProvincesByRegion,
  searchCities,
  getAllRegions,
  isValidProvince,
  isValidCity,
};
