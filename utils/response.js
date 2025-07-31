class ResponseError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

function successResponse(message, data) {
    const response = {
        success: true,
        message: message
    };

    if (data != null) {
        response.data = data;
    }

    return response;
}

function errorResponse(message) {
    return {
        success: false,
        message: message
    }
}

module.exports = { ResponseError, successResponse, errorResponse }