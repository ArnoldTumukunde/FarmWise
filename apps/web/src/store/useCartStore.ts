import { create } from 'zustand';
import { fetchApi } from '@/lib/api';

export interface CartItem {
  id: string;
  courseId: string;
  course: {
    id: string;
    slug: string;
    title: string;
    thumbnailPublicId: string | null;
    price: number;
    instructor: { name?: string; profile?: { displayName: string } };
  };
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  fetched: boolean;
  fetchCart: () => Promise<void>;
  addItem: (courseId: string) => Promise<void>;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  itemCount: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  fetched: false,

  fetchCart: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const res = await fetchApi('/cart');
      const items = (res.items || res.cart?.items || []).map((item: any) => ({
        id: item.id,
        courseId: item.courseId,
        course: {
          id: item.course?.id || item.courseId,
          slug: item.course?.slug || '',
          title: item.course?.title || '',
          thumbnailPublicId: item.course?.thumbnailPublicId || null,
          price: Number(item.course?.price) || 0,
          instructor: {
            name: item.course?.instructor?.profile?.displayName || item.course?.instructor?.name || 'Instructor',
          },
        },
      }));
      set({ items, fetched: true });
    } catch {
      set({ items: [], fetched: true });
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (courseId: string) => {
    try {
      await fetchApi('/cart', {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      });
      get().fetchCart();
    } catch {
      // silently fail — toast handled at call site
    }
  },

  removeItem: (itemId: string) => {
    const prev = get().items;
    set({ items: prev.filter((i) => i.id !== itemId) });
    fetchApi(`/cart/${itemId}`, { method: 'DELETE' }).catch(() => {
      set({ items: prev });
    });
  },

  clearCart: () => set({ items: [], fetched: false }),

  itemCount: () => get().items.length,

  total: () => get().items.reduce((sum, i) => sum + (i.course.price || 0), 0),
}));
