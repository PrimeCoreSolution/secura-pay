// Base API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
console.log("API Base URL:", API_BASE_URL);

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Set base URL (useful when you're ready to connect your API)
  setBaseURL(url: string) {
    this.baseURL = url;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Default headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include", // Include cookies
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error("API Request failed:", error);
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const jsonData = await response.json().catch(() => ({}));

    // Backend always returns {success: boolean, data?: T, error?: string}
    if (!response.ok) {
      const error: ApiError = {
        message: jsonData.error || jsonData.message || "An error occurred",
        status: response.status,
        errors: jsonData.errors,
      };
      throw error;
    }

    // If response is successful, check the success flag
    if (jsonData.success === false) {
      const error: ApiError = {
        message: jsonData.error || "An error occurred",
        status: response.status,
        errors: jsonData.errors,
      };
      throw error;
    }

    // Return the data property if it exists, otherwise return the whole response
    // This handles both wrapped responses {success: true, data: T} and direct responses
    return (jsonData.data !== undefined ? jsonData.data : jsonData) as T;
  }

  // HTTP Methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export the class for custom instances if needed
export { ApiClient };

