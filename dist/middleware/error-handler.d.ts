import { Request, Response, NextFunction } from "express";
export interface ApiError extends Error {
    statusCode?: number;
}
export declare const errorHandler: (err: ApiError, req: Request, res: Response, next: NextFunction) => void;
export declare const notFound: (req: Request, res: Response) => void;
//# sourceMappingURL=error-handler.d.ts.map