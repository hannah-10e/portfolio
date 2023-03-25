import * as React from 'react';
import './Checkbox.scss';
import { InputHTMLAttributes, useEffect } from 'react';
import classNames from 'classnames';
import { ICommon } from '../../interfaces/common';
import { FormControl, IFormControl } from '../form/FormControl';

import { Box } from '../box/Box';
import clone from 'lodash.clone';

export interface CheckboxProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'checked'>,
		ICommon.PaletteProps,
		ICommon.SpacingProps,
		ICommon.TextProps,
		ICommon.HtmlElementProps {
	boxRef?: React.RefObject<HTMLDivElement>;
	elementRef?: React.RefObject<HTMLInputElement>;

	disabled?: boolean;

	labelText: string;
	labelPosition?: 'TOP' | 'RIGHT';

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
		| string;

	//Form Control
	control?: FormControl<boolean>;
	updateControl?: (control: FormControl<boolean>) => void;
	checked?: boolean | undefined;
	onChange?: (event: React.ChangeEvent<HTMLInputElement>, control?: FormControl<IFormControl>) => void;
}

const Checkbox: React.FC<CheckboxProps> = (props) => {
	const {
		id,
		boxRef,
		elementRef,
		control,
		updateControl,
		className,
		disabled,
		checked,
		labelText,
		labelPosition,
		look,
		onChange,

		...checkboxProps
	} = props;

	const [formControl, setFormControl] = React.useState<FormControl<boolean> | undefined>(control);
	useEffect(() => {
		setFormControl(control);
	}, [control]);

	async function changeHandler(event: React.ChangeEvent<HTMLInputElement>) {
		event.persist();
		const target = event.target;
		const updated = clone(control);

		if (updated) {
			updated.value = target.checked;

			await updated.validate();
			setFormControl(updated);
			if (updateControl) updateControl(updated);
		}
		if (onChange) onChange(event, updated);
	}

	function renderCheckbox() {
		const checkboxId = 'Checkbox-' + Math.random().toString(36).slice(-6);
		let checkbox = (
			<input
				id={checkboxId}
				type={'checkbox'}
				className={classNames('checkbox', className)}
				ref={elementRef}
				onChange={changeHandler}
				checked={!!formControl ? formControl.value : checked}
				disabled={disabled}
				{...checkboxProps}
			/>
		);
		let label = (
			<label htmlFor={checkboxId} className={'checkboxLabel'}>
				{labelText}
			</label>
		);
		let labelPlaced;
		if (!labelPosition || labelPosition === 'RIGHT') {
			labelPlaced = (
				<Box className={'checkboxContainer'}>
					{checkbox}
					{label}
				</Box>
			);
		} else {
			labelPlaced = (
				<Box className={'checkboxContainer'}>
					{label}
					{checkbox}
				</Box>
			);
		}
		return labelPlaced;
	}

	return (
		<Box
			id={id}
			className={classNames('htCheckbox', className, look)}
			color={props.color}
			bgColor={props.bgColor}
			elementRef={boxRef}
		>
			{renderCheckbox()}
		</Box>
	);
};

export { Checkbox };
