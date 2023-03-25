import { useEffect, useState } from 'react';
import { Router } from '../navigation';

export function useActiveViewName() {
	const [activeViewName, setActiveViewName] = useState<string>('');

	useEffect(() => {
		let id = Router.getInstance().subscribeToActiveViewChanged((newView) => {
			setActiveViewName(newView);
		});
		return () => Router.getInstance().unsubscribeFromActiveViewChanged(id);
	}, []);

	return activeViewName;
}
