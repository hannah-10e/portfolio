import React, { RefObject } from 'react';
import './Label.scss';
import { ICommon } from '../../interfaces/common';
import { transformProps } from '../../utils/internal';
import classNames from 'classnames';

type TagType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'div' | 'span';
type FontWeight =
	| 'thin'
	| 'extraLight'
	| 'light'
	| 'regular'
	| 'medium'
	| 'semiBold'
	| 'bold'
	| 'extraBold'
	| 'black'
	| 'extraBlack';

export interface LabelProps
	extends ICommon.SpacingProps,
		ICommon.TextProps,
		ICommon.DimensionProps,
		ICommon.HtmlElementProps,
		ICommon.PaletteProps,
		ICommon.InteractProps<HTMLElement> {
	variant:
		| 'display1'
		| 'display2'
		| 'h1'
		| 'h2'
		| 'h3'
		| 'h4'
		| 'h5'
		| 'h6'
		| 'subheader1'
		| 'subheader2'
		| 'body1'
		| 'body2'
		| 'caption1'
		| 'caption2'
		| 'overline'
		| 'button'
		| string;
	weight: FontWeight;
	strikethrough?: boolean;
	underline?: boolean;
	elementType?: TagType;
	children: React.ReactNode;
}

const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

const Label: React.FC<LabelProps> = (props) => {
	const { className, onClick, variant, id, elementRef, children, ...other } = props;
	let styleValues = transformProps(other);

	let ElementType: TagType = 'p';
	if (headings.includes(props.variant)) ElementType = props.variant as TagType;
	if (props.elementType) ElementType = props.elementType as unknown as TagType;

	return (
		<ElementType
			id={id}
			onClick={onClick || undefined}
			ref={elementRef as RefObject<HTMLParagraphElement>}
			style={styleValues}
			className={classNames(
				'rsLabel',
				props.className,
				props.variant,
				{
					fwThin: props.weight === 'thin',
					fwExtraLight: props.weight === 'extraLight',
					fwLight: props.weight === 'light',
					fwRegular: props.weight === 'regular',
					fwMedium: props.weight === 'medium',
					fwSemiBold: props.weight === 'semiBold',
					fwBold: props.weight === 'bold',
					fwExtraBold: props.weight === 'extraBold',
					fwBlack: props.weight === 'black',
					fwExtraBlack: props.weight === 'extraBlack'
				},
				{
					strikethrough: props.strikethrough,
					underline: props.underline
				}
			)}
		>
			{props.children}
		</ElementType>
	);
};

export { Label };
