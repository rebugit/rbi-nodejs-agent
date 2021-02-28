const {Integrations} = require("../../src/integrations/integrations");

describe('Integration main class', function () {
    it('should correctly require a module', function () {
        const ints = new Integrations()

        const s = ints.require('http');

        expect(s).toBeDefined()
    });

    it('should return empty module', function () {
        const ints = new Integrations()

        const s = ints.require('some-module');

        expect(s).toBeUndefined()
    });

});
