const assert = require("assert");
const _ = require("underscore");

class WidgetBaseBase {

    constructor() {
       this._widgetConnectors = null;
    }

    getWidgetConnectors(optionalBaseClass) {
        assert(!optionalBaseClass || optionalBaseClass instanceof Function);
        let result = (this._widgetConnectors || []);
        if (optionalBaseClass) {
            result = result.filter(e => e.get() instanceof optionalBaseClass);
        }
        return result;
    }
}

class WidgetBase extends WidgetBaseBase {

    constructor(name/*:string*/) {
        super();
        assert(!name || typeof name === "string", "expecting a string here");
        this.name = !name ? null : name; // replace undefined by null
        this._dependencies = {};
        this._id = null; // null means unattached entity
        //xx this._widgetConnectors = []; // will be created on demand
        //xx this._subWidgetCollection = []; // will be created on demand
    }

    _addDependantEntity(entity) {
        assert(entity instanceof WidgetBase);
        assert(entity._id, "_addDependantEntity: _id is missing : Entity must be registered");
        const found = this._dependencies[entity._id];
        assert(!found, "_addDependantEntity: should not find entity in dependencies");
        this._dependencies[entity._id] = entity;
    }

    _removeDependantEntity(entity) {
        assert(entity instanceof WidgetBase);
        const _shape = this._dependencies[entity._id];
        if (!_shape) {
            // Object.keys(this._dependencies).forEach(x => this._dependencies[x] = null);
            throw new Error("expecting entity to be found on _dependencies " + entity._id);
        }
        this._dependencies[entity._id] = null;
    }

    getDependantEntities() {
        if (!this._dependencies) {
            return [];
        }
        return Object.keys(this._dependencies).map(k => this._dependencies[k]).filter(e => !!e);
    }

    canDelete() {
        return this.getDependantEntities().length === 0;
    }

    getWidgetConnectors(optionalBaseClass) {

        let result = super.getWidgetConnectors(optionalBaseClass);

        // // now lets treat the sub-widget collection
        // if (this._subWidgetCollection ) {
        //     this._subWidgetCollection.forEach(coll=>{
        //
        //         const subConnectors = coll.getWidgetConnectors(optionalBaseClass);
        //         if (subConnectors.length) {
        //             result = [].concat(result,subConnectors);
        //         }
        //     });
        // }
        return result;
    }


    establishLink() {
        this.getWidgetConnectors().forEach(wc => wc.establishLink());
    }

    _replaceLink(oldShape, newShape) {
        this.getWidgetConnectors().forEach(wc => wc._replaceLink(oldShape, newShape));
    }

    dispose() {
        const filtered = _.uniq(this.getWidgetConnectors());
        filtered.forEach(wc => wc.dispose());
        this._id = "disposed";
    }

    clone() {
        throw new Error("WidgetBase#clone must be overridden");
    }

}

exports.WidgetBaseBase = WidgetBaseBase;
exports.WidgetBase = WidgetBase;
