import classNames from 'classnames';
import clone from 'lodash.clone';
import React, { MouseEvent, useEffect, useState } from 'react';
import { ICommon } from '../../interfaces/common';
import { useUpdateEffect } from '../../hooks';
import { ObjectUtils } from '../../utils';
import { FormControl } from '../form/FormControl';
import './InputNumber.scss';
import { renderErrors } from '../../utils/internal';
import { Box } from '../box/Box';

export interface InputNumberProps extends Omit<ICommon.HtmlElementProps, 'display'>, ICommon.MarginProps {
	name?: string | null;
	showButtons?: boolean;
	inputMode?: 'decimal' | 'numeric' | null;
	buttonLayout?: string;
	mode?: string;
	minFractionDigits?: number;
	maxFractionDigits?: number;
	locale?: string;
	currency?: string;
	currencyDisplay?: string;
	allowEmpty?: boolean;
	min?: number | null;
	max?: number | null;
	disabled?: boolean;
	readOnly?: boolean;
	inputClassName?: string | null;
	localeMatcher?: any;
	useGrouping?: boolean;
	format?: boolean;
	autoFocus?: boolean;
	step?: number;
	value?: number | null;
	prefix?: string | null;
	suffix?: string | null;
	ariaLabelledBy?: string | null;
	helperText?: string | React.ReactNode;

	//Form Control
	control?: FormControl<number>;
	updateControl?: (control: FormControl<number>) => void;
	immediateValidate?: boolean; // Begins checking the input as soon as it changes

	//Event Handlers
	onKeyDown?: ((event: React.KeyboardEvent<HTMLInputElement>) => void) | null;
	onFocus?: ((event: React.FocusEvent<HTMLInputElement>) => void) | null;
	onBlur?: ((event: React.FocusEvent<HTMLInputElement>) => void) | null;
	onChange?: ((value: number | null, event: React.UIEvent) => void) | null;
	onValueChange?:
		| ((data: {
				originalEvent: React.UIEvent | null;
				value: string | number | null;
				stopPropagation: () => void;
				preventDefault: () => void;
				target: {
					name: string;
					id: string;
					value: number;
				};
		  }) => void)
		| null;
}

interface InputNumberFormatOptions extends Intl.NumberFormatOptions {
	localeMatcher: any;
	style: string;
	currency: string;
	currencyDisplay: string;
	useGrouping: boolean;
	minimumFractionDigits: number;
	maximumFractionDigits: number;
}

