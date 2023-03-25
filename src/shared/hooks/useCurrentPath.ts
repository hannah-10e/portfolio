import { useEffect, useState } from 'react';
import { Router } from '../navigation';

export function useCurrentPath() {
	const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
	useEffect(() => {
		let id = Router.getInstance().subscribeToAfterRouterNavigate((newPath) => {
			setCurrentPath(newPath);
		});

		return () => {
			Router.getInstance().unsubscribeFromAfterRouterNavigate(id);
		};
	}, []);

	return currentPath;
}
