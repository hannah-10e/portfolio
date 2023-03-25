import * as React from 'react';
import './LabelInputText.scss';
import { Box } from '../box/Box';
import { Label } from '../label/Label';
import classNames from 'classnames';
import { InputText, InputTextProps } from '../inputText/InputText';
import { ICommon } from '../../interfaces/common';
import { useContext } from 'react';
import { FrameworkContext } from '../frameworkSettings/FrameworkSettings';
import { extractPropsFromKeys } from '../../utils/internal';

export interface LabelInputTextProps
	extends ICommon.MarginProps,
		Omit<
			InputTextProps,
			| 'm'
			| 'mt'
			| 'mr'
			| 'mb'
			| 'ml'
			| 'mx'
			| 'my'
			| 'margin'
			| 'marginTop'
			| 'marginRight'
			| 'marginBottom'
			| 'marginLeft'
			| 'marginX'
			| 'marginY'
		> {
	labelTitle: string | React.ReactNode;
}

const LabelInputText: React.FC<LabelInputTextProps> = (props) => {
	const { labelTitle, elementRef, ...inputProps } = props;

	const boxMarginProps = extractPropsFromKeys<ICommon.MarginProps>(props, ICommon.MarginPropsKeys);
	const { className, ...htmlProps } = extractPropsFromKeys<ICommon.HtmlElementProps>(
		props,
		ICommon.HtmlElementPropsKeys
	);

	const { labelInputText } = useContext(FrameworkContext);

	return (
		<Box className={classNames('htLabelInputText', className)} {...boxMarginProps} {...htmlProps}>
			<Label className={classNames({ required: inputProps.required })} {...labelInputText}>
				{labelTitle}
			</Label>
			<InputText {...inputProps} />
		</Box>
	);
};

export { LabelInputText };
