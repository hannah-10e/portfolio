import * as React from 'react';
import './ToastMessage.scss';
import { toast, ToastContainer, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import { Label, LabelProps } from '../label/Label';
import { Box } from '../box/Box';
import { Icon } from '../icon/Icon';

export enum ToastifyType {
	ERROR,
	SUCCESS,
	INFO,
	WARNING,
	CUSTOM
}

export interface ToastMessageProps {
	message: string;
	title?: string;
	type: ToastifyType;
	toastOptions?: ToastOptions;
}
export interface ToastIcons {
	types: { [key in 'error' | 'info' | 'success' | 'warning' | 'custom']: string };
	size: number;
}

export interface ToastLabels {
	title: {
		variant: LabelProps['variant'];
		weight: LabelProps['weight'];
	};
	message: {
		variant: LabelProps['variant'];
		weight: LabelProps['weight'];
	};
}

let icons: ToastIcons = {
	types: {
		error: 'icon-warning',
		info: 'icon-information',
		success: 'icon-checkmark',
		warning: 'icon-warning',
		custom: 'icon-flag'
	},
	size: 21
};

let labels: ToastLabels = {
	title: {
		variant: 'subtitle1',
		weight: 'bold'
	},
	message: {
		variant: 'body1',
		weight: 'regular'
	}
};

const ToastMessage: React.FC<ToastMessageProps> = (props) => {
	function getClasses() {
		let classes = ['rsToastMessage'];
		if (props.type === ToastifyType.SUCCESS) classes.push('success');
		else if (props.type === ToastifyType.ERROR) classes.push('error');
		else if (props.type === ToastifyType.INFO) classes.push('info');
		else if (props.type === ToastifyType.WARNING) classes.push('warning');
		else classes.push('custom');
		return classes;
	}
	function renderIcon() {
		if (props.type === ToastifyType.ERROR) return <Icon iconImg={icons.types.error} size={icons.size} />;
		else if (props.type === ToastifyType.SUCCESS) return <Icon iconImg={icons.types.success} size={icons.size} />;
		else if (props.type === ToastifyType.INFO) return <Icon iconImg={icons.types.info} size={icons.size} />;
		else if (props.type === ToastifyType.WARNING) return <Icon iconImg={icons.types.warning} size={icons.size} />;
		else return <Icon iconImg={icons.types.custom} size={icons.size} />;
	}

	function getTitleFromType(): string {
		if (props.type === ToastifyType.ERROR) return 'Uh oh, something went wrong.';
		else if (props.type === ToastifyType.SUCCESS) return 'Success!';
		else if (props.type === ToastifyType.INFO) return 'Did you know?';
		else if (props.type === ToastifyType.WARNING) return 'Warning';
		return '';
	}

	return (
		<Box className={getClasses().join(' ')} display={'flex'} alignItems={'center'}>
			{renderIcon()}
			<Box marginLeft={16}>
				<Label variant={labels.title.variant} weight={labels.title.weight}>
					{props.title || getTitleFromType()}
				</Label>
				<Label variant={labels.message.variant} weight={labels.message.weight}>
					{props.message}
				</Label>
			</Box>
		</Box>
	);
};
export default ToastMessage;

export const htToastify = {
	error: (message: string, title?: string, toastOptions?: ToastOptions) => {
		toast.error(<ToastMessage message={message} title={title} type={ToastifyType.ERROR} />, toastOptions);
	},
	info: (message: string, title?: string, toastOptions?: ToastOptions) => {
		toast.info(<ToastMessage message={message} title={title} type={ToastifyType.INFO} />, toastOptions);
	},
	success: (message: string, title?: string, toastOptions?: ToastOptions) => {
		toast.success(<ToastMessage message={message} title={title} type={ToastifyType.SUCCESS} />, toastOptions);
	},
	warning: (message: string, title?: string, toastOptions?: ToastOptions) => {
		toast.warning(<ToastMessage message={message} title={title} type={ToastifyType.WARNING} />, toastOptions);
	},
	custom: (message: string, title?: string, toastOptions?: ToastOptions) => {
		toast(<ToastMessage message={message} title={title} type={ToastifyType.CUSTOM} />, toastOptions);
	},
	setIcons: (newIcons: ToastIcons) => {
		icons = newIcons;
	},
	setLabels: function (newLabels: ToastLabels) {
		labels = newLabels;
	}
};

export { ToastContainer };
