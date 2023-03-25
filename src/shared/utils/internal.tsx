import { CSSProperties, PropsWithChildren } from 'react';
import * as React from 'react';
import { FormControl } from '../components';
import { ICommon } from '../interfaces/common';

const properties = {
	m: 'margin',
	p: 'padding'
};

const directions = {
	t: 'Top',
	r: 'Right',
	b: 'Bottom',
	l: 'Left',
	x: ['Left', 'Right'],
	y: ['Top', 'Bottom']
};

const aliases = {
	marginX: 'mx',
	marginY: 'my',
	paddingX: 'px',
	paddingY: 'py'
};

/**
 * Returns spacing properties that could include margin and props. Used by transformProps
 * @param prop
 */
const getSpacingProperties = (prop: string) => {
	// It's not a shorthand notation.
	if (prop.length > 2) {
		// @ts-ignore
		if (aliases[prop]) {
			// @ts-ignore
			prop = aliases[prop];
		} else {
			return [prop];
		}
	}
	const [a, b] = prop.split('');
	// @ts-ignore
	const property = properties[a];
	// @ts-ignore
	const direction = directions[b] || '';
	return Array.isArray(direction) ? direction.map((dir) => property + dir) : [property + direction];
};

const spacingKeys = [
	'm',
	'mt',
	'mr',
	'mb',
	'ml',
	'mx',
	'my',
	'p',
	'pt',
	'pr',
	'pb',
	'pl',
	'px',
	'py',
	'margin',
	'marginTop',
	'marginRight',
	'marginBottom',
	'marginLeft',
	'marginX',
	'marginY',
	'padding',
	'paddingTop',
	'paddingRight',
	'paddingBottom',
	'paddingLeft',
	'paddingX',
	'paddingY'
];

/**
 * This function converts potential input props to standard CSS properties, for example: mt = marginTop
 * @param props
 * @returns Appropriate CSS properties for style prop on react customComponents
 */
export function transformProps(props: PropsWithChildren<any>): CSSProperties {
	let filtered: any = {};
	let i: keyof typeof props;
	for (i in props) {
		if (i === 'm') {
			filtered['margin'] = props[i];
		} else if (i === 'p') {
			filtered['padding'] = props[i];
		} else if (spacingKeys.includes(i)) {
			let stylePropNames = getSpacingProperties(i);
			for (let propName of stylePropNames) {
				filtered[propName] = props[i];
			}
		} else if (i === 'bgColor') {
			filtered['backgroundColor'] = props[i];
		} else if (i === 'cursorPointer' && props[i]) {
			filtered['cursor'] = 'pointer';
		} else if (i === 'fontSize') {
			filtered[i] = props[i] + 'px';
		} else if (i === 'fullWidth') {
			filtered['width'] = '100%';
		} else {
			filtered[i] = props[i];
		}
	}

	return filtered;
}

/**
 * This function will add ripple effects to where the mouse is clicked inside an element.
 * You will need the following css on the component:
 *
 * .parentComponent{
 * 		position: relative;
 *   > .ripple {
 * 		position: absolute;
 * 		background: #fff;
 * 		transform: translate(-50%, -50%);
 * 		pointer-events: none;
 * 		border-radius: 50%;
 * 		animation: ripples 0.6s linear infinite;
 * 	}
 *  @keyframes ripples {
 * 		0% {
 * 			width: 0;
 * 			height: 0;
 * 			opacity: 0.5;
 * 		}
 * 		100% {
 * 			width: 500px;
 * 			height: 500px;
 * 			opacity: 0;
 * 		}
 * 	}
 * }
 * @param event
 */
export function rippleEffect(event: React.MouseEvent<HTMLElement>) {
	let targetBoundingRect = event.currentTarget.getBoundingClientRect();
	let x = event.clientX - targetBoundingRect.x;
	let y = event.clientY - targetBoundingRect.y;
	let ripples = document.createElement('span');
	ripples.style.left = `${x}px`;
	ripples.style.top = `${y}px`;
	ripples.classList.add('ripple');
	event.currentTarget.appendChild(ripples);
	setTimeout(() => {
		ripples.remove();
	}, 600);
}

/**
 * Renders out our standard errors used with the form control
 * @param control
 */
export function renderErrors(control: FormControl<any> | undefined): React.ReactNode | React.ReactNode[] {
	if (!control) return null;
	const errorNodes: React.ReactNode[] = [];
	const errors = control.errors;
	for (let index = 0; index < errors.length; index++) {
		const errorMessage = control.getErrorMessage(errors[index]);
		errorNodes.push(
			<div key={`${index}Error`} className={'htInputErrorMessage'}>
				{errorMessage}
			</div>
		);
	}
	return errorNodes;
}

/**
 * This function will remove the standard margin props, returning the margin props seperated from the remaining props
 * @param props that includes MarginProps
 * @returns returns an object that has marginProps seperated from remaining
 */
export function extractMarginProps<T extends ICommon.MarginProps>(
	props: T
): { marginProps: ICommon.MarginProps; remaining: Omit<T, keyof ICommon.MarginProps> } {
	const {
		m,
		mt,
		mr,
		mb,
		ml,
		mx,
		my,
		margin,
		marginTop,
		marginRight,
		marginBottom,
		marginLeft,
		marginX,
		marginY,
		...remaining
	} = props;

	const marginProps: ICommon.MarginProps = {
		...(m && { m }),
		...(mt && { mt }),
		...(mr && { mr }),
		...(mb && { mb }),
		...(ml && { ml }),
		...(mx && { mx }),
		...(my && { my }),
		...(margin && { margin }),
		...(marginTop && { marginTop }),
		...(marginRight && { marginRight }),
		...(marginBottom && { marginBottom }),
		...(marginLeft && { marginLeft }),
		...(marginX && { marginX }),
		...(marginY && { marginY })
	};

	return { marginProps, remaining };
}

/**
 * This method is used to help shorthand extracting keys from props. A good example of this is done on the LabelInputText
 * @param object
 * @param properties
 */
export function extractPropsFromKeys<T>(object: { [key: string]: any }, properties: string[]): Partial<T> {
	let extractedObject = {} as any;
	properties.forEach((item) => {
		if (Object.hasOwn(object, item)) {
			extractedObject[item] = object[item];
		}
	});
	return extractedObject;
}
