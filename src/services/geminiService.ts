import type { ActivityCategory, AttractionRecommendation, City, FamilyMember, GeminiSuggestion, ItineraryItem, ReadyMadeTourPlan, TravelerGroupProfile, WeatherData } from '../types/travel';
import { estimateTransitBetweenSpots } from './trafficTransitService';

// In-memory or localStorage API key support
const GEMINI_API_KEY_STORAGE = 'voyagecraft_gemini_api_key';

export function getStoredGeminiApiKey(): string {
  return localStorage.getItem(GEMINI_API_KEY_STORAGE) || import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function setStoredGeminiApiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE);
  }
}

/**
 * Parses time string (e.g. "14:30", "9:00 AM", "09:00") into minutes from midnight
 */
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 600; // default 10:00 AM
  const clean = timeStr.trim().toLowerCase();
  const isPM = clean.includes('pm');
  const isAM = clean.includes('am');
  const numbersPart = clean.replace(/[^\d:]/g, '');
  const [hStr, mStr] = numbersPart.split(':');
  let hours = parseInt(hStr || '10', 10);
  const minutes = parseInt(mStr || '0', 10);

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Evaluates spot accessibility based on scheduled time, typical opening hours, and weather conditions
 */
export function evaluateSpotAccessibility(
  title: string,
  scheduledTime: string,
  openingHours: string = '09:00 - 18:00',
  rainProb: number = 0
): { status: 'open' | 'caution' | 'closed'; note: string } {
  const scheduledMinutes = parseTimeToMinutes(scheduledTime);
  const titleLower = title.toLowerCase();

  // Natural parks, public squares, beaches, promenades are usually open 24/7
  const isPublicOpen = /park|garden|square|piazza|bridge|beach|promenade|lookout|viewpoint|walk|street|downtown/i.test(titleLower);

  // Extract hours like "09:00 - 18:00" or "10:00 AM - 7:00 PM"
  let openMin = 9 * 60; // 09:00
  let closeMin = 18 * 60; // 18:00

  const hourMatches = openingHours.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–to]+\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (hourMatches) {
    openMin = parseTimeToMinutes(hourMatches[1]);
    closeMin = parseTimeToMinutes(hourMatches[2]);
    if (closeMin < openMin) closeMin += 24 * 60; // passes midnight (e.g. 18:00 - 02:00)
  }

  // Weather warning for outdoor venues
  if (rainProb > 45 && isPublicOpen) {
    return {
      status: 'caution',
      note: `⚠️ High chance of rain (${rainProb}%). Outdoor visit may be wet; bring rain gear or consider an indoor alternative.`,
    };
  }

  if (isPublicOpen) {
    if (scheduledMinutes < 360 || scheduledMinutes > 1380) { // before 6 AM or after 11 PM
      return {
        status: 'caution',
        note: 'Accessible 24/7, but visit in daylight recommended for best views and safety.',
      };
    }
    return {
      status: 'open',
      note: '🟢 Open & fully accessible at this time (Open public attraction).',
    };
  }

  // Specific restaurant / dining heuristics
  if (/dinner|lunch|bistro|cafe|restaurant|ramen|tapas|trattoria|food/i.test(titleLower)) {
    if (scheduledMinutes < 420) { // before 7am
      return { status: 'closed', note: '❌ Most dining spots are closed this early in the morning.' };
    }
    return {
      status: 'open',
      note: '🟢 Typical dining service available during this slot.',
    };
  }

  // Standard attraction checks
  if (scheduledMinutes < openMin) {
    const openTimeFormatted = `${Math.floor(openMin / 60)}:${String(openMin % 60).padStart(2, '0')}`;
    return {
      status: 'caution',
      note: `⚠️ Scheduled early. Standard opening is around ${openTimeFormatted}. Double-check morning entrance times.`,
    };
  }

  if (scheduledMinutes > closeMin - 30) {
    const closeTimeFormatted = `${Math.floor(closeMin / 60)}:${String(closeMin % 60).padStart(2, '0')}`;
    return {
      status: 'closed',
      note: `❌ Spot likely closes at ${closeTimeFormatted}. Last entry is usually 45-60 minutes prior.`,
    };
  }

  return {
    status: 'open',
    note: `🟢 Open & accessible (Regular hours: ${openingHours}).`,
  };
}

/**
 * Curated knowledge base of famous attractions for popular global destinations
 */
