import { Player } from './types';

export const PLAYER_COLORS: Record<Player, { base: string; text: string; ring: string }> = {
  Rouge: { base: 'bg-red-500', text: 'text-red-500', ring: 'ring-red-500' },
  Bleu: { base: 'bg-blue-500', text: 'text-blue-500', ring: 'ring-blue-500' },
  Vert: { base: 'bg-green-500', text: 'text-green-500', ring: 'ring-green-500' },
};

export const LEVEL_CONFIG: Record<number, {
  attackerRange: { min: number; max: number };
  defenderRange: { min: number; max: number };
  description: string;
}> = {
  1: { attackerRange: { min: 2, max: 10 }, defenderRange: { min: 1, max: 10 }, description: "Les bases : tables de 2 à 10. Parfait pour s'entraîner." },
  2: { attackerRange: { min: 6, max: 9 }, defenderRange: { min: 1, max: 9 }, description: "On corse les choses : tables de 6 à 9 pour un défi plus relevé." },
  3: { attackerRange: { min: 6, max: 12 }, defenderRange: { min: 1, max: 12 }, description: "Défi des experts : tables de 6 à 12, incluant les tables de 11 et 12." },
};

export const POINTS_MAP: { [key: number]: number } = {
  3: 1,
  4: 3,
  5: 10,
};