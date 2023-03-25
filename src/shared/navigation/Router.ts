import events from './events';
import BrowserNavigation, { NavigationHistoryState } from './BrowserNavigation';
import { CommonShared } from '../interfaces/common';
import { View } from '../components';

type ActiveViewChangedCallback = (newView: string, previousView: string | null, metaData?: any) => void;
type RouterNavigateCallback = (newPath: string, previousPath: string | null) => void;
type RouterBeforeNavigateCallback = (
	newPath: string,
	previousPath: string | null,
	newFullPath: string
) => void | Promise<boolean>;

export interface UrlParamLookup {
	key: string;
	default: number | string;
	type: 'integer' | 'float' | 'string';
	alias?: string;
}

interface RouteDetailsWithPathParams extends CommonShared.RouteDetails<string> {
	pathParams?: { [key: string]: string };
}

// Router configs control how the router operates. Some of these values are used when no RouteDetails are specified and
// the navigate/back functions are called without options. The order of precedence is:
// HIGHEST -> Navigate/Back Options -> Route Options -> Router Options -> LOWEST
export interface RouterConfig {
	animate: boolean; // (TRUE) By default when not specified do we animate?
	allowSwipeBack: boolean; // (TRUE) By default when not specified do we animate?
}

let routerInstance: Router;

class Router {
	public initialSiteTitle = '';
	public initialSiteDescription = '';

	private views: { [key: string]: View } = {};
	private routes: CommonShared.RouteDetails<string>[] = [];
	private notFoundRoute: CommonShared.RouteDetails<string> | undefined;
	private viewHistory: string[] = [];
	private navigating = false;
	private readonly routerConfig: RouterConfig = {
		animate: true,
		allowSwipeBack: true
	};

	private pendingNavigation: {
		path: string;
		options?: CommonShared.NavigateOptions;
		forwardBrowserEvent?: boolean;
	}[] = [];
	private pendingBack: { state: NavigationHistoryState }[] = [];
	private currentViewName: string = '';
	private lastKnownViewName: string | null = null;
	private goingBack: boolean = false;

	private activeViewChangedCallbackList: { id: number; callback: ActiveViewChangedCallback }[] = [];
	private beforeNavigateCallbackList: { id: number; callback: RouterBeforeNavigateCallback }[] = [];
	private afterNavigateCallbackList: { id: number; callback: RouterNavigateCallback }[] = [];

	private readonly initialStartPathQuery: string;
	private initialPathLoadAttempted: boolean = false;

	private browserNavigation: BrowserNavigation;

