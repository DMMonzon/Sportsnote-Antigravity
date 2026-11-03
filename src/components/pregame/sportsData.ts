import dbAccionesJson from '../../../acciones_de_deportes.json';

export interface SportReglamento {
  jugadores_titulares: number;
  modo_puntuacion: string;
  tipo_tanteador: string;
  por_tiempo: boolean;
  duracion_periodo_minutos?: number;
  cantidad_periodos?: number;
  permite_empate: boolean;
  trackea_posesion?: boolean;
  puntos_para_ganar_set?: number;
  diferencia_minima_puntos?: number;
  limite_sets_configurable?: boolean;
  widgets_header?: {
    mostrar_faltas_equipo?: boolean;
    limite_faltas_bonus?: number;
    mostrar_cambios_disponibles?: boolean;
    max_cambios?: number;
    mostrar_video_challenges?: boolean;
    max_challenges?: number;
  };
}

export interface SportJsonItem {
  id: string;
  nombre_visible: string;
  reglamento: SportReglamento;
  modos?: any;
}

// Imágenes reales de Unsplash para los 4 deportes oficiales del catálogo
export const SPORT_IMAGES: Record<string, string> = {
  hockey_cesped: 'https://images.unsplash.com/photo-1780509459807-d47e3571cc99?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  futbol: 'https://images.unsplash.com/photo-1636373686369-2462fd1609ef?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  voley: 'https://images.unsplash.com/photo-1666901356149-93f2eb3ba5a2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  basket: 'https://images.unsplash.com/photo-1659468711279-2857db123912?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D'
};

export const SPORT_ICONS: Record<string, string> = {
  hockey_cesped: 'fa-solid fa-hockey-puck',
  futbol: 'fa-solid fa-futbol',
  voley: 'fa-solid fa-volleyball',
  basket: 'fa-solid fa-basketball'
};

// Catálogo único y real alimentado directamente desde acciones_de_deportes.json
export const SPORTS_CATALOG: SportJsonItem[] = dbAccionesJson as SportJsonItem[];
