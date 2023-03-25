import { Validator, ValidatorEnum } from './Validator';
import { StringUtils } from '../../utils';

export type IFormControl = string | number | boolean | string[] | number[] | null;

/** Tracks the value and validation status of an individual form control. */
export class FormControl<T extends IFormControl> {
	/** @internal */
	private _errors: number[] = [];
	private _initialValue: T;
	/**
	 * Creates a new `RsFormControl` instance.
	 * @param _key Form control key which should match your form model property.
	 * @param _value Initializes the control with an initial value.
	 * @param _validators Array of validators applied to this form control
	 */
	constructor(private _key: string, private _value: T, private _validators?: Validator[]) {
		this._initialValue = _value;
		this._value = _value;
	}

	get key(): string {
		return this._key;
	}

	get value(): T {
		return this._value;
	}
	set value(value: T) {
		this._value = value;
	}

	get errors(): number[] {
		return this._errors;
	}

	resetToInitial(): void {
		this._value = this._initialValue;
		this._errors = [];
	}

	isAtInitialValue(): boolean {
		if (Array.isArray(this._value) && Array.isArray(this._initialValue))
			return JSON.stringify(this._value) === JSON.stringify(this._initialValue);

		return this._value === this._initialValue;
	}

	/**
	 * Get error message by searching validator string
	 * @param index
	 * @returns {string}
	 */
	getErrorMessage(index: number): string {
		if (!this._validators) return '';
		return this._validators[index].errorMessage;
	}

	/**
	 * Updates the initial value with the current value
	 */
	updateInitialValue(): void {
		this._initialValue = this._value;
	}

	/**
	 * Used to clear the error fields. Should only be called if you know what you are doing
	 */
	clearErrors(): void {
		this._errors = [];
	}

	/**
	 * Validates current value of control, based on the validators applied.
	 * @param validateOnly If true, will not update the error array, but will return true or false based on validation
	 * @returns {boolean} True if control passes all validation test, false otherwise.
	 */
	async validate(validateOnly: boolean = false): Promise<boolean> {
		if (!validateOnly) this._errors = [];
		let hasError = false;
		if (this._validators) {
			for (let index = 0; index < this._validators.length; index++) {
				const validator: Validator = this._validators[index];
				const validatorRule = validator.validator;
				switch (validatorRule) {
					case ValidatorEnum.REQ:
						if (this._value === undefined || this._value === null) {
							if (validateOnly) hasError = true;
							else this._errors.push(index);
							continue;
						}

						if (typeof this._value === 'string' && this._value.trim() === '') {
							if (validateOnly) hasError = true;
							else this._errors.push(index);
							continue;
						}

						if (Array.isArray(this._value) && this._value.length === 0) {
							if (validateOnly) hasError = true;
							else this._errors.push(index);
							continue;
						}
						break;
					case ValidatorEnum.MIN_LENGTH:
						const min = parseInt(validator.value as string) || 0;
						if ((this._value as string).length < min) {
							if (validateOnly) hasError = true;
							else this._errors.push(index);
							continue;
						}
						break;
					case ValidatorEnum.MAX_LENGTH:
						const max = parseInt(validator.value as string) || 0;
						if ((this._value as string).length > max) {
							if (validateOnly) hasError = true;
							else this._errors.push(index);
							continue;
						}
						break;
					case ValidatorEnum.NUM:
						if (isNaN(Number(this._value))) {
							if (validateOnly) hasError = true;
							else this._errors.push(index);
							continue;
						}
						break;
					case ValidatorEnum.EMAIL:
						// Although you can technically have a number of other characters according to RFC, they can
						// be considered dangerous. See this site for recommended values to allow.
						// https://www.jochentopf.com/email/chars.html
						// domain names can have: letters, numbers, and hyphens
						const isEmail = StringUtils.validateEmail(this._value?.toString() || '');
						if (!isEmail) {
							if (validateOnly) hasError = true;
							else this._errors.push(index);
							continue;
						}
						break;
					case ValidatorEnum.REG:
						if (!(validator.value as RegExp).test(this._value as string)) {
							if (validateOnly) hasError = true;
							else this._errors.push(index);
							continue;
						}
						break;
					case ValidatorEnum.CUSTOM:
						const result = await (
							validator.value as (control: FormControl<T>) => boolean | Promise<boolean>
						)(this);
						if (!result) {
							if (validateOnly) hasError = true;
							else this._errors.push(index);
							continue;
						}
						break;
				}
			}
		}

		if (validateOnly) return !hasError;
		else return this._errors.length === 0;
	}
}
