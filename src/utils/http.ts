import axios, { AxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../constants/api';

class HttpClient {
  private static instance: HttpClient;
  private baseURL: string;
  private headers: Record<string, any>;

  private constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.headers = API_CONFIG.HEADERS;
  }

  public static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    return HttpClient.instance;
  }

  private getConfig(config?: AxiosRequestConfig): AxiosRequestConfig {
    return {
      ...config,
      baseURL: this.baseURL,
      headers: {
        ...this.headers,
        ...config?.headers
      },
      withCredentials: true,
      decompress: true
    };
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await axios.get<T>(url, this.getConfig(config));
      return response.data;
    } catch (error: any) {
      console.error(`HTTP GET request failed: ${url}`, error.response?.data || error.message);
      throw error;
    }
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await axios.post<T>(url, data, this.getConfig(config));
      return response.data;
    } catch (error: any) {
      console.error(`HTTP POST request failed: ${url}`, error.response?.data || error.message);
      throw error;
    }
  }
}

export const http = HttpClient.getInstance();
