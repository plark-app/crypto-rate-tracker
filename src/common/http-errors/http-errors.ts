export class HttpError extends Error {
    public status: number;
    public data?: object;
    public __proto__: any;

    public constructor(message: string = "Internal error", status: number = 500, data?: object) {
        super(message);

        this.status = status;
        this.data = data || {
            error: message,
        };

        this.__proto__ = HttpError.prototype;
    }
}


export class ValidationError extends HttpError {

    public errors: Record<string, string>;

    public constructor(errors: Record<string, string>) {
        super('Validation error', 400, {
            errors: errors,
        });

        this.errors = errors;
    }
}
