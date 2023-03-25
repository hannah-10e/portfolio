import React from 'react';
import { Box, popupController, htToastify, View } from './shared/components';
import classNames from 'classnames';
import { ToastContainer } from 'react-toastify';
import { useWindowResizeChange } from './shared/hooks';
// import themes from '../src/themes/*.scss?export'

(window as any).global ||= window;

htToastify.setIcons({
	types: {
		custom: '',
		error: 'icon-sad-face',
		info: 'icon-warning-circle',
		success: 'icon-happy-face',
		warning: 'icon-warning'
	},
	size: 21
});

htToastify.setLabels({
	title: {
		variant: 'body2',
		weight: 'bold'
	},
	message: {
		variant: 'caption2',
		weight: 'regular'
	}
});

function App() {
	const screenSize = useWindowResizeChange();

	return (
		<Box className={classNames('App', screenSize)}>
			<>
				<View key="home" id="home" default initialPath="/" />
			</>
			{popupController.instance}
			<ToastContainer />
		</Box>
	);
}

export default App;
