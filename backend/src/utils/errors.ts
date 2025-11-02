import {Response} from "express";
import {ZodIssue} from "zod";

export function validationError(res: Response, issues: ZodIssue[]) {
    return res.status(400).json({
        status: "error",
        errType: "SchemaValidationErr",
        errors: issues.map(issue => ({
            field: issue.path,
            code: issue.code,
            message: issue.message,
        })),
    });
}
