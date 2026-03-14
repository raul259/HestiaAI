export interface Property {
  id: string;
  name: string;
  address: string;
  description?: string | null;
  wifiName?: string | null;
  wifiPassword?: string | null;
  checkoutInstructions?: string | null;
  wasteInstructions?: string | null;
  emergencyContact?: string | null;
  hostName: string;
  hostEmail: string;
  accessCode?: string | null;
  createdAt: Date;
  updatedAt: Date;
  appliances?: Appliance[];
  incidents?: Incident[];
}

export interface Appliance {
  id: string;
  propertyId: string;
  name: string;
  model?: string | null;
  category: string;
  manual: string;
  location?: string | null;
  createdAt: Date;
}

export interface Incident {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  guestName?: string | null;
  guestEmail?: string | null;
  scheduledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  property?: Property;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface Conversation {
  id: string;
  propertyId: string;
  sessionId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export type ApplianceCategory =
  | "tv"
  | "ac"
  | "washer"
  | "dryer"
  | "oven"
  | "dishwasher"
  | "water_heater"
  | "wifi"
  | "other";

export type IncidentCategory =
  | "electricity"
  | "water"
  | "wifi"
  | "appliance"
  | "access"
  | "other";

export type IncidentStatus = "open" | "in_progress" | "resolved" | "closed";
export type IncidentPriority = "low" | "medium" | "high" | "urgent";
