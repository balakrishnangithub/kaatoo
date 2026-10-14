import type { ArtId } from '../art';

/* ---------------- colors ---------------- */
export interface ColorDef {
  id: string;
  ta: string;
  en: string;
  hex: string;
}
export const COLORS: ColorDef[] = [
  { id: 'red', ta: 'சிவப்பு', en: 'red', hex: '#F28482' },
  { id: 'yellow', ta: 'மஞ்சள்', en: 'yellow', hex: '#FFCE80' },
  { id: 'blue', ta: 'நீலம்', en: 'blue', hex: '#A9D6E5' },
  { id: 'green', ta: 'பச்சை', en: 'green', hex: '#B7E4C7' },
  { id: 'purple', ta: 'ஊதா', en: 'purple', hex: '#CDB4DB' },
  { id: 'orange', ta: 'ஆரஞ்சு', en: 'orange', hex: '#F4A259' },
];

/* ---------------- numbers ---------------- */
export const NUMBERS = [
  { n: 1, ta: 'ஒன்று', en: 'one' },
  { n: 2, ta: 'இரண்டு', en: 'two' },
  { n: 3, ta: 'மூன்று', en: 'three' },
  { n: 4, ta: 'நான்கு', en: 'four' },
  { n: 5, ta: 'ஐந்து', en: 'five' },
  { n: 6, ta: 'ஆறு', en: 'six' },
  { n: 7, ta: 'ஏழு', en: 'seven' },
  { n: 8, ta: 'எட்டு', en: 'eight' },
  { n: 9, ta: 'ஒன்பது', en: 'nine' },
  { n: 10, ta: 'பத்து', en: 'ten' },
];

/* ---------------- shapes ---------------- */
export interface ShapeDef {
  id: ArtId;
  ta: string;
  en: string;
}
export const SHAPES: ShapeDef[] = [
  { id: 'circle', ta: 'வட்டம்', en: 'circle' },
  { id: 'square', ta: 'சதுரம்', en: 'square' },
  { id: 'triangle', ta: 'முக்கோணம்', en: 'triangle' },
  { id: 'rect', ta: 'செவ்வகம்', en: 'rectangle' },
  { id: 'starshape', ta: 'நட்சத்திரம்', en: 'star' },
  { id: 'heart', ta: 'இதயம்', en: 'heart' },
  { id: 'oval', ta: 'நீள்வட்டம்', en: 'oval' },
];

/* ---------------- words ---------------- */
export type Category = 'animal' | 'food' | 'thing' | 'nature';
export interface WordCard {
  art: ArtId;
  ta: string;
  en: string;
  cat: Category;
  /** English [one, many] for counting aloud, where "one X, three Xs" would be wrong */
  counting?: [one: string, many: string];
}
export const WORDS: WordCard[] = [
  { art: 'cat', ta: 'பூனை', en: 'cat', cat: 'animal' },
  { art: 'dog', ta: 'நாய்', en: 'dog', cat: 'animal' },
  { art: 'cow', ta: 'மாடு', en: 'cow', cat: 'animal' },
  { art: 'elephant', ta: 'யானை', en: 'elephant', cat: 'animal' },
  { art: 'bird', ta: 'பறவை', en: 'bird', cat: 'animal' },
  { art: 'fish', ta: 'மீன்', en: 'fish', cat: 'animal', counting: ['fish', 'fish'] },
  { art: 'lion', ta: 'சிங்கம்', en: 'lion', cat: 'animal' },
  { art: 'rabbit', ta: 'முயல்', en: 'rabbit', cat: 'animal' },
  { art: 'apple', ta: 'ஆப்பிள்', en: 'apple', cat: 'food' },
  { art: 'banana', ta: 'வாழைப்பழம்', en: 'banana', cat: 'food' },
  { art: 'mango', ta: 'மாம்பழம்', en: 'mango', cat: 'food', counting: ['mango', 'mangoes'] },
  {
    art: 'grapes',
    ta: 'திராட்சை',
    en: 'grapes',
    cat: 'food',
    counting: ['bunch of grapes', 'bunches of grapes'],
  },
  { art: 'orange', ta: 'ஆரஞ்சு', en: 'orange', cat: 'food' },
  { art: 'carrot', ta: 'கேரட்', en: 'carrot', cat: 'food' },
  { art: 'ball', ta: 'பந்து', en: 'ball', cat: 'thing' },
  { art: 'car', ta: 'கார்', en: 'car', cat: 'thing' },
  { art: 'bus', ta: 'பஸ்', en: 'bus', cat: 'thing', counting: ['bus', 'buses'] },
  { art: 'book', ta: 'புத்தகம்', en: 'book', cat: 'thing' },
  { art: 'cup', ta: 'கோப்பை', en: 'cup', cat: 'thing' },
  { art: 'shoe', ta: 'காலணி', en: 'shoe', cat: 'thing' },
  { art: 'balloon', ta: 'பலூன்', en: 'balloon', cat: 'thing' },
  { art: 'drum', ta: 'மேளம்', en: 'drum', cat: 'thing' },
  { art: 'sun', ta: 'சூரியன்', en: 'sun', cat: 'nature' },
  { art: 'moon', ta: 'நிலா', en: 'moon', cat: 'nature' },
  { art: 'star', ta: 'நட்சத்திரம்', en: 'star', cat: 'nature' },
  { art: 'flower', ta: 'பூ', en: 'flower', cat: 'nature' },
  { art: 'tree', ta: 'மரம்', en: 'tree', cat: 'nature' },
  { art: 'cloud', ta: 'மேகம்', en: 'cloud', cat: 'nature' },
  { art: 'house', ta: 'வீடு', en: 'house', cat: 'nature' },
];

