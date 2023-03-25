declare namespace Rest {
	export type OrderTypes = 'ASC' | 'DESC' | 'RAND' | `RAND(${number})` | 'NONE';
	export type ConjunctionTypes = 'AND' | 'OR';
	export type MatchTypes =
		| 'exact'
		| 'fuzzy'
		| 'like'
		| 'greaterThan'
		| 'greaterThanEqual'
		| 'lessThan'
		| 'lessThanEqual';
	export interface ResponseData<T> {
		data: T;
	}
	export interface ErrorData {
		err: string;
		msg: string;
		stack?: string;
	}
	export interface PagedResponseData<T> extends ResponseData<T> {
		total: number;
	}
	export interface PageQuery {
		page?: number;
		perPage?: number;
		sortBy?: string;
		sortOrder?: OrderTypes;
		filter?: string;
	}
}