const FAMOUS_DESTINATIONS_DATA: Record<string, AttractionRecommendation[]> = {
  tokyo: [
    {
      id: 'tok-1',
      title: 'Senso-ji Temple & Nakamise-dori',
      description: 'Tokyo’s oldest Buddhist temple dating back to 645 AD, famed for the iconic Kaminarimon thunder gate and bustling lantern market street.',
      category: 'sightseeing',
      estimatedCost: 0,
      currency: 'JPY (¥)',
      openingHours: '06:00 - 17:00',
      bestTimeToVisit: 'Early morning (08:00 - 09:30)',
      accessibility: 'Step-free paved walkways, wheelchair ramps available.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'tok-2',
      title: 'Shibuya Sky & Scramble Crossing',
      description: 'Breathtaking 360° open-air rooftop observatory hovering 229m over the world’s busiest pedestrian intersection.',
      category: 'sightseeing',
      estimatedCost: 2000,
      currency: 'JPY (¥)',
      openingHours: '10:00 - 22:30',
      bestTimeToVisit: 'Sunset (17:00 - 18:30)',
      accessibility: 'High-speed elevators, fully accessible observation deck.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'tok-3',
      title: 'Meiji Jingu Shrine & Yoyogi Forest',
      description: 'Serene Shinto shrine set within an evergreen forest of 120,000 trees donated from across Japan, offering spiritual calm in central Tokyo.',
      category: 'sightseeing',
      estimatedCost: 0,
      currency: 'JPY (¥)',
      openingHours: '05:30 - 18:00',
      bestTimeToVisit: 'Morning stroll (08:30 - 10:30)',
      accessibility: 'Gravel forest paths; manual wheelchairs available for free loan at entrance.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'tok-4',
      title: 'teamLab Planets Digital Art Immersion',
      description: 'World-famous barefoot interactive art museum where visitors walk through water and colossal kaleidoscopic light installations.',
      category: 'activity',
      estimatedCost: 3800,
      currency: 'JPY (¥)',
      openingHours: '09:00 - 22:00',
      bestTimeToVisit: 'Afternoon or evening (Pre-booking required)',
      accessibility: 'Accessible route available; note water area requires rolling up pants.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'tok-5',
      title: 'Tsukiji Outer Market Culinary Tour',
      description: 'Lively maze of narrow alleys packed with street vendors serving fresh sashimi, wagyu skewers, tamagoyaki, and matcha desserts.',
      category: 'food',
      estimatedCost: 2500,
      currency: 'JPY (¥)',
      openingHours: '08:00 - 14:00',
      bestTimeToVisit: 'Brunch (09:30 - 11:30)',
      accessibility: 'Narrow crowded aisles; best navigated on foot.',
      isMustVisit: false,
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'tok-6',
      title: 'Shinjuku Gyoen National Garden',
      description: 'Spectacular historic garden blending traditional Japanese, English landscape, and French formal styles with tranquil tea houses.',
      category: 'relaxation',
      estimatedCost: 500,
      currency: 'JPY (¥)',
      openingHours: '09:00 - 16:30',
      bestTimeToVisit: 'Midday picnic (12:00 - 14:00)',
      accessibility: 'Smooth paved pathways, accessible restrooms throughout.',
      isMustVisit: false,
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    },
  ],
  paris: [
    {
      id: 'par-1',
      title: 'Eiffel Tower & Champ de Mars',
      description: 'The monumental symbol of France designed by Gustave Eiffel for the 1889 World’s Fair, offering incomparable panoramic views of Paris.',
      category: 'sightseeing',
      estimatedCost: 28,
      currency: 'EUR (€)',
      openingHours: '09:00 - 23:45',
      bestTimeToVisit: 'Sunset or evening sparkle (18:30 - 21:00)',
      accessibility: 'Elevator access to 1st and 2nd floors for wheelchair users.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'par-2',
      title: 'Louvre Museum & Glass Pyramid',
      description: 'The world’s largest art museum housing over 35,000 masterworks including the Mona Lisa, Venus de Milo, and Winged Victory.',
      category: 'activity',
      estimatedCost: 22,
      currency: 'EUR (€)',
      openingHours: '09:00 - 18:00 (Closed Tuesdays)',
      bestTimeToVisit: 'Morning opening (09:00 - 12:00)',
      accessibility: 'Priority queue for visitors with reduced mobility; elevators to all wings.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'par-3',
      title: 'Musée d’Orsay & Impressionist Masterpieces',
      description: 'Housed in a grand Beaux-Arts railway station, showcasing premier Impressionist treasures by Monet, Van Gogh, Renoir, and Degas.',
      category: 'activity',
      estimatedCost: 16,
      currency: 'EUR (€)',
      openingHours: '09:30 - 18:00 (Closed Mondays)',
      bestTimeToVisit: 'Early afternoon (13:30 - 16:00)',
      accessibility: 'Fully accessible with elevators and dedicated ramps.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'par-4',
      title: 'Montmartre & Sacré-Cœur Basilica',
      description: 'Bohemian hilltop village crowned by the alabaster Sacré-Cœur Basilica with street portrait artists, charming cobblestone alleys, and city vistas.',
      category: 'sightseeing',
      estimatedCost: 0,
      currency: 'EUR (€)',
      openingHours: '06:30 - 22:30',
      bestTimeToVisit: 'Late afternoon / Golden hour',
      accessibility: 'Funicular lift available to avoid the 222 steps.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'par-5',
      title: 'Seine River Sunset Cruise',
      description: 'Glide past Notre-Dame, Pont Alexandre III, and historic riverfronts with open-air sightseeing decks.',
      category: 'relaxation',
      estimatedCost: 18,
      currency: 'EUR (€)',
      openingHours: '10:00 - 22:00',
      bestTimeToVisit: 'Dusk (19:30 - 20:30)',
      accessibility: 'Ramps to boarding docks; accessible main deck.',
      isMustVisit: false,
      image: 'https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'par-6',
      title: 'Latin Quarter & Le Marais Cafe Stroll',
      description: 'Historic bistros, artisanal patisseries, and vintage bookshops along narrow medieval streets.',
      category: 'food',
      estimatedCost: 30,
      currency: 'EUR (€)',
      openingHours: '11:00 - 23:00',
      bestTimeToVisit: 'Lunch or late afternoon coffee',
      accessibility: 'Historic cobblestones; outdoor terrace seating widely available.',
      isMustVisit: false,
      image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80',
    },
  ],
  rome: [
    {
      id: 'rom-1',
      title: 'Colosseum & Roman Forum',
      description: 'The monumental amphitheater of the Roman Empire and the ancient political center with triumphal arches and imperial temples.',
      category: 'sightseeing',
      estimatedCost: 24,
      currency: 'EUR (€)',
      openingHours: '09:00 - 19:15',
      bestTimeToVisit: 'Early morning (08:45 - 11:30)',
      accessibility: 'Elevators inside Colosseum; Forum paths are uneven stone.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'rom-2',
      title: 'Vatican Museums & Sistine Chapel',
      description: 'Renaissance art collection culminating in Michelangelo’s transcendent Sistine Chapel ceiling and St. Peter’s Basilica.',
      category: 'sightseeing',
      estimatedCost: 29,
      currency: 'EUR (€)',
      openingHours: '08:00 - 19:00 (Closed Sundays)',
      bestTimeToVisit: 'Morning booking (08:30 - 12:00)',
      accessibility: 'Dedicated accessible tour route; advance notice requested.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'rom-3',
      title: 'Trevi Fountain & Spanish Steps',
      description: 'Baroque masterpiece fountain where tradition says tossing a coin ensures your return to Rome, followed by a walk up the iconic Spanish Steps.',
      category: 'sightseeing',
      estimatedCost: 0,
      currency: 'EUR (€)',
      openingHours: '24/7',
      bestTimeToVisit: 'Morning or late evening to avoid heavy crowds',
      accessibility: 'Paved pedestrian zone around fountain.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1525874684015-58379d421a52?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'rom-4',
      title: 'Pantheon & Piazza Navona',
      description: 'The best-preserved monument of ancient Rome with its 2,000-year-old unreinforced concrete dome and oculus, next to Bernini’s Four Rivers Fountain.',
      category: 'sightseeing',
      estimatedCost: 5,
      currency: 'EUR (€)',
      openingHours: '09:00 - 19:00',
      bestTimeToVisit: 'Midday when sunlight beams through the oculus',
      accessibility: 'Level entrance with wide paved piazza.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1542820229-081e0c12af0b?auto=format&fit=crop&w=800&q=80',
    },
  ],
  sikkim: [
    {
      id: 'sik-1',
      title: 'Tsomgo (Changu) Lake & Baba Mandir',
      description: 'Glacial alpine lake at 12,400 ft altitude surrounded by snow-capped peaks, where waters reflect shifting Himalayan colors with sacred spiritual significance.',
      category: 'sightseeing',
      estimatedCost: 500,
      currency: 'INR (₹)',
      openingHours: '07:30 - 15:00',
      bestTimeToVisit: 'Morning (08:30 - 12:00, permits required)',
      accessibility: '⚠️ High altitude zone; vehicle access right to lakeside walkway.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'sik-2',
      title: 'Nathula Pass & Indo-China Border',
      description: 'Historic high-mountain corridor along the ancient Silk Route at 14,140 ft altitude offering panoramic Himalayan vistas and army post monuments.',
      category: 'sightseeing',
      estimatedCost: 800,
      currency: 'INR (₹)',
      openingHours: '08:00 - 14:30 (Wed-Sun, permit required)',
      bestTimeToVisit: 'Morning before noon mist settles',
      accessibility: '⚠️ High altitude pass; stairs to border viewpoint.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1626014303757-6466336e8494?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'sik-3',
      title: 'Rumtek Monastery (Dharma Chakra Centre)',
      description: 'The largest and most sacred monastery in Sikkim, perched atop a verdant hill overlooking Gangtok, housing priceless Tibetan Buddhist relics and golden stupas.',
      category: 'activity',
      estimatedCost: 50,
      currency: 'INR (₹)',
      openingHours: '06:00 - 18:00',
      bestTimeToVisit: 'Morning prayers (08:30 - 10:30)',
      accessibility: '🟢 Gentle incline from parking area to main prayer courtyard.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1596707328905-2ce458a2d1f7?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'sik-4',
      title: 'MG Marg Cultural & Culinary Stroll',
      description: 'Lively pedestrian-only boulevard lined with Victorian lampposts, Himalayan souvenir boutiques, cozy bakeries, and authentic local momo/thukpa eateries.',
      category: 'food',
      estimatedCost: 350,
      currency: 'INR (₹)',
      openingHours: '09:00 - 20:30 (Closed Tuesdays)',
      bestTimeToVisit: 'Evening twilight stroll (17:00 - 19:30)',
      accessibility: '🟢 Flat cobblestone boulevard, entirely vehicle-free.',
      isMustVisit: false,
      image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'sik-5',
      title: 'Yumthang Valley of Flowers & Hot Springs',
      description: 'Breathtaking alpine meadow in North Sikkim carpeted with blooming rhododendrons, yaks grazing along riverbanks, and therapeutic hot springs.',
      category: 'relaxation',
      estimatedCost: 600,
      currency: 'INR (₹)',
      openingHours: '06:00 - 16:00',
      bestTimeToVisit: 'Spring blooming season or crisp autumn mornings',
      accessibility: 'Scenic walking paths along the valley floor.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'sik-6',
      title: 'Ban Jhakri Falls & Shaman Energy Park',
      description: 'Cascading 100-foot natural waterfall set within landscaped gardens celebrating ancient Sikkim tribal shamanic lore and traditional sculptures.',
      category: 'sightseeing',
      estimatedCost: 100,
      currency: 'INR (₹)',
      openingHours: '08:00 - 17:30',
      bestTimeToVisit: 'Midday (11:00 - 14:00)',
      accessibility: '🟢 Paved pathways with bridges across mountain streams.',
      isMustVisit: false,
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    },
  ],
  arunachal: [
    {
      id: 'aru-1',
      title: 'Tawang Monastery (Galden Namgey Lhatse)',
      description: 'The second largest Tibetan Buddhist monastery in the world, founded in 1680 AD at 10,000 ft altitude with an imposing 26-foot golden Buddha statue.',
      category: 'sightseeing',
      estimatedCost: 100,
      currency: 'INR (₹)',
      openingHours: '07:00 - 18:00',
      bestTimeToVisit: 'Morning prayer chants (08:00 - 11:00)',
      accessibility: '🟢 Step-free entrance into main assembly hall.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1626014303757-6466336e8494?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'aru-2',
      title: 'Sela Pass & Sela Lake (13,700 ft)',
      description: 'Spectacular high-mountain pass linking Tawang with Tezpur, adorned with prayer flags overlooking the crystal clear Sela Lake.',
      category: 'sightseeing',
      estimatedCost: 0,
      currency: 'INR (₹)',
      openingHours: '24/7 (Daylight travel recommended)',
      bestTimeToVisit: 'Morning (09:00 - 13:00)',
      accessibility: '⚠️ High altitude pass; vehicle viewpoint right by highway.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'aru-3',
      title: 'Ziro Valley & Apatani Heritage Trail',
      description: 'UNESCO World Heritage tentative valley famed for sustainable pine-bamboo paddy fields, distinct Apatani tribal culture, and musical festivals.',
      category: 'relaxation',
      estimatedCost: 200,
      currency: 'INR (₹)',
      openingHours: '08:00 - 18:00',
      bestTimeToVisit: 'Daytime village walk (10:00 - 15:30)',
      accessibility: '🟢 Gentle valley village paths and bamboo groves.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'aru-4',
      title: 'Madhuri (Sangetsar) Lake',
      description: 'Ethereal alpine lake cradled by snow peaks, created by an earthquake in 1973 with dead tree trunks still emerging from emerald waters.',
      category: 'sightseeing',
      estimatedCost: 300,
      currency: 'INR (₹)',
      openingHours: '07:30 - 15:30 (Army permit zone)',
      bestTimeToVisit: 'Morning (09:00 - 12:30)',
      accessibility: 'Paved wooden boardwalk along perimeter.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'aru-5',
      title: 'Nuranang (Jang) Falls',
      description: 'One of the most spectacular waterfalls in India dropping 100 meters down rugged granite cliffs into the Nuranang River.',
      category: 'sightseeing',
      estimatedCost: 50,
      currency: 'INR (₹)',
      openingHours: '08:00 - 17:00',
      bestTimeToVisit: 'Afternoon (13:00 - 16:00)',
      accessibility: 'Short walking path from road to viewing shelter.',
      isMustVisit: false,
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'aru-6',
      title: 'Namdapha National Park Rainforest Safari',
      description: 'Dense biodiverse rainforest sanctuary stretching across Myanmar borders, home to red pandas, snow leopards, and hornbills.',
      category: 'activity',
      estimatedCost: 450,
      currency: 'INR (₹)',
      openingHours: '06:00 - 16:30',
      bestTimeToVisit: 'Early morning guided wildlife trek',
      accessibility: '⚠️ Jungle trail; guided forest safari recommended.',
      isMustVisit: false,
      image: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=800&q=80',
    },
  ],
  darjeeling: [
    {
      id: 'darj-1',
      title: 'Tiger Hill Sunrise Viewpoint',
      description: 'World-renowned vantage point offering a majestic early morning sunrise over Mt. Kanchenjunga and Himalayan peaks.',
      category: 'sightseeing',
      estimatedCost: 100,
      currency: 'INR (₹)',
      openingHours: '04:00 - 08:00',
      bestTimeToVisit: 'Early morning (04:30 - 06:30)',
      accessibility: '⚠️ High-altitude cold mountain viewpoint; step access to observatory pavilion.',
      transitInfo: '🚗 ~40 mins uphill drive from town (Start by 4:15 AM to avoid sunrise convoy)',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'darj-2',
      title: 'Batasia Loop & Gorkha War Memorial',
      description: 'Spectacular spiral railway loop with manicured gardens offering 360-degree panoramic views of Darjeeling town and Kanchenjunga.',
      category: 'sightseeing',
      estimatedCost: 50,
      currency: 'INR (₹)',
      openingHours: '05:00 - 18:00',
      bestTimeToVisit: 'Morning after sunrise (07:30 - 09:30)',
      accessibility: '🟢 Gently sloping garden paths with panoramic benches.',
      transitInfo: '🚗 15 mins drive along Hill Cart Road on return from Tiger Hill',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'darj-3',
      title: 'Padmaja Naidu Himalayan Zoo & HMI',
      description: 'Acclaimed high-altitude zoological park dedicated to endangered snow leopards and red pandas, combined with the Himalayan Mountaineering Museum.',
      category: 'activity',
      estimatedCost: 120,
      currency: 'INR (₹)',
      openingHours: '08:30 - 16:30 (Closed Thursdays)',
      bestTimeToVisit: 'Morning to midday (10:00 - 13:00)',
      accessibility: '🟢 Paved uphill walking paths; buggies available for seniors.',
      transitInfo: '🚗 10 mins taxi or 20 mins pleasant walk from Chowrasta Mall',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'darj-4',
      title: 'Glenary’s Bakery, Cafe & Mall Road Stroll',
      description: 'Iconic 100-year-old colonial bakery and rooftop restaurant famed for English breakfasts, pastries, and sunset views over Chowrasta.',
      category: 'food',
      estimatedCost: 350,
      currency: 'INR (₹)',
      openingHours: '07:00 - 21:00',
      bestTimeToVisit: 'Breakfast (08:30) or High Tea (16:30 - 18:30)',
      accessibility: '🟢 Street-level bakery with comfortable indoor & terrace seating.',
      transitInfo: '🚶 2-5 mins walk right in the heart of pedestrian Mall Road',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'darj-5',
      title: 'Happy Valley Tea Estate & Heritage Factory',
      description: 'One of Darjeeling’s oldest organic tea gardens (est. 1854), offering guided estate walks and aromatic tea tasting sessions.',
      category: 'sightseeing',
      estimatedCost: 150,
      currency: 'INR (₹)',
      openingHours: '09:00 - 16:30',
      bestTimeToVisit: 'Midday (11:30 - 14:00)',
      accessibility: 'Paved garden paths; factory tour has small staircases.',
      transitInfo: '🚗 12 mins drive down Lebong Cart Road',
      isMustVisit: false,
      image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'darj-6',
      title: 'Japanese Peace Pagoda & Buddhist Temple',
      description: 'Serene white stupa designed to unite people of all creeds in search of world peace, featuring vibrant avatars of Buddha and morning chanting.',
      category: 'relaxation',
      estimatedCost: 0,
      currency: 'INR (₹)',
      openingHours: '04:30 - 19:00',
      bestTimeToVisit: 'Late afternoon (15:30 - 17:00)',
      accessibility: '🟢 Step-free entrance ramp to temple grounds; steps to upper balcony.',
      transitInfo: '🚗 15 mins scenic drive from town center',
      isMustVisit: false,
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    },
  ],
};

