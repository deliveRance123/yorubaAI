/**
 * ÀRÒYÉ — Core TypeScript Ambient Type Definitions
 */

type ActiveTab = 'chat' | 'history' | 'settings';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface HistoryRecord {
  id: number;
  title: string;
  preview: string;
  timestamp: string;
  messages: ChatMessage[];
}

interface UserSettings {
  voiceGender: 'male' | 'female';
  dialect: 'general' | 'oyo' | 'ekiti' | 'ijebu';
  speechSpeed: 'slow' | 'normal' | 'fast';
}

interface ApiResponse {
  response: string;
  model: string;
  status: string;
}
