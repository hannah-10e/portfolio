declare namespace Api {
	export namespace User {
		export namespace Req {
			export interface UserData {
				example: string;
			}
			// or
			export interface UserData extends Model.User {}
		}
		export namespace Res {
			export interface UserData {
				example: string;
			}
		}
	}
}
