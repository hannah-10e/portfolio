import * as React from 'react';
import { createContext } from 'react';
import { LabelProps } from '../label/Label';
import { PageProps } from '../page/Page';

const defaultSettings: IFrameworkSettings = {
	labelInputText: { variant: 'body1', weight: 'regular', mb: 4 },
	labelInputTextArea: { variant: 'body1', weight: 'regular', mb: 4 },
	labelSelect: { variant: 'body1', weight: 'regular', mb: 4 },
	toasts: {
		icons: {
			error: 'icon-exclamation-circle',
			info: 'icon-solid-info-circle',
			success: 'icon-check',
			warning: 'icon-exclamation-circle',
			custom: 'icon-flag'
		},
		labelVariants: {
			title: 'subtitle1',
			message: 'body1'
		}
	},
	pagination: {
		icons: {
			firstButton: 'pagination-first-page',
			prevButton: 'pagination-chevron-left',
			nextButton: 'pagination-chevron-right',
			lastButton: 'pagination-last-page'
		}
	}
};

export const FrameworkContext = createContext<IFrameworkSettings>(defaultSettings);

export interface ILabelSettingsProps extends Omit<LabelProps, 'children' | 'className' | 'id'> {}

export interface IFrameworkSettings {
	labelInputText: ILabelSettingsProps;
	labelInputTextArea: ILabelSettingsProps;
	labelSelect: ILabelSettingsProps;
	toasts: {
		icons: { [key in 'error' | 'info' | 'success' | 'warning' | 'custom']: string };
		labelVariants: { title: 'subtitle1'; message: 'body1' };
	};
	pagination: {
		icons: { [key in 'prevButton' | 'nextButton' | 'firstButton' | 'lastButton']: string };
	};
	opg?: PageProps['opg'];
	structuredDataJsonLd?: object;
}

interface FrameworkSettingsProps {
	overrides?: Partial<IFrameworkSettings>;
	children: React.ReactNode;
}

const FrameworkSettings: React.FC<FrameworkSettingsProps> = (props) => {
	let settings = defaultSettings;
	let key: keyof IFrameworkSettings;
	if (props.overrides) {
		for (key in props.overrides) {
			if (Object.hasOwn(props.overrides, key)) {
				if (key === 'toasts' || key === 'pagination') {
					// These are nested objects, so we need to merge them instead of just overwriting them
					let indexKey: keyof IFrameworkSettings[typeof key];
					for (indexKey in props.overrides[key]) {
						if (!props.overrides[key]) continue;
						settings[key][indexKey] = { ...settings[key][indexKey], ...props.overrides[key]![indexKey] };
					}
				} else {
					// These are not nested objects, so we can just overwrite them.
					// Since typescript thinks they might be different types we have to ts-ignore
					// @ts-ignore
					settings[key] = { ...settings[key], ...props.overrides[key] };
				}
			}
		}
	}
	return <FrameworkContext.Provider value={settings}>{props.children}</FrameworkContext.Provider>;
};

export { FrameworkSettings };
