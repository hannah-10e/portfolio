import { IFormControl, FormControl } from './FormControl';

/** Validator enumeration */
export enum ValidatorEnum {
	REQ = 'required',
	MIN_LENGTH = 'minLength',
	MAX_LENGTH = 'maxLength',
	EMAIL = 'email',
	NUM = 'numeric',
	REG = 'regexp',
	CUSTOM = 'custom'
}

/** Supports form control validation. */
export class Validator {
	/**
	 * Creates a new `Validator` instance.
	 * @param _validator Validator enumeration from `RsValidatorEnum`.
	 * @param _errorMessage Error message for invalid state.
	 * @param _value Value for comparison validator, e.g. minLength, maxLength,
	 */
	constructor(
		private _validator: ValidatorEnum,
		private _errorMessage: string,
		private _value?: string | number | RegExp | ((control: FormControl<IFormControl>) => boolean | Promise<boolean>)
	) {}

	get validator() {
		return this._validator;
	}

	get errorMessage() {
		if (this._errorMessage.indexOf('$val') > -1) return this._errorMessage.replace(/\$val/g, this._value as string);
		else return this._errorMessage;
	}

	get value() {
		return this._value;
	}
}
