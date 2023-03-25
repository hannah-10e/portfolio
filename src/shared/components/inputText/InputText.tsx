import * as React from 'react';
import './InputText.scss';
import { InputHTMLAttributes, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { ICommon } from '../../interfaces/common';
import { FormControl } from '../form/FormControl';
import { Box } from '../box/Box';
import clone from 'lodash.clone';
import { Icon } from '../icon/Icon';
import { renderErrors } from '../../utils/internal';

export interface InputTextProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'inputMode'>,
		Omit<ICommon.HtmlElementProps, 'display'>,
		ICommon.MarginProps,
		ICommon.PaletteProps {
	inputMode: 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
	elementRef?: React.RefObject<HTMLDivElement>;
	look?: 'standard' | 'filled' | 'outlined' | string;
	type?: 'text' | 'password' | 'tel' | 'hidden' | 'date' | 'datetime-local' | 'month' | 'time';
	noAutocomplete?: boolean;
	autocompleteType?: ICommon.AutoCompleteType | string; // Defaults to "on"
	value?: string | number | readonly string[] | undefined;
	helperText?: string | React.ReactNode;

	//Form Control
	control?: FormControl<string | string[] | number>;
	updateControl?: (control: FormControl<string | string[] | number>) => void;
	immediateValidate?: boolean; // Begins checking the input as soon as it changes

	//Css
	borderColor?: string;
	useFloatingPlaceholder?: boolean;

	icon?: ICommon.NewIconProps[];

	maxLength?: number; // Only works with text inputText type
	minLength?: number; // Only works with text inputText type
	minValue?: number; // Only works with number, range, date, datetime-local, month, time and week.
	maxValue?: number; // Only works with number, range, date, datetime-local, month, time and week.
	onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
	onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
	onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputText: React.FC<InputTextProps> = (props) => {
	const {
		id,
		look,
		elementRef,
		control,
		updateControl,
		icon,
		noAutocomplete,
		autocompleteType,
		onChange,
		className,
		bgColor,
		borderColor,
		color,
		placeholder,
		type,
		inputMode,
		value,
		useFloatingPlaceholder,
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
		immediateValidate,
		onBlur,
		helperText,
		...inputProps
	} = props;

	const boxMarginProps = {
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

	const [hasBeenBlurred, setHasBeenBlurred] = useState<boolean>(immediateValidate || false);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const [formControl, setFormControl] = React.useState<FormControl<string | string[] | number> | undefined>(control);

	useEffect(() => {
		setFormControl(control);
	}, [control]);

	async function validateTarget(
		target: HTMLInputElement,
		forceValidate: boolean = false,
		ignoreCursorPosition: boolean = false
	) {
		if (!control) return;
		const startPosition = target.selectionStart || 0;
		const endPosition = target.selectionEnd || 0;
		const updated = clone(control);

		updated.value = target.value;
		if (updated.value.length === 0) {
			updated.clearErrors();
		} else if (hasBeenBlurred || forceValidate) {
			await updated.validate();
		}

		setFormControl(updated);
		if (updateControl) updateControl(updated);

		// MDN lists that text, search, URL, tel and password are the only types that support selectionStart and selectionEnd
		// See - https://html.spec.whatwg.org/multipage/forms.html#concept-input-apply
		// Also onBlur we don't want to adjust the cursor either - safari bug
		if (['text', 'search', 'url', 'tel', 'password'].includes(props.type || '') && !ignoreCursorPosition)
			target.setSelectionRange(startPosition, endPosition);
	}

	async function changeHandler(event: React.ChangeEvent<HTMLInputElement>) {
		// Required to persist in React 16.X but not 17.X. Otherwise the await() will lose the object
		event.persist();

		if (onChange) onChange(event.target.value, event);
		if (!control) return;

		validateTarget(event.target).catch(console.error);
	}

	function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
		setHasBeenBlurred(true);

		validateTarget(event.target, true, true).catch(console.error);
		if (onBlur) onBlur(event);
	}

	function getAutocompleteType(): string {
		if (props.noAutocomplete) return 'off';
		if (props.autocompleteType) return props.autocompleteType;
		return 'on';
	}

	function getInputStyle() {
		let input = (
			<input
				key={'input'}
				type={type}
				inputMode={inputMode}
				ref={inputRef}
				onChange={changeHandler}
				value={!!formControl ? formControl.value : value}
				autoComplete={getAutocompleteType()}
				onFocus={props.onFocus}
				onBlur={handleBlur}
				placeholder={useFloatingPlaceholder ? ' ' : placeholder}
				{...inputProps}
			/>
		);

		if (!useFloatingPlaceholder) return input;

		return (
			<Box className={'floatingPlaceholder'} key={'floating'}>
				{input}
				<label>{placeholder}</label>
			</Box>
		);
	}

	function renderInput() {
		let inputStyled = getInputStyle();

		if (!icon) {
			return inputStyled;
		}

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

	function hasError(): boolean {
		if (!control) return false;
		return control.errors.length > 0;
	}

	function focusInput() {
		if (inputRef && inputRef.current) inputRef.current.focus();
	}

	return (
		<Box
			id={id}
			className={classNames('htInputText', className, look, { error: hasError() })}
			bgColor={bgColor}
			color={color}
			borderColor={borderColor}
			elementRef={elementRef}
			{...boxMarginProps}
		>
			<Box className={'inputContainer'} onClick={focusInput}>
				{renderInput()}
			</Box>
			{!!helperText && <Box className={'helperText'}>{helperText}</Box>}
			{renderErrors(props.control)}
		</Box>
	);
};

export { InputText };