export interface CategoryDef {
  id: Category;
  ta: string;
  en: string;
  art: ArtId;
  bg: string;
}
export const CATEGORIES: CategoryDef[] = [
  { id: 'animal', ta: 'விலங்குகள்', en: 'animals', art: 'cat', bg: '#F5CAC3' },
  { id: 'food', ta: 'உணவு', en: 'food', art: 'mango', bg: '#FFCE80' },
  { id: 'thing', ta: 'பொருட்கள்', en: 'things', art: 'ball', bg: '#A9D6E5' },
  { id: 'nature', ta: 'இயற்கை', en: 'nature', art: 'tree', bg: '#B7E4C7' },
];

/* ---------------- emotions ---------------- */
export interface EmotionDef {
  art: ArtId;
  ta: string;
  en: string;
  line: string;
  lineEn: string;
}
export const EMOTIONS: EmotionDef[] = [
  {
    art: 'face_happy',
    ta: 'சந்தோஷம்',
    en: 'happy',
    line: 'நண்பர்களுடன் விளையாடும்போது சந்தோஷம்',
    lineEn: 'happy when we play together',
  },
  {
    art: 'face_sad',
    ta: 'சோகம்',
    en: 'sad',
    line: 'பொம்மை உடைந்தால் சோகம் வரும்',
    lineEn: 'sad when a toy breaks',
  },
  {
    art: 'face_angry',
    ta: 'கோபம்',
    en: 'angry',
    line: 'கோபம் வந்தால் மூச்சை மெதுவாக விடு',
    lineEn: 'when angry, breathe slowly',
  },
  {
    art: 'face_surprised',
    ta: 'ஆச்சரியம்',
    en: 'surprised',
    line: 'புதிய விஷயம் கண்டால் ஆச்சரியம்',
    lineEn: 'surprised by something new',
  },
  {
    art: 'face_sleepy',
    ta: 'தூக்கம்',
    en: 'sleepy',
    line: 'தூக்கம் வந்தால் ஓய்வு எடு',
    lineEn: 'sleepy means time to rest',
  },
  {
    art: 'face_calm',
    ta: 'அமைதி',
    en: 'calm',
    line: 'மெதுவாக மூச்சு விட்டால் அமைதி',
    lineEn: 'slow breaths make us calm',
  },
];

/* ---------------- activities ---------------- */
export interface ActivityDef {
  id: string;
  ta: string;
  en: string;
  art: ArtId;
  bg: string;
  blurb: string;
}
/* `as const` keeps each id literal, so GameId below is derived from this list:
   adding an activity here is what creates its id, and the compiler then insists
   it gets a screen (the GAMES map in App.tsx). */
