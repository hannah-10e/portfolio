import * as React from 'react';
import './Avatar.scss';
import { CSSProperties, useEffect, useState } from 'react';
import classNames from 'classnames';
import { ICommon } from '../../interfaces/common';
import { transformProps } from '../../utils/internal';
import { Box } from '../box/Box';
const AvatarImage = 'src/media/default-avatar.png';
export interface AvatarProps extends ICommon.SpacingProps, ICommon.PaletteProps, ICommon.InteractProps<HTMLDivElement> {
	widthHeight: number;
	image?: string;
	name?: string;
	className?: string;
}

const Avatar: React.FC<AvatarProps> = (props) => {
	const { widthHeight, image, name, onClick, elementRef, className, ...styleProps } = props;

	const [avatarImage, setAvatarImage] = useState<string | undefined>(image);

	useEffect(() => {
		setAvatarImage(image);
	}, [image]);

	function renderStyles() {
		let styles: Partial<CSSProperties> = {};
		styles['height'] = `${widthHeight}px`;
		styles['width'] = `${widthHeight}px`;
		styles['fontSize'] = `calc(${widthHeight}px * .50)`;
		let transformedStyles = transformProps(styleProps);
		return { ...styles, ...transformedStyles };
	}

	function formatName() {
		if (!name) return '';
		let newName = name.split(' ');
		let filteredName = newName.filter((item) => {
			return item.length > 0;
		});
		if (filteredName.length > 1) {
			return filteredName[0][0].toUpperCase() + filteredName[1][0].toUpperCase();
		} else if (filteredName.length === 1) {
			return filteredName[0][0].toUpperCase();
		} else {
			return '';
		}
	}
	function imageToUndefined() {
		if (props.name) {
			setAvatarImage(undefined);
		} else {
			setAvatarImage(AvatarImage);
		}
	}

	function renderAvatar() {
		if (!!image)
			return (
				<img
					src={avatarImage}
					onError={() => {
						imageToUndefined();
					}}
					alt={'Avatar'}
				/>
			);

		return <Box className={'nameInitial'}>{formatName()}</Box>;
	}

	return (
		<Box
			className={classNames('htAvatar', className)}
			elementRef={elementRef}
			style={renderStyles()}
			onClick={onClick}
		>
			{renderAvatar()}
		</Box>
	);
};

export { Avatar };
