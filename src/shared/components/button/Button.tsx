import React, { ButtonHTMLAttributes } from 'react';
import './Button.scss';
import classNames from 'classnames';
import { rippleEffect, transformProps } from '../../utils/internal';
import { ICommon } from '../../interfaces/common';
import { Icon } from '../icon/Icon';
import { ObjectUtils } from '../../utils';
import { Link, LinkProps } from '../link/Link';

export interface ButtonProps
	extends ICommon.PaletteProps,
		Omit<ICommon.HtmlElementProps, 'display'>,
		ICommon.SpacingProps,
		ICommon.BorderProps,
		ICommon.InteractProps<HTMLButtonElement>,
		Partial<Pick<LinkProps, 'path' | 'external' | 'target'>>,
		Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
	look:
		| 'containedPrimary'
		| 'containedSecondary'
		| 'containedTertiary'
		| 'outlinedPrimary'
		| 'outlinedSecondary'
		| 'outlinedTertiary'
		| 'textPrimary'
		| 'textSecondary'
		| 'textTertiary'
		| 'iconNone'
		| 'iconPrimary'
		| 'iconSecondary'
		| string;
	icon?: Omit<ICommon.NewIconProps, 'onClick'>[];
	small?: boolean;
	fullWidth?: boolean;
	disableRipple?: boolean;
	children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = (props) => {
	const {
		id,
		className,
		look,
		disableRipple,
		small,
		onClick,
		elementRef,
		autoFocus,
		disabled,
		form,
		formAction,
		formEncType,
		formMethod,
		formNoValidate,
		formTarget,
		name,
		type,
		value,
		icon,
		children,
		...styleProps
	} = props;

	const buttonProps = {
		autoFocus,
		disabled,
		form,
		formAction,
		formEncType,
		formMethod,
		formNoValidate,
		formTarget,
		name,
		value
	};

	function renderChildren() {
		let children = props.children;

		if (!ObjectUtils.isArrayWithData(icon)) {
			return children;
		}

		let iconButton = props.look.includes('icon') ? [] : [children];

		icon.forEach((item, index) => {
			const { position, isHidden, ...iconProps } = item;
			if (isHidden) return;
			if (position === 'LEFT') {
				iconButton = [<Icon key={`${item.iconImg}${index}`} {...iconProps} />, ...iconButton];
			} else {
				iconButton = [...iconButton, <Icon key={`${item.iconImg}${index}`} {...iconProps} />];
			}
		});
		return iconButton;
	}

	function renderButton() {
		return (
			<button
				id={id}
				className={classNames('htButton', className, look, { small })}
				type={type || 'button'}
				onClick={(event) => {
					if (!disableRipple) rippleEffect(event);
					if (onClick) onClick(event);
				}}
				ref={elementRef}
				style={transformProps(styleProps)}
				{...buttonProps}
			>
				{renderChildren()}
				{props.path && !props.disabled && (
					<Link
						className={'htButtonLink'}
						path={props.path}
						external={props.external}
						target={props.target}
					/>
				)}
			</button>
		);
	}

	return renderButton();
};

export { Button };
