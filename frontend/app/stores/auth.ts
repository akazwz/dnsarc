import type { User } from "gen/auth/v1/auth_pb";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
	user: User | null;
	accessToken: string | null;
	signIn: (user: User, accessToken: string) => void;
	signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			user: null,
			accessToken: null,
			signIn: (user: User, accessToken: string) => {
				set({ user, accessToken });
			},
			signOut: () => {
				set({ user: null, accessToken: null });
			},
		}),
		{
			name: "auth-storage",
		},
	),
);
