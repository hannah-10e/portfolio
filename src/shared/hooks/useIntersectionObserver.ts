import { MutableRefObject, useEffect, useState } from 'react';

export function useIntersectionObserver(ref: MutableRefObject<any>): boolean {
	const [isInView, setIsInView] = useState<boolean>(false);

	useEffect(() => {
		function handleIntersectionEvent(entries: IntersectionObserverEntry[]) {
			const isIntersecting = !!entries.find((entry) => entry.isIntersecting);
			setIsInView(isIntersecting);
		}

		const observer = new IntersectionObserver(handleIntersectionEvent, {
			root: null,
			rootMargin: '0px',
			threshold: 0.1
		});
		if (ref.current) observer.observe(ref.current);
		return observer.disconnect;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ref]);

	return isInView;
}
