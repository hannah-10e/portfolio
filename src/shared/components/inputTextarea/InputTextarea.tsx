import * as React from 'react';
import './InputTextarea.scss';
import { TextareaHTMLAttributes, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { ICommon } from '../../interfaces/common';
import { FormControl } from '../form/FormControl';
import { Box } from '../box/Box';
import clone from 'lodash.clone';
import { renderErrors } from '../../utils/internal';

export interface InputTextareaProps
	extends ICommon.PaletteProps,
		Omit<ICommon.HtmlElementProps, 'display'>,
		Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'>,
		ICommon.MarginProps {
	elementRef?: React.RefObject<HTMLDivElement>;
	look?: 'standard' | 'filled' | 'outlined' | string;
	noAutocomplete?: boolean;
	autocompleteType?: ICommon.AutoCompleteType | string; // Defaults to "on"
	value?: string | readonly string[] | undefined;
	helperText?: string | React.ReactNode;

	//Textarea properties
	minLength?: number;
	maxLength?: number;

	//Form Control
	control?: FormControl<string>;
	updateControl?: (control: FormControl<string>) => void;
	immediateValidate?: boolean; // Begins checking the input as soon as it changes

	useFloatingPlaceholder?: boolean;

	onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
	onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
	onChange?: (value: string, event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const InputTextarea: React.FC<InputTextareaProps> = (props) => {
	const {
		id,
		look,
		elementRef,
		control,
		updateControl,
		noAutocomplete,
		autocompleteType,
		onChange,
		className,
		placeholder,
		value,
		minLength,
		maxLength,
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
		...textareaProps
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

	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	const [hasBeenBlurred, setHasBeenBlurred] = useState<boolean>(immediateValidate || false);
	const [formControl, setFormControl] = useState<FormControl<string> | undefined>(control);

	useEffect(() => {
		setFormControl(control);
	}, [control]);

	async function validateTarget(target: HTMLTextAreaElement, forceValidate: boolean = false) {
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

		target.setSelectionRange(startPosition, endPosition);
	}

	async function changeHandler(event: React.ChangeEvent<HTMLTextAreaElement>) {
		// Required to persist in React 16.X but not 17.X. Otherwise, the await() will lose the object
		event.persist();

		if (onChange) onChange(event.target.value, event);
		if (!control) return;

		validateTarget(event.target).catch(console.error);
	}

	function handleBlur(event: React.FocusEvent<HTMLTextAreaElement>) {
		setHasBeenBlurred(true);

		validateTarget(event.target, true).catch(console.error);
		if (onBlur) onBlur(event);
	}

	function getAutocompleteType(): string {
		if (props.noAutocomplete) return 'off';
		if (props.autocompleteType) return props.autocompleteType;
		return 'on';
	}

	function renderTextarea() {
		let textArea = (
			<textarea
				ref={textareaRef}
				onChange={changeHandler}
				value={!!formControl ? formControl.value : value}
				autoComplete={getAutocompleteType()}
				onFocus={props.onFocus}
				onBlur={handleBlur}
				placeholder={useFloatingPlaceholder ? ' ' : placeholder}
				{...textareaProps}
			/>
		);

		if (!useFloatingPlaceholder) return textArea;

		return (
			<Box className={'floatingPlaceholder'}>
				{textArea}
				<label>{placeholder}</label>
			</Box>
		);
	}

	function focusInput() {
		if (textareaRef && textareaRef.current) textareaRef.current.focus();
	}

	return (
		<Box
			id={id}
			className={classNames('htInputTextarea', className, look)}
			elementRef={elementRef}
			color={props.color}
			bgColor={props.bgColor}
			{...boxMarginProps}
		>
			<Box className={'inputTextareaContainer'} onClick={focusInput}>
				{renderTextarea()}
			</Box>
			{!!helperText && <Box className={'helperText'}>{helperText}</Box>}
			{renderErrors(props.control)}
		</Box>
	);
};

export { InputTextarea };