/**
 * Dynamically creates recommendations for any worldwide destination
 */
function generateGenericRecommendations(city: City): AttractionRecommendation[] {
  const cName = city.name;
  const curr = city.currency?.split(' ')[0] || 'USD ($)';

  return [
    {
      id: `gen-${city.id}-1`,
      title: `${cName} Historic Old Quarter & Central Landmark`,
      description: `The cultural heartbeat of ${cName}, featuring signature architecture, public squares, monuments, and authentic local streets.`,
      category: 'sightseeing',
      estimatedCost: 0,
      currency: curr,
      openingHours: '24/7 (Shops 09:00 - 19:00)',
      bestTimeToVisit: 'Morning (09:00 - 11:30)',
      accessibility: '🟢 Pedestrian streets with street-level access.',
      isMustVisit: true,
      image: city.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: `gen-${city.id}-2`,
      title: `${cName} National Heritage Museum & Art Gallery`,
      description: `Premier exhibition celebrating the art, history, and vibrant traditions that shaped ${cName} and its region.`,
      category: 'activity',
      estimatedCost: 15,
      currency: curr,
      openingHours: '10:00 - 18:00 (Closed Mondays)',
      bestTimeToVisit: 'Early afternoon (13:00 - 15:30)',
      accessibility: '🟢 Step-free access, elevators, and audio guides available.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: `gen-${city.id}-3`,
      title: `Panoramic City Viewpoint & Scenic Promenade`,
      description: `Panoramic vantage point offering breathtaking skyline views, photo spots, and relaxing sunset strolls.`,
      category: 'sightseeing',
      estimatedCost: 10,
      currency: curr,
      openingHours: '08:00 - 21:00',
      bestTimeToVisit: 'Golden Hour / Sunset (17:30 - 19:00)',
      accessibility: '🟢 Scenic trail or elevator access to main viewing deck.',
      isMustVisit: true,
      image: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: `gen-${city.id}-4`,
      title: `${cName} Artisanal Food Market & Culinary Hub`,
      description: `Vibrant food market where local vendors prepare regional delicacies, fresh produce, and street food specialties.`,
      category: 'food',
      estimatedCost: 20,
      currency: curr,
      openingHours: '08:30 - 16:00',
      bestTimeToVisit: 'Lunchtime (12:00 - 14:00)',
      accessibility: '🟢 Level market floor with outdoor seating.',
      isMustVisit: false,
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: `gen-${city.id}-5`,
      title: `Botanical Gardens & Serene Waterway`,
      description: `Lush urban oasis perfect for a peaceful afternoon walk, featuring native flora, tranquil fountains, and cozy coffee spots.`,
      category: 'relaxation',
      estimatedCost: 5,
      currency: curr,
      openingHours: '08:00 - 19:00',
      bestTimeToVisit: 'Afternoon (14:30 - 16:30)',
      accessibility: '🟢 Paved pathways and resting benches throughout.',
      isMustVisit: false,
      image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
    },
  ];
}

function parseJsonSafely<T>(text: string): T | null {
  if (!text) return null;
  try {
    let clean = text.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }
    return JSON.parse(clean) as T;
  } catch {
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(text.slice(firstBracket, lastBracket + 1)) as T;
      } catch {
        // ignore
      }
    }
    return null;
  }
}

// Curated themed Unsplash images for arbitrary global attractions
const CATEGORY_IMAGES: Record<string, string[]> = {
  nature: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
  ],
  monument: [
    'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80',
  ],
  city: [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  ],
  temple: [
    'https://images.unsplash.com/photo-1626014303757-6466336e8494?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
  ],
};

function getScenicPhotoForAttraction(title: string, index: number, fallback?: string): string {
  const t = title.toLowerCase();
  if (/temple|monastery|church|cathedral|shrine|mosque|basilica/i.test(t)) {
    return CATEGORY_IMAGES.temple[index % CATEGORY_IMAGES.temple.length];
  }
  if (/lake|pass|mountain|peak|falls|waterfall|valley|river|park|garden|beach|forest/i.test(t)) {
    return CATEGORY_IMAGES.nature[index % CATEGORY_IMAGES.nature.length];
  }
  if (/palace|fort|castle|tower|monument|museum|memorial|square/i.test(t)) {
    return CATEGORY_IMAGES.monument[index % CATEGORY_IMAGES.monument.length];
  }
  return CATEGORY_IMAGES.city[index % CATEGORY_IMAGES.city.length] || fallback || CATEGORY_IMAGES.city[0];
}

/**
 * Free live Wikipedia search fallback for any destination worldwide without API keys
 */
