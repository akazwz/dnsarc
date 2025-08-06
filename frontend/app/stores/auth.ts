import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
	accessToken: string | null;
	signIn: (accessToken: string) => void;
	signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			accessToken: null,
			signIn: (accessToken: string) => {
				set({ accessToken });
			},
			signOut: () => {
				set({ accessToken: null });
			},
		}),
		{
			name: "auth-storage",
		},
	),
);
