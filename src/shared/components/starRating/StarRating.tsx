import React, { useState, useEffect } from 'react';
import { Icon, IconProps } from '../icon/Icon';
import { Box } from '../box/Box';
import './StarRating.scss';
import classNames from 'classnames';
import { ICommon } from '../../interfaces/common';
import { extractMarginProps, transformProps } from '../../utils/internal';

export interface IStarIconProps {
	fullStarIcon?: IconProps;
	halfStarIcon?: IconProps;
	noStarIcon?: IconProps;
	defaultIcon?: Omit<IconProps, 'iconImg' | 'className' | 'onClick'>;
}

export interface StarRatingProps extends ICommon.MarginProps {
	starSize: number;
	rating?: number;
	customIcon?: IStarIconProps;
	starColor?: string;
	className?: string;
	isClickable?: boolean;
	onStarClicked?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = (props) => {
	const [rating, setRating] = useState(props.rating || 0);
	const [hoverMovement, setHoverMovement] = useState(true);

	const { marginProps } = extractMarginProps(props);
	const containerStyle = transformProps(marginProps);

	let borderClassName;

	useEffect(() => {
		if (props.rating === undefined) return;
		setRating(props.rating);
	}, [props.rating]);

	function handleClick(stars: number) {
		if (props.isClickable) {
			setHoverMovement(false);
			setRating(stars);
			if (props.onStarClicked) {
				props.onStarClicked(stars);
			}
		}
	}

	// Handling the hover here. isHoverType will be true for hover in and false for hover out
	function handleHover(isHoverType: boolean, stars: number) {
		if (props.isClickable) {
			if (hoverMovement) {
				if (isHoverType) {
					setRating(stars);
				} else {
					setRating(0);
				}
			}
		}
	}

	// Get methods used for when the star has no icon.
	function getBackgroundSizeClassName() {
		let backgroundClassName;
		if (props.starSize <= 16) borderClassName = 'smallStarBackground';
		else if (props.starSize >= 17 && props.starSize <= 24) borderClassName = 'medStarBackground';
		else if (props.starSize > 24) backgroundClassName = 'largeStarBackground';
		return backgroundClassName;
	}

	function getBorderSizeClassName() {
		let borderClassName;
		if (props.starSize <= 16) borderClassName = 'smallStarBorder';
		else if (props.starSize >= 17 && props.starSize <= 24) borderClassName = 'medStarBorder';
		else if (props.starSize > 24) borderClassName = 'largeStarBorder';
		return borderClassName;
	}

	function renderFullStarIcon() {
		if (!props.customIcon) {
			const borderClassName = getBorderSizeClassName();
			return <Box className={`starRatingBorder ${borderClassName}`} bgColor={props.starColor || 'black'} />;
		}
		const { fullStarIcon } = props.customIcon;
		if (fullStarIcon) {
			return <Icon key={'icon'} {...fullStarIcon} />;
		}
	}

	function renderHalfOrNoStarIcon(starNumber: number) {
		if (!props.customIcon) {
			const borderClassName = getBorderSizeClassName();
			const backgroundClassName = getBackgroundSizeClassName();

			if (starNumber - rating - 1 >= 0) {
				return (
					<>
						<Box className={`starRatingBorder ${borderClassName} emptyStar`} bgColor={'lightgray'} />
						<Box className={`starRatingBackground ${backgroundClassName}`} bgColor={'white'} />
					</>
				);
			} else {
				return (
					<>
						<Box className={`starRatingBorder ${borderClassName} emptyStar`} bgColor={'lightgrey'} />
						<Box className={`starRatingBackground ${backgroundClassName}`} />
						<Box className={`halfStar ${borderClassName}`} bgColor={props.starColor || 'black'} />
					</>
				);
			}
		}

		const { halfStarIcon, noStarIcon } = props.customIcon;

		if (starNumber - rating - 1 >= 0) {
			return (
				<Icon
					key={'icon'}
					iconImg={noStarIcon?.iconImg || 'icon-empty-star'}
					size={props.starSize}
					color={props.starColor}
					{...noStarIcon}
				/>
			);
		} else {
			return (
				<Icon
					key={'icon'}
					iconImg={halfStarIcon?.iconImg || 'icon-half-star'}
					size={props.starSize}
					color={props.starColor}
					{...halfStarIcon}
				/>
			);
		}
	}

	function renderStarIcons() {
		let stars = [];
		for (let i = 1; i < 6; i++) {
			if (i <= rating) {
				stars.push(
					<div
						key={i}
						className={'starRating'}
						onClick={() => {
							handleClick(i);
						}}
						onMouseOver={() => {
							handleHover(true, i);
						}}
						onMouseOut={() => {
							handleHover(false, i);
						}}
					>
						{renderFullStarIcon()}
					</div>
				);
			} else {
				stars.push(
					<div
						key={i}
						className={'starRating'}
						onClick={() => {
							handleClick(i);
						}}
						onMouseOver={() => {
							handleHover(true, i);
						}}
						onMouseOut={() => {
							handleHover(false, i);
						}}
					>
						{renderHalfOrNoStarIcon(i)}
					</div>
				);
			}
		}

		return (
			<Box
				style={containerStyle}
				className={classNames('htStarRating', {
					dim: !props.rating && !props.isClickable,
					isClickable: props.isClickable
				})}
			>
				{stars}
			</Box>
		);
	}
	return renderStarIcons();
};

export { StarRating };