const InputNumber: React.FC<InputNumberProps> = (props) => {
	const {
		id,
		name,
		showButtons,
		inputMode: _inputMode,
		buttonLayout,
		mode,
		minFractionDigits,
		maxFractionDigits,
		locale,
		currency,
		currencyDisplay,
		allowEmpty,
		min,
		max,
		disabled,
		readOnly,
		className,
		inputClassName,
		localeMatcher,
		useGrouping,
		format,
		autoFocus,
		value,
		prefix,
		suffix,
		ariaLabelledBy,
		step,
		control,
		updateControl,
		onKeyDown,
		onFocus,
		onBlur,
		onChange,
		onValueChange,
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

	const elementRef = React.useRef(null);
	const inputRef = React.useRef<HTMLInputElement | null>(null);
	const timer = React.useRef<NodeJS.Timeout | null>(null);
	const lastValue = React.useRef<string | null>(null);

	const numberFormat = React.useRef<Intl.NumberFormat | null>(null);
	const groupChar = React.useRef<string | null>(null);
	const prefixChar = React.useRef<string | null>(null);
	const suffixChar = React.useRef<string | null>(null);
	const isSpecialChar = React.useRef<boolean | null>(null);
	const _numeral = React.useRef<RegExp | null>(null);
	const _group = React.useRef<RegExp | null>(null);
	const _minusSign = React.useRef<RegExp | null>(null);
	const _currency = React.useRef<RegExp | null>(null);
	const _decimal = React.useRef<RegExp | null>(null);
	const _suffix = React.useRef<RegExp | null>(null);
	const _prefix = React.useRef<RegExp | null>(null);
	const _index = React.useRef<Function | null>(null);

	const stacked = props.showButtons && props.buttonLayout === 'stacked';
	const inputMode = _inputMode || (props.mode === 'decimal' && !props.minFractionDigits ? 'numeric' : 'decimal');

	const [hasBeenBlurred, setHasBeenBlurred] = useState<boolean>(immediateValidate || false);

	const [formControl, setFormControl] = React.useState<FormControl<number> | null>(control as FormControl<number>);

	useEffect(() => {
		setFormControl(control || null);
	}, [control]);

	function getOptions(): InputNumberFormatOptions {
		return {
			localeMatcher: props.localeMatcher,
			style: props.mode as string,
			currency: props.currency as string,
			currencyDisplay: props.currencyDisplay as string,
			useGrouping: props.useGrouping as boolean,
			minimumFractionDigits: props.minFractionDigits as number,
			maximumFractionDigits: props.maxFractionDigits as number
		};
	}

	function constructParser() {
		numberFormat.current = new Intl.NumberFormat(props.locale, getOptions());
		const numerals = new Intl.NumberFormat(props.locale, { useGrouping: false })
			.format(9876543210)
			.split('')
			.reverse();
		const index = new Map(numerals.map((d, i) => [d, i]));
		_numeral.current = new RegExp(`[${numerals.join('')}]`, 'g');
		_group.current = getGroupingExpression();
		_minusSign.current = getMinusSignExpression();
		_currency.current = getCurrencyExpression();
		_decimal.current = getDecimalExpression();
		_suffix.current = getSuffixExpression();
		_prefix.current = getPrefixExpression();
		_index.current = (d: string) => index.get(d);
	}

	function escapeRegExp(text: string) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
	}

	function getDecimalExpression() {
		const formatter = new Intl.NumberFormat(props.locale, { ...getOptions(), useGrouping: false });
		return new RegExp(
			`[${formatter
				.format(1.1)
				.replace(_currency.current as RegExp, '')
				.trim()
				.replace(_numeral.current as RegExp, '')}]`,
			'g'
		);
	}

	function getGroupingExpression() {
		const formatter = new Intl.NumberFormat(props.locale, { useGrouping: true });
		groupChar.current = formatter
			.format(1000000)
			.trim()
			.replace(_numeral.current as RegExp, '')
			.charAt(0);
		return new RegExp(`[${groupChar.current}]`, 'g');
	}

	function getMinusSignExpression() {
		const formatter = new Intl.NumberFormat(props.locale, { useGrouping: false });
		return new RegExp(
			`[${formatter
				.format(-1)
				.trim()
				.replace(_numeral.current as RegExp, '')}]`,
			'g'
		);
	}

	function getCurrencyExpression() {
		if (props.currency) {
			const formatter = new Intl.NumberFormat(props.locale, {
				style: 'currency',
				currency: props.currency,
				currencyDisplay: props.currencyDisplay,
				minimumFractionDigits: 0,
				maximumFractionDigits: 0
			});
			return new RegExp(
				`[${formatter
					.format(1)
					.replace(/\s/g, '')
					.replace(_numeral.current as RegExp, '')
					.replace(_group.current as RegExp, '')}]`,
				'g'
			);
		}

		return new RegExp(`[]`, 'g');
	}

	function getPrefixExpression() {
		if (props.prefix) {
			prefixChar.current = props.prefix;
		} else {
			const formatter = new Intl.NumberFormat(props.locale, {
				style: props.mode,
				currency: props.currency,
				currencyDisplay: props.currencyDisplay
			});
			prefixChar.current = formatter.format(1).split('1')[0];
		}

		return new RegExp(`${escapeRegExp(prefixChar.current || '')}`, 'g');
	}

	function getSuffixExpression() {
		if (props.suffix) {
			suffixChar.current = props.suffix;
		} else {
			const formatter = new Intl.NumberFormat(props.locale, {
				style: props.mode,
				currency: props.currency,
				currencyDisplay: props.currencyDisplay,
				minimumFractionDigits: 0,
				maximumFractionDigits: 0
			});
			suffixChar.current = formatter.format(1).split('1')[1];
		}

		return new RegExp(`${escapeRegExp(suffixChar.current || '')}`, 'g');
	}

	function formatValue(value: string | number | null): string {
		if (value != null) {
			if (value === '-') {
				// Minus sign
				return value;
			}

			if (props.format) {
				let formatter = new Intl.NumberFormat(props.locale, getOptions());
				let _formattedValue = formatter.format(value as number);
				if (props.prefix) {
					_formattedValue = props.prefix + _formattedValue;
				}

				if (props.suffix) {
					_formattedValue = _formattedValue + props.suffix;
				}

				return _formattedValue;
			}

			return value.toString();
		}

		return '';
	}

	function parseValue(text: string) {
		let filteredText = text
			.replace(_suffix.current as RegExp, '')
			.replace(_prefix.current as RegExp, '')
			.trim()
			.replace(/\s/g, '')
			.replace(_currency.current as RegExp, '')
			.replace(_group.current as RegExp, '')
			.replace(_minusSign.current as RegExp, '-')
			.replace(_decimal.current as RegExp, '.')
			.replace(_numeral.current as RegExp, _index.current as (d: string) => string);

		if (filteredText) {
			if (filteredText === '-')
				// Minus sign
				return filteredText;

			let parsedValue = +filteredText;
			return isNaN(parsedValue) ? null : parsedValue;
		}

		return null;
	}

	function repeat(event: React.UIEvent, interval: number | null, dir: number) {
		let i = interval || 500;

		clearTimer();
		timer.current = setTimeout(() => {
			repeat(event, 40, dir);
		}, i);

		spin(event, dir);
	}

	function spin(event: React.UIEvent, dir: number) {
		if (inputRef.current) {
			let step = (props.step as number) * dir;
			let currentValue = parseValue(inputRef.current.value) || 0;
			let newValue = validateValue((currentValue as number) + step);

			// touch devices trigger the keyboard to display because of setSelectionRange
			!isTouchDevice() && updateInput(newValue as number, null, 'spin');
			updateModel(event, newValue ?? null);

			handleOnChange(event, currentValue as string, newValue as number);
		}
	}

	function onUpButtonTouchStart(event: React.TouchEvent<HTMLButtonElement>) {
		if (!props.disabled && !props.readOnly) {
			repeat(event, null, 1);
			event.preventDefault();
		}
	}

	function onUpButtonMouseDown(event: MouseEvent) {
		if (!props.disabled && !props.readOnly) {
			props.autoFocus && inputRef.current?.focus();
			repeat(event, null, 1);
			event.preventDefault();
		}
	}

	function onUpButtonTouchEnd() {
		if (!props.disabled && !props.readOnly) {
			clearTimer();
			event?.preventDefault();
		}
	}

	function onUpButtonMouseUp() {
		if (!props.disabled && !props.readOnly) {
			clearTimer();
		}
	}

	function onUpButtonMouseLeave() {
		if (!props.disabled && !props.readOnly) {
			clearTimer();
		}
	}

	function onUpButtonKeyUp() {
		if (!props.disabled && !props.readOnly) {
			clearTimer();
		}
	}

	function onUpButtonKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
		if (!props.disabled && !props.readOnly && (event.keyCode === 32 || event.keyCode === 13)) {
			repeat(event, null, 1);
		}
	}

	function onDownButtonTouchStart(event: React.TouchEvent<HTMLButtonElement>) {
		if (!props.disabled && !props.readOnly) {
			repeat(event, null, -1);
			event.preventDefault();
		}
	}

	function onDownButtonTouchEnd() {
		if (!props.disabled && !props.readOnly) {
			clearTimer();
			event?.preventDefault();
		}
	}

	function onDownButtonMouseDown(event: React.MouseEvent<HTMLButtonElement>) {
		if (!props.disabled && !props.readOnly) {
			props.autoFocus && inputRef.current?.focus();
			repeat(event, null, -1);

			event.preventDefault();
		}
	}

	function onDownButtonMouseUp() {
		if (!props.disabled && !props.readOnly) {
			clearTimer();
		}
	}

	function onDownButtonMouseLeave() {
		if (!props.disabled && !props.readOnly) {
			clearTimer();
		}
	}

	function onDownButtonKeyUp() {
		if (!props.disabled && !props.readOnly) {
			clearTimer();
		}
	}

	function onDownButtonKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
		if (!props.disabled && !props.readOnly && (event.key === 'Space' || event.key === 'Enter')) {
			repeat(event, null, -1);
		}
	}

	function onInput(event: React.KeyboardEvent<HTMLInputElement>) {
		if (props.disabled || props.readOnly) {
			return;
		}

		if (isSpecialChar.current) {
			const target = event.target as HTMLInputElement;
			target.value = lastValue.current as string;
		}
		isSpecialChar.current = false;
	}

	function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (props.disabled || props.readOnly) {
			return;
		}

		const target = event.target as HTMLInputElement;
		lastValue.current = target.value;
		if (event.shiftKey || event.altKey) {
			isSpecialChar.current = true;
			return;
		}

		let selectionStart = target.selectionStart as number;
		let selectionEnd = target.selectionEnd as number;
		let inputValue = target.value as string;
		let newValueStr = null;

		if (event.altKey) {
			event.preventDefault();
		}

		switch (event.which) {
			//up
			case 38:
				spin(event, 1);
				event.preventDefault();
				break;

			//down
			case 40:
				spin(event, -1);
				event.preventDefault();
				break;

			//left
			case 37:
				if (!isNumeralChar(inputValue.charAt(selectionStart - 1))) {
					event.preventDefault();
				}
				break;

			//right
			case 39:
				if (!isNumeralChar(inputValue.charAt(selectionStart))) {
					event.preventDefault();
				}
				break;

			//enter
			case 13:
				newValueStr = validateValue(parseValue(inputValue) as number) as string;
				if (inputRef.current) {
					inputRef.current.value = formatValue(newValueStr);
					inputRef.current.setAttribute('aria-valuenow', newValueStr);
				}
				updateModel(event, newValueStr);
				break;

			//backspace
			case 8:
				event.preventDefault();

				if (selectionStart === selectionEnd) {
					const deleteChar = inputValue.charAt(selectionStart - 1);
					const { decimalCharIndex, decimalCharIndexWithoutPrefix } = getDecimalCharIndexes(inputValue);

					if (isNumeralChar(deleteChar)) {
						const decimalLength = getDecimalLength(inputValue);

						if ((_group.current as RegExp).test(deleteChar)) {
							(_group.current as RegExp).lastIndex = 0;
							newValueStr =
								inputValue.slice(0, selectionStart - 2) + inputValue.slice(selectionStart - 1);
						} else if ((_decimal.current as RegExp).test(deleteChar)) {
							(_decimal.current as RegExp).lastIndex = 0;

							if (decimalLength) {
								inputRef.current?.setSelectionRange(selectionStart - 1, selectionStart - 1);
							} else {
								newValueStr =
									inputValue.slice(0, selectionStart - 1) + inputValue.slice(selectionStart);
							}
						} else if (decimalCharIndex > 0 && selectionStart > decimalCharIndex) {
							const insertedText =
								isDecimalMode() && (props.minFractionDigits || 0) < decimalLength ? '' : '0';
							newValueStr =
								inputValue.slice(0, selectionStart - 1) +
								insertedText +
								inputValue.slice(selectionStart);
						} else if (decimalCharIndexWithoutPrefix === 1) {
							newValueStr =
								inputValue.slice(0, selectionStart - 1) + '0' + inputValue.slice(selectionStart);
							newValueStr = (parseValue(newValueStr) as number) > 0 ? newValueStr : '';
						} else {
							newValueStr = inputValue.slice(0, selectionStart - 1) + inputValue.slice(selectionStart);
						}
					}

					updateValue(event, newValueStr as string, null, 'delete-single');
				} else {
					newValueStr = deleteRange(inputValue, selectionStart, selectionEnd);
					updateValue(event, newValueStr, null, 'delete-range');
				}

				break;

			// del
			case 46:
				event.preventDefault();

				if (selectionStart === selectionEnd) {
					const deleteChar = inputValue.charAt(selectionStart);
					const { decimalCharIndex, decimalCharIndexWithoutPrefix } = getDecimalCharIndexes(inputValue);

					if (isNumeralChar(deleteChar)) {
						const decimalLength = getDecimalLength(inputValue);

						if ((_group.current as RegExp).test(deleteChar)) {
							(_group.current as RegExp).lastIndex = 0;
							newValueStr = inputValue.slice(0, selectionStart) + inputValue.slice(selectionStart + 2);
						} else if ((_decimal.current as RegExp).test(deleteChar)) {
							(_decimal.current as RegExp).lastIndex = 0;

							if (decimalLength) {
								inputRef.current?.setSelectionRange(selectionStart + 1, selectionStart + 1);
							} else {
								newValueStr =
									inputValue.slice(0, selectionStart) + inputValue.slice(selectionStart + 1);
							}
						} else if (decimalCharIndex > 0 && selectionStart > decimalCharIndex) {
							const insertedText =
								isDecimalMode() && (props.minFractionDigits || 0) < decimalLength ? '' : '0';
							newValueStr =
								inputValue.slice(0, selectionStart) +
								insertedText +
								inputValue.slice(selectionStart + 1);
						} else if (decimalCharIndexWithoutPrefix === 1) {
							newValueStr =
								inputValue.slice(0, selectionStart) + '0' + inputValue.slice(selectionStart + 1);
							newValueStr = (parseValue(newValueStr) as number) > 0 ? newValueStr : '';
						} else {
							newValueStr = inputValue.slice(0, selectionStart) + inputValue.slice(selectionStart + 1);
						}
					}

					updateValue(event, newValueStr as string, null, 'delete-back-single');
				} else {
					newValueStr = deleteRange(inputValue, selectionStart, selectionEnd);
					updateValue(event, newValueStr, null, 'delete-range');
				}
				break;

			default:
				break;
		}

		if (props.onKeyDown) {
			props.onKeyDown(event);
		}
	}

	function onInputKeyPress(event: React.KeyboardEvent) {
		if (props.disabled || props.readOnly) {
			return;
		}

		const code = event.which || event.keyCode;

		if (code !== 13) {
			// to submit a form
			event.preventDefault();
		}

		const char = String.fromCharCode(code);
		const _isDecimalSign = isDecimalSign(char);
		const _isMinusSign = isMinusSign(char);

		if ((48 <= code && code <= 57) || _isMinusSign || _isDecimalSign) {
			insert(event, char, { isDecimalSign: _isDecimalSign, isMinusSign: _isMinusSign });
		}
	}

	function onPaste(event: React.ClipboardEvent) {
		event.preventDefault();

		if (props.disabled || props.readOnly) {
			return;
		}

		let data = (event.clipboardData || (window as any)['clipboardData']).getData('Text');
		if (data) {
			let filteredData = parseValue(data);
			if (filteredData != null) {
				insert(event as any, filteredData.toString());
			}
		}
	}

	function allowMinusSign() {
		return props.min === null || (props.min as number) < 0;
	}

	function isMinusSign(char: string) {
		if ((_minusSign.current as RegExp).test(char) || char === '-') {
			(_minusSign.current as RegExp).lastIndex = 0;
			return true;
		}

		return false;
	}

	function isDecimalSign(char: string) {
		if ((_decimal.current as RegExp).test(char)) {
			(_decimal.current as RegExp).lastIndex = 0;
			return true;
		}

		return false;
	}

	function isDecimalMode() {
		return props.mode === 'decimal';
	}

	function getDecimalCharIndexes(val: string) {
		const decimalCharIndex = val.search(_decimal.current as RegExp);
		(_decimal.current as RegExp).lastIndex = 0;

		const filteredVal = val
			.replace(_prefix.current as RegExp, '')
			.trim()
			.replace(/\s/g, '')
			.replace(_currency.current as RegExp, '');
		const decimalCharIndexWithoutPrefix = filteredVal.search(_decimal.current as RegExp);
		(_decimal.current as RegExp).lastIndex = 0;

		return { decimalCharIndex, decimalCharIndexWithoutPrefix };
	}

	function getCharIndexes(val: string) {
		const decimalCharIndex = val.search(_decimal.current as RegExp);
		(_decimal.current as RegExp).lastIndex = 0;
		const minusCharIndex = val.search(_minusSign.current as RegExp);
		(_minusSign.current as RegExp).lastIndex = 0;
		const suffixCharIndex = val.search(_suffix.current as RegExp);
		(_suffix.current as RegExp).lastIndex = 0;
		const currencyCharIndex = val.search(_currency.current as RegExp);
		(_currency.current as RegExp).lastIndex = 0;

		return { decimalCharIndex, minusCharIndex, suffixCharIndex, currencyCharIndex };
	}

	function insert(event: React.UIEvent, text: string, sign = { isDecimalSign: false, isMinusSign: false }) {
		const minusCharIndexOnText = text.search(_minusSign.current as RegExp);
		(_minusSign.current as RegExp).lastIndex = 0;
		if (!allowMinusSign() && minusCharIndexOnText !== -1) {
			return;
		}

		const selectionStart = inputRef.current?.selectionStart as number;
		const selectionEnd = inputRef.current?.selectionEnd as number;
		let inputValue = inputRef.current?.value.trim() as string;
		const { decimalCharIndex, minusCharIndex, suffixCharIndex, currencyCharIndex } = getCharIndexes(inputValue);
		let newValueStr;

		if (sign.isMinusSign) {
			if (selectionStart === 0) {
				newValueStr = inputValue;
				if (minusCharIndex === -1 || selectionEnd !== 0) {
					newValueStr = insertText(inputValue, text, 0, selectionEnd);
				}

				updateValue(event, newValueStr, text, 'insert');
			}
		} else if (sign.isDecimalSign) {
			if (decimalCharIndex > 0 && selectionStart === decimalCharIndex) {
				updateValue(event, inputValue, text, 'insert');
			} else if (decimalCharIndex > selectionStart && decimalCharIndex < selectionEnd) {
				newValueStr = insertText(inputValue, text, selectionStart, selectionEnd);
				updateValue(event, newValueStr, text, 'insert');
			} else if (decimalCharIndex === -1 && props.maxFractionDigits) {
				newValueStr = insertText(inputValue, text, selectionStart, selectionEnd);
				updateValue(event, newValueStr, text, 'insert');
			}
		} else {
			const maxFractionDigits = numberFormat.current?.resolvedOptions().maximumFractionDigits as number;
			const operation = selectionStart !== selectionEnd ? 'range-insert' : 'insert';

			if (decimalCharIndex > 0 && selectionStart > decimalCharIndex) {
				if (selectionStart + text.length - (decimalCharIndex + 1) <= maxFractionDigits) {
					const charIndex =
						currencyCharIndex >= selectionStart
							? currencyCharIndex - 1
							: suffixCharIndex >= selectionStart
							? suffixCharIndex
							: inputValue.length;

					newValueStr =
						inputValue.slice(0, selectionStart) +
						text +
						inputValue.slice(selectionStart + text.length, charIndex) +
						inputValue.slice(charIndex);
					updateValue(event, newValueStr, text, operation);
				}
			} else {
				newValueStr = insertText(inputValue, text, selectionStart, selectionEnd);
				updateValue(event, newValueStr, text, operation);
			}
		}
	}

	function insertText(value: string, text: string, start: number, end: number) {
		let textSplit = text === '.' ? text : text.split('.');

		if (textSplit.length === 2) {
			const decimalCharIndex = value.slice(start, end).search(_decimal.current as RegExp);
			(_decimal.current as RegExp).lastIndex = 0;
			return decimalCharIndex > 0
				? value.slice(0, start) + formatValue(text) + value.slice(end)
				: value || formatValue(text);
		} else if (end - start === value.length) {
			return formatValue(text);
		} else if (start === 0) {
			return text + value.slice(end);
		} else if (end === value.length) {
			return value.slice(0, start) + text;
		} else {
			return value.slice(0, start) + text + value.slice(end);
		}
	}

	function deleteRange(value: string, start: number, end: number) {
		let newValueStr;

		if (end - start === value.length) newValueStr = '';
		else if (start === 0) newValueStr = value.slice(end);
		else if (end === value.length) newValueStr = value.slice(0, start);
		else newValueStr = value.slice(0, start) + value.slice(end);

		return newValueStr;
	}

	function initCursor() {
		let selectionStart = inputRef.current?.selectionStart as number;
		let inputValue = inputRef.current?.value as string;
		let valueLength = inputValue.length as number;
		let index = null;

		// remove prefix
		let prefixLength = (prefixChar.current || '').length;
		inputValue = inputValue.replace(_prefix.current as RegExp, '');
		selectionStart = selectionStart - prefixLength;

		let char = inputValue.charAt(selectionStart);
		if (isNumeralChar(char)) {
			return selectionStart + prefixLength;
		}

		//left
		let i = selectionStart - 1;
		while (i >= 0) {
			char = inputValue.charAt(i);
			if (isNumeralChar(char)) {
				index = i + prefixLength;
				break;
			} else {
				i--;
			}
		}

		if (index !== null) {
			inputRef.current?.setSelectionRange(index + 1, index + 1);
		} else {
			i = selectionStart;
			while (i < valueLength) {
				char = inputValue.charAt(i);
				if (isNumeralChar(char)) {
					index = i + prefixLength;
					break;
				} else {
					i++;
				}
			}

			if (index !== null) {
				inputRef.current?.setSelectionRange(index, index);
			}
		}

		return index || 0;
	}

	function onInputClick() {
		initCursor();
	}

	function isNumeralChar(char: string) {
		if (
			char.length === 1 &&
			((_numeral.current as RegExp).test(char) ||
				(_decimal.current as RegExp).test(char) ||
				(_group.current as RegExp).test(char) ||
				(_minusSign.current as RegExp).test(char))
		) {
			resetRegex();
			return true;
		} else {
			return false;
		}
	}

	function resetRegex() {
		(_numeral.current as RegExp).lastIndex = 0;
		(_decimal.current as RegExp).lastIndex = 0;
		(_group.current as RegExp).lastIndex = 0;
		(_minusSign.current as RegExp).lastIndex = 0;
	}

	async function updateValue(
		event: React.UIEvent,
		valueStr: string,
		insertedValueStr: string | null,
		operation: string
	) {
		let currentValue = inputRef.current?.value as string;
		let newValue = null;

		if (valueStr != null) {
			newValue = evaluateEmpty(parseValue(valueStr) as number);
			updateInput(newValue, insertedValueStr as string, operation, valueStr);

			const updated = clone(formControl);
			if (updated) {
				updated.value = newValue || 0;
				if (!updated.value) {
					updated.clearErrors();
				} else if (hasBeenBlurred) {
					await updated.validate();
				}
				setFormControl(updated);
				if (updateControl) updateControl(updated);
			}

			handleOnChange(event, currentValue, newValue);
		}
	}

	function evaluateEmpty(newValue: number | null): number | null {
		return !newValue && !props.allowEmpty ? props.min || 0 : newValue;
	}

	function handleOnChange(event: React.UIEvent, currentValue: string, newValue: number | null) {
		if (props.onChange && isValueChanged(currentValue, newValue)) {
			props.onChange(newValue, event);
		}
	}

	function isValueChanged(currentValue: string | number | null, newValue: number | null): boolean {
		if (newValue === null && currentValue !== null) {
			return true;
		}

		if (newValue != null) {
			let parsedCurrentValue = typeof currentValue === 'string' ? parseValue(currentValue) : currentValue;
			return newValue !== parsedCurrentValue;
		}

		return false;
	}

	function validateValue(value: string | number) {
		if (value === '-' || value == null) {
			return null;
		}

		if (props.min !== null && value < (props.min as number)) {
			return props.min;
		}

		if (props.max !== null && value > (props.max as number)) {
			return props.max;
		}

		return value;
	}

	function updateInput(value: number | null, insertedValueStr: string | null, operation: string, valueStr?: string) {
		insertedValueStr = insertedValueStr || '';

		let inputEl = inputRef.current;
		if (!inputEl) return;
		let inputValue = inputEl.value;
		let newValue = formatValue(value);
		let currentLength = inputValue.length;

		if (newValue !== valueStr) {
			newValue = concatValues(newValue, valueStr as string);
		}

		if (currentLength === 0) {
			inputEl.value = newValue;
			inputEl.setSelectionRange(0, 0);
			const index = initCursor();
			const selectionEnd = index + insertedValueStr.length;
			inputEl.setSelectionRange(selectionEnd, selectionEnd);
		} else {
			let selectionStart = inputEl.selectionStart as number;
			let selectionEnd = inputEl.selectionEnd as number;
			inputEl.value = newValue;
			let newLength = newValue.length;

			if (operation === 'range-insert') {
				const startValue = parseValue((inputValue || '').slice(0, selectionStart));
				const startValueStr = startValue !== null ? startValue.toString() : '';
				const startExpr = startValueStr.split('').join(`(${groupChar.current})?`);
				const sRegex = new RegExp(startExpr, 'g');
				sRegex.test(newValue);

				const tExpr = insertedValueStr.split('').join(`(${groupChar.current})?`);
				const tRegex = new RegExp(tExpr, 'g');
				tRegex.test(newValue.slice(sRegex.lastIndex));

				selectionEnd = sRegex.lastIndex + tRegex.lastIndex;
				inputEl.setSelectionRange(selectionEnd, selectionEnd);
			} else if (newLength === currentLength) {
				if (operation === 'insert' || operation === 'delete-back-single')
					inputEl.setSelectionRange(selectionEnd + 1, selectionEnd + 1);
				else if (operation === 'delete-single') inputEl.setSelectionRange(selectionEnd - 1, selectionEnd - 1);
				else if (operation === 'delete-range' || operation === 'spin')
					inputEl.setSelectionRange(selectionEnd, selectionEnd);
			} else if (operation === 'delete-back-single') {
				let prevChar = inputValue.charAt(selectionEnd - 1);
				let nextChar = inputValue.charAt(selectionEnd);
				let diff = currentLength - newLength;
				let isGroupChar = (_group.current as RegExp).test(nextChar);

				if (isGroupChar && diff === 1) {
					selectionEnd += 1;
				} else if (!isGroupChar && isNumeralChar(prevChar)) {
					selectionEnd += -1 * diff + 1;
				}

				(_group.current as RegExp).lastIndex = 0;
				inputEl.setSelectionRange(selectionEnd, selectionEnd);
			} else if (inputValue === '-' && operation === 'insert') {
				inputEl.setSelectionRange(0, 0);
				const index = initCursor();
				const selectionEnd = index + insertedValueStr.length + 1;
				inputEl.setSelectionRange(selectionEnd, selectionEnd);
			} else {
				selectionEnd = selectionEnd + (newLength - currentLength);
				inputEl.setSelectionRange(selectionEnd, selectionEnd);
			}
		}

		inputEl.setAttribute('aria-valuenow', value + '');
	}

	function updateInputValue(newValue: number | null) {
		newValue = evaluateEmpty(newValue);

		const inputEl = inputRef.current;
		const value = inputEl?.value;
		const _formattedValue = formattedValue(newValue);

		if (value !== _formattedValue && inputEl !== null) {
			inputEl.value = _formattedValue;
			inputEl.setAttribute('aria-valuenow', newValue + '');
		}
	}

	function formattedValue(val: number | null): string {
		return formatValue(evaluateEmpty(val));
	}

	function concatValues(val1: string, val2: string) {
		if (val1 && val2) {
			let decimalCharIndex = val2.search(_decimal.current as RegExp);
			(_decimal.current as RegExp).lastIndex = 0;

			return decimalCharIndex !== -1
				? val1.split(_decimal.current as RegExp)[0] + val2.slice(decimalCharIndex)
				: val1;
		}

		return val1;
	}

	function getDecimalLength(value: string) {
		if (value) {
			const valueSplit = value.split(_decimal.current as RegExp);

			if (valueSplit.length === 2) {
				return valueSplit[1]
					.replace(_suffix.current as RegExp, '')
					.trim()
					.replace(/\s/g, '')
					.replace(_currency.current as RegExp, '').length;
			}
		}

		return 0;
	}

	function updateModel(event: React.UIEvent | null, value: string | number | null) {
		if (props.onValueChange) {
			props.onValueChange({
				originalEvent: event,
				value: value,
				stopPropagation: () => {},
				preventDefault: () => {},
				target: {
					name: props.name as string,
					id: props.id as string,
					value: value as number
				}
			});
		}
	}

	function onInputFocus(event: React.FocusEvent<HTMLInputElement>) {
		props.onFocus && props.onFocus(event);
	}

	async function onInputBlur(event: React.FocusEvent<HTMLInputElement>) {
		setHasBeenBlurred(true);

		let finalValue = 0;

		if (inputRef.current) {
			let currentValue = inputRef.current.value;
			finalValue = parseValue(currentValue) as number;
			if (isValueChanged(currentValue, props.value as number)) {
				let newValue = validateValue(parseValue(currentValue) as number) as number;
				finalValue = newValue;
				updateInputValue(newValue);
				updateModel(event as any, newValue);
			}
		}

		const updated = clone(formControl);
		if (updated) {
			updated.value = finalValue || 0;
			if (!updated.value) {
				updated.clearErrors();
			} else {
				await updated.validate();
			}
			setFormControl(updated);
			if (updateControl) updateControl(updated);
		}

		props.onBlur && props.onBlur(event);
	}

	function clearTimer() {
		if (timer.current) {
			clearInterval(timer.current);
		}
	}

	function changeValue() {
		const newValue = validateValue(props.value as number) as number;
		updateInputValue(newValue);

		if (props.value !== null && props.value !== newValue) {
			updateModel(null, newValue);
		}
	}

	function getFormatter() {
		return numberFormat.current;
	}

	React.useEffect(() => {
		constructParser();

		const newValue = validateValue(props.value as number);
		if (props.value !== null && props.value !== newValue) {
			updateModel(null, newValue ?? null);
		}
	}, []);

	useUpdateEffect(() => {
		constructParser();
		changeValue();
	}, [
		props.locale,
		props.localeMatcher,
		props.mode,
		props.currency,
		props.currencyDisplay,
		props.useGrouping,
		props.minFractionDigits,
		props.maxFractionDigits,
		props.suffix,
		props.prefix
	]);

	useUpdateEffect(() => {
		changeValue();
	}, [props.value]);

	function createInputElement() {
		const className = classNames('rsInputNumber', props.inputClassName);
		const valueToRender = formattedValue(!!formControl ? formControl.value : (props.value as number | null));

		return (
			<input
				ref={inputRef}
				id={props.id as string}
				role="spinbutton"
				className={className}
				defaultValue={valueToRender}
				inputMode={inputMode}
				disabled={props.disabled}
				readOnly={props.readOnly}
				name={props.name as string}
				autoFocus={props.autoFocus}
				onKeyDown={onInputKeyDown}
				onKeyPress={onInputKeyPress}
				onInput={onInput}
				onClick={onInputClick}
				onBlur={onInputBlur}
				onFocus={onInputFocus}
				onPaste={onPaste}
				min={props.min as number}
				max={props.max as number}
				aria-valuemin={props.min as number}
				aria-valuemax={props.max as number}
				aria-valuenow={props.value as number}
				aria-labelledby={props.ariaLabelledBy as string}
				{...inputProps}
			/>
		);
	}

	function createUpButton() {
		return (
			<button
				type="button"
				onMouseLeave={onUpButtonMouseLeave}
				onMouseDown={onUpButtonMouseDown}
				onMouseUp={onUpButtonMouseUp}
				onKeyDown={onUpButtonKeyDown}
				onKeyUp={onUpButtonKeyUp}
				onTouchStart={onUpButtonTouchStart}
				onTouchEnd={onUpButtonTouchEnd}
				disabled={props.disabled}
				tabIndex={-1}
			>
				<span></span>
			</button>
		);
	}

	function createDownButton() {
		return (
			<button
				type="button"
				onMouseLeave={onDownButtonMouseLeave}
				onMouseDown={onDownButtonMouseDown}
				onMouseUp={onDownButtonMouseUp}
				onKeyDown={onDownButtonKeyDown}
				onKeyUp={onDownButtonKeyUp}
				onTouchStart={onDownButtonTouchStart}
				onTouchEnd={onDownButtonTouchEnd}
				disabled={props.disabled}
				tabIndex={-1}
			>
				<span></span>
			</button>
		);
	}

	function createButtonGroup() {
		const upButton = props.showButtons && createUpButton();
		const downButton = props.showButtons && createDownButton();

		if (stacked) {
			return (
				<span className="rsInputnumberButtonGroup">
					{upButton}
					{downButton}
				</span>
			);
		}

		return (
			<>
				{upButton}
				{downButton}
			</>
		);
	}

	const isTouchDevice = () => {
		return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0;
	};

	const otherProps = ObjectUtils.findDiffKeys(props, InputNumber.defaultProps);
	const inputElement = createInputElement();
	const buttonGroup = createButtonGroup();
	const errors = renderErrors(props.control);

	return (
		<Box className={classNames('htInputNumber', className)} {...boxMarginProps}>
			<span ref={elementRef} id={props.id} {...otherProps}>
				{inputElement}
				{buttonGroup}
			</span>
			{!!helperText && <Box className={'helperText'}>{helperText}</Box>}
			{errors}
		</Box>
	);
};

InputNumber.displayName = 'InputNumber';
InputNumber.defaultProps = {
	value: null,
	format: true,
	showButtons: false,
	buttonLayout: 'stacked',
	locale: undefined,
	localeMatcher: undefined,
	mode: 'decimal',
	suffix: null,
	prefix: null,
	currency: undefined,
	currencyDisplay: undefined,
	useGrouping: true,
	minFractionDigits: undefined,
	maxFractionDigits: undefined,
	id: undefined,
	name: null,
	allowEmpty: true,
	step: 1,
	min: null,
	max: null,
	disabled: false,
	inputMode: null,
	readOnly: false,
	className: '',
	autoFocus: false,
	inputClassName: null,
	ariaLabelledBy: null,
	control: undefined,
	updateControl: undefined,
	onValueChange: null,
	onChange: null,
	onBlur: null,
	onFocus: null,
	onKeyDown: null
};

export { InputNumber };
