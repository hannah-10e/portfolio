import * as React from 'react';
import { useEffect, useState } from 'react';
import './Select.scss';
import { Box } from '../box/Box';
import classNames from 'classnames';
import { IFormControl, FormControl } from '../form/FormControl';
import {
	ActionMeta,
	default as ReactSelect,
	GroupBase,
	MultiValue,
	OnChangeValue,
	OptionsOrGroups,
	Props,
	SingleValue
} from 'react-select';
import { ICommon } from '../../interfaces/common';
import { renderErrors } from '../../utils/internal';
import clone from 'lodash.clone';

// For webpack to work I had to import CreatableSelect with full qualified path, which means we lose on the types. Ts-ignore for now
// @ts-ignore
import CreatableSelect from 'react-select/creatable/dist/react-select.esm.js';
import { PropsValue } from 'react-select/dist/declarations/src/types';
import cloneDeep from 'lodash.clonedeep';
import { Label } from '../label/Label';

export interface SelectProps<
	Option,
	IsMulti extends boolean = false,
	Group extends GroupBase<Option> = GroupBase<Option>
> extends Props<Option, IsMulti, Group>,
		ICommon.MarginProps {
	control?: FormControl<IFormControl>;
	updateControl?: (control: FormControl<IFormControl>) => void;
	isCreatable?: boolean;
	createOptionPosition?: 'first' | 'last';
	onCreateOption?: (inputValue: string) => void;
	helperText?: string | React.ReactNode;
}

function Select<Option, IsMulti extends boolean = false, Group extends GroupBase<Option> = GroupBase<Option>>(
	props: SelectProps<Option, IsMulti, Group>
) {
	const {
		id,
		className,
		control,
		updateControl,
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
		onChange,
		isCreatable,
		createOptionPosition,
		onCreateOption,
		value, // Remove the value from selectProps
		helperText,
		...selectProps
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

	const [internalValue, setInternalValue] = useState<PropsValue<Option> | undefined>(props.value);
	const [isErroredComponent, setIsErroredComponent] = useState<boolean>(false);

	useEffect(() => {
		setInternalValue(props.value);
	}, [props.value]);

	// We only want to handle either a controlled component with value, onChange or using our form control.
	// Check if they provided both.
	if (!isErroredComponent) {
		if (props.value && props.control) {
			console.error(
				'You cannot use both value and control on a Select component. Please use either value or control.'
			);
			setIsErroredComponent(true);
		} else if (props.onChange && props.updateControl) {
			console.error('You should not use both onChange and updateControl on the same Select component.');
			setIsErroredComponent(true);
		} else if (props.options && isGroupOption(props.options)) {
			let existingIds: string[] | number[] = [];
			let isValid = true;

			for (let i = 0; i < props.options.length; i++) {
				let group: Group = props.options[i];
				for (let x = 0; x < group.options.length; x++) {
					let option: Option = group.options[x];
					//@ts-ignore
					if (existingIds.includes(option.value)) {
						isValid = false;
						break;
					}
					//@ts-ignore
					existingIds.push(option.value);
				}
				if (!isValid) break;
			}
			if (!isValid) {
				console.error('You have options with the same value');
				setIsErroredComponent(true);
			}
		}
	}

	useEffect(() => {
		if (!control || !props.options) return;

		let optionsToSearch = cloneDeep(props.options);
		if (isGroupOption(optionsToSearch)) {
			optionsToSearch = optionsToSearch.reduce((options: Option[], group: Group) => {
				return [...options, ...group.options];
			}, []);
		}

		if (Array.isArray(control.value)) {
			let optionsFound = optionsToSearch.filter((item) => {
				// @ts-ignore
				return control.value.includes(item.value);
			}) as Option[];
			if (!optionsFound.length) setInternalValue(null);
			else setInternalValue(optionsFound);
		} else {
			let optionFound = optionsToSearch.find((item) => {
				// @ts-ignore
				return item.value === control.value;
			}) as Option;

			if (!optionFound) setInternalValue(null);
			else setInternalValue(optionFound);
		}
	}, [control, props.options]);

	function isMultiValue(value: MultiValue<any> | SingleValue<any>): value is MultiValue<any> {
		return !!value && Array.isArray(value);
	}

	function isGroupOption(options: OptionsOrGroups<Option, Group>): options is Group[] {
		// A group has a format like this:
		// [
		// 	{
		// 		label: 'Colours',
		// 		options: colourOptions,
		// 	},
		// 	{
		// 		label: 'Flavours',
		// 		options: flavourOptions,
		// 	},
		// ];
		// Where as an option has this format
		// [
		// 	{
		// 		label: 'Option 1',
		// 		value: 1,
		// 	}
		// ]

		// The best we can do to tell them apart is if there is an options value on one of the element
		return !!options && Array.isArray(options) && options.length > 1 && options[0].hasOwnProperty('options');
	}

	async function handleChange(value: OnChangeValue<Option, IsMulti>, action: ActionMeta<Option>) {
		if (!control || !updateControl) return;
		const updated = clone(control);

		if (action.action === 'clear') {
			if (typeof updated.value === 'number') updated.value = null;
			if (typeof updated.value === 'boolean') updated.value = null;
			else if (typeof updated.value === 'string') updated.value = '';
			else if (Array.isArray(updated.value)) updated.value = [];
			updated.clearErrors();
			updateControl(updated);
			return;
		}

		if (isMultiValue(value)) {
			updated.value = value.map((item) => {
				return item.value;
			});
		} else {
			updated.value = (value as SingleValue<any>).value;
		}
		await updated.validate();
		updateControl(updated);
	}

	function renderSelectOrCreateSelect() {
		return !isCreatable ? (
			<ReactSelect
				{...selectProps}
				onChange={(value, action) => {
					if (onChange) onChange(value, action);
					handleChange(value, action);
				}}
				value={internalValue}
			/>
		) : (
			<CreatableSelect
				{...selectProps}
				createOptionPosition={createOptionPosition}
				onCreateOption={onCreateOption}
				onChange={(value: OnChangeValue<Option, IsMulti>, action: ActionMeta<Option>) => {
					if (onChange) onChange(value, action);
					handleChange(value, action);
				}}
				value={internalValue}
			/>
		);
	}

	if (isErroredComponent)
		return (
			<Label variant={'body1'} weight={'extraBold'} color={'red'}>
				Broken component props. Check console error
			</Label>
		);

	return (
		<Box id={id} className={classNames('htSelect', className)} {...boxMarginProps}>
			{renderSelectOrCreateSelect()}
			{!!helperText && <Box className={'helperText'}>{helperText}</Box>}
			{renderErrors(props.control)}
		</Box>
	);
}

export { Select };
