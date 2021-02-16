class AxiosIntegration {
    wrap() {
        return (request) => {
            return async function requestWrapper(options) {
                const req = await request.call(this, options);
                console.log("inside ", req)
                return req
            };
        }
    }
}
