// ============================================
// 🔴 TOP ROJO - Premium Visibility System
// ============================================

export type TopRojoPlantType = 'top_24h' | 'top_3d' | 'top_7d';
export type TopRojoStatus = 'active' | 'expired' | 'cancelled';

/**
 * Planes TOP ROJO disponibles
 */
export const TOP_ROJO_PLANS = {
  top_24h: {
    id: 'top_24h',
    name: 'TOP ROJO 24H',
    duration: 24,          // horas
    price: 49,
    description: 'Aparece en el Top 5 de tu ciudad y en la home durante 24 horas con badge rojo y máxima visibilidad.'
  },
  top_3d: {
    id: 'top_3d',
    name: 'TOP ROJO 3 DÍAS',
    duration: 72,          // horas
    price: 129,
    description: 'Aparece en el Top 5 de tu ciudad y en la home durante 3 días seguidos con máxima visibilidad.'
  },
  top_7d: {
    id: 'top_7d',
    name: 'TOP ROJO 7 DÍAS',
    duration: 168,         // horas
    price: 249,
    description: 'Aparece en el Top 5 de tu ciudad y en la home durante 7 días completos con máxima visibilidad.'
  }
};

/**
 * Request para crear/comprar TOP ROJO
 */
export interface ITopRojoCreateRequest {
  profileId: string;          // FK: Profile._id
  planType: TopRojoPlantType; // 'top_24h' | 'top_3d' | 'top_7d'
  city: string;               // Ciudad donde será visible
  country: string;            // País
  title?: string;             // Título del TOP ROJO
  description?: string;       // Descripción del servicio
  contactPhone?: string;      // Número de contacto adicional
  images?: Array<{            // Fotos del TOP ROJO
    url: string;
    public_id: string;
  }>;
}

/**
 * Response de TOP ROJO
 */
export interface ITopRojoResponse {
  _id: string;
  userId: string;
  profileId: string;
  
  // Información general
  displayName: string;
  profileImage: string;
  city: string;
  country: string;
  
  // Estado TOP
  isTop: boolean;
  planType: TopRojoPlantType;
  status: TopRojoStatus;
  
  // Duración
  startDate: Date;
  endDate: Date;
  daysRemaining: number;
  hoursRemaining: number;
  
  // Estadísticas
  views: number;
  clicks: number;
  inquiries: number;
  
  // Precio y pago
  price: number;
  transactionId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lista de TOP ROJO por ciudad
 */
export interface ITopRojoListResponse {
  city: string;
  country: string;
  total: number;
  profiles: ITopRojoResponse[];
  maxSlots: number; // 5
  slotsAvailable: number; // 5 - total
}

/**
 * Dashboard: Mis TOP ROJO
 */
export interface IMyTopRojoDashboard {
  active: ITopRojoResponse[];
  expired: ITopRojoResponse[];
  statistics: {
    totalSpent: number;
    totalViews: number;
    totalClicks: number;
    conversionRate: number;
  };
}

/**
 * Rotación automática (cuando hay > 5)
 */
export interface ITopRojoRotation {
  city: string;
  rotationActive: boolean;
  rotationIntervalMinutes: number; // 10 o 15 minutos
  nextRotationTime: Date;
}
