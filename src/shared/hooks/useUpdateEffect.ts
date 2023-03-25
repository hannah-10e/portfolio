import * as React from 'react';

// Used internally by InputNumber. I don't really want to expose this to the public.
export function useUpdateEffect(fn: () => void, deps?: React.DependencyList) {
	const mounted = React.useRef(false);
	return React.useEffect(() => {
		if (!mounted.current) {
			mounted.current = true;
			return;
		}

		return fn && fn();
	}, deps);
}
