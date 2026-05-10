"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (process.env.NODE_ENV === "development") {
        console.error(`[ERROR] ${statusCode}: ${message}`, err.stack);
    }
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
const notFound = (req, res) => {
    res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
};
exports.notFound = notFound;
//# sourceMappingURL=error-handler.js.map