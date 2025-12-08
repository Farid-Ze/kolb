export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["assets/models/brain.glb","assets/models/mneme-shards.glb","assets/sphere/node-1.jpg","assets/sphere/node-2.jpg","assets/sphere/node-3.jpg","assets/sphere/node-4.jpg","assets/sphere/node-5.jpg","assets/sphere/node-6.jpg","assets/textures/frost-disturb.jpg","assets/textures/noise.png","assets/textures/zenotika-logo.png"]),
	mimeTypes: {".glb":"model/gltf-binary",".jpg":"image/jpeg",".png":"image/png"},
	_: {
		client: {start:"_app/immutable/entry/start.CrUvw2MK.js",app:"_app/immutable/entry/app.DUbxjTwc.js",imports:["_app/immutable/entry/start.CrUvw2MK.js","_app/immutable/chunks/CmdDrUbu.js","_app/immutable/chunks/CkpG1Ui7.js","_app/immutable/chunks/D0Urrntl.js","_app/immutable/chunks/E0fAqY1C.js","_app/immutable/entry/app.DUbxjTwc.js","_app/immutable/chunks/CkpG1Ui7.js","_app/immutable/chunks/33f3phWG.js","_app/immutable/chunks/BeueiIU2.js","_app/immutable/chunks/E0fAqY1C.js","_app/immutable/chunks/Cg40V8I9.js","_app/immutable/chunks/DEOOh210.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/assessment",
				pattern: /^\/assessment\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/insights",
				pattern: /^\/insights\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/sphere",
				pattern: /^\/sphere\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
