import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { encryptToken, decryptToken } from './encryption.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data/ytstudio');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const FILES = {
  channels: path.join(DATA_DIR, 'channels.json'),
  characters: path.join(DATA_DIR, 'characters.json'),
  stories: path.join(DATA_DIR, 'stories.json'),
  logs: path.join(DATA_DIR, 'logs.json'),
  videoPerformance: path.join(DATA_DIR, 'video_performance.json'),
  learningPatterns: path.join(DATA_DIR, 'learning_patterns.json'),
  improvements: path.join(DATA_DIR, 'improvements.json')
};

const DEFAULT_CHANNELS = [
  {
    id: 'old-couple',
    name: 'Old Couple Stories',
    gmail: 'oldcouple.official@gmail.com',
    youtube_channel_id: 'UC_old_couple_01',
    niche: 'Emotional Drama',
    style: 'Storytelling',
    uploads_per_day: 2,
    shorts_duration: 40,
    audience: 'General / Emotional',
    status: 'Connected',
    lastSync: '2 mins ago',
    views7d: '54.2K',
    ctr: '8.2%',
    topMood: 'Sad',
    handle: '@oldcouplestories',
    image: '/assets/yt/yt_old_couple.png',
    badge: 'ACTIVE',
    tokens_encrypted: encryptToken('oauth2_bearer_v3_old_couple_token')
  },
  {
    id: 'flood-stories',
    name: 'Flood Stories',
    gmail: 'floodstories.ai@gmail.com',
    youtube_channel_id: 'UC_flood_stories_02',
    niche: 'Natural Disaster Stories',
    style: 'Dramatic Cinematic',
    uploads_per_day: 2,
    shorts_duration: 40,
    audience: 'Youth / Family',
    status: 'Connected',
    lastSync: '1 min ago',
    views7d: '120.7K',
    ctr: '7.6%',
    topMood: 'Tragedy',
    handle: '@floodstories',
    image: '/assets/yt/yt_flood_stories.png',
    badge: 'ACTIVE',
    tokens_encrypted: encryptToken('oauth2_bearer_v3_flood_stories_token')
  },
  {
    id: 'funny-family',
    name: 'Funny Family',
    gmail: 'funnyfamily.studio@gmail.com',
    youtube_channel_id: 'UC_funny_family_03',
    niche: 'Comedy Shorts',
    style: 'Humorous',
    uploads_per_day: 2,
    shorts_duration: 35,
    audience: 'Family / Kids',
    status: 'Connected',
    lastSync: '5 mins ago',
    views7d: '12.1K',
    ctr: '5.1%',
    topMood: 'Comedy',
    handle: '@funnyfamily',
    image: '/assets/yt/yt_funny_family.png',
    badge: 'ACTIVE',
    tokens_encrypted: encryptToken('oauth2_bearer_v3_funny_family_token')
  },
  {
    id: 'accident-stories',
    name: 'Accident Stories',
    gmail: 'accidentstories.hub@gmail.com',
    youtube_channel_id: 'UC_accident_stories_04',
    niche: 'Highway Thrillers',
    style: 'Fast-paced',
    uploads_per_day: 2,
    shorts_duration: 40,
    audience: 'Action / Suspense',
    status: 'Connected',
    lastSync: '10 mins ago',
    views7d: '89.3K',
    ctr: '6.9%',
    topMood: 'Angry',
    handle: '@accidentstories',
    image: '/assets/yt/yt_accident_stories.png',
    badge: 'ACTIVE',
    tokens_encrypted: encryptToken('oauth2_bearer_v3_accident_stories_token')
  },
  {
    id: 'village-life',
    name: 'Village Life',
    gmail: 'villagelife.prod@gmail.com',
    youtube_channel_id: 'UC_village_life_05',
    niche: 'Rural Culture & Life',
    style: 'Peaceful / Inspirational',
    uploads_per_day: 2,
    shorts_duration: 40,
    audience: 'Rural / Nostalgic',
    status: 'Connected',
    lastSync: 'Just now',
    views7d: '46.8K',
    ctr: '7.2%',
    topMood: 'Inspirational',
    handle: '@villagelife',
    image: '/assets/yt/yt_village_life.png',
    badge: 'ACTIVE',
    tokens_encrypted: encryptToken('oauth2_bearer_v3_village_life_token')
  },
  {
    id: 'tech-explainer',
    name: 'Tech Explainer AI',
    gmail: 'techexplainer.network@gmail.com',
    youtube_channel_id: 'UC_tech_explainer_06',
    niche: 'AI & Future Tech',
    style: 'Informative High-Tech',
    uploads_per_day: 2,
    shorts_duration: 40,
    audience: 'Tech Enthusiasts',
    status: 'Connected',
    lastSync: '15 mins ago',
    views7d: '92.4K',
    ctr: '9.1%',
    topMood: 'Informative',
    handle: '@techexplainer',
    image: '/assets/yt/yt_funny_family.png',
    badge: 'ACTIVE',
    tokens_encrypted: encryptToken('oauth2_bearer_v3_tech_explainer_token')
  },
  {
    id: 'horror-tales',
    name: 'Dark Horror Tales',
    gmail: 'darkhorror.creators@gmail.com',
    youtube_channel_id: 'UC_horror_tales_07',
    niche: 'Supernatural Horror',
    style: 'Dark Atmospheric',
    uploads_per_day: 2,
    shorts_duration: 40,
    audience: 'Horror Fans',
    status: 'Connected',
    lastSync: '3 mins ago',
    views7d: '145.2K',
    ctr: '11.4%',
    topMood: 'Horror',
    handle: '@darkhorrortales',
    image: '/assets/yt/yt_accident_stories.png',
    badge: 'ACTIVE',
    tokens_encrypted: encryptToken('oauth2_bearer_v3_dark_horror_token')
  },
  {
    id: 'motivation-hub',
    name: 'Alpha Motivation',
    gmail: 'alphamotivation.jarvis@gmail.com',
    youtube_channel_id: 'UC_alpha_motivation_08',
    niche: 'Self-Improvement',
    style: 'High Energy Impact',
    uploads_per_day: 2,
    shorts_duration: 40,
    audience: 'Young Adults',
    status: 'Connected',
    lastSync: '12 mins ago',
    views7d: '68.9K',
    ctr: '7.8%',
    topMood: 'Motivation',
    handle: '@alphamotivation',
    image: '/assets/yt/yt_village_life.png',
    badge: 'ACTIVE',
    tokens_encrypted: encryptToken('oauth2_bearer_v3_alpha_motivation_token')
  },
  {
    id: 'historical-facts',
    name: 'Ancient History AI',
    gmail: 'ancienthistory.vault@gmail.com',
    youtube_channel_id: 'UC_history_ai_09',
    niche: 'Historical Mysteries',
    style: 'Cinematic Narrative',
    uploads_per_day: 2,
    shorts_duration: 40,
    audience: 'History Lovers',
    status: 'Connected',
    lastSync: '4 mins ago',
    views7d: '210.5K',
    ctr: '10.2%',
    topMood: 'Epic',
    handle: '@ancienthistoryai',
    image: '/assets/yt/yt_old_couple.png',
    badge: 'ACTIVE',
    tokens_encrypted: encryptToken('oauth2_bearer_v3_ancient_history_token')
  },
  {
    id: 'crime-files',
    name: 'True Crime Dossier',
    gmail: 'truecrime.jarvis@gmail.com',
    youtube_channel_id: 'UC_true_crime_10',
    niche: 'Crime & Investigation',
    style: 'Investigative Thriller',
    uploads_per_day: 2,
    shorts_duration: 40,
    audience: 'Mystery Seekers',
    status: 'Connected',
    lastSync: '8 mins ago',
    views7d: '180.3K',
    ctr: '8.9%',
    topMood: 'Mystery',
    handle: '@truecrimedossier',
    image: '/assets/yt/yt_flood_stories.png',
    badge: 'ACTIVE',
    tokens_encrypted: encryptToken('oauth2_bearer_v3_true_crime_token')
  }
];

