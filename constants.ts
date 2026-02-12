
import { UserRole } from './types';

export const COLORS = {
  NEON: '#00fe00',
  DARK: '#131041',
  GREY: '#b4b4b4',
};

export const ROLES = [
  { id: UserRole.COACH, title: 'Entrenador', icon: '📋' },
  { id: UserRole.JOURNALIST, title: 'Periodista', icon: '🎙️' },
  { id: UserRole.ORGANIZER, title: 'Organizador', icon: '🏅' },
];

export const ACTIONS_GOAL = [
  { id: 'GOAL', label: 'Gol', icon: '⚽' },
  { id: 'SHOT', label: 'Disparo', icon: '🥅' },
  { id: 'FOUL', label: 'Falta', icon: '⚠️' },
  { id: 'LOSS', label: 'Pérdida', icon: '📉' },
  { id: 'RECOVERY', label: 'Recupero', icon: '📈' },
];

export const ACTIONS_POINT = [
  { id: 'POINT', label: 'Punto', icon: '⭐' },
  { id: 'BLOCK', label: 'Bloqueo', icon: '🛡️' },
  { id: 'SERVE_ACE', label: 'Ace', icon: '🎾' },
  { id: 'ERROR', label: 'Error', icon: '❌' },
];
