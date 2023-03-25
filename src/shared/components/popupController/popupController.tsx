import React, { Component, PropsWithChildren } from 'react';
import { FullPopupProps, PopupAnimateDirection, PopupAnimateType, PopupProps } from './Popup';

interface PopupControllerState {
	popups: { component: React.Component | React.FC; props: PropsWithChildren<FullPopupProps> }[];
}

export class PopupController extends Component<{}, PopupControllerState> {
	constructor(props: {}) {
		super(props);
		this.state = {
			popups: []
		};
	}

	open = (component: React.Component | React.FC, props: any = {}): number => {
		let fullProps = props as PropsWithChildren<FullPopupProps>;
		fullProps.opened = true;
		fullProps.popupId = Date.now();

		// Get defaults
		fullProps.animateType = fullProps.animateType ?? popupDefaults.animateType;
		fullProps.animateDurationMs = fullProps.animateDurationMs ?? popupDefaults.animateDurationMs;
		fullProps.animateDirection = fullProps.animateDirection ?? popupDefaults.animateDirection;
		fullProps.backgroundColor = fullProps.backgroundColor ?? popupDefaults.backgroundColor;
		fullProps.enableBodyScrollLock = fullProps.enableBodyScrollLock ?? popupDefaults.enableBodyScrollLock;
		fullProps.onDestroyed = this.removePopupFromRenderById;

		this.setState(({ popups }) => {
			return { popups: [...popups, { component, props }] };
		});

		return fullProps.popupId;
	};

	hide = (component: any) => {
		let { popups } = this.state;
		for (let i in popups) {
			if (this._matchComponent(popups[i].component, component)) {
				popups[i].props.opened = false;
			}
		}
		this.setState({ popups });
	};

	closeAll = () => {
		let { popups } = this.state;
		for (let popup of popups) {
			this.destroyPopupById(popup.props.popupId);
		}
	};

	/**
	 * Closes popups by ID
	 * @param popupId - ID of popups to close
	 */
	closeById = (popupId: number) => {
		this.destroyPopupById(popupId);
	};

	/**
	 * Closes the last opened popups
	 */
	closeLast = () => {
		let { popups } = this.state;
		if (!popups.length) return;
		this.destroyPopupById(popups[popups.length - 1].props.popupId);
	};

	/**
	 * Closes ALL popups that match the component type
	 * @param component
	 */
	close = (component: any) => {
		let { popups } = this.state;
		for (let popup of popups) {
			if (this._matchComponent(popup.component, component)) {
				this.destroyPopupById(popup.props.popupId);
			}
		}
	};

	/**
	 * Returns the number of popups opened
	 */
	numberOfPopupsOpened = () => {
		let count = 0;
		for (let popup of this.state.popups) {
			if (popup.props.opened) count++;
		}
		return count;
	};

	private removePopupFromRenderById = (popupId: number) => {
		this.setState(({ popups }) => {
			return {
				popups: popups.filter((popup) => {
					return popup.props.popupId !== popupId;
				})
			};
		});
	};

	private _matchComponent = (component1: any, component2: any) => {
		if (!component1) return false;
		if (!component2) return false;
		if (component1 === component2) return true;
		if (component1 === component2.constructor) return true;
		return false;
	};

	/**
	 * Changes popups props to destroy: true, this starts it's animation cycle and when it is
	 * finished it will call us back where we will remove it
	 * @param popupId
	 */
	private destroyPopupById = (popupId: number) => {
		this.setState(({ popups }) => {
			return {
				popups: popups.map((popup) => {
					if (popup.props.popupId === popupId) {
						return {
							component: popup.component,
							props: { ...popup.props, destroy: true }
						};
					}
					return popup;
				})
			};
		});
	};

	render() {
		let comps = [];
		for (let i in this.state.popups) {
			let Comp: any = this.state.popups[i].component;
			let props = this.state.popups[i].props;
			comps.push(
				<Comp
					key={props.popupId}
					onHide={() => {
						this.close(Comp);
					}}
					{...props}
				/>
			);
		}
		if (comps.length > 0) return comps;
		return null;
	}
}

interface PopupDefaults {
	animateType: PopupAnimateType;
	animateDurationMs: number;
	animateDirection: PopupAnimateDirection;
	backgroundColor: string;
	enableBodyScrollLock: boolean;
}

let popupDefaults: PopupDefaults = {
	animateType: 'slideInOut',
	animateDurationMs: 500,
	animateDirection: 'bottom',
	backgroundColor: 'rgba(0, 0, 0, 0.18)',
	enableBodyScrollLock: true
};

interface PopupControllerInterface {
	open: <T extends PopupProps>(Comp: React.FC<any>, props?: T) => number;
	hide: (Comp: React.FC<any>) => void;
	close: (Comp: React.FC<any>) => void;
	closeById: (popupId: number) => void;
	closeLast: () => void;
	closeAll: () => void;
	setDefaults: (defaults: Partial<PopupDefaults>) => void;
	convertProps: (props: PopupProps) => PropsWithChildren<FullPopupProps>;
	numberOfPopupsOpened: () => number;
	instance: any;
}

let popupControllerRef: any = {};
let popupController: PopupControllerInterface = {
	open: (Comp: React.FC<any>, props?: any): number => {
		return popupControllerRef.open(Comp, props);
	},
	hide: (Comp: React.FC<any>) => {
		popupControllerRef.hide(Comp);
	},
	close: (Comp: React.FC) => {
		popupControllerRef.close(Comp);
	},
	closeById: (popupId: number) => {
		popupControllerRef.closeById(popupId);
	},
	closeLast: () => {
		popupControllerRef.closeLast();
	},
	closeAll: () => {
		popupControllerRef.closeAll();
	},
	setDefaults: (defaults: Partial<PopupDefaults>) => {
		popupDefaults = { ...popupDefaults, ...defaults };
	},
	convertProps: (props: PopupProps) => {
		return props as PropsWithChildren<FullPopupProps>;
	},
	numberOfPopupsOpened: () => {
		return popupControllerRef.numberOfPopupsOpened();
	},
	instance: <PopupController ref={(ref) => (popupControllerRef = ref)} />
};

export { popupController };
