module.exports = function checkResponse(res, message, url) {
    const rawStatus = res.status !== undefined ? res.status : res.statusCode;
    const status = Number(rawStatus);
    if (rawStatus !== undefined && rawStatus !== null && rawStatus !== '' &&
        !isNaN(status) && (status < 200 || status >= 300)) {
        throw new Error(`${message} (${status}): ${url}`);
    }
};
