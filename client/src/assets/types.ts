export interface OrganizerInfo {
  organizationName: string;
  description: string;
  website?: string;
  address?: string;
  phone?: string;
  verified: boolean;
  stripeAccountId?: string;
  stripeAccountStatus?: "pending" | "unverified" | "verified" ;
  createdAt: Date;
}
export interface EventCardProps {
  event: EventType;
  variant?: 'user' | 'organizer';
  onDelete?: (eventId: string) => Promise<void>;
   onManage?: () => void;
}
export interface User {
  email: string;
  name: string;
  stripeAccountId?: string;
  role: 'user' | 'admin' | 'organizer';
  isVerified: boolean;
  accessToken: string;
  isBlocked: boolean;
  organizerInfo?: OrganizerInfo;
  createdEvents?: string[];
}

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  refreshToken: () => Promise<void>;
  upgradeToOrganizer: (organizerData: Omit<OrganizerInfo, 'createdAt'>) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  confirmEmailVerification: (token: string) => Promise<any>;
  verifyEmail: (token: string) => Promise<any>;
  checkAuthStatus: () => Promise<void>;
   isVerifiedOrganizer: boolean;
};

export interface EventType {
  _id: string;
  title: string;
  description: string;
  date: string;
  image?: string;
  media?: string[];
  location: string;
  imageUrl: string;
  category: string;
  price: number;
  quantity: number;
  startTime: string;
  endTime: string;
  cordinates: {
    lat: number;
    lng: number;
  };
  organizer: User;
  status: 'upcoming' | 'completed' | 'cancelled';
  tickets: {
    _id: string;
    name: string;
    price: number;
    quantity: number;
    description: string;
  }[];
  attendees: {
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
    };
    ticketType: {
      _id: string;
      name: string;
      price: number;
    };
    purchaseDate: string;
    pricePaid: number;
  }[];
}
export interface OrgDashboardProps {
  events: EventType[];
  onCreateEvent: (event: EventType) => void;
  onUpdateEvent: (event: EventType) => void;
  onDeleteEvent: (eventId: string) => void;
}
export interface EventFiltersProps {
  filters: {
    status: string;
    date: string;
    sort: string;
  };
  onFilterChange: React.Dispatch<React.SetStateAction<{
    status: string;
    date: string;
    priceRange: string;
    category: string;
    location: string;
    sort: string;
  }>>;
  organizerView?: boolean;
  
}