export const ACTIVITIES = [
  {
    id: 'draw',
    ta: 'வரையலாம்',
    en: 'draw',
    art: 'flower',
    bg: '#F5CAC3',
    blurb: 'free drawing & tracing',
  },
  {
    id: 'bubbles',
    ta: 'குமிழிகள்',
    en: 'bubbles',
    art: 'balloon',
    bg: '#A9D6E5',
    blurb: 'tap & discover',
  },
  {
    id: 'words',
    ta: 'சொற்கள்',
    en: 'words',
    art: 'mango',
    bg: '#FFCE80',
    blurb: 'first words, Tamil + English',
  },
  {
    id: 'sort',
    ta: 'வகைப்படுத்து',
    en: 'sort',
    art: 'starshape',
    bg: '#CDB4DB',
    blurb: 'colors, shapes, categories',
  },
  {
    id: 'shadow',
    ta: 'நிழல்',
    en: 'shadows',
    art: 'cat',
    bg: '#B7E4C7',
    blurb: 'match the silhouette',
  },
  {
    id: 'odd',
    ta: 'யார் வேறு?',
    en: 'odd one out',
    art: 'lion',
    bg: '#F5CAC3',
    blurb: 'spot the different one',
  },
  {
    id: 'pattern',
    ta: 'முறைகள்',
    en: 'patterns',
    art: 'drum',
    bg: '#FFCE80',
    blurb: 'what comes next?',
  },
  {
    id: 'count',
    ta: 'எண்ணிக்கை',
    en: 'counting',
    art: 'apple',
    bg: '#A9D6E5',
    blurb: 'tap to count 1–10',
  },
  {
    id: 'sizes',
    ta: 'பெரியது சிறியது',
    en: 'big & small',
    art: 'elephant',
    bg: '#B7E4C7',
    blurb: 'order by size',
  },
  {
    id: 'emotions',
    ta: 'உணர்வுகள்',
    en: 'feelings',
    art: 'face_happy',
    bg: '#CDB4DB',
    blurb: 'name the feeling',
  },
] as const satisfies readonly ActivityDef[];

/** every game's id — the key for its progress, its guiding hand, and its screen */
export type GameId = (typeof ACTIVITIES)[number]['id'];

/* ---------------- offline play ideas (wind-down) ---------------- */
export const OFFLINE_IDEAS = [
  { ta: 'கட்டுகளால் கோபுரம் கட்டு', en: 'Build a tower with blocks' },
  { ta: 'பந்தை ஒருவருக்கொருவர் உருட்டுங்கள்', en: 'Roll a ball back and forth' },
  { ta: 'புத்தகத்தில் படங்களைப் பெயர் சொல்லுங்கள்', en: 'Name pictures in a book together' },
  { ta: 'மறைந்திரு விளையாடு', en: 'Play hide and seek' },
  { ta: 'பாட்டுக்கு ஆடு', en: 'Dance to a favourite song' },
  { ta: 'கை, கால், மூக்கு — உடலைக் காட்டு', en: 'Point to hands, feet, nose' },
  { ta: 'கோப்பைகளால் தண்ணீர் விளையாட்டு', en: 'Pour water between cups' },
  { ta: 'சமையலறையில் சிறு உதவியாளர்', en: 'Be a little kitchen helper' },
];

