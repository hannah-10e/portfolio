import * as React from 'react';
import { PropsWithChildren, useEffect, useState } from 'react';
import './DataTable.scss';
import {
	DataTable,
	DataTableFilterMatchModeType,
	DataTableFilterMeta,
	DataTableFilterMetaData,
	DataTableGlobalFilterType,
	DataTableMultiSortMetaType,
	DataTablePFSEvent,
	DataTableProps as PrimeReactDataTableProps,
	DataTableSortOrderType
} from 'primereact/datatable';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { FilterMatchMode } from 'primereact/api';

export enum DataTableSortOrder {
	'ASC' = 1,
	'DESC' = -1,
	'NONE' = 0
}

export interface PageQuery {
	page: number;
	perPage: number;
	sortBy?: string;
	sortOrder?: Rest.OrderTypes;
	filter?: string;
}

export type FilterMatchModes = DataTableFilterMatchModeType | 'isNull' | 'isNotNull';

export interface DataTableFilters {
	[key: string]: { operator: string; constraints: { value: any; matchMode: FilterMatchModes }[] };
}

enum NullFilterMatchModes {
	IS_NULL = 'isNull',
	IS_NOT_NULL = 'isNotNull'
}

export const MatchModeType = { ...FilterMatchMode, ...NullFilterMatchModes };

interface TableState<T> {
	tableData: T[];
	total: number;
	first: number;
	rows: number;
	sortField?: string;
	sortOrder?: DataTableSortOrder;
	filters?: DataTableFilterMeta;
	multiSortMeta?: DataTableMultiSortMetaType;
	globalFilter?: string;
	globalFilterFields?: string[];
}

export interface HtDataTableProps<T> extends PrimeReactDataTableProps {
	data: { data: T[]; total: number };
	getData: (pageQuery: PageQuery) => void;
	globalSearchPlaceholder?: string;
	sortOrder?: DataTableSortOrder;
	globalFilterDebounceMs?: number;
	elementRef?: React.RefObject<any>;
}

let debounceTimeout: any;

