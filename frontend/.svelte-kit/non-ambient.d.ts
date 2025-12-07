
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/assessment" | "/insights" | "/sphere";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/assessment": Record<string, never>;
			"/insights": Record<string, never>;
			"/sphere": Record<string, never>
		};
		Pathname(): "/" | "/assessment" | "/assessment/" | "/insights" | "/insights/" | "/sphere" | "/sphere/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/assets/models/brain.glb" | "/assets/sphere/node-1.jpg" | "/assets/sphere/node-2.jpg" | "/assets/sphere/node-3.jpg" | "/assets/sphere/node-4.jpg" | "/assets/sphere/node-5.jpg" | "/assets/sphere/node-6.jpg" | "/assets/textures/frost-disturb.jpg" | "/assets/textures/noise.png" | string & {};
	}
}