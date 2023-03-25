import * as React from 'react';
import './RadioButtonGroup.scss';
import { Box } from '../box/Box';
import { ICommon } from '../../interfaces/common';
import { LabelRadioButton } from '../labelRadioButton/LabelRadioButton';
import { FormControl } from '../form/FormControl';

type IValueOptions = string | number;

export interface IGroupOptions {
	label: string;
	value: IValueOptions;
	isSelected?: boolean;
}

export interface IContainerProps
	extends ICommon.SpacingProps,
		ICommon.FlexProps,
		Omit<ICommon.PaletteProps, 'color'>,
		ICommon.DimensionProps,
		ICommon.HtmlElementProps {}

export interface RadioButtonGroupProps extends IContainerProps {
	groupName: string;
	options: IGroupOptions[];
	labelStyles: Omit<ICommon.NewLabelProps, 'children'>;

	control?: FormControl<IValueOptions>;
	updateControl?: (control: FormControl<IValueOptions>) => void;
	onChange?: (value: IValueOptions) => void;
}

const RadioButtonGroup: React.FC<RadioButtonGroupProps> = (props) => {
	const { groupName, options, labelStyles, control, updateControl, onChange, ...containerStyles } = props;

	function renderRadioButtons() {
		return options.map((item, index) => {
			let selected = item.isSelected;
			if (control) {
				selected = control.value === item.value;
			}

			return (
				<LabelRadioButton
					radioName={groupName}
					value={item.value}
					onSelect={(value) => {
						if (control && updateControl) {
							let newControl = control;
							newControl.value = value;
							updateControl(newControl);
						}
						if (onChange) onChange(value);
					}}
					label={{ ...labelStyles, children: item.label }}
					isChecked={selected}
				/>
			);
		});
	}

	return (
		<Box className={'htRadioButtonGroup'} {...containerStyles}>
			{renderRadioButtons()}
		</Box>
	);
};

export { RadioButtonGroup };
