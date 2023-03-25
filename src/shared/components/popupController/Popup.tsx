import React, { CSSProperties, useEffect, useRef, useState } from 'react';
import './Popup.scss';
import { popupController } from './popupController';
import classNames from 'classnames';

export type PopupAnimateDirection = 'top' | 'bottom' | 'left' | 'right';
export type PopupAnimateType = 'slideInOut' | 'fade';

export interface PopupProps {
	className?: string;
	preventCloseByBackgroundClick?: boolean;
	animateType?: PopupAnimateType;
	animateDurationMs?: number;
	animateDirection?: PopupAnimateDirection;
	backgroundColor?: string;
	enableBodyScrollLock?: boolean;
	onRemoved?: () => void;
	children?: React.ReactNode;
}

export interface FullPopupProps extends PopupProps {
	// These are internal props only used by popupController
	opened: boolean;
	destroy: boolean;
	popupId: number;
	onHidden: () => void;
	onDestroyed: (popupId: number) => void;
}

const BODY_LOCK_COUNT_ATTRIBUTE_NAME = 'data-body-lock-count';
function useBlockBackgroundScroll(enable: boolean) {
	useEffect(() => {
		if (!enable) return;
		const bodyElement = document.querySelector('body')!;
		let lockCount = parseInt(bodyElement.getAttribute(BODY_LOCK_COUNT_ATTRIBUTE_NAME) || '0');
		if (lockCount === 0) bodyElement.style.overflow = 'hidden';
		lockCount += 1;
		bodyElement.setAttribute(BODY_LOCK_COUNT_ATTRIBUTE_NAME, lockCount.toString());
		return () => {
			if (!enable) return;
			// Maybe there are two popups open, don't disable unless we did it
			let lockCount = parseInt(bodyElement.getAttribute(BODY_LOCK_COUNT_ATTRIBUTE_NAME) || '0');
			lockCount -= 1;
			if (lockCount === 0) {
				bodyElement.style.overflow = '';
				bodyElement.removeAttribute(BODY_LOCK_COUNT_ATTRIBUTE_NAME);
			} else {
				bodyElement.setAttribute(BODY_LOCK_COUNT_ATTRIBUTE_NAME, lockCount.toString());
			}
		};
	}, []);
}

const Popup: React.FC<PopupProps> = (props) => {
	const fullProps = popupController.convertProps(props);
	const [isShown, setIsShown] = useState<boolean>(false);

	useEffect(() => {
		if (fullProps.opened && !fullProps.destroy) {
			if (fullProps.animateDurationMs) {
				// Sometimes react updates too fast and the animation doesn't play, delay a bit so we can show off screen
				setTimeout(() => {
					setIsShown(true);
				}, 10);
			} else {
				setIsShown(true);
			}
		} else {
			setIsShown(false);

			// Delay calling onHidden until animateDuration has expired
			setTimeout(() => {
				if (fullProps.onHidden) fullProps.onHidden();
			}, fullProps.animateDurationMs || 0);
		}
	}, [fullProps, fullProps.opened]);

	useEffect(() => {
		if (!fullProps.destroy) return;
		setIsShown(false);
		// Delay calling onHidden until animateDuration has expired
		setTimeout(() => {
			if (fullProps.onDestroyed) fullProps.onDestroyed(fullProps.popupId);
			if (fullProps.onRemoved) fullProps.onRemoved();
		}, fullProps.animateDurationMs || 0);
	}, [fullProps, fullProps.destroy]);

	useBlockBackgroundScroll(fullProps.enableBodyScrollLock ?? true);

	const popupElement = useRef<HTMLDivElement>(null);
	const popupContentElement = useRef<HTMLDivElement>(null);

	function handleClose(e: React.MouseEvent<HTMLDivElement>) {
		if (fullProps.preventCloseByBackgroundClick) return;
		if (e.target === popupContentElement.current) {
			popupController.closeById(fullProps.popupId);
		}
	}

	function getSlideInOutAnimateProperties(initialStyle: CSSProperties): CSSProperties {
		let updatedStyle = { ...initialStyle };
		if (fullProps.animateDirection === 'top') {
			updatedStyle.transform = isShown ? 'translate(0, 0)' : 'translate(0, -100vh)';
			updatedStyle.transition = `transform ${fullProps.animateDurationMs}ms ease`;
		} else if (fullProps.animateDirection === 'bottom') {
			updatedStyle.transform = isShown ? 'translate(0, 0)' : 'translate(0, 100vh)';
			updatedStyle.transition = `transform ${fullProps.animateDurationMs}ms ease`;
		} else if (fullProps.animateDirection === 'left') {
			updatedStyle.transform = isShown ? 'translate(0, 0)' : 'translate(-100vw, 0)';
			updatedStyle.transition = `transform ${fullProps.animateDurationMs}ms ease`;
		} else if (fullProps.animateDirection === 'right') {
			updatedStyle.transform = isShown ? 'translate(0, 0)' : 'translate(100vw, 0)';
			updatedStyle.transition = `transform ${fullProps.animateDurationMs}ms ease`;
		}

		return updatedStyle;
	}

	function getFadeAnimateProperties(initialStyle: CSSProperties): CSSProperties {
		let updatedStyle = { ...initialStyle };
		updatedStyle.opacity = isShown ? 1 : 0;
		updatedStyle.transition = `opacity ${fullProps.animateDurationMs}ms ease`;
		return updatedStyle;
	}

	function getPopupContentStyle(): CSSProperties {
		let style: CSSProperties = {};
		if (fullProps.animateDurationMs) {
			if (fullProps.animateType === 'slideInOut') style = getSlideInOutAnimateProperties(style);
			else if (fullProps.animateType === 'fade') style = getFadeAnimateProperties(style);
		}
		return style;
	}

	function getPopupStyle(): CSSProperties {
		let style: CSSProperties = {};
		if (fullProps.backgroundColor) {
			style.backgroundColor = isShown ? fullProps.backgroundColor : 'transparent';
			if (fullProps.animateDurationMs)
				style.transition = `background-color ${fullProps.animateDurationMs}ms ease`;
		}
		return style;
	}

	return (
		<div
			onClick={handleClose}
			className={classNames('htPopup', { show: isShown })}
			style={getPopupStyle()}
			ref={popupElement}
			id={`Popup-${fullProps.popupId}`}
		>
			<div
				className={classNames('htPopupContent', fullProps.className)}
				ref={popupContentElement}
				style={getPopupContentStyle()}
			>
				{fullProps.children}
			</div>
		</div>
	);
};
export { Popup };