const DEFAULT_CHARACTERS = [
  {
    id: 'char-ramesh',
    channel_id: 'old-couple',
    name: 'Ramesh',
    gender: 'Male',
    age: 72,
    height: "5'9\"",
    body_type: 'Slender Elderly',
    skin_tone: 'Warm Tan',
    hair_style: 'Receding Gray Hair',
    hair_color: 'Gray',
    beard_style: 'Full White Beard',
    clothes_style: 'Traditional Cotton Kurta',
    accessories: 'Reading Glasses, Brass Ring',
    voice_style: 'Deep, Resonant, Warm, Wise',
    accent: 'Rural Indian Accent',
    personality: 'Emotional, Wise, Nostalgic, Resilient',
    emotion_range: ['Sad', 'Emotional', 'Hopeful', 'Reflective'],
    relationships: 'Husband of Sita',
    backstory: 'Former village teacher who dedicated his life to community storytelling.',
    reference_images: ['/assets/yt/yt_old_couple.png'],
    appearance_count: 42,
    storyline: 'Searching for lost childhood home in village.',
    is_locked: true,
    consistency_score: 98.8,
    attachment: '🌟 98% (High)',
    role: 'Grandfather / Elder',
    mood: '👴 Emotional / Wise',
    videosAppeared: '42 Videos'
  },
  {
    id: 'char-sita',
    channel_id: 'old-couple',
    name: 'Sita',
    gender: 'Female',
    age: 68,
    height: "5'4\"",
    body_type: 'Gentle Elderly',
    skin_tone: 'Warm Fair',
    hair_style: 'Neat Gray Bun',
    hair_color: 'Gray',
    beard_style: 'None',
    clothes_style: 'Simple Cotton Saree',
    accessories: 'Gold Bangle, Traditional Bindi',
    voice_style: 'Soft, Tender, Melodious, Reassuring',
    accent: 'Warm Gentle Tone',
    personality: 'Soft-spoken, Caring, Devoted, Gentle',
    emotion_range: ['Love', 'Concern', 'Empathy', 'Joy'],
    relationships: 'Wife of Ramesh',
    backstory: 'Matriarch of the family known for her wisdom and unconditional warmth.',
    reference_images: ['/assets/yt/yt_old_couple.png'],
    appearance_count: 38,
    storyline: 'Supporting Ramesh through health recovery.',
    is_locked: true,
    consistency_score: 97.9,
    attachment: '🌟 96% (High)',
    role: 'Grandmother / Matriarch',
    mood: '👵 Loving / Caring',
    videosAppeared: '38 Videos'
  },
  {
    id: 'char-village-boy',
    channel_id: 'village-life',
    name: 'Village Boy',
    gender: 'Male',
    age: 19,
    height: "5'10\"",
    body_type: 'Athletic Youth',
    skin_tone: 'Dusky',
    hair_style: 'Crop Cut',
    hair_color: 'Black',
    beard_style: 'Clean Shaven',
    clothes_style: 'Casual Shirt & Jeans',
    accessories: 'Leather Wristband',
    voice_style: 'Youthful, Energetic, Crisp',
    accent: 'Clear Passionate Voice',
    personality: 'Energetic, Ambitious, Honest, Hardworking',
    emotion_range: ['Determination', 'Excitement', 'Hope', 'Struggle'],
    relationships: 'Grandson of Farmer & Ramesh',
    backstory: 'Ambitious youth determined to excel in national competitive exams.',
    reference_images: ['/assets/yt/yt_village_life.png'],
    appearance_count: 29,
    storyline: 'Preparing for national scholarship exam.',
    is_locked: true,
    consistency_score: 94.2,
    attachment: '🌟 91% (High)',
    role: 'Protagonist / Youth',
    mood: '👦 Energetic / Ambitious',
    videosAppeared: '29 Videos'
  },
  {
    id: 'char-bus-driver',
    channel_id: 'accident-stories',
    name: 'Bus Driver',
    gender: 'Male',
    age: 45,
    height: "6'0\"",
    body_type: 'Broad Stocky',
    skin_tone: 'Muted Tan',
    hair_style: 'Short Crew Cut',
    hair_color: 'Dark Brown',
    beard_style: 'Short Stubble',
    clothes_style: 'Driver Uniform Jacket',
    accessories: 'Wristwatch, Pocket Torch',
    voice_style: 'Firm, Strong, Gritty',
    accent: 'Strong Direct Accent',
    personality: 'Protective, Brave, Alert, Loyal',
    emotion_range: ['Urgency', 'Courage', 'Relief'],
    relationships: 'Friend of Village Boy',
    backstory: 'Veteran driver with 20 years experience on perilous highway routes.',
    reference_images: ['/assets/yt/yt_accident_stories.png'],
    appearance_count: 14,
    storyline: 'Hero of the Highway Accident Miracle.',
    is_locked: true,
    consistency_score: 91.5,
    attachment: '🌟 85% (Medium)',
    role: 'Supporting Hero',
    mood: '🚌 Heroic / Protective',
    videosAppeared: '14 Videos'
  },
  {
    id: 'char-farmer',
    channel_id: 'flood-stories',
    name: 'Farmer',
    gender: 'Male',
    age: 52,
    height: "5'11\"",
    body_type: 'Weathered Muscular',
    skin_tone: 'Sun-bronzed',
    hair_style: 'Wavy Thick Hair',
    hair_color: 'Salt and Pepper',
    beard_style: 'Thick Moustache',
    clothes_style: 'Traditional Farm Wear',
    accessories: 'Turban Cloth',
    voice_style: 'Deep, Weathered, Grounded',
    accent: 'Authentic Folk Accent',
    personality: 'Resilient, Hardworking, Humble, Wise',
    emotion_range: ['Grief', 'Perseverance', 'Pride'],
    relationships: 'Father of Village Boy',
    backstory: 'Dedicated farmer who rebuilds life and crops after seasonal catastrophes.',
    reference_images: ['/assets/yt/yt_flood_stories.png'],
    appearance_count: 35,
    storyline: 'Rebuilding farm after devastating flood.',
    is_locked: true,
    consistency_score: 96.1,
    attachment: '🌟 94% (High)',
    role: 'Village Elder',
    mood: '👨‍🌾 Resilient / Hardworking',
    videosAppeared: '35 Videos'
  }
];

