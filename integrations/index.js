const {PostgresIntegration} = require("./postgresIntegration");
const {HttpIntegration} = require("./httpIntegration");

module.exports = {
    Http: HttpIntegration,
    Pg: PostgresIntegration
}
