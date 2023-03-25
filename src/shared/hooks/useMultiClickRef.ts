import { useEffect, useRef, useState } from 'react';

/**
 * This Custom hook is used for adding a callback to an element when it is clicked X amount of times.
 * @param callBack
 * @param numberOfClicks
 * @param secondsToCompleteIn
 */

export function useMultiClickRef<T extends HTMLElement = HTMLElement>(
	callBack: () => void,
	numberOfClicks: number,
	secondsToCompleteIn: number
) {
	const elementRef = useRef<T>(null);
	const [startTime, setStartTime] = useState<number>(0);
	const [clicks, setClicks] = useState<number>(0);

	useEffect(() => {
		let target = elementRef.current;
		if (!target) return;

		target.addEventListener('click', onClick);

		return () => {
			if (!target) return;
			target.removeEventListener('click', onClick);
		};
	}, [clicks, startTime]);

	function onClick() {
		let currentTime = Date.now();
		let timeDifferenceSeconds = (currentTime - startTime) / 1000;

		if (timeDifferenceSeconds <= secondsToCompleteIn && clicks + 1 === numberOfClicks) {
			setClicks(0);
			setStartTime(0);
			callBack();
			return;
		}

		if (!clicks || timeDifferenceSeconds > secondsToCompleteIn) {
			setStartTime(Date.now());
			setClicks(1);
		} else {
			setClicks(clicks + 1);
		}
	}
	return elementRef;
}