async function fetchWikipediaAttractions(city: City): Promise<AttractionRecommendation[] | null> {
  try {
    const query = encodeURIComponent(`${city.name} tourist attractions`);
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&format=json&origin=*&srlimit=10`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.query?.search && Array.isArray(data.query.search) && data.query.search.length > 0) {
      const curr = city.currency?.split(' ')[0] || 'USD';
      const isINR = curr.includes('INR');
      const isJPY = curr.includes('JPY') || curr.includes('KRW');
      const baseCost = isINR ? 150 : isJPY ? 1000 : 15;

      // Filter out meta or list articles
      const filtered = data.query.search.filter((item: { title: string }) => {
        const t = item.title.toLowerCase();
        return !t.startsWith('list of') &&
               !t.startsWith('demographics of') &&
               !t.startsWith('geography of') &&
               !t.startsWith('history of') &&
               !t.startsWith('timeline of') &&
               !t.startsWith('transport in') &&
               !t.includes('constituency') &&
               !t.includes('election');
      });

      if (filtered.length >= 2) {
        return filtered.slice(0, 6).map((item: { title: string; snippet: string }, idx: number) => {
          const cleanSnippet = item.snippet.replace(/<[^>]*>?/gm, '');
          const isNature = /lake|pass|mountain|falls|park|garden/i.test(item.title);
          const isTemple = /monastery|temple|shrine|church/i.test(item.title);

          return {
            id: `wiki-${city.id}-${idx}`,
            title: item.title,
            description: cleanSnippet || `Famous landmark and visitor attraction in ${city.name}.`,
            category: isNature ? 'relaxation' : isTemple ? 'sightseeing' : idx % 2 === 0 ? 'sightseeing' : 'activity',
            estimatedCost: idx === 0 ? 0 : Math.round(baseCost * (idx * 0.75 + 1)),
            currency: curr,
            openingHours: isNature ? '24/7 (Daylight recommended)' : isTemple ? '07:00 - 18:00' : '09:30 - 18:00',
            bestTimeToVisit: idx % 2 === 0 ? 'Morning (09:00 - 11:30)' : 'Afternoon (14:00 - 16:30)',
            accessibility: '🟢 Accessible visitor attraction with local transport and walking paths.',
            isMustVisit: idx < 3,
            image: getScenicPhotoForAttraction(item.title, idx, city.image),
          };
        });
      }
    }
  } catch (err) {
    console.warn('Wikipedia fallback lookup failed:', err);
  }
  return null;
}

/**
 * Fetches tourist attractions recommendations, optionally using Gemini API if key is available
 */
export async function getTouristAttractions(city: City): Promise<AttractionRecommendation[]> {
  const apiKey = getStoredGeminiApiKey();
  const cityKey = city.name.toLowerCase().trim();

  // If Gemini API Key is available, call Gemini Flash API
  if (apiKey) {
    try {
      const prompt = `You are a world-class travel expert. Return a JSON array of the top 6 famous tourist attractions and must-visit places for "${city.name}, ${city.country}".
For each attraction return this JSON structure:
[
  {
    "id": "unique-slug",
    "title": "Attraction Name",
    "description": "Short engaging 2-sentence description",
    "category": "sightseeing" | "activity" | "food" | "relaxation",
    "estimatedCost": number (in local currency/USD integer),
    "currency": "${city.currency?.split(' ')[0] || 'USD'}",
    "openingHours": "e.g. 09:00 - 18:00",
    "bestTimeToVisit": "e.g. Morning 09:30 - 11:30",
    "accessibility": "e.g. Wheelchair accessible, ramps available, advance booking required",
    "isMustVisit": true or false (true for top 3 must-visits)
  }
]
Output ONLY raw JSON, with no markdown fences, no formatting backticks.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = parseJsonSafely<AttractionRecommendation[]>(text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((item, idx) => ({
              ...item,
              id: `gemini-attract-${idx}-${Date.now()}`,
              image: FAMOUS_DESTINATIONS_DATA[cityKey]?.[idx]?.image || city.image,
            }));
          }
        }
      }
    } catch (e) {
      console.warn('Gemini API call failed, using built-in knowledge base:', e);
    }
  }

  // 1. Fallback to curated presets (Tokyo, Paris, Rome, Sikkim, Arunachal, etc.)
  const matchedKey = Object.keys(FAMOUS_DESTINATIONS_DATA).find(
    k => cityKey.includes(k) || k.includes(cityKey) || (city.country && city.country.toLowerCase().includes(k))
  );
  if (matchedKey && FAMOUS_DESTINATIONS_DATA[matchedKey]) {
    return FAMOUS_DESTINATIONS_DATA[matchedKey];
  }

  // 2. Query free live Wikipedia search for real local landmarks anywhere on Earth
  const wikiResults = await fetchWikipediaAttractions(city);
  if (wikiResults && wikiResults.length > 0) {
    return wikiResults;
  }

  // 3. Resilient contextual generator
  return generateGenericRecommendations(city);
}

/**
 * Generates tailored ready-made tour plans matching the user's tour duration
 */
export async function getReadyMadeTourPlans(
  city: City,
  durationDays: number = 3,
  weather: WeatherData | null = null
): Promise<ReadyMadeTourPlan[]> {
  const attractions = await getTouristAttractions(city);
  const days = Math.max(1, Math.min(14, durationDays));

  const curr = city.currency?.split(' ')[0] || 'USD';
  const isINR = curr.includes('INR');
  const isJPY = curr.includes('JPY') || curr.includes('KRW');
  const lunchCost = isINR ? 300 : isJPY ? 1200 : 25;
  const dinnerCost = isINR ? 600 : isJPY ? 2500 : 40;
  const museumCost = isINR ? 150 : isJPY ? 1000 : 18;
  const artisanCost = isINR ? 250 : isJPY ? 1500 : 20;

  // Plan 1: "Iconic Highlights & Must-Visits"
  const plan1Items: ItineraryItem[] = [];
  for (let day = 1; day <= days; day++) {
    const dayWeather = weather?.daily?.[day - 1];
    const rainProb = dayWeather?.precipitationProb || 0;

    // Morning spot (from attractions or curated)
    const morningAttraction = attractions[(day - 1) * 2 % attractions.length];
    const morningTime = '09:30';
    const morningAccess = evaluateSpotAccessibility(morningAttraction.title, morningTime, morningAttraction.openingHours, rainProb);
    plan1Items.push({
      id: `p1-d${day}-1`,
      dayIndex: day,
      time: morningTime,
      title: morningAttraction.title,
      location: `${morningAttraction.title}, ${city.name}`,
      category: morningAttraction.category,
      cost: morningAttraction.estimatedCost,
      notes: `Must-visit: ${morningAttraction.description}`,
      completed: false,
      openingHours: morningAttraction.openingHours,
      accessibilityStatus: morningAccess.status,
      accessibilityNote: morningAccess.note,
      isMustVisit: true,
    });

    // Lunch spot
    plan1Items.push({
      id: `p1-d${day}-2`,
      dayIndex: day,
      time: '13:00',
      title: `Traditional ${city.name} Culinary Lunch`,
      location: `Local Bistro & Market Quarter`,
      category: 'food',
      cost: lunchCost,
      notes: 'Sample authentic regional specialties and seasonal dishes.',
      completed: false,
      openingHours: '11:30 - 15:00',
      accessibilityStatus: 'open',
      accessibilityNote: '🟢 Open dining service.',
      isMustVisit: false,
    });

    // Afternoon spot
    const afternoonAttraction = attractions[((day - 1) * 2 + 1) % attractions.length];
    const afternoonTime = '15:30';
    const afternoonAccess = evaluateSpotAccessibility(afternoonAttraction.title, afternoonTime, afternoonAttraction.openingHours, rainProb);
    plan1Items.push({
      id: `p1-d${day}-3`,
      dayIndex: day,
      time: afternoonTime,
      title: afternoonAttraction.title,
      location: `${afternoonAttraction.title}, ${city.name}`,
      category: afternoonAttraction.category,
      cost: afternoonAttraction.estimatedCost,
      notes: afternoonAttraction.description,
      completed: false,
      openingHours: afternoonAttraction.openingHours,
      accessibilityStatus: afternoonAccess.status,
      accessibilityNote: afternoonAccess.note,
      isMustVisit: afternoonAttraction.isMustVisit,
    });
  }

  const plan1TotalCost = plan1Items.reduce((acc, curr) => acc + curr.cost, 0);

  // Plan 2: "Cultural Heritage & Arts Discovery"
  const plan2Items: ItineraryItem[] = [];
  for (let day = 1; day <= days; day++) {
    plan2Items.push({
      id: `p2-d${day}-1`,
      dayIndex: day,
      time: '10:00',
      title: `${city.name} Historic Architecture & Museum Walk`,
      location: `Cultural Heritage District`,
      category: 'activity',
      cost: museumCost,
      notes: 'Explore masterworks, heritage exhibits, and historic courtyards.',
      completed: false,
      openingHours: '09:30 - 18:00',
      accessibilityStatus: 'open',
      accessibilityNote: '🟢 Step-free museum entry with elevator access.',
      isMustVisit: true,
    });

    plan2Items.push({
      id: `p2-d${day}-2`,
      dayIndex: day,
      time: '14:00',
      title: `Artisan Workshops & Historic Cafe Stroll`,
      location: `Old Town Arcade`,
      category: 'shopping',
      cost: artisanCost,
      notes: 'Discover local craftsmanship, boutique crafts, and freshly roasted coffee.',
      completed: false,
      openingHours: '10:00 - 19:00',
      accessibilityStatus: 'open',
      accessibilityNote: '🟢 Street-level boutique stores.',
      isMustVisit: false,
    });

    plan2Items.push({
      id: `p2-d${day}-3`,
      dayIndex: day,
      time: '18:30',
      title: `Atmospheric Evening Walk & Local Gastronomy`,
      location: `Historic Riverfront / Plaza`,
      category: 'food',
      cost: dinnerCost,
      notes: 'Enjoy candlelit dining with local wines and regional delicacies.',
      completed: false,
      openingHours: '18:00 - 23:00',
      accessibilityStatus: 'open',
      accessibilityNote: '🟢 Evening dining service available.',
      isMustVisit: false,
    });
  }
  const plan2TotalCost = plan2Items.reduce((acc, curr) => acc + curr.cost, 0);

  return [
    {
      id: 'tour-plan-iconic',
      name: `${days}-Day Iconic Highlights Tour`,
      theme: 'Fast-Paced & Famous Sights',
      description: `Carefully optimized to cover ${city.name}'s top must-visit attractions, panoramic viewpoints, and signature dining over ${days} full days without feeling rushed.`,
      durationDays: days,
      estimatedTotalCost: plan1TotalCost,
      highlights: [
        `All top ${city.name} must-visit landmarks`,
        'Pre-timed for optimal crowd avoidance',
        'Balanced sight-to-dining schedule',
      ],
      items: plan1Items,
    },
    {
      id: 'tour-plan-culture',
      name: `${days}-Day Cultural & Heritage Explorer`,
      theme: 'Arts, Architecture & Local Flavor',
      description: `Immerse in the rich stories, art galleries, historic quarters, and culinary heritage of ${city.name} with relaxed transitions and accessible routes.`,
      durationDays: days,
      estimatedTotalCost: plan2TotalCost,
      highlights: [
        'Curated museums and artisan workshops',
        'Authentic neighborhood strolls & cafes',
        'Weather-resilient and accessible itinerary',
      ],
      items: plan2Items,
    },
  ];
}

