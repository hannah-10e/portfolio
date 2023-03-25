import { CommonShared } from '../interfaces/common';

type NavigationCallback = (state: NavigationHistoryState) => void;
type CheckNavigationCallback = (state: NavigationHistoryState) => Promise<boolean>;

// Contains all the state information for when a page navigated
export interface NavigationHistoryState {
	path: string;
	viewName: string;
	routeOptions?: CommonShared.NavigateOptions;
}

// Contains the state data and extra info needed by the browser
interface NavigationHistoryExtra {
	key: number;
	isBacked: boolean;
	state: NavigationHistoryState;
}

class BrowserNavigation {
	private lastHistoryTime: number = 0;
	private historyData: NavigationHistoryExtra[] = [];
	private backCallbacks: NavigationCallback[] = [];
	private forwardCallbacks: NavigationCallback[] = [];
	private checkNavigationCallbacks: CheckNavigationCallback[] = [];

	constructor() {
		this.onPopState = this.onPopState.bind(this);
		window.onpopstate = this.onPopState;

		(window as any).browserNavigation = this;
	}

	getLastHistoryTime() {
		return this.lastHistoryTime;
	}

	replaceState(state: NavigationHistoryState) {
		let swappedState: NavigationHistoryExtra | undefined;
		if (this.historyData.length > 0) {
			this.historyData = this.historyData.map((item) => {
				if (item.key !== window.history.state.key) return item;
				swappedState = { ...item, state };
				return swappedState;
			});
		} else {
			swappedState = {
				key: Date.now(),
				isBacked: false,
				state
			};
			this.historyData.push(swappedState);
		}

		if (swappedState) window.history.replaceState(this.createBrowserState(swappedState.key), '', state.path);
		this.printAllViewHistory();
	}

	pushHistory(state: NavigationHistoryState) {
		this.deleteAllBackedStates();

		let history: NavigationHistoryExtra = {
			key: Date.now(),
			state,
			isBacked: false
		};

		this.historyData.push(history);
		this.lastHistoryTime = history.key;
		window.history.pushState(this.createBrowserState(history.key), '', state.path);

		this.printAllViewHistory();
	}

	back(): boolean {
		if (this.historyData.length < 2) return false;
		window.history.back();
		return true;
	}

	forward() {
		window.history.forward();
	}

	onBackPressed(callback: NavigationCallback) {
		this.backCallbacks.push(callback);
	}

	onForwardPressed(callback: NavigationCallback) {
		this.forwardCallbacks.push(callback);
	}

	onCheckNavigation(callback: CheckNavigationCallback) {
		this.checkNavigationCallbacks.push(callback);
	}

	private async onPopState(e: PopStateEvent) {
		if (!e.state) {
			console.error("Received a browser action but we don't have any state to navigate to.");
			return;
		}

		if (window.hasOwnProperty('showBrowseLogs')) console.log('POP STATE (TEST): ', e.state);

		let { key } = e.state;
		let viewHistoryState = this.getMatchingViewHistoryState(key);
		if (!viewHistoryState) {
			console.error("We don't have a matching history state for browser event!!!");
			return;
		}

		// Check to see if we allow this navigation, if not push the state back on
		if (!(await this.checkNavigation(viewHistoryState))) {
			if (window.hasOwnProperty('showBrowseLogs')) console.log('rejected navigation');
			let prevHistoryState = this.getMatchingViewHistoryState(this.lastHistoryTime);
			if (!prevHistoryState) {
				console.error("We don't have a matching history state for previous history!!!");
				return;
			}
			window.history.pushState(this.createBrowserState(this.lastHistoryTime), '', prevHistoryState.state.path);
			return;
		}

		if (this.lastHistoryTime < key) {
			// Forward Button Navigate
			this.clearHistoryStateBacked(key);
			this.lastHistoryTime = key;
			this.printAllViewHistory();
			this.fireForwardEvent(viewHistoryState);
		} else {
			// Back Button Navigate
			this.setHistoryStateBacked(this.lastHistoryTime);
			this.lastHistoryTime = key;
			this.printAllViewHistory();

			this.fireBackEvent(viewHistoryState);
		}
	}

	getMatchingViewHistoryState(key: number): NavigationHistoryExtra | undefined {
		return this.historyData.find((item) => {
			return item.key === key;
		});
	}

	setHistoryStateBacked(key: number) {
		let history = this.getMatchingViewHistoryState(key);
		if (!history) {
			console.error('Could not find history matching key: ', key);
			return;
		}
		history.isBacked = true;
	}

	clearHistoryStateBacked(key: number) {
		let history = this.getMatchingViewHistoryState(key);
		if (!history) {
			console.error('Could not find history matching key: ', key);
			return;
		}
		history.isBacked = false;
	}

	fireBackEvent(newHistory: NavigationHistoryExtra) {
		if (window.hasOwnProperty('showBrowseLogs')) console.log('Browser back clicked');
		for (let i in this.backCallbacks) {
			this.backCallbacks[i](newHistory.state);
		}
	}

	fireForwardEvent(newHistory: NavigationHistoryExtra) {
		if (window.hasOwnProperty('showBrowseLogs')) console.log('Browser forward clicked');
		for (let i in this.forwardCallbacks) {
			this.forwardCallbacks[i](newHistory.state);
		}
	}

	async checkNavigation(newHistory: NavigationHistoryExtra): Promise<boolean> {
		for (let i in this.checkNavigationCallbacks) {
			if (!(await this.checkNavigationCallbacks[i](newHistory.state))) return false;
		}
		return true;
	}

	createBrowserState(key: number) {
		return { key };
	}

	deleteAllBackedStates() {
		this.historyData = this.historyData.filter((data: any) => {
			return !data.isBacked;
		});
	}

	printAllViewHistory() {
		if (!window.hasOwnProperty('showBrowseLogs')) return;
		let historyLog: any = {};

		let count = 1;
		for (let history of this.historyData) {
			let prefix = '';
			if (history.key === this.lastHistoryTime) prefix = '♣';
			if (history.isBacked) prefix += 'BACK';
			historyLog[`history: ${count++}`] = {
				key: history.key,
				path: prefix + history.state.path,
				viewName: history.state.viewName,
				options: history.state.routeOptions ? JSON.stringify(history.state.routeOptions) : ''
			};
		}

		console.table(historyLog);
	}
}

export default BrowserNavigation;
