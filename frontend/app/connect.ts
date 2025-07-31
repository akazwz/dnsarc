import {
	Code,
	ConnectError,
	createClient,
	type Interceptor,
} from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { AuthService } from "gen/auth/v1/auth_pb";
import { DNSRecordService } from "gen/dns_record/v1/dns_record_pb";
import { ZoneService } from "gen/zone/v1/zone_pb";
import { useAuthStore } from "~/stores/auth";

const authInterceptor: Interceptor = (next) => async (req) => {
	const token = useAuthStore.getState().accessToken;
	if (token) {
		req.header.append("Authorization", `Bearer ${token}`);
	}
	try {
		return await next(req);
	} catch (err) {
		if (err instanceof ConnectError && err.code === Code.Unauthenticated) {
			useAuthStore.getState().signOut();
		}
		throw err;
	}
};

const transport = createConnectTransport({
	baseUrl: import.meta.env.VITE_API_URL,
	interceptors: [authInterceptor],
});

export const authClient = createClient(AuthService, transport);
export const zoneClient = createClient(ZoneService, transport);
export const dnsRecordClient = createClient(DNSRecordService, transport);