/**
 * Provides real-time Gemini suggestions while the user manually plans a specific day
 */
export async function getGeminiItinerarySuggestions(
  city: City,
  dayIndex: number,
  currentItems: ItineraryItem[],
  weather: WeatherData | null
): Promise<GeminiSuggestion[]> {
  const apiKey = getStoredGeminiApiKey();
  const dayItems = currentItems.filter(i => i.dayIndex === dayIndex);
  const dayWeather = weather?.daily?.[dayIndex - 1];
  const rainProb = dayWeather?.precipitationProb || 0;
  const isRainy = rainProb > 40;

  // If Gemini API Key exists, try live dynamic generation
  if (apiKey) {
    try {
      const scheduledSpots = dayItems.map(i => `${i.time}: ${i.title} (${i.category})`).join(', ');
      const prompt = `You are a smart travel concierge. A traveler is planning Day ${dayIndex} in ${city.name}, ${city.country}.
Their currently scheduled activities for this day: [${scheduledSpots || 'Nothing scheduled yet'}].
Weather forecast: ${dayWeather?.weatherDescription || 'Mild'}, Rain chance: ${rainProb}%, Temp: ${dayWeather?.maxTemp || 22}°C.
Suggest 3 complementary spots/activities to add to their day (e.g. food spots near existing locations, must-visit sights, or evening spots).
Output a JSON array of 3 objects with this exact structure:
[
  {
    "id": "sug-1",
    "title": "Spot Name",
    "reason": "Why this fits their day perfectly (1 sentence)",
    "category": "sightseeing" | "food" | "activity" | "relaxation",
    "suggestedTime": "14:00",
    "estimatedCost": 20,
    "openingHours": "09:00 - 18:00",
    "accessibility": "Open & accessible; wheelchair ramps available",
    "isMustVisit": true or false
  }
]
No markdown wrapping, just plain JSON.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = parseJsonSafely<GeminiSuggestion[]>(text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Gemini dynamic suggestion call failed:', e);
    }
  }

  // Curated Contextual Suggestions Fallback
  const suggestions: GeminiSuggestion[] = [];
  const attractions = await getTouristAttractions(city);
  const scheduledTitles = dayItems.map(i => i.title.toLowerCase());

  // Check if any must-visit attraction is not yet scheduled
  const unvisitedMustVisit = attractions.find(a => a.isMustVisit && !scheduledTitles.some(t => t.includes(a.title.toLowerCase())));
  if (unvisitedMustVisit) {
    suggestions.push({
      id: `sug-mustvisit-${unvisitedMustVisit.id}`,
      title: unvisitedMustVisit.title,
      reason: `🌟 Must-Visit Highlight: Top rated landmark in ${city.name} that shouldn't be missed.`,
      category: unvisitedMustVisit.category,
      suggestedTime: '10:30',
      estimatedCost: unvisitedMustVisit.estimatedCost,
      openingHours: unvisitedMustVisit.openingHours,
      accessibility: unvisitedMustVisit.accessibility,
      isMustVisit: true,
    });
  }

  // Suggest dining if no food activity is present for this day
  const hasFood = dayItems.some(i => i.category === 'food');
  if (!hasFood) {
    suggestions.push({
      id: `sug-dining-${dayIndex}`,
      title: `Artisanal Lunch & Specialty Treats`,
      reason: `🍽️ Fuel your exploration with authentic ${city.name} dishes at a highly rated local tavern.`,
      category: 'food',
      suggestedTime: '13:00',
      estimatedCost: 25,
      openingHours: '11:30 - 15:30',
      accessibility: '🟢 Step-free entrance, outdoor terrace dining available.',
      isMustVisit: false,
    });
  }

  // Weather-specific suggestion
  if (isRainy) {
    suggestions.push({
      id: `sug-rain-${dayIndex}`,
      title: `${city.name} Indoor Art Gallery or Historic Covered Market`,
      reason: `🌧️ Rain forecasted (${rainProb}%): Perfect covered indoor activity keeping you comfortable and dry.`,
      category: 'activity',
      suggestedTime: '15:30',
      estimatedCost: 15,
      openingHours: '10:00 - 18:30',
      accessibility: '🟢 Fully sheltered indoor venue with modern facilities.',
      isMustVisit: false,
    });
  } else {
    // Evening / Golden hour viewpoint
    suggestions.push({
      id: `sug-sunset-${dayIndex}`,
      title: `Golden Hour Scenic Panorama & Twilight Stroll`,
      reason: `🌅 Clear conditions: Spectacular evening lighting across ${city.name}’s skyline and monuments.`,
      category: 'sightseeing',
      suggestedTime: '18:00',
      estimatedCost: 10,
      openingHours: '08:00 - 21:00',
      accessibility: '🟢 Accessible viewpoint deck with panoramic photo spots.',
      isMustVisit: false,
    });
  }

  return suggestions;
}

/**
 * Estimates transit duration, mode, and traffic conditions between locations
 */
export function estimateTransitInfo(fromLocation: string, toLocation: string): string {
  const result = estimateTransitBetweenSpots(fromLocation, toLocation);
  return result.trafficAdvice;
}

/**
 * AI-powered custom tour planner tailored to origin, duration, budget, number of heads, and age group.
 */
