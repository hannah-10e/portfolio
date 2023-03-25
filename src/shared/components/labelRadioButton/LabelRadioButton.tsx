import * as React from 'react';
import './LabelRadioButton.scss';
import { Box } from '../box/Box';
import { Label } from '../label/Label';
import { ICommon } from '../../interfaces/common';
import classNames from 'classnames';
import { useRef } from 'react';

export interface LabelRadioButtonProps extends Omit<ICommon.HtmlElementProps, 'display'>, ICommon.MarginProps {
	radioName: string;
	value: string | number;
	isChecked?: boolean;
	onSelect: (value: string | number) => void;
	label: ICommon.NewLabelProps;
}

const LabelRadioButton: React.FC<LabelRadioButtonProps> = (props) => {
	const { className, radioName, value, isChecked, onSelect, label, ...marginProps } = props;
	const radioLabelRef = useRef<HTMLLabelElement>(null);

	function renderLabelPosition() {
		let radioButton = (
			<label key={'radioButton'} className={'radioButtonContainer'} ref={radioLabelRef}>
				<input
					type={'radio'}
					name={radioName}
					value={value}
					checked={isChecked}
					onChange={(e) => {
						let inputValue = e.target as HTMLInputElement;
						if (inputValue.checked) onSelect(value);
					}}
				/>
				<span className={'radioButton'}>
					<Box />
				</span>
			</label>
		);
		let radioLabel = (
			<Label
				key={'radioLabel'}
				{...label}
				onClick={(event) => {
					if (radioLabelRef.current) {
						radioLabelRef.current.click();
					}
					if (label.onClick) label.onClick(event);
				}}
			>
				{label.children}
			</Label>
		);

		if (label.position === 'LEFT') return [radioLabel, radioButton];
		else return [radioButton, radioLabel];
	}

	return (
		<Box
			id={props.id}
			className={classNames('htLabelRadioButton', className)}
			onClick={(event) => {
				event.stopPropagation();
			}}
			{...marginProps}
		>
			{renderLabelPosition()}
		</Box>
	);
};

export { LabelRadioButton };
