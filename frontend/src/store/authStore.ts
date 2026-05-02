import { create } from 'zustand';
import { User, Company } from '../types';

interface AuthState {
  user: User | null;
  company: Company | null;
  isLoading: boolean;
  setAuth: (user: User, company: Company) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  company: null,
  isLoading: true,
  setAuth: (user, company) => set({ user, company, isLoading: false }),
  clearAuth: () => set({ user: null, company: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
