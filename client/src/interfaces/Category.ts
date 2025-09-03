import { Model } from '.';
import type { Bookmark } from './Bookmark';

export interface NewCategory {
  name: string;
  isPublic: boolean | number;
  section?: 'bookmarks' | 'apps';
  abbreviation?: string;
}

export interface Category extends Model, NewCategory {
  isPinned: boolean | number;
  orderId?: number | null;

  bookmarks?: Bookmark[];
}
