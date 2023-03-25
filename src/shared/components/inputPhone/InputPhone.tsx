import * as React from 'react';
import './InputPhone.scss';
import { Box } from '../box/Box';
import { ICommon } from '../../interfaces/common';
import { extractMarginProps, renderErrors } from '../../utils/internal';
import classNames from 'classnames';
import { FormControl } from '../form/FormControl';
import { useEffect, useMemo, useRef, useState } from 'react';
import PhoneInput, { Props as PhoneInputProps } from 'react-phone-number-input';
import clone from 'lodash.clone';
import { Icon } from '../icon/Icon';
import { getCountryCallingCode } from 'react-phone-number-input';
import { CountryCode } from 'libphonenumber-js/core';
import { ObjectUtils, StringUtils } from '../../utils';

import 'react-phone-number-input/style.css';

//github docs: https://www.npmjs.com/package/react-phone-number-input

export interface InputPhoneProps
	extends Omit<PhoneInputProps<Partial<HTMLInputElement>>, 'onChange'>,
		ICommon.MarginProps {
	control?: FormControl<string>;
	updateControl?: (control: FormControl<string>) => void;
	immediateValidate?: boolean; // Begins checking the input as soon as it changes
	showFlags?: boolean;
	onChange?: (value: string) => void;
	helperText?: string | React.ReactNode;
	icon?: ICommon.NewIconProps[];
}

const InputPhone: React.FC<InputPhoneProps> = (props) => {
	const { marginProps, remaining } = extractMarginProps(props);
	const {
		className,
		id,
		control,
		value,
		onChange,
		updateControl,
		onBlur,
		immediateValidate,
		helperText,
		icon,
		showFlags,
		...phoneProps
	} = remaining;

	const uniqueSelectId = useMemo(() => {
		return `PhoneInputFlagSelect-${Math.round(Math.random() * 10000)}`;
	}, []);

	const [hasBeenBlurred, setHasBeenBlurred] = useState<boolean>(immediateValidate || false);
	const [formControl, setFormControl] = useState<FormControl<string> | undefined>(control);
	const [countryCode, setCountryCode] = useState<CountryCode>(
		phoneProps.defaultCountry || ObjectUtils.isArrayWithData(phoneProps.countries) ? phoneProps.countries![0] : 'US'
	);
	const boxRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		setFormControl(control);
	}, [control]);

	async function changeHandler(value: string) {
		setCountryCode((document.getElementById(uniqueSelectId) as HTMLSelectElement).value as CountryCode);
		if (onChange) onChange(value);
		if (!control) return;

		validateTarget(value).catch(console.error);
	}

	async function validateTarget(
		value: string,
		forceValidate: boolean = false,
		ignoreCursorPosition: boolean = false
	) {
		if (!control) return;
		const updated = clone(control);

		updated.value = value;
		if (!updated.value || updated.value.length === 0) {
			updated.clearErrors();
		} else if (hasBeenBlurred || forceValidate) {
			await updated.validate();
		}

		setFormControl(updated);
		if (updateControl) updateControl(updated);
	}

	function focusInput(event: React.MouseEvent<HTMLElement>) {
		if (boxRef && boxRef.current) {
			//@ts-ignore
			if (event.target.id === uniqueSelectId) return;

			(boxRef.current?.querySelector('.rsBox.inputContainer input') as HTMLInputElement).focus();
		}
	}

	function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
		setHasBeenBlurred(true);
		let country: CountryCode = countryCode;
		let value = StringUtils.removeAllExceptNumbers(event.target.value);

		if (value) {
			let code = getCountryCallingCode(country);
			//Check to see if country code is already there.
			if (value.slice(0, code.length) === code) value += '+';
			else value = `+${getCountryCallingCode(country)}${value}`;
		}
		validateTarget(value, true, true).catch(console.error);
		if (onBlur) onBlur(event);
	}

	function renderInput() {
		let inputStyled = (
			<PhoneInput
				className={classNames({ showFlags })}
				defaultCountry={countryCode}
				onBlur={handleBlur}
				onChange={changeHandler}
				value={!!formControl ? formControl.value : value}
				countrySelectProps={{
					id: uniqueSelectId
				}}
				{...phoneProps}
			/>
		);

		if (!icon) return inputStyled;

		let iconInput = [inputStyled];

		icon.forEach((item, index) => {
			const { position, isHidden, ...iconProps } = item;
			if (isHidden) return;
			if (position === 'LEFT') {
				iconInput = [<Icon key={`${item.iconImg}${index}`} {...iconProps} />, ...iconInput];
			} else {
				iconInput = [...iconInput, <Icon key={`${item.iconImg}${index}`} {...iconProps} />];
			}
		});
		return iconInput;
	}

	return (
		<Box id={id} className={classNames('htInputPhone', className)} {...marginProps} elementRef={boxRef}>
			<Box className={'inputContainer'} onClick={focusInput}>
				{renderInput()}
			</Box>
			{!!helperText && <Box className={'helperText'}>{helperText}</Box>}
			{renderErrors(control)}
		</Box>
	);
};

export { InputPhone };