/* ---------------- developmental milestones (CDC-informed) ---------------- */
export interface MilestoneBand {
  id: string;
  label: string;
  labelTa: string;
  groups: { domain: string; domainTa: string; items: { id: string; en: string; ta: string }[] }[];
}
export const MILESTONES: MilestoneBand[] = [
  {
    id: '2y',
    label: '2 – 3 years',
    labelTa: 'இரண்டு வயது',
    groups: [
      {
        domain: 'Social & Emotional',
        domainTa: 'சமூகம்',
        items: [
          {
            id: '2s1',
            en: 'Notices when others are hurt or upset',
            ta: 'மற்றவர் வலியில் இருக்கும்போது கவனிக்கிறாள்',
          },
          {
            id: '2s2',
            en: 'Plays next to (and sometimes with) other children',
            ta: 'மற்ற குழந்தைகள் அருகில் விளையாடுகிறாள்',
          },
          {
            id: '2s3',
            en: 'Looks at your face to see how to react',
            ta: 'உங்கள் முகத்தைப் பார்த்து எப்படி நடக்கலாம் என தெரிந்துகொள்கிறாள்',
          },
        ],
      },
      {
        domain: 'Language',
        domainTa: 'மொழி',
        items: [
          {
            id: '2l1',
            en: 'Says two or more words together ("more milk")',
            ta: 'இரண்டு சொற்களைச் சேர்த்துப் பேசுகிறாள்',
          },
          {
            id: '2l2',
            en: 'Points to things in a book when asked',
            ta: 'புத்தகத்தில் படங்களைக் கேட்டபோது காட்டுகிறாள்',
          },
          {
            id: '2l3',
            en: 'Points to at least two body parts',
            ta: 'குறைந்தது இரண்டு உடல் உறுப்புகளைக் காட்டுகிறாள்',
          },
        ],
      },
      {
        domain: 'Thinking & Learning',
        domainTa: 'சிந்தனை',
        items: [
          {
            id: '2c1',
            en: 'Uses things to pretend (feeds a doll)',
            ta: 'பொம்மைக்கு சாப்பாடு கொடுப்பது போல பாசாங்கு செய்கிறாள்',
          },
          {
            id: '2c2',
            en: 'Sorts things by shape or color',
            ta: 'வடிவம் அல்லது நிறம் வாரியாகப் பிரிக்கிறாள்',
          },
          {
            id: '2c3',
            en: 'Plays with more than one toy at the same time',
            ta: 'ஒரே நேரத்தில் பல பொம்மைகளுடன் விளையாடுகிறாள்',
          },
          { id: '2c4', en: 'Scribbles spontaneously', ta: 'தானாகக் கிறுக்குகிறாள்' },
        ],
      },
      {
        domain: 'Movement',
        domainTa: 'இயக்கம்',
        items: [
          {
            id: '2m1',
            en: 'Kicks a ball, runs, climbs on furniture',
            ta: 'பந்தை உதைக்கிறாள், ஓடுகிறாள், ஏறுகிறாள்',
          },
          { id: '2m2', en: 'Eats with a spoon', ta: 'கரண்டியால் சாப்பிடுகிறாள்' },
        ],
      },
    ],
  },
  {
    id: '3y',
    label: '3 – 4 years',
    labelTa: 'மூன்று வயது',
    groups: [
      {
        domain: 'Social & Emotional',
        domainTa: 'சமூகம்',
        items: [
          {
            id: '3s1',
            en: 'Calms down within 10 minutes after you leave',
            ta: 'நீங்கள் சென்ற பின் சற்றே நேரத்தில் அமைதியாகிறாள்',
          },
          {
            id: '3s2',
            en: 'Notices other children and joins them to play',
            ta: 'மற்ற குழந்தைகளுடன் சேர்ந்து விளையாடுகிறாள்',
          },
        ],
      },
      {
        domain: 'Language',
        domainTa: 'மொழி',
        items: [
          {
            id: '3l1',
            en: 'Asks "who, what, where, why" questions',
            ta: 'யார், என்ன, எங்கே, ஏன் எனக் கேட்கிறாள்',
          },
          {
            id: '3l2',
            en: 'Says first name; others understand most of what she says',
            ta: 'தன் பெயரைச் சொல்கிறாள்; பேச்சு பெரும்பாலும் புரிகிறது',
          },
          {
            id: '3l3',
            en: 'Carries a conversation with 2–3 back-and-forths',
            ta: 'இரண்டு–மூன்று முறை பேச்சு பரிமாறுகிறாள்',
          },
        ],
      },
      {
        domain: 'Thinking & Learning',
        domainTa: 'சிந்தனை',
        items: [
          { id: '3c1', en: 'Draws a circle when shown how', ta: 'காட்டினால் வட்டம் வரைகிறாள்' },
          {
            id: '3c2',
            en: 'Avoids touching hot things once warned',
            ta: 'எச்சரித்தால் சூடானதைத் தொடுவதைத் தவிர்க்கிறாள்',
          },
        ],
      },
      {
        domain: 'Movement',
        domainTa: 'இயக்கம்',
        items: [
          { id: '3m1', en: 'Puts on some clothes by herself', ta: 'சில ஆடைகளைத் தானே அணிகிறாள்' },
          { id: '3m2', en: 'Uses a fork', ta: 'முள் கரண்டி பயன்படுத்துகிறாள்' },
        ],
      },
    ],
  },
  {
    id: '4y',
    label: '4 – 5 years',
    labelTa: 'நான்கு வயது',
    groups: [
      {
        domain: 'Social & Emotional',
        domainTa: 'சமூகம்',
        items: [
          {
            id: '4s1',
            en: 'Pretends to be something else (teacher, superhero)',
            ta: 'ஆசிரியர் போல வேடம் போட்டு விளையாடுகிறாள்',
          },
          { id: '4s2', en: 'Comforts a friend who is sad', ta: 'சோகமான நண்பனை ஆறுதல் செய்கிறாள்' },
          { id: '4s3', en: 'Likes to be a helper', ta: 'உதவி செய்ய விரும்புகிறாள்' },
        ],
      },
      {
        domain: 'Language',
        domainTa: 'மொழி',
        items: [
          { id: '4l1', en: 'Tells simple stories', ta: 'எளிய கதைகளைச் சொல்கிறாள்' },
          {
            id: '4l2',
            en: 'Answers simple questions about a book',
            ta: 'புத்தகம் பற்றிய எளிய கேள்விகளுக்கு பதில் சொல்கிறாள்',
          },
        ],
      },
      {
        domain: 'Thinking & Learning',
        domainTa: 'சிந்தனை',
        items: [
          { id: '4c1', en: 'Counts to 10', ta: '10 வரை எண்ணுகிறாள்' },
          {
            id: '4c2',
            en: 'Names a few colors and some letters',
            ta: 'சில நிறங்கள், சில எழுத்துகளைச் சொல்கிறாள்',
          },
          {
            id: '4c3',
            en: 'Draws a person with 3+ body parts',
            ta: 'மூன்று உறுப்புகளுடன் மனிதர் வரைகிறாள்',
          },
        ],
      },
      {
        domain: 'Movement',
        domainTa: 'இயக்கம்',
        items: [
          {
            id: '4m1',
            en: 'Catches a large ball most of the time',
            ta: 'பெரிய பந்தைப் பிடிக்கிறாள்',
          },
        ],
      },
    ],
  },
  {
    id: '5y',
    label: '5 – 6 years',
    labelTa: 'ஐந்து வயது',
    groups: [
      {
        domain: 'Social & Emotional',
        domainTa: 'சமூகம்',
        items: [
          {
            id: '5s1',
            en: 'Follows rules and takes turns',
            ta: 'விதிகளைப் பின்பற்றி முறை காத்திருக்கிறாள்',
          },
          { id: '5s2', en: 'Does simple chores', ta: 'எளிய வீட்டு வேலைகளைச் செய்கிறாள்' },
        ],
      },
      {
        domain: 'Language',
        domainTa: 'மொழி',
        items: [
          {
            id: '5l1',
            en: 'Tells a story with at least two events',
            ta: 'இரண்டு நிகழ்வுகளுடன் கதை சொல்கிறாள்',
          },
          {
            id: '5l2',
            en: 'Uses or recognizes simple rhymes',
            ta: 'எளிய ஒலி ஒத்த சொற்களை அறிந்துகொள்கிறாள்',
          },
        ],
      },
      {
        domain: 'Thinking & Learning',
        domainTa: 'சிந்தனை',
        items: [
          {
            id: '5c1',
            en: 'Counts to 10 and beyond; names some numbers and letters',
            ta: '10-க்கு மேல் எண்ணுகிறாள்; எண்கள், எழுத்துகள் அறிகிறாள்',
          },
          {
            id: '5c2',
            en: 'Understands opposites (big/small, hot/cold)',
            ta: 'எதிர்ச்சொற்களைப் புரிந்துகொள்கிறாள்',
          },
        ],
      },
      {
        domain: 'Movement',
        domainTa: 'இயக்கம்',
        items: [
          {
            id: '5m1',
            en: 'Hops, skips, buttons some buttons',
            ta: 'துள்ளுகிறாள், பட்டன் போடுகிறாள்',
          },
        ],
      },
    ],
  },
];

/* ---------------- praise ---------------- */
/* a Tamil line with the English that echoes it — kept as one pair so the echo
   always says the same thing as the Tamil it follows */
export interface Phrase {
  ta: string;
  en: string;
}
export const PRAISE: Phrase[] = [
  { ta: 'மிக நன்று!', en: 'Good job!' },
  { ta: 'அருமை!', en: 'Well done!' },
  { ta: 'சூப்பர்!', en: 'Super!' },
  { ta: 'சரியாகச் செய்தாய்!', en: 'You did it!' },
  { ta: 'அழகு!', en: 'Lovely!' },
];
export const TRY_TA = 'மீண்டும் முயற்சி செய்';
/* process praise (Gunderson et al. 2013): praise the effort, not the child — builds persistence */
export const PRAISE_EFFORT: Phrase[] = [
  { ta: 'நல்ல முயற்சி!', en: 'Good effort!' },
  { ta: 'முயற்சி செய்தாய், அருமை!', en: 'You kept trying — lovely!' },
  { ta: 'நீயே வரைந்தாய்!', en: 'You traced it yourself!' },
  { ta: 'ஓடுகிறது, தொடர்!', en: 'It is moving, keep going!' },
];
