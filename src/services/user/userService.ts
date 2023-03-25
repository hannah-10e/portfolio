import http from '../../utils/http';
import { Service } from '../Service';

export default class UserService extends Service {
	async getUserData(req: Api.User.Req.UserData) {
		let res = await http.get<Rest.ResponseData<Api.User.Res.UserData>, Api.User.Req.UserData>('user', req);
		return res.data;
	}
}
