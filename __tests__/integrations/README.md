# Integration tests

Those tests will actually shim the node modules.
They have to be run outside Jest because it does not provide `--preserve-simlink`,
as we are using npm link to simulate the library installed as node_module

### Roadmap

- Add docker server to handle external requests
- Add docker db to handler database requests
- Switch both off when we are testing the debug mode.
This will test the custom mocks
