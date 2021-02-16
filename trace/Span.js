class Span {
    constructor({correlationId, data, operationType}) {
        this._correlationId = correlationId;
        this._opetationType = operationType || 'RESPONSE'
        this._data = data;
    }

    span() {
        return {
            correlationId: this._correlationId,
            data: this._data,
            operationType: this._opetationType
        }
    }
}

module.exports = {
    Span
}