class DatabaseService {
  constructor() {
    this.initStorage();
  }

  initStorage() {
    if (!fs.existsSync(FILES.channels)) {
      fs.writeFileSync(FILES.channels, JSON.stringify(DEFAULT_CHANNELS, null, 2));
    }
    if (!fs.existsSync(FILES.characters)) {
      fs.writeFileSync(FILES.characters, JSON.stringify(DEFAULT_CHARACTERS, null, 2));
    } else {
      // Auto-enrich existing character records with full visual profile fields
      try {
        const existing = JSON.parse(fs.readFileSync(FILES.characters, 'utf8'));
        const enriched = existing.map(c => {
          const def = DEFAULT_CHARACTERS.find(d => d.id === c.id || d.name === c.name);
          return def ? { ...def, ...c, age: def.age || c.age, hair_color: c.hair_color || def.hair_color, hair_style: c.hair_style || def.hair_style, beard_style: c.beard_style || def.beard_style } : c;
        });
        fs.writeFileSync(FILES.characters, JSON.stringify(enriched, null, 2));
      } catch {
        fs.writeFileSync(FILES.characters, JSON.stringify(DEFAULT_CHARACTERS, null, 2));
      }
    }
    if (!fs.existsSync(FILES.stories)) {
      fs.writeFileSync(FILES.stories, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(FILES.logs)) {
      fs.writeFileSync(FILES.logs, JSON.stringify({
        video: [],
        upload: [],
        story: [],
        api: [],
        character: [],
        analytics: []
      }, null, 2));
    }
  }

  read(file) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return [];
    }
  }

  write(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  }

  // Channels
  getChannels() {
    return this.read(FILES.channels);
  }

  addChannel(channel) {
    const channels = this.getChannels();
    channels.push(channel);
    this.write(FILES.channels, channels);
    return channel;
  }

  getChannelById(id) {
    return this.getChannels().find(c => c.id === id);
  }

  updateChannel(id, updates) {
    const channels = this.getChannels();
    const idx = channels.findIndex(c => c.id === id);
    if (idx !== -1) {
      channels[idx] = { ...channels[idx], ...updates, lastSync: 'Just now' };
      this.write(FILES.channels, channels);
      return channels[idx];
    }
    return null;
  }

  // Characters
  getCharacters() {
    return this.read(FILES.characters);
  }

  getCharacterById(id) {
    return this.getCharacters().find(c => c.id === id);
  }

  addCharacter(char) {
    const characters = this.getCharacters();
    const newChar = { id: `char-${Date.now()}`, appearance_count: 0, ...char };
    characters.push(newChar);
    this.write(FILES.characters, characters);
    return newChar;
  }

  updateCharacter(id, updates) {
    const characters = this.getCharacters();
    const idx = characters.findIndex(c => c.id === id);
    if (idx !== -1) {
      characters[idx] = { ...characters[idx], ...updates };
      this.write(FILES.characters, characters);
      return characters[idx];
    }
    return null;
  }

  // Stories
  getStories() {
    return this.read(FILES.stories);
  }

  addStory(story) {
    const stories = this.getStories();
    const newStory = { id: `story-${Date.now()}`, created_at: new Date().toISOString(), ...story };
    stories.unshift(newStory);
    this.write(FILES.stories, stories);
    return newStory;
  }

  updateStory(id, updates) {
    const stories = this.getStories();
    const idx = stories.findIndex(s => s.id === id);
    if (idx !== -1) {
      stories[idx] = { ...stories[idx], ...updates };
      this.write(FILES.stories, stories);
      return stories[idx];
    }
    return null;
  }

  // Logs
  addLog(type, entry) {
    const logs = this.read(FILES.logs);
    if (!logs[type]) logs[type] = [];
    const logItem = { id: Date.now(), timestamp: new Date().toISOString(), ...entry };
    logs[type].unshift(logItem);
    // Keep max 500 logs per type
    if (logs[type].length > 500) logs[type] = logs[type].slice(0, 500);
    this.write(FILES.logs, logs);
    return logItem;
  }

  getLogs(type) {
    const logs = this.read(FILES.logs);
    return type ? (logs[type] || []) : logs;
  }

  // Phase 2.4 Self-Learning Helpers
  getVideoPerformance() {
    return this.read(FILES.videoPerformance) || [];
  }

  addVideoPerformance(entry) {
    const records = this.getVideoPerformance();
    const item = { id: `perf_${Date.now()}`, created_at: new Date().toISOString(), ...entry };
    records.unshift(item);
    this.write(FILES.videoPerformance, records);
    return item;
  }

  getLearningPatterns() {
    return this.read(FILES.learningPatterns) || [];
  }

  addLearningPattern(entry) {
    const patterns = this.getLearningPatterns();
    const item = { id: `pattern_${Date.now()}`, created_at: new Date().toISOString(), ...entry };
    patterns.unshift(item);
    this.write(FILES.learningPatterns, patterns);
    return item;
  }

  getImprovements() {
    return this.read(FILES.improvements) || [];
  }

  addImprovement(entry) {
    const list = this.getImprovements();
    const item = { id: `imp_${Date.now()}`, created_at: new Date().toISOString(), ...entry };
    list.unshift(item);
    this.write(FILES.improvements, list);
    return item;
  }
}

export const db = new DatabaseService();
