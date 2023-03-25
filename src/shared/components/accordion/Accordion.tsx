import * as React from 'react';
import './Accordion.scss';
import { useEffect, useState } from 'react';
import { Icon, IconProps } from '../icon/Icon';
import { rippleEffect, transformProps } from '../../utils/internal';
import { Box } from '../box/Box';
import classNames from 'classnames';
import { ICommon } from '../../interfaces/common';
import { Label, LabelProps } from '../label/Label';

export interface HeaderStyleProps
	extends ICommon.SpacingProps,
		ICommon.BorderProps,
		ICommon.DimensionProps,
		ICommon.PaletteProps {}

export interface DrawerStyleProps
	extends ICommon.MarginProps,
		ICommon.BorderProps,
		ICommon.DimensionProps,
		ICommon.PaletteProps {}

export interface IExpandIconProps {
	openedIcon?: IconProps;
	closedIcon?: IconProps;
	defaultIcon?: Omit<IconProps, 'iconImg' | 'className' | 'onClick'>;
}
export interface IContainerStyleProps extends ICommon.MarginProps {
	width?: string | number;
	maxWidth?: string | number;
	minWidth?: string | number;
}

export interface AccordionProps extends Omit<ICommon.HtmlElementProps, 'display'> {
	title: LabelProps | React.ReactNode;
	children?: React.ReactNode;
	onClick?: (event: React.MouseEvent<HTMLElement>, isOpen: boolean) => void;
	headerStyles?: HeaderStyleProps;
	drawerStyles?: DrawerStyleProps;
	containerStyles?: IContainerStyleProps;
	expandIcon?: IExpandIconProps;
	disableRipple?: boolean;
	hideExpandIcon?: boolean;
	isOpen?: boolean;
}

const Accordion: React.FC<AccordionProps> = (props) => {
	const [isOpened, setIsOpened] = useState<boolean>(props.isOpen || false);
	const containerRef = React.createRef<HTMLDivElement>();
	const drawerRef = React.createRef<HTMLDivElement>();
	const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true);

	useEffect(() => {
		accordionButtonHandler();
	}, [isOpened]);

	useEffect(() => {
		if (props.isOpen) setIsOpened(props.isOpen);
		else setIsOpened(false);
	}, [props.isOpen]);

	function accordionButtonHandler() {
		const container = containerRef.current;
		const drawer = drawerRef.current;
		if (!container || !drawer) return;
		if (isOpened) {
			container.classList.add('active');
			drawer.classList.add('opened');
			setIsOpened(true);
		} else {
			container.classList.remove('active');
			drawer.classList.remove('opened');
			setIsOpened(false);
		}

		if (isFirstLoad) {
			setIsFirstLoad(false);
			if (!isOpened) {
				drawer.style.height = '0px';
				return;
			} else {
				drawer.style.height = 'auto';
			}
		}

		if (!isOpened) {
			drawer.style.height = drawer.scrollHeight + 'px';
			//We need to have a slight delay so that the height can have a pixel value before removing.
			setTimeout(() => {
				drawer.style.height = '0px';
			}, 50);
		} else {
			drawer.style.height = drawer.scrollHeight + 'px';
			//This Time out is set to 300ms which is the transition time for height.
			setTimeout(() => {
				drawer.style.height = 'auto';
			}, 300);
		}
	}

	function isLabel(possibleLabel: any): possibleLabel is LabelProps {
		return typeof possibleLabel === 'object' && possibleLabel.hasOwnProperty('variant');
	}

	function renderIcon() {
		if (props.hideExpandIcon) return;
		if (!props.expandIcon)
			return (
				<Icon
					key={'icon'}
					className={classNames('chevron', { iconSpinDown: !isOpened })}
					iconImg={'icon-chevron-up'}
				/>
			);
		const { openedIcon, closedIcon, defaultIcon } = props.expandIcon;

		if (defaultIcon) {
			return (
				<Icon
					key={'icon'}
					className={classNames('chevron', { iconSpinDown: !isOpened })}
					iconImg={'icon-chevron-up'}
					{...defaultIcon}
				/>
			);
		}
		if (openedIcon && closedIcon) {
			if (isOpened) return <Icon key={'icon'} {...openedIcon} />;
			else return <Icon key={'icon'} {...closedIcon} />;
		}
	}

	function renderTitle() {
		let icon = [renderIcon()];

		if (isLabel(props.title)) {
			return [<Label key={'title'} {...props.title} />, ...icon];
		}

		return [<React.Fragment key={'title'}>{props.title}</React.Fragment>, ...icon];
	}

	return (
		<Box
			className={classNames('htAccordion', props.className)}
			elementRef={containerRef}
			style={transformProps(props.containerStyles)}
		>
			<Box
				className={'header'}
				style={transformProps(props.headerStyles)}
				onClick={(event) => {
					if (!props.disableRipple) rippleEffect(event as React.MouseEvent<HTMLElement>);
					setIsOpened(!isOpened);
					if (props.onClick) props.onClick(event as React.MouseEvent<HTMLElement>, !isOpened);
				}}
			>
				{renderTitle()}
			</Box>
			<Box className={'drawer'} elementRef={drawerRef} style={transformProps(props.drawerStyles)}>
				{props.children}
			</Box>
		</Box>
	);
};

export { Accordion };
