/**
 * Traffic Advice & Travel Time Estimation Service
 * Provides realistic terrain-aware travel times, mountain road dynamics, and automatic day schedule calculation.
 */

export interface TransitEstimation {
  durationMinutes: number;
  durationText: string;
  trafficAdvice: string;
  distanceKm?: number;
}

// Known transit times between regional hubs, hill stations, and mountain routes
interface RouteRule {
  from: string[];
  to: string[];
  durationMinutes: number;
  advice: string;
}

const KNOWN_ROUTES: RouteRule[] = [
  // Namchi <-> Rabangla / Ravangla (User's specific highlighted route)
  {
    from: ['namchi'],
    to: ['rabangla', 'ravangla', 'buddha park'],
    durationMinutes: 300, // 5 hours minimum as specified by user
    advice: '🚗 ~5 hrs mountain route via Damthang (Steep winding hairpins, single lanes; allow buffer for checkposts)',
  },
  {
    from: ['rabangla', 'ravangla', 'buddha park'],
    to: ['namchi', 'char dham', 'samdruptse'],
    durationMinutes: 300,
    advice: '🚗 ~5 hrs mountain route via Damthang (Account for mountain fog & road maintenance)',
  },

  // Gangtok <-> Namchi / Ravangla / Pelling
  {
    from: ['gangtok'],
    to: ['namchi'],
    durationMinutes: 210, // 3.5 hrs
    advice: '🚗 ~3.5 hrs scenic Teesta river highway drive (Moderate traffic near Singtam)',
  },
  {
    from: ['gangtok'],
    to: ['rabangla', 'ravangla'],
    durationMinutes: 240, // 4 hrs
    advice: '🚗 ~4 hrs mountain drive via Tarku (Narrow valley road, lush tea estates)',
  },
  {
    from: ['gangtok'],
    to: ['pelling'],
    durationMinutes: 270, // 4.5 hrs
    advice: '🚗 ~4.5 - 5 hrs western Sikkim mountain route (Winding hill road, daylight drive advised)',
  },
  {
    from: ['gangtok'],
    to: ['tsomgo', 'changu'],
    durationMinutes: 150, // 2.5 hrs
    advice: '🚗 ~2.5 hrs high-altitude climb to 12,310 ft (Army permit checkpoint at 3rd Mile)',
  },
  {
    from: ['gangtok'],
    to: ['nathula'],
    durationMinutes: 210, // 3.5 hrs
    advice: '🚗 ~3.5 hrs military permit zone to 14,140 ft (Start by 7:30 AM; check weather for snow)',
  },

  // Darjeeling Routes
  {
    from: ['darjeeling', 'hotel'],
    to: ['tiger hill'],
    durationMinutes: 45,
    advice: '🚗 ~45 mins mountain ascent (Leave by 4:15 AM to avoid the sunrise summit convoy)',
  },
  {
    from: ['darjeeling'],
    to: ['kalimpong'],
    durationMinutes: 165, // 2.75 hrs
    advice: '🚗 ~2.5 - 3 hrs drive via Peshok tea gardens & Teesta Bazar (Winding descents)',
  },
  {
    from: ['darjeeling'],
    to: ['mirik'],
    durationMinutes: 135, // 2.25 hrs
    advice: '🚗 ~2 - 2.5 hrs scenic Indo-Nepal border road via Pashupati Nagar (Smooth pine forest drive)',
  },
  {
    from: ['darjeeling'],
    to: ['gangtok'],
    durationMinutes: 255, // 4.25 hrs
    advice: '🚗 ~4 - 4.5 hrs inter-state hill transit (Checkpost at Melli bridge crossing)',
  },
  {
    from: ['siliguri', 'njp', 'bagdogra'],
    to: ['darjeeling'],
    durationMinutes: 210, // 3.5 hrs
    advice: '🚗 ~3 - 3.5 hrs climb via Rohini / Hill Cart Road (Heavy freight trucks during midday)',
  },
  {
    from: ['siliguri', 'njp', 'bagdogra'],
    to: ['gangtok'],
    durationMinutes: 270, // 4.5 hrs
    advice: '🚗 ~4.5 - 5 hrs along NH-10 Teesta river corridor (Vulnerable to monsoon landslips)',
  },

  // Arunachal Routes
  {
    from: ['bomdila'],
    to: ['tawang'],
    durationMinutes: 390, // 6.5 hrs
    advice: '🚗 ~6.5 hrs high Himalayan journey traversing Sela Pass (13,700 ft; start early)',
  },
  {
    from: ['dirang'],
    to: ['tawang'],
    durationMinutes: 330, // 5.5 hrs
    advice: '🚗 ~5.5 hrs drive over Sela Pass (Challenging curves, fog, and army convoys)',
  },
  {
    from: ['guwahati'],
    to: ['shillong'],
    durationMinutes: 195, // 3.25 hrs
    advice: '🚗 ~3 - 3.5 hrs 4-lane expressway via Umiam Lake (Smooth highway, peak hour jam at city entry)',
  },
  {
    from: ['shillong'],
    to: ['cherrapunji', 'sohra'],
    durationMinutes: 135, // 2.25 hrs
    advice: '🚗 ~2 - 2.5 hrs misty plateau drive via Duwan Sing Syiem bridge (Heavy afternoon clouds/fog)',
  },
];