export async function generateAITourPlanForGroup(
  city: City,
  origin: string,
  startDate: string,
  endDate: string,
  durationDays: number,
  budget: number,
  numberOfHeads: number,
  ageGroup: string,
  travelStyle: string,
  weather: WeatherData | null,
  familyMembers?: FamilyMember[]
): Promise<{ items: ItineraryItem[]; estimatedCost: number; summary: string }> {
  const apiKey = getStoredGeminiApiKey();
  const days = Math.max(1, Math.min(14, durationDays));
  const curr = city.currency?.split(' ')[0] || 'INR (₹)';
  const isINR = curr.includes('INR');

  const membersDesc = familyMembers && familyMembers.length > 0
    ? familyMembers.map(m => `${m.type.toUpperCase()} (Age: ${m.age})`).join(', ')
    : ageGroup;

  // If Gemini API key is available, generate live tailored plan
  if (apiKey) {
    try {
      const prompt = `You are a world-class travel planner. Design an unforgettable, personalized ${days}-day itinerary.
Origin (starting from): "${origin}"
Destination: "${city.name}, ${city.country}"
Dates: ${startDate} to ${endDate} (${days} days)
Total Group Size: ${numberOfHeads} traveler(s)
Family Members & Specific Ages: "${membersDesc}"
Overall Composition: "${ageGroup}"
Travel Style: "${travelStyle}"
Total Group Budget: ${budget} ${curr}

STRICT TAILORING RULES:
- If there are children (under 18): carefully accommodate their exact ages. For toddlers (<5) prioritize stroller-friendly gardens, easy walks, and earlier rest; for older kids (6-17), include exciting interactive spots, cable cars, zoos, and viewpoints.
- If there are seniors (65+): strictly ensure step-free access, gentle walking pace, elevator/vehicle accessibility, and avoid strenuous climbs or high-altitude overexertion.
- If young adults: include sunrise viewpoints, vibrant markets, and active photography spots.
- Include Day 1 arrival from "${origin}" & hotel check-in.
- For each day, include 3-4 realistic activities (morning, lunch, afternoon, evening).
- Include realistic transitInfo (driving/walking time and traffic advice between stops).

Return a JSON object with this exact format:
{
  "summary": "2-sentence inspiring overview of this custom trip tailored to the group",
  "items": [
    {
      "id": "act-1",
      "dayIndex": 1,
      "time": "10:00",
      "title": "Spot Title",
      "location": "Location Name",
      "category": "sightseeing",
      "cost": 500,
      "notes": "Personalized advice/recommendation for this group",
      "openingHours": "09:00 - 18:00",
      "bestTimeToVisit": "Morning 09:30 - 11:30",
      "transitInfo": "🚗 25 mins drive from hotel (Light traffic)",
      "accessibilityStatus": "open",
      "accessibilityNote": "Step-free accessible",
      "isMustVisit": true
    }
  ]
}
Output ONLY raw JSON without markdown wrapping.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = parseJsonSafely<{ summary: string; items: ItineraryItem[] }>(text);
          if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
            const total = parsed.items.reduce((s, it) => s + (Number(it.cost) || 0), 0);
            return {
              summary: parsed.summary || `Personalized ${days}-day tour for ${numberOfHeads} travelers (${ageGroup}) from ${origin} to ${city.name}.`,
              items: parsed.items.map((it, idx) => ({
                ...it,
                id: `ai-item-${idx}-${Date.now()}`,
                completed: false,
              })),
              estimatedCost: total,
            };
          }
        }
      }
    } catch (e) {
      console.warn('Gemini group plan generation failed, using intelligent built-in generator:', e);
    }
  }

  // Built-in intelligent generator tailored to group and destination
  const attractions = await getTouristAttractions(city);
  const items: ItineraryItem[] = [];
  const isDarjeeling = city.name.toLowerCase().includes('darjeeling');
  const isKids = ageGroup.toLowerCase().includes('kid') || ageGroup.toLowerCase().includes('child');
  const isSeniors = ageGroup.toLowerCase().includes('senior') || ageGroup.toLowerCase().includes('60');

  // Day 1: Arrival, Check-in & Orientation
  items.push({
    id: `plan-d1-1`,
    dayIndex: 1,
    time: '11:30',
    title: `Arrive from ${origin || 'Home'} & Check in at Hotel`,
    location: `${city.name} Central Hotel`,
    category: 'lodging',
    cost: 0,
    notes: `Arrive in ${city.name}, settle into your rooms, unpack and freshen up after the journey from ${origin}.`,
    completed: false,
    openingHours: '24/7 Check-in',
    bestTimeToVisit: 'Midday (11:30 - 13:00)',
    transitInfo: `🚗 Transit from airport/railhead to hotel (~1.5 - 2.5 hrs mountain drive)`,
    accessibilityStatus: 'open',
    accessibilityNote: '🟢 Hotel check-in and luggage assistance available.',
    isMustVisit: false,
  });

  items.push({
    id: `plan-d1-2`,
    dayIndex: 1,
    time: '13:30',
    title: `Traditional ${city.name} Welcome Lunch`,
    location: `Local Specialty Bistro`,
    category: 'food',
    cost: isINR ? 400 * numberOfHeads : 25 * numberOfHeads,
    notes: `Savor authentic regional flavors and warm beverages suited to ${city.name}'s climate.`,
    completed: false,
    openingHours: '12:00 - 15:30',
    bestTimeToVisit: 'Lunchtime (13:00 - 14:30)',
    transitInfo: '🚶 5 mins walk from hotel',
    accessibilityStatus: 'open',
    accessibilityNote: '🟢 Relaxed indoor dining.',
    isMustVisit: false,
  });

  items.push({
    id: `plan-d1-3`,
    dayIndex: 1,
    time: '16:00',
    title: isDarjeeling ? `Stroll along Mall Road (Chowrasta) & Glenary's` : `Orientation Walk around ${city.name} Promenade`,
    location: isDarjeeling ? 'Chowrasta Mall Road' : `${city.name} Town Center`,
    category: 'relaxation',
    cost: isINR ? 250 * numberOfHeads : 15 * numberOfHeads,
    notes: isDarjeeling
      ? 'Acclimatize with a peaceful walk on vehicle-free Mall Road, enjoy sunset views over the valley and warm pastries at Glenary’s.'
      : `Gentle afternoon walk to get oriented with ${city.name}'s atmosphere and local craft shops.`,
    completed: false,
    openingHours: '24/7 (Shops 10:00 - 20:00)',
    bestTimeToVisit: 'Late afternoon / Sunset (16:00 - 18:30)',
    transitInfo: '🚶 Pedestrian zone; step-free paved pathways',
    accessibilityStatus: 'open',
    accessibilityNote: '🟢 Step-free pedestrian promenade.',
    isMustVisit: true,
  });

  // Day 2+: Tailored activities based on age group & destination
  for (let d = 2; d <= days; d++) {
    const dayWeather = weather?.daily?.[d - 1];
    const rainProb = dayWeather?.precipitationProb || 0;

    if (d === 2 && isDarjeeling) {
      // Iconic Tiger Hill Sunrise day
      items.push({
        id: `plan-d2-1`,
        dayIndex: 2,
        time: '04:30',
        title: 'Tiger Hill Sunrise & Kanchenjunga Panorama',
        location: 'Tiger Hill Observatory',
        category: 'sightseeing',
        cost: 100 * numberOfHeads,
        notes: isSeniors
          ? 'Dress in very warm thermal layers. Pre-book observatory top lounge for indoor glass viewing and seating.'
          : 'Witness the unforgettable first golden rays on Mt. Kanchenjunga and Everest peaks. Arrive by 4:30 AM to beat peak convoy.',
        completed: false,
        openingHours: '04:00 - 08:00',
        bestTimeToVisit: 'Sunrise (04:30 - 06:15)',
        transitInfo: '🚗 ~40 mins mountain drive from hotel (Leave hotel at 4:15 AM sharp)',
        accessibilityStatus: 'open',
        accessibilityNote: isSeniors ? '⚠️ Enclosed viewing gallery has steps; warm heater rooms available.' : '🟢 Open viewing deck.',
        isMustVisit: true,
      });

      items.push({
        id: `plan-d2-2`,
        dayIndex: 2,
        time: '07:30',
        title: 'Batasia Loop & War Memorial',
        location: 'Batasia Loop, Hill Cart Rd',
        category: 'sightseeing',
        cost: 50 * numberOfHeads,
        notes: 'Marvel at the engineering marvel of the Toy Train spiral loop with 360-degree landscaped gardens.',
        completed: false,
        openingHours: '05:00 - 18:00',
        bestTimeToVisit: 'Morning after Tiger Hill (07:30 - 09:00)',
        transitInfo: '🚗 15 mins drive along Hill Cart Road on way back to town',
        accessibilityStatus: 'open',
        accessibilityNote: '🟢 Gently paved spiral walkways.',
        isMustVisit: true,
      });

      items.push({
        id: `plan-d2-3`,
        dayIndex: 2,
        time: '09:00',
        title: 'Return to Hotel for Hearty Breakfast & Rest',
        location: 'Hotel Dining Hall',
        category: 'food',
        cost: 0,
        notes: 'Relax and recharge after the early sunrise start. Enjoy seasonal hot breakfast.',
        completed: false,
        openingHours: '07:00 - 11:00',
        bestTimeToVisit: 'Morning (09:00 - 10:30)',
        transitInfo: '🚗 10 mins return drive to hotel',
        accessibilityStatus: 'open',
        accessibilityNote: '🟢 Hotel rest and relaxation.',
        isMustVisit: false,
      });

      items.push({
        id: `plan-d2-4`,
        dayIndex: 2,
        time: '12:00',
        title: isKids ? 'Padmaja Naidu Himalayan Zoo (Red Pandas) & HMI' : 'Himalayan Mountaineering Institute & Zoo',
        location: 'Jawahar Parbat',
        category: 'activity',
        cost: 120 * numberOfHeads,
        notes: isKids
          ? 'Kids will adore the endangered red pandas, snow leopards, and Tibetan wolves in natural high-altitude enclosures!'
          : 'Fascinating mountaineering museum showcasing Everest expedition gear and Himalayan wildlife conservation.',
        completed: false,
        openingHours: '08:30 - 16:30',
        bestTimeToVisit: 'Midday (11:30 - 14:30)',
        transitInfo: '🚗 10 mins taxi / 20 mins walk from Chowrasta',
        accessibilityStatus: 'open',
        accessibilityNote: '🟢 Paved uphill park roads; golf buggies available on request for seniors.',
        isMustVisit: true,
      });

      items.push({
        id: `plan-d2-5`,
        dayIndex: 2,
        time: '18:00',
        title: 'Tea Tasting & Candlelit Dinner at Glenary’s',
        location: 'Glenary’s Restaurant & Pub',
        category: 'food',
        cost: isINR ? 550 * numberOfHeads : 30 * numberOfHeads,
        notes: 'Sample world-renowned Darjeeling First Flush tea, followed by live music and European/Continental dinner.',
        completed: false,
        openingHours: '12:00 - 22:00',
        bestTimeToVisit: 'Evening (18:30 - 21:00)',
        transitInfo: '🚶 5 mins walk in Mall area',
        accessibilityStatus: 'open',
        accessibilityNote: '🟢 Level entrance on Mall Road.',
        isMustVisit: false,
      });
    } else {
      // General tailored day for any destination
      const morningSpot = attractions[(d * 2 - 3) % attractions.length];
      const afternoonSpot = attractions[(d * 2 - 2) % attractions.length];

      items.push({
        id: `plan-d${d}-1`,
        dayIndex: d,
        time: '09:30',
        title: morningSpot.title,
        location: `${morningSpot.title}, ${city.name}`,
        category: morningSpot.category,
        cost: morningSpot.estimatedCost * numberOfHeads,
        notes: isSeniors
          ? `Paced comfortably for seniors: ${morningSpot.description}`
          : isKids
          ? `Great family-friendly visit: ${morningSpot.description}`
          : morningSpot.description,
        completed: false,
        openingHours: morningSpot.openingHours,
        bestTimeToVisit: morningSpot.bestTimeToVisit,
        transitInfo: estimateTransitInfo('Hotel', morningSpot.title),
        accessibilityStatus: evaluateSpotAccessibility(morningSpot.title, '09:30', morningSpot.openingHours, rainProb).status,
        accessibilityNote: morningSpot.accessibility,
        isMustVisit: morningSpot.isMustVisit,
      });

      items.push({
        id: `plan-d${d}-2`,
        dayIndex: d,
        time: '13:00',
        title: `Authentic ${city.name} Regional Lunch`,
        location: `Local Dining Quarter`,
        category: 'food',
        cost: isINR ? 350 * numberOfHeads : 22 * numberOfHeads,
        notes: `Relaxed lunchtime suited to the ${ageGroup} group, tasting signature local dishes.`,
        completed: false,
        openingHours: '11:30 - 15:30',
        bestTimeToVisit: '13:00 - 14:15',
        transitInfo: '🚶 5-10 mins walk from morning attraction',
        accessibilityStatus: 'open',
        accessibilityNote: '🟢 Accessible dining with outdoor and indoor seating.',
        isMustVisit: false,
      });

      items.push({
        id: `plan-d${d}-3`,
        dayIndex: d,
        time: '15:30',
        title: afternoonSpot.title,
        location: `${afternoonSpot.title}, ${city.name}`,
        category: afternoonSpot.category,
        cost: afternoonSpot.estimatedCost * numberOfHeads,
        notes: afternoonSpot.description,
        completed: false,
        openingHours: afternoonSpot.openingHours,
        bestTimeToVisit: afternoonSpot.bestTimeToVisit,
        transitInfo: estimateTransitInfo(morningSpot.title, afternoonSpot.title),
        accessibilityStatus: evaluateSpotAccessibility(afternoonSpot.title, '15:30', afternoonSpot.openingHours, rainProb).status,
        accessibilityNote: afternoonSpot.accessibility,
        isMustVisit: afternoonSpot.isMustVisit,
      });

      items.push({
        id: `plan-d${d}-4`,
        dayIndex: d,
        time: '19:00',
        title: `Evening Stroll & Gastronomy Experience`,
        location: `${city.name} Historic Quarter`,
        category: 'food',
        cost: isINR ? 500 * numberOfHeads : 30 * numberOfHeads,
        notes: 'Unwind with an evening meal and peaceful night views before heading back to the hotel.',
        completed: false,
        openingHours: '18:00 - 22:30',
        bestTimeToVisit: 'Evening (19:00 - 21:00)',
        transitInfo: '🚗 10 mins return drive to hotel',
        accessibilityStatus: 'open',
        accessibilityNote: '🟢 Evening dining service available.',
        isMustVisit: false,
      });
    }
  }

  const totalCost = items.reduce((sum, item) => sum + item.cost, 0);

  return {
    summary: `Tailored ${days}-day itinerary from ${origin || 'origin'} to ${city.name} specially designed for ${numberOfHeads} traveler(s) (${ageGroup}) focusing on ${travelStyle}.`,
    items,
    estimatedCost: totalCost,
  };
}

