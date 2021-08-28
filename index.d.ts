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
	/**
	 * Transform controller and antion names into kebab-case
	 */
	useKebab?: boolean;
}

interface APIResponse {
	/** `true` if response code is `200` */
	success: boolean;
	/** HTTP response code */
	code: number;
	/** Server response */
	msg: any;
}

type EventListener = (...args: any[]) => void;
declare interface Socket {
	/** Vanilla socket connection object */
	socket: WebSocket;
	/** WebSocket endpoint path without starting slash */
	path: string;

	/**
	 * Registers event listener
	 * @param event Event name
	 * @param listener Event listener to register
	 */
	on (event: string, listener: EventListener): void;
	/**
	 * Registers event listener for one time execution
	 * @param event Event name
	 * @param listener Event listener to register
	 */
	once (event: string, listener: EventListener): void;
	/**
	 * Unregisters event listener
	 * @param event Event name
	 * @param listener Event listener to unregister
	 */
	off (event: string, listener: EventListener): void;
	/**
	 * Sends WebSocket message to API server
	 * @param event Event name
	 * @param args Any JSON compitable arguments for event handler
	 */
	emit (event: string, ...args: any[]): void;
	/**
	 * Closes socket connection
	 */
	close (): void;
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
	public send (controller: string, action: string, data: any, query: object): Promise<APIResponse>;

	/**
	 * WebSocket connection wrapper
	 */
	public socket: Socket;
	/**
	 * WebSocket connection wrapper
	 */
	public Socket: Socket;

	[key: string]: Socket | {
		/**
		 * Sends API request
		 * @param data Any JSON compitable object, `null` by default
		 * @param query GET query pairs object, `null` by default
		 */
		[key: string]: (data: any, query: object) => Promise<APIResponse>;
	}
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

export default new RootAPIInstance();
