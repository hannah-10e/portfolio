import React from 'react';
import { IconProps, AvatarProps, LabelProps } from '../components';

export namespace CommonShared {
	export interface NavigateOptions {
		view?: string; // The view in which to load the new page into. This would override the router' definition. If no view is specified in either then it loads in current view
	}

	/**
	 * Return true on accept navigation, false or an error string if failed
	 */
	export type RouteGuard = (path: string) => boolean | string;

	export interface RouteDetails<T> {
		path: T; // The path to be used when loading the page component, '*' is any page not found 404
		page: React.ReactNode;
		routeGuard?: RouteGuard;
		options?: CommonShared.NavigateOptions; // Options for the route. Most common will be view to default load page into
	}
}

export namespace ICommon {
	export type GlobalCSSValues = 'inherit' | 'initial' | 'revert' | 'unset';

	export interface HtmlElementProps {
		id?: string;
		display?: 'initial' | 'block' | 'inline' | 'flex' | 'grid' | string;
		className?: string;
	}
	export const HtmlElementPropsKeys: (keyof HtmlElementProps)[] = ['id', 'display', 'className'];

	export interface InteractProps<T> {
		onClick?: React.MouseEventHandler;
		elementRef?: React.RefObject<T>;
	}

	export interface MarginProps {
		m?: string | number;
		mt?: string | number;
		mr?: string | number;
		mb?: string | number;
		ml?: string | number;
		mx?: string | number;
		my?: string | number;
		margin?: string | number;
		marginTop?: string | number;
		marginRight?: string | number;
		marginBottom?: string | number;
		marginLeft?: string | number;
		marginX?: string | number;
		marginY?: string | number;
	}
	export const MarginPropsKeys: (keyof MarginProps)[] = [
		'm',
		'mt',
		'mr',
		'mb',
		'ml',
		'mx',
		'my',
		'margin',
		'marginTop',
		'marginRight',
		'marginBottom',
		'marginLeft',
		'marginX',
		'marginY'
	];

	export interface PaddingProps {
		p?: string | number;
		pt?: string | number;
		pr?: string | number;
		pb?: string | number;
		pl?: string | number;
		px?: string | number;
		py?: string | number;
		padding?: string | number;
		paddingTop?: string | number;
		paddingRight?: string | number;
		paddingBottom?: string | number;
		paddingLeft?: string | number;
		paddingX?: string | number;
		paddingY?: string | number;
	}
	export const PaddingPropsKeys: (keyof PaddingProps)[] = [
		'p',
		'pt',
		'pr',
		'pb',
		'pl',
		'px',
		'py',
		'padding',
		'paddingTop',
		'paddingRight',
		'paddingBottom',
		'paddingLeft',
		'paddingX',
		'paddingY'
	];

	export interface SpacingProps extends PaddingProps, MarginProps {}
	export const SpacingPropsKeys: (keyof SpacingProps)[] = [...MarginPropsKeys, ...PaddingPropsKeys];

	export interface BorderProps {
		border?: string | number;
		borderTop?: string | number;
		borderLeft?: string | number;
		borderRight?: string | number;
		borderBottom?: string | number;
		borderColor?: string;
		borderRadius?: string | number;
	}

	export interface PositionProps {
		position?: string;
		left?: string | number;
		right?: string | number;
		top?: string | number;
		bottom?: string | number;
	}

	export interface FlexProps {
		flexDirection?: 'row' | ' row-reverse' | 'column' | 'column-reverse' | 'initial' | 'inherit' | string;
		flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse' | 'inherit' | 'initial' | 'revert' | 'revert-layer' | 'unset';
		justifyContent?:
			| 'flex-start'
			| 'flex-end'
			| 'center'
			| 'space-between'
			| 'space-around'
			| 'space-evenly'
			| 'initial'
			| 'inherit'
			| string;
		alignItems?: 'stretch' | 'center' | 'flex-start' | 'flex-end' | 'baseline' | 'initial' | 'inherit' | string;
		alignContent?: 'center' | 'start' | 'end' | 'flex-start' | 'flex-end' | string;
		order?: string;
		flex?: string;
		flexGrow?: string | number;
		flexShrink?: string | number;
		alignSelf?: string | number;
		textAlign?: string | number;
		gap?: string | number;
	}

	export interface GridProps {
		placeContent?: string;
		gridTemplateColumns?: string;
		gridTemplateRows?: string;
		gridTemplate?: string;
	}

	export interface TextProps {
		overflow?: string;
		textOverflow?: 'clip' | 'ellipsis' | string | 'initial' | 'inherit';
		textAlign?: 'left' | 'right' | 'center' | 'justify' | 'initial' | 'inherit' | string;
		visibility?: 'visible' | 'hidden' | 'collapse' | 'initial' | 'inherit';
		textTransform?:
			| 'none'
			| 'capitalize'
			| 'uppercase'
			| 'lowercase'
			| 'full-width'
			| 'full-size-kana'
			| 'inherit'
			| 'initial'
			| 'revert'
			| 'unset';
		whiteSpace?: string;
	}

	export interface DimensionProps {
		width?: string | number;
		height?: string | number;
		maxWidth?: string | number;
		maxHeight?: string | number;
		minWidth?: string | number;
		minHeight?: string | number;
	}

	export interface PaletteProps {
		color?: string;
		bgColor?: string;
	}

	export interface NewIconProps extends IconProps {
		position: 'LEFT' | 'RIGHT';
		isHidden?: boolean;
	}

	export interface NewAvatarProps extends AvatarProps {
		position: 'LEFT' | 'RIGHT';
		isHidden?: boolean;
	}

	export interface NewLabelProps extends LabelProps {
		position: 'LEFT' | 'RIGHT';
	}

	export type AutoCompleteType =
		| 'off'
		| 'autocomplete'
		| 'on'
		| 'name'
		| 'honorific-prefix'
		| 'given-name'
		| 'additional-name'
		| 'family-name'
		| 'honorific-suffix'
		| 'nickname'
		| 'email'
		| 'username'
		| 'new-password'
		| 'current-password'
		| 'one-time-code'
		| 'organization-title'
		| 'organization'
		| 'street-address'
		| 'address-line1'
		| 'address-line2'
		| 'address-line3'
		| 'address-level4'
		| 'address-level3'
		| 'address-level2'
		| 'address-level1'
		| 'country'
		| 'country-name'
		| 'postal-code'
		| 'cc-name'
		| 'cc-given-name'
		| 'cc-additional-name'
		| 'cc-family-name'
		| 'cc-number'
		| 'cc-exp'
		| 'cc-exp-month'
		| 'cc-exp-year'
		| 'cc-csc'
		| 'cc-type'
		| 'transaction-currency'
		| 'transaction-amount'
		| 'language'
		| 'bday'
		| 'bday-day'
		| 'bday-month'
		| 'bday-year'
		| 'sex'
		| 'tel'
		| 'tel-country-code'
		| 'tel-national'
		| 'tel-area-code'
		| 'tel-local'
		| 'tel-local-prefix'
		| 'tel-local-suffix'
		| 'tel-extension'
		| 'impp'
		| 'url'
		| 'photo';
}
