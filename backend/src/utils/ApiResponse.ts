import { Response } from 'express';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SuccessPayload<T> {
  success: true;
  message: string;
  data?: T;
  pagination?: Pagination;
}

export class ApiResponse {
  static success<T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T,
    pagination?: Pagination,
  ): Response {
    const payload: SuccessPayload<T> = { success: true, message };
    if (data !== undefined) payload.data = data;
    if (pagination !== undefined) payload.pagination = pagination;
    return res.status(statusCode).json(payload);
  }

  static ok<T>(res: Response, message: string, data?: T, pagination?: Pagination): Response {
    return this.success(res, 200, message, data, pagination);
  }

  static created<T>(res: Response, message: string, data?: T): Response {
    return this.success(res, 201, message, data);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}

export function buildPagination(page: number, limit: number, total: number): Pagination {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