const HtDataTable = <T extends {}>(props: PropsWithChildren<HtDataTableProps<T>>) => {
	const { getData, globalFilterDebounceMs, elementRef, ...baseProps } = props;
	const [globalFilter, setGlobalFilter] = useState<DataTableGlobalFilterType>(props.globalFilter);
	const [loading, setLoading] = useState<boolean>(false);
	const [tableState, setTableState] = useState<TableState<T>>({
		tableData: props.data.data,
		total: props.data.total || props.data.data.length,
		first: props.first || 0,
		rows: props.rowsPerPageOptions?.[0] || 10,
		sortField: props.sortField,
		sortOrder: props.sortOrder,
		filters: props.filters,
		multiSortMeta: props.multiSortMeta,
		globalFilter: props.globalFilter || '',
		globalFilterFields: props.globalFilterFields
	});

	useEffect(() => {
		setTableState({
			...tableState,
			tableData: props.data.data,
			total: props.data.total || props.data.data.length
		});
	}, [props.data]);

	useEffect(() => {
		setTableState({
			...tableState,
			filters: { ...tableState.filters, ...props.filters }
		});
		handleEvent({
			filters: { ...tableState.filters, ...props.filters }
		} as unknown as DataTablePFSEvent);
	}, [props.filters]);

	useEffect(() => {
		handleEvent({
			filters: { ...tableState.filters, global: { value: tableState.globalFilter, matchMode: 'contains' } }
		} as unknown as DataTablePFSEvent);
	}, [tableState.globalFilter]);

	useEffect(() => {
		if (globalFilter !== props.globalFilter) {
			setGlobalFilter(props.globalFilter);
		}
	}, [props.globalFilter]);

	useEffect(() => {
		clearTimeout(debounceTimeout);
		if (!globalFilter) {
			if (!tableState.filters?.global) return;
			const { global, ...filters } = tableState.filters as any;
			setTableState({ ...tableState, globalFilter: '', filters: filters });
		} else {
			debounceTimeout = setTimeout(() => {
				setTableState({
					...tableState,
					globalFilter: globalFilter,
					filters: { ...tableState.filters, global: { value: globalFilter, matchMode: 'contains' } }
				});
			}, globalFilterDebounceMs || 0);
		}
	}, [globalFilter]);

	function getSortOrder(sortOrder: DataTableSortOrderType) {
		if (sortOrder === 1) return 'ASC';
		if (sortOrder === -1) return 'DESC';
		return 'NONE';
	}

	function getMatchType(matchType: FilterMatchModes): {
		negate: boolean;
		matchType:
			| 'startsWith'
			| 'contains'
			| 'endsWith'
			| 'exact'
			| 'greaterThanEqual'
			| 'greaterThan'
			| 'lessThanEqual'
			| 'lessThan'
			| 'isNull';
	} {
		switch (matchType) {
			case 'startsWith':
			case 'contains':
			case 'endsWith':
				return { negate: false, matchType };
			case 'notContains':
				return { negate: true, matchType: 'contains' };
			case 'dateIsNot':
			case 'notEquals':
				return { negate: true, matchType: 'exact' };
			case 'in':
				return { negate: false, matchType: 'contains' };
			case 'dateBefore':
			case 'lt':
				return { negate: false, matchType: 'lessThan' };
			case 'lte':
				return { negate: false, matchType: 'lessThanEqual' };
			case 'dateAfter':
			case 'gt':
				return { negate: false, matchType: 'greaterThan' };
			case 'gte':
				return { negate: false, matchType: 'greaterThanEqual' };
			case 'isNull':
				return { negate: false, matchType: 'isNull' };
			case 'isNotNull':
				return { negate: true, matchType: 'isNull' };
			case 'custom':
			case 'between':
			case 'dateIs':
			case 'equals':
			default:
				return { negate: false, matchType: 'exact' };
		}
	}

	function getGlobalFilterOperator(filterString: string, globalFilterString: string, filter: any) {
		if (!filterString && !globalFilterString) return '';
		if (filterString && !globalFilterString) {
			return 'AND(';
		}
		return filter?.operator || 'OR';
	}

	function getFilterString(filters: DataTableFilterMeta): string {
		let filterString = '';
		for (let column in filters) {
			const currentFilter: any = filters[column];
			if (column === 'global') {
				if (!currentFilter.value) continue;
				let globalFilterString = '';
				const matchType = getMatchType(currentFilter.matchMode);
				props.globalFilterFields?.forEach((globalFilter: string) => {
					globalFilterString += `${getGlobalFilterOperator(filterString, globalFilterString, currentFilter)}${
						matchType.negate ? '!' : ''
					}(column:${globalFilter},value:${currentFilter.value},type:${matchType.matchType})`;
				});
				filterString += `${globalFilterString}${filterString.length ? ')' : ''}`;
				continue;
			}
			currentFilter.constraints.forEach((constraint: DataTableFilterMetaData) => {
				const matchType = getMatchType(constraint.matchMode);
				if (matchType.matchType !== 'isNull' && !constraint.value) return;
				filterString += `${filterString.length ? currentFilter?.operator || '' : ''}${
					matchType.negate ? '!' : ''
				}(column:${column},value:${matchType.matchType === 'isNull' ? null : constraint.value},type:${
					matchType.matchType
				})`;
			});
		}
		return filterString;
	}

	function calculatePage(): number {
		return Math.ceil((tableState.first + 1) / tableState.rows);
	}

	function handleEvent(event?: DataTablePFSEvent): void {
		getData({
			page: event?.page !== undefined ? event.page + 1 : calculatePage(),
			perPage: event?.rows || tableState.rows,
			sortBy: event?.sortField || tableState.sortField || undefined,
			sortOrder: getSortOrder(event?.sortOrder || tableState.sortOrder),
			filter: getFilterString(event?.filters || tableState.filters || {})
		});
	}

	function handleSort(event: DataTablePFSEvent): void {
		setLoading(true);
		handleEvent(event);
		props.onSort?.(event);

		setTableState({
			...tableState,
			sortField: event.sortField,
			sortOrder: DataTableSortOrder[getSortOrder(event.sortOrder)],
			multiSortMeta: event.multiSortMeta
		});
		setLoading(false);
	}

	function handleFilter(event: DataTablePFSEvent): void {
		setLoading(true);
		handleEvent(event);
		props.onFilter?.(event);

		setTableState({
			...tableState,
			filters: {
				...props.filters,
				...event.filters
			}
		});
		setLoading(false);
	}

	function handlePage(event: DataTablePFSEvent): void {
		setLoading(true);
		handleEvent(event);
		props.onPage?.(event);

		setTableState({
			...tableState,
			rows: event.rows,
			first: event.first
		});
		setLoading(false);
	}

	return (
		<div className={'htDataTable'}>
			<DataTable
				{...baseProps}
				loading={loading}
				value={tableState.tableData}
				globalFilter={undefined}
				globalFilterFields={tableState.globalFilterFields}
				sortField={tableState.sortField}
				sortOrder={tableState.sortOrder}
				onSort={handleSort}
				filters={tableState.filters}
				onFilter={props.onFilter || handleFilter}
				first={tableState.first}
				rows={props.rows || tableState.rows}
				totalRecords={tableState.total}
				rowsPerPageOptions={props.rowsPerPageOptions || [10, 25, 50, 100, 500]}
				paginator={props.paginator || true}
				lazy={props.lazy || true}
				onPage={handlePage}
				ref={elementRef}
			>
				{props.children}
			</DataTable>
		</div>
	);
};

export { HtDataTable };
