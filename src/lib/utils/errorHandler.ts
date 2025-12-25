import { AxiosError } from 'axios';

/**
 * Extracts a user-friendly error message from an axios error or generic error
 * 
 * @param error - The error object (can be AxiosError, Error, or unknown)
 * @param defaultMessage - Default message to show if error message cannot be extracted
 * @returns A user-friendly error message string
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage: string = 'Произошла ошибка. Пожалуйста, попробуйте еще раз.'
): string {
  // Handle Axios errors
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<{
      message?: string;
      detail?: string | Array<{ loc?: (string | number)[]; msg?: string; type?: string }>;
      error?: string;
      details?: {
        fields?: Array<{ field?: string; message?: string }>;
      };
    }>;

    const responseData = axiosError.response?.data;

    // Try to get message from response data (most common)
    if (responseData?.message) {
      return responseData.message;
    }

    // Try detail field (FastAPI sometimes uses this)
    if (responseData?.detail) {
      if (typeof responseData.detail === 'string') {
        return responseData.detail;
      }
      // Handle array of validation errors
      if (Array.isArray(responseData.detail) && responseData.detail.length > 0) {
        const firstError = responseData.detail[0];
        if (firstError?.msg) {
          return firstError.msg;
        }
      }
    }

    // Try error field (but skip generic HTTP_ERROR)
    if (responseData?.error && responseData.error !== 'HTTP_ERROR') {
      // If error is a code, try to get message instead
      if (responseData.message) {
        return responseData.message;
      }
      // Otherwise return the error code as fallback
      return responseData.error;
    }

    // Try validation errors from details.fields
    if (responseData?.details?.fields && responseData.details.fields.length > 0) {
      const firstFieldError = responseData.details.fields[0];
      if (firstFieldError?.message) {
        return firstFieldError.message;
      }
      if (firstFieldError?.field) {
        return `Ошибка в поле: ${firstFieldError.field}`;
      }
    }

    // Fallback to status text or status code
    if (axiosError.response?.statusText && axiosError.response.statusText !== 'Bad Request') {
      return axiosError.response.statusText;
    }

    if (axiosError.response?.status) {
      // Don't show generic status codes, use default message instead
      return defaultMessage;
    }
  }

  // Handle generic Error objects
  if (error instanceof Error) {
    // Don't show generic axios error messages
    if (
      error.message.includes('Request failed with status code') ||
      error.message.includes('Network Error') ||
      error.message.includes('timeout')
    ) {
      return defaultMessage;
    }
    return error.message;
  }

  // Fallback to default message
  return defaultMessage;
}

