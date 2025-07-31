import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("login", "routes/login.tsx"),
	route("register", "routes/register.tsx"),
	route("dash", "routes/dash.tsx"),
	route("dash/:domain", "routes/zone.tsx"),
] satisfies RouteConfig;
