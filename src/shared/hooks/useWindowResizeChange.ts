import { useEffect, useState } from 'react';

type ScreenSize = 'mobile' | 'tablet' | '';

export function useWindowResizeChange(mobileView: number = 599, tabletView: number = 700): ScreenSize {
	const [screenSize, setScreenSize] = useState<ScreenSize>('');
	useEffect(() => {
		window.addEventListener('resize', onResize);
		function onResize(event: UIEvent) {
			const screen = event.target as Window;
			renderSize(screen.innerWidth);
		}
		function renderSize(screen: number) {
			if (screen <= mobileView) setScreenSize('mobile');
			else if (screen <= tabletView) setScreenSize('tablet');
			else setScreenSize('');
		}
		renderSize(window.innerWidth);

		return () => {
			window.removeEventListener('resize', onResize);
		};
	}, []);

	return screenSize;
}
