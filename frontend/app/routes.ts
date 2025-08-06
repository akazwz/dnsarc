import {
	index,
	layout,
	type RouteConfig,
	route,
} from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("auth", "routes/auth.tsx"),
	layout("routes/dash/layout.tsx", [
		route("/dash", "routes/dash/index.tsx"),
		route("/dash/zones", "routes/dash/zones.tsx"),
		route("/dash/zone/:name", "routes/dash/zone.tsx"),
		route("/dash/account", "routes/dash/account.tsx"),
	]),
] satisfies RouteConfig;
