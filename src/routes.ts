import HomePage from './pages/homePage/HomePage';
import { CommonShared } from './shared/interfaces/common';

export type RoutePaths = '/' | '*' | '/search';

const routes: CommonShared.RouteDetails<RoutePaths>[] = [
	{
		path: '/',
		page: HomePage,
		options: {
			view: 'home'
		}
	}
	// {
	// 	path: '*',
	// 	page: NotFoundPage
	// },
	// {
	// 	path: '/search',
	// 	page: LoadingPage
	// }
];

export default routes;
(window as any).routes = routes;
