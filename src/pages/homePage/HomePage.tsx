import * as React from 'react';
import './HomePage.scss';
import { Box, Page } from '../../shared/components';
import serviceFactory from '../../services/serviceFactory';
import UserService from '../../services/user/userService';

interface HomePageProps {}

const HomePage: React.FC<HomePageProps> = (props) => {
	const userService = serviceFactory.get<UserService>('UserService');

	return (
		<Page className={'htHomePage'}>
			<Box display={'flex'} justifyContent={'center'}>
				This is the Home Page!
			</Box>
		</Page>
	);
};
export default HomePage;