/**
 * Refines an existing AI Tour Plan based on user instructions/requests
 * e.g., "Make it more relaxed", "Add sunset spot", "More food & bakery", "Budget friendly"
 */
export async function refineAITourPlan(
  city: City,
  currentItems: ItineraryItem[],
  instruction: string,
  groupProfile?: TravelerGroupProfile
): Promise<{ items: ItineraryItem[]; summary: string }> {
  const apiKey = getStoredGeminiApiKey();
  const lowerInstr = (instruction || '').toLowerCase();

  // Try live Gemini API first if key available
  if (apiKey) {
    try {
      const prompt = `You are a world-class travel planner. Refine this existing itinerary for ${city.name}, ${city.country}.
User request for changes: "${instruction}"
Traveler group profile: ${groupProfile?.numberOfHeads || 2} traveler(s), ${groupProfile?.ageGroup || 'General'}.

Current Itinerary Items:
${JSON.stringify(currentItems.map(it => ({
  dayIndex: it.dayIndex,
  time: it.time,
  title: it.title,
  category: it.category,
  cost: it.cost,
  notes: it.notes,
  transitInfo: it.transitInfo
})))}

Update the itinerary items to satisfy the user's request. Adjust times, activities, notes, and transit info accordingly.
Return a JSON object:
{
  "summary": "1-2 sentence description of what was updated according to user request",
  "items": [
    ...updated array of ItineraryItem objects preserving existing format
  ]
}
Return raw JSON only.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = parseJsonSafely<{ summary: string; items: ItineraryItem[] }>(text);
          if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
            return {
              summary: parsed.summary || `Updated itinerary based on: "${instruction}"`,
              items: parsed.items.map((it, idx) => ({
                ...it,
                id: it.id || `refined-item-${idx}-${Date.now()}`,
                completed: false
              }))
            };
          }
        }
      }
    } catch (e) {
      console.warn('Live Gemini refinement failed, applying smart deterministic updates:', e);
    }
  }

  // Intelligent fallback refinement logic
  let updatedItems = currentItems.map(item => ({ ...item }));
  let summary = `Updated itinerary based on your request: "${instruction}".`;

  if (lowerInstr.includes('relax') || lowerInstr.includes('slow') || lowerInstr.includes('pace') || lowerInstr.includes('chill')) {
    // Space out times and add relaxation notes
    updatedItems = updatedItems.map((item) => {
      let time = item.time;
      if (item.time === '09:00' || item.time === '09:30') time = '10:30';
      if (item.time === '14:00') time = '15:00';
      return {
        ...item,
        time,
        notes: item.notes ? `${item.notes} (Relaxed pace with extra leisure time)` : 'Leisurely pace with valley views.'
      };
    });
    summary = 'Refined for a more relaxed pace with later starts, gentle transitions, and leisurely pauses.';
  } else if (lowerInstr.includes('cafe') || lowerInstr.includes('tea') || lowerInstr.includes('food') || lowerInstr.includes('bakery')) {
    // Add iconic cafe/tea stop
    const hasFoodOnDay1 = updatedItems.find(i => i.dayIndex === 1 && (i.title.toLowerCase().includes('tea') || i.title.toLowerCase().includes('cafe')));
    if (!hasFoodOnDay1) {
      const isDarjeeling = city.name.toLowerCase().includes('darjeeling');
      const spotTitle = isDarjeeling ? "Glenary's Bakery & Heritage Tea Tasting" : `${city.name} Artisan Tea & Coffee Lounge`;
      updatedItems.push({
        id: `refined-tea-${Date.now()}`,
        dayIndex: 1,
        time: '16:30',
        title: spotTitle,
        location: `${city.name} Promenade`,
        category: 'food',
        cost: 250 * (groupProfile?.numberOfHeads || 2),
        notes: 'Sip authentic local tea and enjoy freshly baked pastries overlooking the mountains.',
        completed: false,
        openingHours: '09:00 - 21:00',
        bestTimeToVisit: 'Afternoon tea (16:00 - 18:00)',
        transitInfo: '🚶 5 mins walk from town center',
        accessibilityStatus: 'open',
        accessibilityNote: '🟢 Step-free indoor seating.',
        isMustVisit: true
      });
    }
    summary = 'Added specialty local cafe and artisan tea tasting stops to the notes.';
  } else if (lowerInstr.includes('budget') || lowerInstr.includes('cheap') || lowerInstr.includes('save') || lowerInstr.includes('economical')) {
    updatedItems = updatedItems.map(item => ({
      ...item,
      cost: Math.round(item.cost * 0.5),
      notes: `${item.notes || ''} [Budget tip: Avail shared taxis or free scenic viewpoints.]`
    }));
    summary = 'Optimized notes for budget efficiency, reducing paid entries by ~50% and prioritizing scenic public walks.';
  } else if (lowerInstr.includes('kid') || lowerInstr.includes('child') || lowerInstr.includes('senior') || lowerInstr.includes('elder') || lowerInstr.includes('walk')) {
    updatedItems = updatedItems.map(item => ({
      ...item,
      accessibilityStatus: 'open',
      accessibilityNote: '🟢 Step-free path, wheelchair & stroller accessible with frequent benches.',
      notes: `${item.notes || ''} (Paved route, minimal uphill walking for comfort.)`
    }));
    summary = 'Refined notes for maximum accessibility, step-free navigation, and gentle walking comfort for kids & seniors.';
  } else if (lowerInstr.includes('sunrise') || lowerInstr.includes('tiger hill')) {
    const hasSunrise = updatedItems.some(i => i.title.toLowerCase().includes('sunrise') || i.title.toLowerCase().includes('tiger hill'));
    if (!hasSunrise) {
      updatedItems.unshift({
        id: `refined-sunrise-${Date.now()}`,
        dayIndex: 2,
        time: '04:30',
        title: 'Tiger Hill Sunrise & Kanchenjunga Panorama',
        location: 'Tiger Hill Observatory',
        category: 'sightseeing',
        cost: 100 * (groupProfile?.numberOfHeads || 2),
        notes: 'Golden sunrise over Mt. Kanchenjunga. Start by 4:15 AM to beat the morning convoy.',
        completed: false,
        openingHours: '04:00 - 08:00',
        bestTimeToVisit: 'Sunrise (04:30 - 06:00)',
        transitInfo: '🚗 ~40 mins mountain ascent via Hill Cart Road',
        accessibilityStatus: 'open',
        accessibilityNote: '🟢 Enclosed observatory seating available.',
        isMustVisit: true
      });
    }
    summary = 'Included the iconic sunrise excursion on Day 2 with early mountain transit advice.';
  } else {
    // Custom note applied
    updatedItems = updatedItems.map(item => ({
      ...item,
      notes: `${item.notes || ''} • [Note: Tailored for "${instruction}"]`
    }));
    summary = `Refined itinerary notes to reflect: "${instruction}".`;
  }

  // Ensure sequential transit advice is fresh
  for (let i = 1; i < updatedItems.length; i++) {
    if (updatedItems[i].dayIndex === updatedItems[i - 1].dayIndex) {
      const transit = estimateTransitBetweenSpots(updatedItems[i - 1].title, updatedItems[i].title);
      updatedItems[i].transitInfo = transit.trafficAdvice;
    }
  }

  return {
    items: updatedItems,
    summary
  };
}

export interface ConciergePlaceSuggestion {
  id: string;
  title: string;
  location: string;
  category: ActivityCategory;
  suggestedTime: string;
  cost: number;
  reason: string;
  openingHours?: string;
  bestTimeToVisit?: string;
  transitInfo?: string;
}

export interface ConciergeResponse {
  replyText: string;
  suggestedPlaces: ConciergePlaceSuggestion[];
}

/**
 * Checks if user message is exclusively related to the destination and tour
 */
function isTourRelatedMessage(message: string, cityName: string): boolean {
  const m = message.toLowerCase();
  const c = cityName.toLowerCase();

  // If directly mentions city or travel keywords
  if (m.includes(c)) return true;

  const travelKeywords = [
    'place', 'spot', 'visit', 'tour', 'trip', 'itinerary', 'travel',
    'hotel', 'stay', 'food', 'restaurant', 'cafe', 'tea', 'eat', 'dinner', 'lunch', 'breakfast',
    'morning', 'evening', 'sunset', 'sunrise', 'night', 'time', 'timing',
    'traffic', 'drive', 'taxi', 'train', 'flight', 'cab', 'transit', 'route', 'hours', 'km',
    'walk', 'view', 'viewpoint', 'peak', 'hill', 'mountain', 'lake', 'pass', 'falls', 'monastery',
    'temple', 'park', 'market', 'mall', 'budget', 'cost', 'ticket', 'weather', 'rain', 'temperature',
    'kid', 'child', 'senior', 'family', 'day 1', 'day 2', 'day 3', 'day 4', 'day 5', 'activity',
    'recommend', 'suggest', 'where', 'what to', 'attraction', 'guide', 'namchi', 'rabangla', 'gangtok',
    'darjeeling', 'kalimpong', 'pelling', 'sikkim', 'tiger hill', 'glenary', 'batasia'
  ];

  if (travelKeywords.some(kw => m.includes(kw))) return true;

  // Obvious non-travel patterns
  const nonTravelPatterns = [
    'write code', 'python', 'javascript', 'html', 'css', 'react',
    'math', 'solve', 'equation', 'who is', 'president', 'capital of',
    'explain quantum', 'recipe for', 'tell me a joke', 'write an essay', 'homework'
  ];

  if (nonTravelPatterns.some(p => m.includes(p))) return false;

  // Short greetings are allowed
  if (m.length <= 15) return true;

  return false;
}

/**
 * Exclusive Tour Concierge AI assistant
 * Responds exclusively to questions about the tour and suggests places that can be added with 1 tap.
 */
export async function askTourConcierge(
  userMessage: string,
  city: City,
  activeItems: ItineraryItem[] = [],
  selectedDay: number = 1,
  groupProfile?: TravelerGroupProfile
): Promise<ConciergeResponse> {
  const cleanMsg = (userMessage || '').trim();

  // 1. Enforce strict tour-only guardrail
  if (!isTourRelatedMessage(cleanMsg, city.name)) {
    return {
      replyText: `I am your dedicated ${city.name} Tour Concierge, and I can only chat exclusively about your trip! Please ask me about places to visit, restaurants, sightseeing spots, route timings, or itinerary advice for ${city.name}.`,
      suggestedPlaces: []
    };
  }

  const apiKey = getStoredGeminiApiKey();

  // 2. Try live Gemini API if key available
  if (apiKey) {
    try {
      const prompt = `You are the dedicated RouteWise Tour Concierge for ${city.name}, ${city.country}.
STRICT RULE: You chat EXCLUSIVELY about this tour, attractions, restaurants, timings, mountain road traffic, and itinerary planning.
User message: "${cleanMsg}"
Currently selected day in planner: Day ${selectedDay}.
Current itinerary items in trip: ${JSON.stringify(activeItems.map(i => ({ day: i.dayIndex, title: i.title, time: i.time })))}.
Group: ${groupProfile?.numberOfHeads || 2} traveler(s) (${groupProfile?.ageGroup || 'General'}).

If the user asks for suggestions, recommendations, or a place to include in their trip, suggest 1 to 3 real, specific places in ${city.name} with realistic prices, times, and transit advice.
Return ONLY valid JSON with this exact structure:
{
  "replyText": "Helpful, conversational concierge answer (2-4 sentences)",
  "suggestedPlaces": [
    {
      "id": "sug-1",
      "title": "Exact Place Name",
      "location": "Location within ${city.name}",
      "category": "sightseeing",
      "suggestedTime": "14:30",
      "cost": 150,
      "reason": "Why this place is recommended for their tour",
      "openingHours": "09:00 - 18:00",
      "bestTimeToVisit": "Afternoon",
      "transitInfo": "🚗 ~20 mins drive"
    }
  ]
}
If no specific place needs to be added (e.g. general question about weather or route), leave "suggestedPlaces" as an empty array [].`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = parseJsonSafely<ConciergeResponse>(text);
          if (parsed && typeof parsed.replyText === 'string') {
            const enrichedPlaces = (parsed.suggestedPlaces || []).map(p => {
              const transit = estimateTransitBetweenSpots(activeItems[activeItems.length - 1]?.title || 'Hotel', p.title);
              return {
                ...p,
                location: p.location || `${p.title}, ${city.name}`,
                transitInfo: p.transitInfo || transit.trafficAdvice,
                id: p.id || `sug-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`
              };
            });

            return {
              replyText: parsed.replyText,
              suggestedPlaces: enrichedPlaces
            };
          }
        }
      }
    } catch (e) {
      console.warn('Live Gemini concierge chat failed, falling back to smart local engine:', e);
    }
  }

  // 3. Smart local deterministic concierge engine
  const lower = cleanMsg.toLowerCase();
  const allAttractions = await getTouristAttractions(city);
  const existingTitles = new Set(activeItems.map(i => i.title.toLowerCase()));

  // Filter available spots not yet in itinerary
  let candidates = allAttractions.filter(a => !existingTitles.has(a.title.toLowerCase()));
  if (candidates.length === 0) candidates = allAttractions;

  let matchedSpots: AttractionRecommendation[] = [];
  let replyText = '';

  if (lower.includes('sunset') || lower.includes('dusk')) {
    matchedSpots = candidates.filter(a => 
      a.bestTimeToVisit.toLowerCase().includes('sunset') || 
      a.title.toLowerCase().includes('observatory') || 
      a.title.toLowerCase().includes('mall') ||
      a.title.toLowerCase().includes('hill')
    ).slice(0, 2);
    replyText = `For a spectacular sunset in ${city.name}, here is a top viewpoint where the golden twilight over the valley is mesmerizing. You can tap below to include it directly in Day ${selectedDay}:`;
  } else if (lower.includes('sunrise') || lower.includes('morning') || lower.includes('dawn')) {
    matchedSpots = candidates.filter(a => 
      a.title.toLowerCase().includes('tiger hill') || 
      a.bestTimeToVisit.toLowerCase().includes('sunrise') ||
      a.bestTimeToVisit.toLowerCase().includes('morning')
    ).slice(0, 2);
    replyText = `Early mornings offer crystal clear mountain visibility in ${city.name}! Here are the finest sunrise and morning spots for your itinerary:`;
  } else if (lower.includes('food') || lower.includes('cafe') || lower.includes('bakery') || lower.includes('tea') || lower.includes('eat') || lower.includes('lunch') || lower.includes('dinner')) {
    matchedSpots = candidates.filter(a => a.category === 'food' || a.title.toLowerCase().includes('glenary') || a.title.toLowerCase().includes('tea') || a.title.toLowerCase().includes('bistro')).slice(0, 2);
    if (matchedSpots.length === 0) {
      matchedSpots = candidates.filter(a => a.category === 'food').slice(0, 2);
    }
    replyText = `Here are renowned culinary stops in ${city.name} to savor authentic regional tastes, fresh tea, and artisan bakes:`;
  } else if (lower.includes('kid') || lower.includes('child') || lower.includes('family') || lower.includes('zoo')) {
    matchedSpots = candidates.filter(a => 
      a.title.toLowerCase().includes('zoo') || 
      a.title.toLowerCase().includes('toy train') || 
      a.title.toLowerCase().includes('park') ||
      a.title.toLowerCase().includes('garden')
    ).slice(0, 2);
    replyText = `For family travelers and kids visiting ${city.name}, these attractions feature gentle walking, interactive wildlife, and fun scenic sights:`;
  } else if (lower.includes('peace') || lower.includes('monastery') || lower.includes('temple') || lower.includes('buddha')) {
    matchedSpots = candidates.filter(a => 
      a.title.toLowerCase().includes('monastery') || 
      a.title.toLowerCase().includes('pagoda') || 
      a.title.toLowerCase().includes('ghoom') ||
      a.title.toLowerCase().includes('buddha')
    ).slice(0, 2);
    replyText = `If you are looking for serenity and spiritual heritage, these revered monasteries and viewpoints in ${city.name} are essential to experience:`;
  } else if (lower.includes('traffic') || lower.includes('transit') || lower.includes('drive') || lower.includes('route') || lower.includes('train') || lower.includes('metro') || lower.includes('namchi') || lower.includes('rabangla')) {
    if (city.country.toLowerCase().includes('japan') || city.name.toLowerCase().includes('tokyo') || city.name.toLowerCase().includes('kyoto') || city.name.toLowerCase().includes('osaka')) {
      replyText = `Transit in ${city.name} is fast, punctual, and world-class via the JR lines and Tokyo Metro subway network. Use a digital or physical IC card (Suica or Pasmo) for tap-and-go travel, and avoid peak morning rush hours (8:00–9:30 AM) with bulky luggage.`;
    } else if (city.country.toLowerCase().includes('india') || city.name.toLowerCase().includes('darjeeling') || city.name.toLowerCase().includes('sikkim')) {
      replyText = `Mountain roads around ${city.name} feature winding single-lane ghats. For example, mountainous connections like Namchi to Rabangla take ~5 hours via Damthang due to hairpins and checkpoints. Always allow buffer for mountain fog!`;
    } else {
      replyText = `Transit in ${city.name} is convenient via local rail, taxis, and walking around central districts. Allow extra travel buffer during evening rush hours.`;
    }
    return { replyText, suggestedPlaces: [] };
  } else {
    // General spot recommendation
    matchedSpots = candidates.slice(0, 2);
    replyText = `Here is a standout place in ${city.name} that fits naturally into your tour plan. Tap below to add it straight to Day ${selectedDay}:`;
  }

  const lastActivity = activeItems[activeItems.length - 1];
  const suggestedPlaces: ConciergePlaceSuggestion[] = matchedSpots.map(s => {
    const transit = estimateTransitBetweenSpots(lastActivity?.title || 'Hotel', s.title);
    return {
      id: `concierge-${s.id}-${Date.now()}`,
      title: s.title,
      location: `${s.title}, ${city.name}`,
      category: s.category,
      suggestedTime: s.bestTimeToVisit.toLowerCase().includes('sunset') ? '17:30' : (s.bestTimeToVisit.toLowerCase().includes('sunrise') ? '04:30' : '15:00'),
      cost: s.estimatedCost,
      reason: s.description,
      openingHours: s.openingHours,
      bestTimeToVisit: s.bestTimeToVisit,
      transitInfo: transit.trafficAdvice
    };
  });

  return {
    replyText,
    suggestedPlaces
  };
}

