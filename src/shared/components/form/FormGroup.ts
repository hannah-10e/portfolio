import cloneDeep from 'lodash.clonedeep';
import clone from 'lodash.clone';
import { IFormControl, FormControl } from './FormControl';

/** Tracks the value and validity state of a group of RsFormControl instances. */
export class FormGroup {
	/**
	 * Creates a new `FormGroup` instance.
	 * @param _controls Array of 'FormControl' objects.
	 */
	constructor(private _controls: FormControl<IFormControl>[]) {}

	/**
	 * Get one form control object by searching the key.
	 * @param key Key of form control
	 * @returns {FormControl}
	 */
	get<T extends IFormControl>(key: string): FormControl<T> {
		return this._controls.find((c) => c.key === key) as FormControl<T>;
	}

	/**
	 * Returns all the keys for all the controls in the group
	 * @returns {string[]} - All the keys
	 */
	getKeys(): string[] {
		let keys = this._controls.map((control) => {
			return control.key;
		});
		return keys;
	}

	/**
	 * Get a shallow clone of one form control object by searching the key.
	 * @param key Key of form control
	 * @returns {FormControl}
	 */
	getClone<T extends IFormControl>(key: string): FormControl<T> {
		return clone(this._controls.find((c) => c.key === key) as FormControl<T>);
	}

	/**
	 * Get a clone Deep of one form control object by searching the key.
	 * @param key Key of form control
	 * @returns {FormControl}
	 */
	getCloneDeep<T extends IFormControl>(key: string): FormControl<T> {
		return cloneDeep(this._controls.find((c) => c.key === key) as FormControl<T>);
	}

	/**
	 * Update one form control object in current array.
	 * @param updated
	 */
	update(updated: FormControl<IFormControl>): FormGroup {
		const index = this._controls.findIndex((c) => c.key === updated.key);
		this._controls.splice(index, 1, updated);
		return this;
	}

	/**
	 * Triggers all form control objects validating themselves.
	 * NOTE: After a validation it is recommended to update the react state form group with a cloneDeep
	 * copy of itself. This will make it so all controls will then appropriately show their own
	 * error codes from the validation check.
	 * e.x. setFormGroup(formGroup.clone())
	 * @param validateOnly If true, only validate the form control, do not update the error codes.
	 * @returns {boolean} True if all form controls pass validation test, false otherwise.
	 */
	async isValid(validateOnly: boolean = false): Promise<boolean> {
		let valid = true;
		for (let index = 0; index < this._controls.length; index++) {
			const control = this._controls[index];
			valid = (await control.validate(validateOnly)) && valid;
		}
		return valid;
	}

	/** Clone current form group object.
	 * @returns {FormGroup}
	 */
	clone() {
		return clone(this);
	}

	/** Clone Deep current form group object.
	 * @returns {FormGroup}
	 */
	cloneDeep() {
		return cloneDeep(this);
	}

	/**
	 * Get data model out of current form group and convert it to designated generic type.
	 * @returns {T}
	 */
	toModel<T>() {
		const model = {} as any;
		for (let index = 0; index < this._controls.length; index++) {
			const control = this._controls[index];
			model[control.key] = control.value;
		}
		return model as T;
	}

	/**
	 * Resets all controls of the group to their initial values
	 */
	resetToInitialValue(): FormGroup {
		for (let control of this._controls) {
			control.resetToInitial();
		}
		return this;
	}

	/**
	 * Checks all the customComponents to see if any of them have changed from their initial value
	 */
	isModified() {
		for (let control of this._controls) {
			if (!control.isAtInitialValue()) return true;
		}
		return false;
	}

	/**
	 * Returns a key, value model of only controls that are different from their initial value
	 */
	toChangedModel<T>() {
		const model = {} as any;
		for (let index = 0; index < this._controls.length; index++) {
			const control = this._controls[index];
			if (control.isAtInitialValue()) continue;
			model[control.key] = control.value;
		}
		return model as T;
	}

	/**
	 * Takes all the current form values and updates the initial value to the current values, make it so no changes are
	 * present. Thus, isModified() should return false.
	 */
	updateInitialValues(): FormGroup {
		for (let control of this._controls) {
			control.updateInitialValue();
		}
		return this;
	}
}