/**
 * Clean and normalize a location string for matching
 */
function normalizeLoc(loc: string): string {
  return (loc || '')
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates transit estimation, duration in minutes, and realistic traffic advice
 */
export function estimateTransitBetweenSpots(from: string, to: string): TransitEstimation {
  const normFrom = normalizeLoc(from);
  const normTo = normalizeLoc(to);

  // 1. Check known specific route database
  for (const rule of KNOWN_ROUTES) {
    const fromMatches = rule.from.some(f => normFrom.includes(f));
    const toMatches = rule.to.some(t => normTo.includes(t));

    if (fromMatches && toMatches) {
      const hours = Math.floor(rule.durationMinutes / 60);
      const mins = rule.durationMinutes % 60;
      const durationText = hours > 0 ? (mins > 0 ? `~${hours}h ${mins}m` : `~${hours} hrs`) : `~${mins} mins`;

      return {
        durationMinutes: rule.durationMinutes,
        durationText,
        trafficAdvice: rule.advice,
      };
    }
  }

  // 2. Local walking in town centers / promenades / malls
  const walkKeywords = ['mall', 'glenary', 'chowrasta', 'promenade', 'piazza', 'market', 'bazaar', 'street'];
  if (walkKeywords.some(w => normTo.includes(w)) && walkKeywords.some(w => normFrom.includes(w))) {
    return {
      durationMinutes: 10,
      durationText: '~10 mins',
      trafficAdvice: '🚶 10 mins leisurely walk (Pedestrian town center, vehicle-free promenade)',
    };
  }

  // 3. Return to / departure from Hotel within city
  if (normTo.includes('hotel') && !normFrom.includes('station') && !normFrom.includes('airport')) {
    return {
      durationMinutes: 25,
      durationText: '~25 mins',
      trafficAdvice: '🚗 ~20-25 mins return drive to hotel (Moderate local evening traffic)',
    };
  }

  // 4. Station or Airport to Hotel / City
  if (normFrom.includes('airport') || normFrom.includes('station') || normFrom.includes('terminal')) {
    return {
      durationMinutes: 120,
      durationText: '~2 hrs',
      trafficAdvice: '🚗 ~1.5 - 2.5 hrs transit from arrival station/airport to hotel',
    };
  }

  // 5. Generic Mountain Terrain Detection
  const mountainKeywords = ['hill', 'peak', 'pass', 'lake', 'monastery', 'viewpoint', 'falls', 'valley', 'cave', 'sanctuary'];
  const hasMountain = mountainKeywords.some(k => normTo.includes(k) || normFrom.includes(k));

  if (hasMountain) {
    // Hill excursions usually take 45 to 75 mins between separate spots
    return {
      durationMinutes: 60,
      durationText: '~1 hr',
      trafficAdvice: '🚗 ~45 - 60 mins mountain drive (Winding single-lane roads; allow extra time for photo stops)',
    };
  }

  // 6. Default city drive
  return {
    durationMinutes: 20,
    durationText: '~20 mins',
    trafficAdvice: '🚗 ~15 - 25 mins local transit (Normal city traffic flow)',
  };
}

/**
 * Converts a "HH:mm" 24-hour string to minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 600; // 10:00 AM default
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  return h * 60 + m;
}

/**
 * Converts minutes from midnight to "HH:mm" 24-hour format
 */
export function minutesToTimeString(totalMinutes: number): string {
  const bounded = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const h = Math.floor(bounded / 60);
  const m = bounded % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Typical estimated time spent at an activity by category
 */
export function getEstimatedVisitDuration(category?: string, title?: string): number {
  const cat = (category || '').toLowerCase();
  const t = (title || '').toLowerCase();

  if (cat === 'lodging' || t.includes('check-in') || t.includes('hotel')) return 60; // 1 hr checkin/unpack
  if (cat === 'food' || t.includes('lunch') || t.includes('dinner')) return 75; // 1 hr 15 mins meal
  if (t.includes('sunrise') || t.includes('tiger hill')) return 90; // 1.5 hrs
  if (t.includes('monastery') || t.includes('temple') || t.includes('museum')) return 90;
  if (t.includes('trek') || t.includes('hike') || t.includes('lake')) return 120; // 2 hrs
  return 60; // 1 hour standard visit
}

/**
 * Automatically calculates the recommended start time for the next scheduled item
 * based on the previous item's start time, visit duration, and transit time.
 */
export function calculateNextScheduledTime(
  previousStartTime: string,
  previousDurationMinutes: number,
  transitMinutes: number
): string {
  const prevMinutes = timeStringToMinutes(previousStartTime);
  const nextTimeMinutes = prevMinutes + previousDurationMinutes + transitMinutes;
  // Round up to nearest 5 or 15 minutes for human readability
  const rounded = Math.ceil(nextTimeMinutes / 15) * 15;
  return minutesToTimeString(rounded);
}
