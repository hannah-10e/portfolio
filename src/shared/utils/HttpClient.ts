import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ObjectUtils } from './Utils';

/** HTTP client performs HTTP requests */
export class HttpClient {
	private config: AxiosRequestConfig;
	private axiosInstance: AxiosInstance;

	constructor(config?: AxiosRequestConfig) {
		this.config = config || {
			headers: {
				'Content-Type': 'application/json',

				'Access-Control-Allow-Origin': '*'
			}
		};

		this.axiosInstance = axios.create();
	}

	/**
	 * Adds some middleware on all outgoing requests
	 * @param onFulfilled Function called on a successful request
	 * @param onRejected Function called on a failure
	 * @returns An intercepter id that can be removed in the future
	 */
	addRequestIntercepter(
		onFulfilled: (value: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>,
		onRejected?: (error: any) => any
	): number {
		return this.axiosInstance.interceptors.request.use(onFulfilled, onRejected);
	}

	/**
	 * Removes previously added middleware
	 * @param interceptorId
	 */
	removeRequestIntercepter(interceptorId: number) {
		return this.axiosInstance.interceptors.request.eject(interceptorId);
	}

	/**
	 * Adds some middleware on all outgoing requests
	 * @param onFulfilled Function called on a successful request
	 * @param onRejected Function called on a failure
	 * @returns An intercepter id that can be removed in the future
	 */
	addResponseIntercepter(
		onFulfilled: (value: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
		onRejected: (error: any) => any
	): number {
		return this.axiosInstance.interceptors.response.use(onFulfilled, onRejected);
	}

	/**
	 * Removes previously added middleware
	 * @param interceptorId
	 */
	removeResponseIntercepter(interceptorId: number) {
		return this.axiosInstance.interceptors.response.eject(interceptorId);
	}

	/**
	 * Changes the current default config
	 * @param {AxiosRequestConfig} config - New configuration
	 */
	changeConfig(config: AxiosRequestConfig) {
		this.config = config;
	}

	/**
	 * Returns a clone copy of the current config
	 * @return {AxiosRequestConfig} Cloned copy of configuration for Axios
	 */
	currentConfig(): AxiosRequestConfig {
		return ObjectUtils.clone(this.config);
	}

	/**
	 * Send HTTP GET request to target URL
	 * @name get<T>
	 * @param {string} url
	 * @param {any} data
	 * @param {AxiosRequestConfig} config
	 * @returns {Promise<AxiosResponse<T>>}
	 */
	get<T, U>(url: string, data?: U, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		if (data) {
			url += '?' + ObjectUtils.serialize(data);
		}

		config = config ?? this.config;

		return this.axiosInstance.get<T>(url, config);
	}

	/**
	 * Send HTTP PUT request to target URL
	 * @name put<T>
	 * @param {string} url
	 * @param {any} data
	 * @param {AxiosRequestConfig} config
	 * @returns {Promise<AxiosResponse<T>>}
	 */

	put<T, U>(url: string, data?: U, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		config = config ?? this.config;

		return this.axiosInstance.put<T>(url, data, config);
	}

	/**
	 * Send HTTP PATCH request to target URL
	 * @name put<T, U>
	 * @param {string} url
	 * @param {any} data
	 * @param {AxiosRequestConfig} config
	 * @returns {Promise<AxiosResponse<T>>}
	 */
	patch<T, U>(url: string, data?: U, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		config = config ?? this.config;

		return this.axiosInstance.patch<T>(url, data, config);
	}

	/**
	 * Send HTTP POST request to target URL
	 * @name post<T>
	 * @param {string} url
	 * @param {any} data
	 * @param {AxiosRequestConfig} config
	 * @returns {Promise<AxiosResponse<T>>}
	 */
	post<T, U>(url: string, data?: U, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		config = config ?? this.config;

		return this.axiosInstance.post<T>(url, data, config);
	}

	/**
	 * Send HTTP DELETE request to target URL
	 * @name delete<T>
	 * @param {string} url
	 * @param {any} data
	 * @param {AxiosRequestConfig} config
	 * @returns {Promise<AxiosResponse<T>>}
	 */
	delete<T, U>(url: string, data?: U, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		if (data) {
			url += '?' + ObjectUtils.serialize(data);
		}

		config = config ?? this.config;

		return this.axiosInstance.delete<T>(url, config);
	}

	/**
	 * Upload file to target URL using axios config
	 * @name upload
	 * @param {string} url
	 * @param {FormData} formData
	 * @param {File} file
	 * @param {(p: number)=>void} progress
	 * @param {AxiosRequestConfig} config - alternative axios config to use
	 * @returns {Promise<T>}
	 */
	upload<T>(
		url: string,
		formData: FormData,
		file: File,
		progress?: (percent: number) => void,
		config?: AxiosRequestConfig
	): Promise<AxiosResponse<T>> {
		config = config ?? this.config;
		let updatedConfig = ObjectUtils.clone(config) as AxiosRequestConfig;
		updatedConfig.headers!['Content-Type'] = 'multipart/form-data';
		if (progress)
			updatedConfig.onUploadProgress = (progressEvent) => {
				progress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
			};
		formData.append('file', file, file.name);
		return this.axiosInstance.post<T>(url, formData, updatedConfig);
	}
}
