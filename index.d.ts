declare class Settings {
	/**
	 * Base of request URI, `window.location.hostname` by default
	 * @example
	 * API.settings.base = 'api.' + window.location.hostname + ':8081'
	 */
	base?: string;
	/**
	 * Indicates whether to use secure connection (HTTPS/WSS), `true` by default
	 * @example
	 * // API will use secure connection only in production
	 * API.settings.secure = !API.settings.dev()
	 */
	secure?: boolean;
	/**
	 * Returns `true` if running in development mode, otherwise returns `false`
	 */
	dev? (): boolean;
	/**
	 * Changes development mode detection method
	 * @example
	 * // Default development mode detection method
	 * API.settings.dev(process.env.NODE_ENV === 'development')
	 */
	dev? (isDev: boolean): void;
	/**
	 * WebSocket reconnection attempts, `5` by default
	 */
	reconnectAttempts?: number;
	/**
	 * WebSocket reconnection timeout in seconds, `2.5` by default
	 */
	reconnectTimeout?: number;
}

interface IAPIResponse {
	success: boolean;
	code: number;
	msg: any;
}

declare class APIInstance {
	/**
	 * Stores API connection settings
	 */
	public settings: Settings;
	/**
	 * Alternative way to send API request
	 * @param controller Controller name
	 * @param action Action name
	 * @param data Any JSON compitable object, `null` by default
	 * @param query GET query pairs object, `null` by default
	 */
	public send (controller: string, action: string, data: any, query: object): Promise<IAPIResponse>;

	[key: string]: any;
	// TODO: understand and fix
	// [key: string]: {
	// 	/**
	// 	 * Sends API request
	// 	 * @param data Any JSON compitable object, `null` by default
	// 	 * @param query GET query pairs object, `null` by default
	// 	 */
	// 	[key: string]: (data: any, query: object) => void
	// }
}

declare class RootAPIInstance extends APIInstance {
	/**
	 * Contains all registered instances
	 */
	public instances: { [key: string]: APIInstance };
	/**
	 * Registers new API instance with specified name and settings
	 */
	public registerInstance (name: string, settings: Settings): APIInstance;
	/**
	 * Sends POST request in browser with form
	 * @param url Destination URL
	 * @param data Object with POST data
	 * @param newtab Indicates whether to submit the form in new tab, `false` by default
	 */
	public post (url: string, data: object, newtab: boolean): void;
}

// @ts-ignore
export default new RootAPIInstance();
