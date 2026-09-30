/**
 * ÀRÒYÉ — Core TypeScript Interfaces & Types
 */

export type ActiveTab = 'chat' | 'history' | 'settings';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface HistoryRecord {
  id: number;
  title: string;
  preview: string;
  timestamp: string;
  messages: ChatMessage[];
}

export interface UserSettings {
  voiceGender: 'male' | 'female';
  dialect: 'general' | 'oyo' | 'ekiti' | 'ijebu';
  speechSpeed: 'slow' | 'normal' | 'fast';
}

export interface ApiResponse {
  response: string;
  model: string;
  status: string;
}