	constructor(routerConfig?: Partial<RouterConfig>) {
		if (routerConfig) this.routerConfig = { ...this.routerConfig, ...routerConfig };
		routerInstance = this;

		this.browserNavigation = new BrowserNavigation();

		this.onBackButtonPressed = this.onBackButtonPressed.bind(this);
		this.onForwardButtonPressed = this.onForwardButtonPressed.bind(this);
		this.onCheckNavigation = this.onCheckNavigation.bind(this);
		this.browserNavigation.onBackPressed(this.onBackButtonPressed);
		this.browserNavigation.onForwardPressed(this.onForwardButtonPressed);
		this.browserNavigation.onCheckNavigation(this.onCheckNavigation);

		// Determine if we are loading an alternative initialPath
		let path = window.location.pathname;
		path = path.replace(/^(.+?)\/*?$/, '$1'); // Remove trailing slash
		path += window.location.search;
		this.initialStartPathQuery = path;

		this.initialSiteTitle = document.title;

		const metaTags = document.getElementsByTagName('meta');
		for (let i = 0; i < metaTags.length; i++) {
			if (!metaTags[i].getAttributeNames().includes('name')) continue;
			if (metaTags[i].getAttribute('name') !== 'description') continue;
			this.initialSiteDescription = metaTags[i].getAttribute('content') || '';
		}

		// events.on('pageDidMount', (pageElement: HTMLElement) => {
		// 	setTimeout(() => {
		// 		animatePageForView(pageElement.parentElement);
		// 	}, 10);
		// });
		//
		// events.on('pageDidUpdate', (pageElement: HTMLElement) => {
		// 	// setTimeout(() => {
		// 	//   animatePageForView(pageElement.parentElement);
		// 	// }, 10);
		// });
		//
		// events.on('pageWillUnmount', (pageElement: HTMLElement) => {
		// 	// let parent = pageElement.parentElement
		// 	// setTimeout(() => {
		// 	//   animatePageForView(parent);
		// 	// }, 10);
		// });

		events.on('routerBack', (data: { view: string }) => {
			this.back();
		});

		events.on('addView', (data: { id: string; instance: View; default: boolean }) => {
			if (this.currentViewName && !this.currentViewName.toLowerCase().includes('popup')) {
				this.lastKnownViewName = this.currentViewName;
				this.viewHistory.push(this.currentViewName);
			}

			this.addView(data.id, data.instance);

			let routeDetails = this.getRouteDetailsForPath(data.instance.getPath());

			if (!routeDetails) {
				console.error(
					'view just added has an initial path that does not exist in router!!!',
					data.instance.getPath()
				);
				return;
			}

			if (routeDetails.routeGuard) {
				let result = routeDetails.routeGuard(routeDetails.path);

				if (typeof result === 'boolean') {
					if (!result) {
						console.error('view just added route guard did not give alternate path!!!');
						return;
					} else {
						data.instance.setPage(routeDetails.page, data.instance.getPath());
					}
				} else if (typeof result === 'string') {
					let newRouteDetails = this.getRouteDetailsForPath(result);
					if (!newRouteDetails) {
						console.error('view just added has an initial path that does not exist in router!!!', result);
						return;
					}

					data.instance.setPage(newRouteDetails.page, result);
				}
			} else {
				data.instance.setPage(routeDetails.page, data.instance.getPath());
			}

			if (data.default) {
				this.setActiveView(data.id);
				this.browserNavigation.replaceState({ path: data.instance.getPath(), viewName: data.id });
			}
		});

		events.on('removeView', (data: { id: string }) => {
			this.removeView(data.id);
		});

		events.on('activeViewChange', async (viewName: string) => {
			if (this.currentViewName === viewName) {
				await this.forceHome();
				return;
			}

			if (!this.views.hasOwnProperty(viewName)) return;

			const previousPathNoQuery = this.views[this.currentViewName].getPath().split('?')[0];
			const newPathNoQuery = this.views[viewName].getPath().split('?')[0];

			this.fireBeforeRouterNavigateCallbacks(newPathNoQuery, previousPathNoQuery, this.views[viewName].getPath());

			this.setActiveView(viewName);

			let currentView = this.views[this.currentViewName];
			this.browserNavigation.pushHistory({
				viewName: this.currentViewName,
				path: currentView.getPath()
			});

			this.fireAfterRouterNavigateCallbacks(newPathNoQuery, previousPathNoQuery);
		});
	}

	static getInstance(): Router {
		return routerInstance;
	}

	/**
	 * Returns the current active name
	 * @returns {string | null} The current view name
	 */
	getActiveViewName(): string | null {
		return this.currentViewName;
	}

	/**
	 * Returns the current path loaded by the browser
	 * @returns {string} The current path, does not include query or hash
	 */
	getCurrentPath(): string {
		return window.location.pathname;
	}

	/**
	 * Dyanmically adds a route
	 * @param {RouteDetails} newRoute - The router to add given as an array
	 */
	addRoute(route: CommonShared.RouteDetails<string>) {
		this.routes.push(route);
	}

	/**
	 * Sets the routes to the router for the application. WARNING: Must be called before any views are rendered!
	 * @param {RouteDetails[]} initialRoutes - The static router used on start
	 */
	loadStaticRoutes(initialRoutes: CommonShared.RouteDetails<string>[]) {
		this.routes = initialRoutes;
		this.notFoundRoute = this.routes.find((route) => {
			return route.path === '*';
		});
	}

	/**
	 * Attempts to load the initial path with the possibility of getting a 404 page. This is usually called when
	 * the main app determines if the user is logged in or not
	 */
	async tryToLoadInitialPath() {
		if (this.initialStartPathQuery === '/' || this.initialPathLoadAttempted) return;

		this.initialPathLoadAttempted = true;
		let initialPathNoQuery = this.initialStartPathQuery.split('?')[0];
		let initialPathRouteDetails = this.getRouteDetailsForPath(initialPathNoQuery);
		if (!initialPathRouteDetails) {
			if (this.notFoundRoute) {
				// Find the default view
				for (let viewName in this.views) {
					if (this.views[viewName].isDefault()) {
						this.setActiveView(viewName);
						this.views[viewName].setPage(this.notFoundRoute.page, this.initialStartPathQuery);
						this.browserNavigation.replaceState({
							path: this.initialStartPathQuery,
							viewName
						});
						return;
					}
				}
			}
			console.error("Invalid route given and we don't have a valid 404 page.");
			return;
		}

		if (!this.checkRouteGuard(initialPathRouteDetails)) return;

		const pathNoQuery = this.initialStartPathQuery.split('?')[0];
		let prevent = await this.fireBeforeRouterNavigateCallbacks(pathNoQuery, '/', this.initialStartPathQuery);
		if (prevent) return;

		if (initialPathRouteDetails?.options?.view) {
			if (!this.setActiveView(initialPathRouteDetails.options.view)) return;
		}

		this.browserNavigation.replaceState({
			path: this.initialStartPathQuery,
			viewName: this.currentViewName
		});

		this.views[this.currentViewName].setPage(initialPathRouteDetails.page, this.initialStartPathQuery);
		this.fireAfterRouterNavigateCallbacks(pathNoQuery, '/');
	}

	/**
	 * Add callback and subscribe to active view changed event
	 * @param {ActiveViewChangedCallback} callback
	 * @returns {number}
	 */
	subscribeToActiveViewChanged(callback: ActiveViewChangedCallback): number {
		const id = Date.now();
		this.activeViewChangedCallbackList.push({ id, callback });
		return id;
	}

	/**
	 * Remove subscribed callback of active view changed event
	 * @param id
	 */
	unsubscribeFromActiveViewChanged(id: number) {
		this.activeViewChangedCallbackList = this.activeViewChangedCallbackList.filter((callbackHandler) => {
			return callbackHandler.id !== id;
		});
	}

	/**
	 * Add callback and subscribe to the before router navigation events
	 * @param {RouterNavigateCallback} callback
	 * @returns {number}
	 */
	subscribeToBeforeRouterNavigate(callback: RouterBeforeNavigateCallback): number {
		const id = Date.now();
		this.beforeNavigateCallbackList.push({ id, callback });
		return id;
	}

	/**
	 * Remove subscribed callback of before router navigation events
	 * @param id
	 */
	unsubscribeFromBeforeRouterNavigate(id: number) {
		this.beforeNavigateCallbackList = this.beforeNavigateCallbackList.filter((callbackHandler) => {
			return callbackHandler.id !== id;
		});
	}

	/**
	 * Add callback and subscribe to the after router navigation events
	 * @param {RouterNavigateCallback} callback
	 * @returns {number}
	 */
	subscribeToAfterRouterNavigate(callback: RouterNavigateCallback): number {
		const id = Date.now();
		this.afterNavigateCallbackList.push({ id, callback });
		return id;
	}

	/**
	 * Remove subscribed callback of after router navigation events
	 * @param id
	 */
	unsubscribeFromAfterRouterNavigate(id: number) {
		this.afterNavigateCallbackList = this.afterNavigateCallbackList.filter((callbackHandler) => {
			return callbackHandler.id !== id;
		});
	}

	/**
	 * Go back. Eventually should be smarter to say back in a certain view
	 */
	back<T = string>(fallbackPath?: T) {
		if (!this.browserNavigation.back() && fallbackPath) {
			this.navigate(fallbackPath).catch(console.error);
		}
	}

	/**
	 * Force current view to initialPath specified when view was added
	 */
	forceHome() {
		let path = this.views[this.currentViewName as string].getInitialPath();
		return this.navigate(path);
	}

	/**
	 * Changes the current view to the given view name
	 * @param {string} viewName - The name of the view to change to
	 */
	async changeView(viewName: string) {
		let foundView = this.views[viewName];
		if (!foundView) {
			console.error(`View ${viewName} not found`);
			return;
		}
		let path = foundView.getPath();
		await this.navigate(path, { view: viewName });
	}

	/**
	 * Navigate to input path
	 * @param path
	 * @param {CommonShared.NavigateOptions} options
	 * @param forwardBrowserEvent - Set if navigate was result of a forward button event
	 */
	async navigate<T = string>(path: T, options?: CommonShared.NavigateOptions, forwardBrowserEvent?: boolean) {
		if (!(await this.loadUrlCheck(path as unknown as string, options))) return;
		await this.navigateAllow(path as unknown as string, options, forwardBrowserEvent);
	}

	/**
	 * Retrieves from the current URL the query parameters
	 * @param {UrlParamLookup} params - The params in which to get. Includes defaults
	 * @returns UrlParamLookup[]
	 */
	getQueryParams<T>(params: UrlParamLookup[]): T {
		const urlParams = new URLSearchParams(window.location.search);
		let result: { [key: string]: string | number } = {};
		for (let param of params) {
			if (urlParams.has(param.key)) {
				let paramValue = urlParams.get(param.key) as string;
				if (param.type === 'integer') result[param?.alias || param.key] = parseInt(paramValue);
				else if (param.type === 'float') result[param?.alias || param.key] = parseFloat(paramValue);
				else result[param?.alias || param.key] = paramValue;
			} else {
				result[param?.alias || param.key] = param.default;
			}
		}
		//@ts-ignore
		return result;
	}

	/**
	 * Retrieves from the current URL the parameters
	 * @param {UrlParamLookup} params - The params in which to get. Includes defaults
	 * @returns UrlParamLookup[]
	 */
	getPathParams<T>(params: UrlParamLookup[]): T {
		let routeDetails = this.getRouteDetailsForPath(window.location.pathname);
		let result: { [key: string]: string | number } = {};
		for (let param of params) {
			if (routeDetails?.pathParams && routeDetails.pathParams.hasOwnProperty(param.key)) {
				let paramValue = routeDetails.pathParams[param.key];
				if (param.type === 'integer') result[param?.alias || param.key] = parseInt(paramValue);
				else if (param.type === 'float') result[param?.alias || param.key] = parseFloat(paramValue);
				else result[param?.alias || param.key] = paramValue;
			} else {
				result[param?.alias || param.key] = param.default;
			}
		}

		//@ts-ignore
		return result;
	}

	/**
	 * Updates the current page's URL parameters. This should only be called by the page that is loaded.
	 * @param params - object containing parameters to be set in the url.
	 */
	updateQueryParams(params: { [key: string]: number | string }) {
		let paramString = '';
		if (!this.currentViewName) return;
		for (let i in params) {
			let paramValue: string = params[i].toString();
			if (!paramString) paramString = `?${i}=${paramValue}`;
			else paramString += `&${i}=${paramValue}`;
		}
		let url = this.views[this.currentViewName].getPath().split('?')[0] + paramString;
		this.browserNavigation.replaceState({
			path: url,
			viewName: this.currentViewName
		});
	}

	/**
	 * Performs the actual navigate to a page. Must be proceeded by a loadUrlCheck()
	 * @param path
	 * @param options
	 * @param forwardBrowserEvent
	 * @private
	 */
	private async navigateAllow(path: string, options?: CommonShared.NavigateOptions, forwardBrowserEvent?: boolean) {
		if (this.navigating) return this.navigateLater(path, options, forwardBrowserEvent);
		this.navigating = true;

		const url = new URL(path, 'https://unknown.com');
		const pathNoQueryNoHash = url.pathname;

		let routeDetails = this.getRouteDetailsForPath(path) || this.notFoundRoute;
		if (!routeDetails) return;

		let requestedView = options?.view || routeDetails.options?.view;
		if (requestedView && requestedView !== this.currentViewName) {
			this.setActiveView(requestedView);
		}
		let currentView = this.calculateCurrentView(options?.view);
		if (!this.views[currentView]) {
			this.navigating = false;
			this.navigateFinished();
			console.error('this view does not exist.', currentView);
			return;
		}

		if (!forwardBrowserEvent)
			this.browserNavigation.pushHistory({ path, viewName: currentView, routeOptions: options });
		await this.views[currentView].setPage(routeDetails.page, path);

		// To get the browser to page down to the location we need to use window.location.replace
		// However this is great for navigating forward, more code needs to be written for backwards
		// and forwards navigations whenever we have a hash..commenting out until I have time to
		// do it right.
		// if (url.hash) window.location.replace(path);

		this.fireAfterRouterNavigateCallbacks(pathNoQueryNoHash, this.getCurrentPath());

		this.navigating = false;
		this.navigateFinished();
	}

	/**
	 * Checks route guards and before navigation checks
	 * @param path
	 * @param options
	 * @private
	 */
	private async loadUrlCheck(path: string, options?: CommonShared.NavigateOptions): Promise<boolean> {
		const url = new URL(path, 'https://unknown.com');
		const pathNoQueryNoHash = url.pathname;

		let routeDetails = this.getRouteDetailsForPath(path) || this.notFoundRoute;
		if (!routeDetails) {
			console.error('this path does not exist.', path);
			return false;
		}

		if (!this.checkRouteGuard(routeDetails)) {
			return false;
		}

		let prevent = await this.fireBeforeRouterNavigateCallbacks(pathNoQueryNoHash, this.getCurrentPath(), path);
		if (prevent) {
			return false;
		}
		return true;
	}

	private checkRouteGuard(routeDetails: CommonShared.RouteDetails<string>): boolean {
		if (!routeDetails.routeGuard) return true;

		let result = routeDetails.routeGuard(routeDetails.path);
		if (typeof result === 'string') {
			this.navigate(result);
			return false;
		}

		if (!result) {
			this.navigate('/');
			return false;
		}

		return true;
	}

	/**
	 * Calls all registered callbacks
	 * @param {string} newPath
	 * @param {string} previousPath
	 * @return Returns true if we should prevent navigating to the next route.
	 */
	private async fireBeforeRouterNavigateCallbacks(
		newPath: string,
		previousPath: string,
		newFullPath: string
	): Promise<boolean> {
		let prevent = false;
		for (let callback of this.beforeNavigateCallbackList) {
			let callbackPreventPromise = callback.callback(newPath, previousPath, newFullPath);
			if (callbackPreventPromise && (await callbackPreventPromise)) prevent = true;
		}
		return prevent;
	}

	/**
	 * Calls all registered callbacks
	 * @param {string} newPath
	 * @param {string} previousPath
	 */
	private fireAfterRouterNavigateCallbacks(newPath: string, previousPath: string) {
		for (let callback of this.afterNavigateCallbackList) {
			callback.callback(newPath, previousPath);
		}
	}

	private findFirstViewName(potentialViewNames: string | string[]): string | null {
		if (typeof potentialViewNames === 'string') {
			if (this.views.hasOwnProperty(potentialViewNames)) return potentialViewNames;
		} else if (Array.isArray(potentialViewNames)) {
			for (let name of potentialViewNames) {
				if (this.views.hasOwnProperty(name)) return name;
			}
		}
		return null;
	}

	/**
	 * Set active view to input view
	 * @param {string} viewName
	 * @param metaData
	 */
	private setActiveView(viewName: string | string[], metaData?: any): boolean {
		let foundViewName = this.findFirstViewName(viewName);
		if (!foundViewName) return false;

		const previousViewName = this.currentViewName;
		this.currentViewName = foundViewName;
		const viewElement = document.getElementById(foundViewName);
		if (!viewElement || !viewElement.parentElement) return false;
		// Remove activeView from all elements
		for (let child of Array.from(viewElement.parentElement.children)) {
			if (child.classList.contains('rsView')) child.classList.remove('active');
		}
		viewElement.classList.add('active');

		for (let handler of this.activeViewChangedCallbackList) {
			handler.callback(foundViewName, previousViewName, metaData);
		}

		return true;
	}

	/**
	 * Calculates a current view with optional view name passed in. I think I want this method removed
	 * @param optionalViewName
	 */
	private calculateCurrentView(optionalViewName?: string | string[]) {
		return this.findFirstViewName(optionalViewName || '') || this.currentViewName || this.lastKnownViewName || '';
	}

	/**
	 * Called when the browser notifies us of a backwards navigation
	 * @param newState
	 * @private
	 */
	private async navigateBack(newState: NavigationHistoryState) {
		if (this.goingBack) return this.backLater(newState);
		this.goingBack = true;

		const pathNoQuery = newState.path.split('?')[0];

		let routeDetails = this.getRouteDetailsForPath(newState.path) as CommonShared.RouteDetails<string>;

		this.setActiveView(newState.viewName);
		await this.views[newState.viewName].back(routeDetails.page, newState.path);

		this.fireAfterRouterNavigateCallbacks(pathNoQuery, this.getCurrentPath());

		this.goingBack = false;
		this.backFinished().catch(console.error);
	}

	private getRouteDetailsForPath(path: string): RouteDetailsWithPathParams | undefined {
		let pathNoQueryNoHash = path.split('?')[0].split('#')[0];
		let viewNames = Object.keys(this.views);

		// Check for exact matches first
		let foundRoute = this.routes.find((route) => {
			if (route.options?.view && !viewNames.includes(route.options?.view)) return false;
			return route.path === pathNoQueryNoHash;
		});

		let pathParams: { [key: string]: string } = {};

		if (!foundRoute) {
			// Check for router with path parameters
			foundRoute = this.routes.find((route) => {
				if (route.options?.view && !viewNames.includes(route.options?.view)) return false;

				if (!route.path.includes(':')) return false;

				let routePathParts = route.path.split('/').filter(Boolean);
				let pathParts = pathNoQueryNoHash.split('/').filter(Boolean);
				if (routePathParts.length !== pathParts.length) return false;
				if (routePathParts.length === 0) return false;
				for (let i = 0; i < routePathParts.length; i++) {
					if (routePathParts[i].includes(':')) {
						pathParams[routePathParts[i].slice(1)] = pathParts[i];
						continue;
					}
					if (routePathParts[i] !== pathParts[i]) return false;
				}
				return true;
			});
		}

		if (foundRoute) return { ...foundRoute, pathParams };
		return foundRoute;
	}

	private async navigateFinished() {
		let toNavigate = this.pendingNavigation.pop();
		if (toNavigate) await this.navigateAllow(toNavigate.path, toNavigate.options, toNavigate.forwardBrowserEvent);
	}

	private navigateLater(path: string, options?: CommonShared.NavigateOptions, forwardBrowserEvent?: boolean) {
		this.pendingNavigation.push({ path, options, forwardBrowserEvent });
	}

	private async backFinished() {
		let toGoBack = this.pendingBack.pop();
		if (toGoBack) await this.navigateBack(toGoBack.state);
	}

	private backLater(state: NavigationHistoryState) {
		this.pendingBack.push({ state });
	}

	private addView(id: string, instance: View) {
		this.views[id] = instance;
		this.viewHistory.push(id);
	}

	private removeView = (id: string) => {
		delete this.views[id];
		this.viewHistory.pop();
		this.currentViewName = this.viewHistory[this.viewHistory.length - 1];
	};

	private async onBackButtonPressed(newState: NavigationHistoryState) {
		await this.navigateBack(newState);
	}

	private async onForwardButtonPressed(state: NavigationHistoryState) {
		await this.navigateAllow(state.path, state.routeOptions, true);
	}

	private async onCheckNavigation(state: NavigationHistoryState): Promise<boolean> {
		return this.loadUrlCheck(state.path, state.routeOptions);
	}
}

export { Router };
