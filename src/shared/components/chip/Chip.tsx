import * as React from 'react';
import './Chip.scss';
import { rippleEffect, transformProps } from '../../utils/internal';
import { Icon } from '../icon/Icon';
import classNames from 'classnames';
import { Label, LabelProps } from '../label/Label';
import { ICommon } from '../../interfaces/common';
import { Avatar } from '../avatar/Avatar';

interface ChipStyles extends ICommon.BorderProps, ICommon.PaddingProps, ICommon.MarginProps, ICommon.PaletteProps {}

export interface ChipProps {
	labelVariant: LabelProps['variant'];
	label: string;
	look: 'outlined' | 'standard';

	icon?: ICommon.NewIconProps[];
	avatar?: ICommon.NewAvatarProps[];
	chipStyles?: ChipStyles;

	disabled?: boolean;
	avatarImg?: string;
	avatarInitials?: string;
	onClick?: (event?: React.MouseEvent) => void;
	className?: string;
}

const Chip: React.FC<ChipProps> = (props) => {
	let cssProperties = transformProps(props.chipStyles);

	function renderIcons() {
		let label = [
			<Label key={'icon-label'} weight={'regular'} variant={props.labelVariant}>
				{props.label}
			</Label>
		];

		if (props.icon) {
			props.icon.forEach((item, index) => {
				const { position, isHidden, onClick, ...iconProps } = item;
				if (isHidden) return;

				const icon = (
					<Icon
						key={`${item.iconImg}${index}`}
						{...iconProps}
						onClick={(event) => {
							if (onClick) onClick(event);
							event?.stopPropagation();
						}}
					/>
				);

				if (position === 'LEFT') {
					label = [icon, ...label];
				} else {
					label = [...label, icon];
				}
			});
		}

		if (props.avatar) {
			props.avatar.forEach((item, index) => {
				const { position, isHidden, onClick, ...avatarProps } = item;
				if (isHidden) return;

				const avatar = (
					<Avatar
						key={`${avatarProps.name || avatarProps.image} ${index}`}
						onClick={(event) => {
							if (onClick) onClick(event);
							event?.stopPropagation();
						}}
						{...avatarProps}
					/>
				);

				if (position === 'LEFT') {
					label = [avatar, ...label];
				} else {
					label = [...label, avatar];
				}
			});
		}

		return label;
	}

	return (
		<span
			className={classNames('htChip', props.look, props.disabled, props.className, { onClick: !!props.onClick })}
			style={cssProperties}
			onClick={(event) => {
				if (props.onClick) {
					rippleEffect(event as React.MouseEvent<HTMLElement>);
					props.onClick(event);
				}
			}}
		>
			{renderIcons()}
		</span>
	);
};

export { Chip };
