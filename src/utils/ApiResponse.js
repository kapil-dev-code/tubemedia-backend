export class ApiResponse {
    constructor(statusCode, data = null, message = null) {
        this.statusCode = statusCode;
        this.success = statusCode < 400;
        this.message = message || (this.success ? "Success" : "Error");
        this.data = data;
    }
}