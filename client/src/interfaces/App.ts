import { Model } from '.';

export interface NewApp {
  name: string;
  url: string;
  icon: string;
  isPublic: boolean;
  description: string;
  /** optional while filling the form */
  categoryId?: number;
}

/** What the API returns (fully-populated) */
export interface App extends Model {
  name: string;
  url: string;
  icon: string;
  isPublic: boolean;
  description: string;
  orderId: number;
  isPinned: boolean;
  /** required on persisted entities */
  categoryId: number;
}
