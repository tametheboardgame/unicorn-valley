import type { AtmosphericTimeState } from '../atmosphere/AtmosphericTimeService';

export type SunbeamNoticeTone = 'parchment' | 'blush' | 'mint' | 'lavender' | 'gold';

export interface SunbeamNotice {
  id: string;
  icon: string;
  eyebrow: string;
  title: string;
  summary: string;
  body: string;
  footer: string;
  tone: SunbeamNoticeTone;
}

export interface SunbeamNoticeBoardContext {
  timeState: AtmosphericTimeState;
  fountainRepaired: boolean;
  mapCornerFoundNow?: boolean;
}

const TIME_NOTICES: Record<AtmosphericTimeState, SunbeamNotice> = {
  morning: {
    id: 'today',
    icon: '🌤️',
    eyebrow: 'TODAY IN SUNBEAM',
    title: 'A bright start',
    summary: 'Fresh buns, garden watering and Rainbow Run practice.',
    body: 'The Bakery has its first trays out, Willow is watering the garden beds, and Rainbow Run practice starts once the square gets busy.',
    footer: 'Pinned up this morning',
    tone: 'gold',
  },
  afternoon: {
    id: 'today',
    icon: '☀️',
    eyebrow: 'TODAY IN SUNBEAM',
    title: 'Afternoon around the square',
    summary: 'Playground games and a Story House reading circle.',
    body: 'The playground is lively this afternoon. The Story House is also holding a relaxed reading circle — wander in if you fancy a quieter break.',
    footer: 'Pinned up this afternoon',
    tone: 'gold',
  },
  sunset: {
    id: 'today',
    icon: '🌅',
    eyebrow: 'SUNSET NOTICE',
    title: 'Picnic blankets available',
    summary: 'Borrow a blanket beside the Bakery before the light goes.',
    body: 'A small stack of picnic blankets is available beside the Bakery for anyone staying out to watch the sunset. Please bring them back before heading home.',
    footer: 'For this evening',
    tone: 'blush',
  },
  night: {
    id: 'today',
    icon: '🌙',
    eyebrow: 'LANTERN NOTICE',
    title: 'Keep the east path clear',
    summary: 'Leave room for late walkers after moonrise.',
    body: 'The east path is used by unicorns heading home after moonrise. Please keep baskets, games and picnic things tucked away from the lantern line.',
    footer: 'Night-time reminder',
    tone: 'lavender',
  },
};

function fountainNotice(repaired: boolean): SunbeamNotice {
  return repaired
    ? {
        id: 'fountain',
        icon: '⛲',
        eyebrow: 'VILLAGE UPDATE',
        title: 'The fountain is chiming again',
        summary: 'Pebble reports a successful repair in the central square.',
        body: 'The Sunbeam Fountain is happily chiming again. Pebble says everything sounds exactly as it should — including one tiny note that may or may not be intentional.',
        footer: 'Thanks to everyone who helped',
        tone: 'mint',
      }
    : {
        id: 'fountain',
        icon: '🔧',
        eyebrow: 'PEBBLE ASKS',
        title: 'Odd little parts wanted',
        summary: 'The quiet fountain still needs a few curious pieces.',
        body: 'Pebble is still collecting odd little parts for the Sunbeam Fountain. If something looks mechanical, shiny or unusually springy, it may be worth showing them.',
        footer: 'Leave finds with Pebble',
        tone: 'mint',
      };
}

const STORY_NOTICE: SunbeamNotice = {
  id: 'story-house',
  icon: '📚',
  eyebrow: 'STORY HOUSE',
  title: 'Drop-in reading table',
  summary: 'Pick a story, settle in and stay for as long as you like.',
  body: 'The Story House reading table is open for quiet browsing. Short tales are welcome, long tales are welcome, and nobody minds if you come back tomorrow to finish.',
  footer: 'No booking needed',
  tone: 'parchment',
};

const CHESS_NOTICE: SunbeamNotice = {
  id: 'chess',
  icon: '♟',
  eyebrow: 'SUNBEAM CHESS',
  title: 'Friendly games welcome',
  summary: 'The plaza board is open to beginners and regular players.',
  body: 'Take either chair at the chess table and play a friendly game. Beginners are welcome — the board can show legal moves and offer a quiet hint if you want one.',
  footer: 'Beside the little chess sign',
  tone: 'lavender',
};

const MITTEN_NOTICE: SunbeamNotice = {
  id: 'mitten',
  icon: '🧤',
  eyebrow: 'LOST & FOUND',
  title: 'One purple mitten',
  summary: 'Small, woolly and apparently very good at disappearing.',
  body: 'A purple mitten has gone missing somewhere around the village square. If found, tuck it safely behind the notice board so it does not wander off again.',
  footer: 'Its matching mitten is getting lonely',
  tone: 'blush',
};

const MAP_CORNER_NOTICE: SunbeamNotice = {
  id: 'map-corner',
  icon: '🗺️',
  eyebrow: 'YOU FOUND SOMETHING',
  title: 'A map corner was tucked back here',
  summary: 'It was hiding behind the lost-mitten notice.',
  body: 'A torn corner of Tansy’s map was wedged behind the papers on the board. You carefully pull it free and keep it with the other clues.',
  footer: 'Map corner collected',
  tone: 'gold',
};

export function buildSunbeamNoticeBoard(context: SunbeamNoticeBoardContext): SunbeamNotice[] {
  return [
    context.mapCornerFoundNow ? MAP_CORNER_NOTICE : MITTEN_NOTICE,
    TIME_NOTICES[context.timeState],
    fountainNotice(context.fountainRepaired),
    STORY_NOTICE,
    CHESS_NOTICE,
  ];
}
