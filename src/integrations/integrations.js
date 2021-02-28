class Integrations {
    isModulePresent(moduleName){
        try {
            return require.resolve(moduleName)
        } catch (e) {
            return undefined
        }
    }

    require(moduleName){
        const module = this.isModulePresent(moduleName);
        if (module){
            return require(module)
        }
    }
}

module.exports = {
    Integrations
}
