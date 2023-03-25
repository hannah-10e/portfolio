import { Router } from '../shared/navigation';

class AdvancedRouter extends Router {
	constructor() {
		super({ animate: false });
	}
}

let router = new AdvancedRouter();
export default router;
(window as any).router = router;
