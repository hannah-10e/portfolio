import React, { CSSProperties, TouchEvent, MouseEvent, PointerEvent } from 'react';
import { transformProps } from '../../utils/internal';
import { ICommon } from '../../interfaces/common';
import classNames from 'classnames';

export interface BoxProps
	extends ICommon.SpacingProps,
		ICommon.DimensionProps,
		ICommon.PaletteProps,
		ICommon.BorderProps,
		ICommon.PositionProps,
		ICommon.FlexProps,
		ICommon.GridProps,
		ICommon.InteractProps<HTMLDivElement>,
		ICommon.HtmlElementProps {
	style?: CSSProperties;

	// Spacing props
	boxSizing?: 'border-box' | 'content-box' | string;

	// Display properties
	overflow?: 'visible' | 'hidden' | 'clip' | 'scroll' | 'auto' | 'hidden visible' | string;
	textOverflow?: 'clip' | 'ellipsis' | string | 'initial' | 'inherit';
	visibility?: 'visible' | 'hidden' | 'collapse' | 'initial' | 'inherit';
	whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | 'break-spaces' | string;

	// Events
	// Mouse Events (mouse)
	onMouseDown?: (event: MouseEvent) => void;
	onMouseUp?: (event: MouseEvent) => void;
	onMouseEnter?: (event: MouseEvent) => void;
	onMouseLeave?: (event: MouseEvent) => void;
	onMouseMove?: (event: MouseEvent) => void;
	// Touch events (trackpad/touch)
	onTouchStart?: (event: TouchEvent) => void;
	onTouchEnd?: (event: TouchEvent) => void;
	onTouchCancel?: (event: TouchEvent) => void;
	onTouchMove?: (event: TouchEvent) => void;
	// Pointer events (mouse and touch and pen)
	onPointerDown?: (event: PointerEvent) => void;
	onPointerUp?: (event: PointerEvent) => void;
	onPointerCancel?: (event: PointerEvent) => void;
	onPointerMove?: (event: PointerEvent) => void;
	onPointerEnter?: (event: PointerEvent) => void;
	onPointerLeave?: (event: PointerEvent) => void;

	children?: React.ReactNode;
}

const Box: React.FC<BoxProps> = (props) => {
	const {
		elementRef,
		className,
		onClick,
		onMouseDown,
		onMouseUp,
		onMouseEnter,
		onMouseLeave,
		onMouseMove,
		onTouchStart,
		onTouchEnd,
		onTouchCancel,
		onTouchMove,
		onPointerDown,
		onPointerUp,
		onPointerCancel,
		onPointerMove,
		onPointerEnter,
		onPointerLeave,
		id,
		style,
		children,
		...other
	} = props;
	let cssProperties = transformProps(other);
	if (style) cssProperties = { ...cssProperties, ...style };

	return (
		<div
			id={id}
			ref={elementRef}
			className={classNames('htBox', className)}
			style={cssProperties}
			onClick={onClick}
			onMouseDown={onMouseDown}
			onMouseUp={onMouseUp}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			onMouseMove={onMouseMove}
			onTouchStart={onTouchStart}
			onTouchEnd={onTouchEnd}
			onTouchCancel={onTouchCancel}
			onTouchMove={onTouchMove}
			onPointerDown={onPointerDown}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerCancel}
			onPointerMove={onPointerMove}
			onPointerEnter={onPointerEnter}
			onPointerLeave={onPointerLeave}
		>
			{props.children}
		</div>
	);
};
export { Box };
