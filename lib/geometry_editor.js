const assert = require("assert");

const serialijse = require("serialijse");

const WidgetConnector = require("./widget_connector").WidgetConnector;
const WidgetBase = require("./widget_base").WidgetBase;
const WidgetCollection = require("./widget_collection").WidgetCollection;
const WidgetBaseConn = require("./widget_base_conn").WidgetBaseConn;
const WidgetConnectorList = require("./widget_connector_list").WidgetConnectorList;


class Expression {
    constructor(exp) {
        this.exp = exp || "0";
    }

    set(exp) {
        this.exp = exp;
        // to do : verify syntax and throw if necessary
    }

    toScript() {
        return this.exp;
    }

    clone() {
        const clone = new Expression();
        clone.exp = this.exp;
        return clone;
    }
}

class ExpressionPoint {

    constructor(exprX, exprY, exprZ) {
        this.X = new Expression(exprX);
        this.Y = new Expression(exprY);
        this.Z = new Expression(exprZ);
    }

    set(exprX, exprY, exprZ) {
        this.X.set(exprX);
        this.Y.set(exprY);
        this.Z.set(exprZ);
    }

    toScript() {
        return "[" + this.X.toScript() + "," + this.Y.toScript() + "," + this.Z.toScript() + "]";
    }

    clone() {
        const clone = new ExpressionPoint();
        clone.X = this.X.clone();
        clone.Y = this.Y.clone();
        clone.Z = this.Z.clone();
        return clone;
    }
}

let future_GeomBase;

class ShapeConnector extends WidgetConnector {

    constructor(parent) {
        super(parent);
    }

    isValidConnectedObject(object) {
        assert(object, "expecting a valid object");
        return object instanceof future_GeomBase;
    }
}

class GeomBase extends WidgetBase {

    constructor(name/*: string*/) {
        super(name);
        this.isVisible = false;
    }

    clone() {
        throw new Error("Not Implemented");
    }

    getShapeConnectors() {
        return this.getWidgetConnectors().filter(connector => (connector instanceof ShapeConnector));
    }

    getDependantShapes() {
        return this.getDependantEntities().filter(widget => (widget instanceof GeomBase));
    }
}

future_GeomBase = GeomBase;


class GeomPrimitive extends GeomBase {

}

class GeomPrimitiveBox extends GeomPrimitive {

    constructor(name) {
        super(name);
        this.point1 = new ExpressionPoint();
        this.point2 = new ExpressionPoint();
    }

    toScript() {
        return "csg.makeBox("
            + this.point1.toScript() + ","
            + this.point2.toScript() + ");";
    }

    clone() {
        const clone = new GeomPrimitiveBox();
        clone.name = this.name;
        clone.point1 = this.point1.clone();
        clone.point2 = this.point2.clone();
        clone.isVisible = this.isVisible;
        return clone;
    }
}

class GeomPrimitiveCylinder extends GeomPrimitive {

    constructor(name) {
        super(name);
        this.point1 = new ExpressionPoint();
        this.point2 = new ExpressionPoint();
        this.radius = new Expression();
    }

    toScript() {
        return "csg.makeCylinder("
            + this.point1.toScript() + ","
            + this.point2.toScript() + ","
            + this.radius.toScript() + ");";
    }

    clone() {
        const clone = new GeomPrimitiveCylinder();
        clone.name = this.name;
        clone.point1 = this.point1.clone();
        clone.point2 = this.point2.clone();
        clone.radius = this.radius.clone();
        clone.isVisible = this.isVisible;
        return clone;
    }

}

class GeomPrimitiveCone extends GeomPrimitive {

    constructor(name) {
        super(name);
        this.point1 = new ExpressionPoint();
        this.radius1 = new Expression();
        this.point2 = new ExpressionPoint();
        this.radius2 = new Expression();
    }

    toScript() {
        return "csg.makeCone("
            + this.point1.toScript() + ","
            + this.radius1.toScript() + ","
            + this.point2.toScript() + ","
            + this.radius2.toScript() + ");";
    }

    clone() {
        const clone = new GeomPrimitiveCone();
        clone.name = this.name;
        clone.point1 = this.point1.clone();
        clone.radius1 = this.radius1.clone();
        clone.point2 = this.point2.clone();
        clone.radius2 = this.radius2.clone();
        clone.isVisible = this.isVisible;
        return clone;
    }
}

class GeomPrimitiveSphere extends GeomPrimitive {

    constructor(name) {
        super(name);
        this.center = new ExpressionPoint();
        this.radius = new Expression();
    }

    toScript() {
        return "csg.makeSphere("
            + this.center.toScript() + ","
            + this.radius.toScript() + ");";
    }

    clone() {
        const clone = new GeomPrimitiveSphere();
        clone.name = this.name;
        clone.center = this.center.clone();
        clone.radius = this.radius.clone();
        clone.isVisible = this.isVisible;
        return clone;
    }

}

class GeomPrimitiveTorus extends GeomPrimitive {

    constructor(name) {
        super(name);
        this.center = new ExpressionPoint();
        this.axis = new ExpressionPoint();
        this.mainRadius = new Expression();
        this.smallRadius = new Expression();
    }

    toScript() {
        return "csg.makeTorus("
            + this.center.toScript() + ","
            + this.axis.toScript() + ","
            + this.mainRadius.toScript() + ","
            + this.smallRadius.toScript() + ");";
    }

    clone() {
        const clone = new GeomPrimitiveTorus();
        clone.name = this.name;
        clone.center = this.center.clone();
        clone.axis = this.axis.clone();
        clone.mainRadius = this.mainRadius.clone();
        clone.smallRadius = this.smallRadius.clone();
        clone.isVisible = this.isVisible;
        return clone;
    }

}


class GeomOperation extends GeomBase {

    constructor(name, arg1, arg2) {
        super(name);
        assert(!arg1 || arg1 instanceof GeomBase);
        assert(!arg2 || arg2 instanceof GeomBase);

        this.leftArg = new ShapeConnector(this);
        this.rightArg = new ShapeConnector(this);

        if (arg1) {
            this.leftArg.set(arg1);
        }
        if (arg2) {
            this.rightArg.set(arg2);
        }
    }

}

function t(arg) {
    assert(arg instanceof ShapeConnector, "expecting a ShapeConnector");
    return arg.get() ? arg.get().name : "null";
}

class GeomOperationCut extends GeomOperation {

    constructor(name, arg1, arg2) {
        super(name, arg1, arg2);
    }

    toScript() {
        return "csg.cut(" + t(this.leftArg) + "," + t(this.rightArg) + ");";
    }

    clone() {
        const clone = new GeomOperationCut(this.name);
        clone.leftArg.set(this.leftArg.get());
        clone.rightArg.set(this.rightArg.get());
        clone.isVisible = this.isVisible;
        return clone;
    }
}

class GeomOperationFuse extends GeomOperation {

    constructor(name, arg1, arg2) {
        super(name, arg1, arg2);
    }

    toScript() {
        return "csg.fuse(" + t(this.leftArg) + "," + t(this.rightArg) + ");";
    }

    clone() {
        const clone = new GeomOperationFuse(this.name);
        clone.leftArg.set(this.leftArg.get());
        clone.rightArg.set(this.rightArg.get());
        clone.isVisible = this.isVisible;
        return clone;
    }

}

class GeomOperationCommon extends GeomOperation {
    constructor(name, arg1, arg2) {
        super(name, arg1, arg2);
    }

    toScript() {
        return "csg.common(" + t(this.leftArg) + "," + t(this.rightArg) + ");";
    }

    clone() {
        const clone = new GeomOperationCommon(this.name);
        clone.leftArg.set(this.leftArg.get());
        clone.rightArg.set(this.rightArg.get());
        clone.isVisible = this.isVisible;
        return clone;
    }

}

class GeomTransfo extends GeomBase {

    constructor(name) {
        super(name);
        this.geometry = new ShapeConnector(this);
    }

    setGeometry(geo) {
        assert(geo instanceof GeomBase);
        assert(this.geometry instanceof ShapeConnector);
        this.geometry.set(geo);
    }
}

class GeomTransfoRotate extends GeomTransfo {

    constructor(name) {
        super(name);
        this.center = new ExpressionPoint();
        this.axis = new ExpressionPoint();
        this.angle = new Expression();
    }

    toScript() {
        return t(this.geometry) + ".rotate(" +
            this.center.toScript() + "," +
            this.axis.toScript() + "," +
            this.angle.toScript() + ");";
    }

    clone() {
        const clone = new GeomTransfoRotate();
        clone.name = this.name;
        clone.geometry.set(this.geometry.get());
        clone.center = this.center.clone();
        clone.axis = this.axis.clone();
        clone.angle = this.angle.clone();
        clone.isVisible = this.isVisible;
        return clone;
    }
}

class GeomTransfoBatch extends GeomTransfo {


    // TODO => heritage multiple
    constructor(name) {

        super(name);

        this.transformType = "";
        this.times = new Expression();
        this.times.set(1);

        this.center = new ExpressionPoint();
        this.axis = new ExpressionPoint();
        this.angle = new Expression();

        this.vector = new ExpressionPoint();

    }

    setSelectedTransform(string){
        this.transformType = string;
    }

    toScript() {

        let stringToReturn = "";

        const it = Math.floor(parseFloat(this.times.toScript()));
        if (this.transformType == "Rotate") {

            for (var j = 1; j < it ; j++) {

                stringToReturn = "csg.fuse("+ t(this.geometry) + ".rotate(" +
                    this.center.toScript() + "," +
                    this.axis.toScript() + "," +
                    this.angle.toScript() +" * "+j + ")," + (stringToReturn || t(this.geometry)) + ")";

            }
        }
        else {

            for (var j = 1; j < it; j++) {
                const currentVector = new ExpressionPoint(
                    this.vector.X.toScript() +" * "+j,
                    this.vector.Y.toScript() +" * "+ j,
                    this.vector.Z.toScript() +" * "+ j);
                stringToReturn = "csg.fuse(" + t(this.geometry) + ".translate(" +
                    currentVector.toScript() + "),"+ (stringToReturn || t(this.geometry)) + ")";
            }

        }
        stringToReturn += ";"
        return stringToReturn || "null;" ;
    }

    clone() {
        const clone = new GeomTransfoBatch();
        clone.name = this.name;
        clone.geometry.set(this.geometry.get());

        clone.vector = this.vector.clone();

        clone.center = this.center.clone();
        clone.axis = this.axis.clone();
        clone.angle = this.angle.clone();

        clone.transformType = this.transformType;
        clone.times = this.times;
        clone.isVisible = this.isVisible;

        return clone;
    }
}


class GeomTransfoGrid extends GeomTransfo {

    constructor(name) {
        super(name);
        this.size = new Expression();
        this.height = new Expression();

    }

    toScript() {
        // TODO: prendre la partie entière
        // TODO: boucler sur Size et Height en appelant la primitive translate

        // const scriptToReturn = "";
        //
        // for (var i = 0; i < this.size; i++) {
        //     for (var j = 0; j < this.height; j++) {
        //
        //         scriptToReturn += t(this.geometry) + ".translate([" +
        //             i + "," +
        //             i + "," +
        //             j + "]);";
        //
        //     }
        // }
        const stringToReturn = t(this.geometry) + ".translate([" +
            this.size.toScript() + "," +
            this.size.toScript() + "," +
            this.height.toScript() + "]);";

        return stringToReturn;
    }

    clone() {
        const clone = new GeomTransfoGrid();
        clone.name = this.name;
        clone.geometry.set(this.geometry.get());
        clone.size = this.size.clone();
        clone.height = this.height.clone();
        clone.isVisible = this.isVisible;
        return clone;
    }
}

class GeomTransfoTranslate extends GeomTransfo {

    constructor(name) {
        super(name);
        this.vector = new ExpressionPoint();
    }

    toScript() {
        return t(this.geometry) + ".translate(" +
            this.vector.toScript() + ");";
    }

    clone() {
        const clone = new GeomTransfoTranslate();
        clone.name = this.name;
        clone.geometry.set(this.geometry.get());
        clone.vector = this.vector.clone();
        clone.isVisible = this.isVisible;
        return clone;
    }

}


class GeometryEditor extends WidgetCollection {

    constructor() {
        super();
        this._parameters = [];
    }

    getWidgetBaseClass() {
        return GeomBase;
    }

    _registerShape(shape) {
        assert(shape instanceof GeomBase);
        return this._registerWidget(shape);
    }

    addBox() {
        const shape = new GeomPrimitiveBox(this.__getNextName());
        shape.point2.set(10, 10, 10);
        return this._registerShape(shape);
    }

    addCylinder() {
        const shape = new GeomPrimitiveCylinder(this.__getNextName());
        return this._registerShape(shape);
    }

    addCone() {
        const shape = new GeomPrimitiveCone(this.__getNextName());
        return this._registerShape(shape);
    }

    addSphere() {
        const shape = new GeomPrimitiveSphere(this.__getNextName());
        return this._registerShape(shape);
    }

    addTorus() {
        const shape = new GeomPrimitiveTorus(this.__getNextName());
        return this._registerShape(shape);
    }

    // ---------------------- Operations
    addCutOperation(geometry1, geometry2) {
        const shape = new GeomOperationCut(this.__getNextName(), geometry1, geometry2);
        return this._registerShape(shape);
    }

    addFuseOperation(geometry1, geometry2) {
        const shape = new GeomOperationFuse(this.__getNextName(), geometry1, geometry2);
        return this._registerShape(shape);
    }

    addCommonOperation(geometry1, geometry2) {
        const shape = new GeomOperationCommon(this.__getNextName(), geometry1, geometry2);
        return this._registerShape(shape);
    }

    // ---------------------- Transformation
    addRotation() {
        const shape = new GeomTransfoRotate(this.__getNextName());
        return this._registerShape(shape);
    }

    addTranslation() {
        const shape = new GeomTransfoTranslate(this.__getNextName());
        return this._registerShape(shape);
    }

    addGrid() {
        const shape = new GeomTransfoGrid(this.__getNextName());
        return this._registerShape(shape);
    }

    addBatch() {
        const shape = new GeomTransfoBatch(this.__getNextName());
        return this._registerShape(shape);
    }

    __getNextName() {
        return this.__getNextNameWithPrefix("shape");
    }

    convertToScript() {

        const context = {};

        function convertItemToScript(item) {
            let str = "var " + item.name + " = ";
            str += item.toScript(context);

            if (item.isVisible) {
                str += "\ndisplay(" + item.name + ");";
            }
            return str;
        }

        function convertParameterToScript(param) {
            const value = (param.value === null || param.value === undefined) ? param.defaultValue : param.value;
            return "var $" + param.id + " = " + value + ";";
        }

        let lines = [];
        const parameters = this.getParameters();
        lines = lines.concat(parameters.map(convertParameterToScript));
        lines = lines.concat(this.items.map(convertItemToScript));
        return lines.join("\n");
    }

    /**
     *
     * @param parameters
     * @example:
     *    g.setParameters(   [ {id:"length",value: 10},{ id:"thickness", value: 1}]);
     */
    setParameters(parameters) {
        assert(parameters instanceof Array, "expecting an array here. for instance [{id:1,defaultValue:10}]");
        this._parameters = parameters;
    }

    getParameters() {
        return this._parameters;
    }

    setParameter(param, value) {
        const params = this.getParameters();
        const index = params.findIndex(p => p.id == param);
        if (index < 0) {
            this._parameters.push({id: param, value: value});
            return;
        }
        this._parameters[index].value = value;
    }

    clone() {
        const clone = this.extractSubset(this.items);
        //xx clone._parameters = JSON.parse(JSON.stringify(this._parameters));
        clone._parameters = this._parameters.map(a => Object.assign({}, a));
        return clone;
    }
}

serialijse.declarePersistable(Expression);
serialijse.declarePersistable(ExpressionPoint);

serialijse.declarePersistable(GeometryEditor);
serialijse.declarePersistable(GeomPrimitiveBox);
serialijse.declarePersistable(GeomPrimitiveCylinder);
serialijse.declarePersistable(GeomPrimitiveCone);
serialijse.declarePersistable(GeomPrimitiveSphere);
serialijse.declarePersistable(GeomPrimitiveTorus);

serialijse.declarePersistable(GeomOperationCut);
serialijse.declarePersistable(GeomOperationFuse);
serialijse.declarePersistable(GeomOperationCommon);

serialijse.declarePersistable(GeomTransfoRotate);
serialijse.declarePersistable(GeomTransfoTranslate);
serialijse.declarePersistable(GeomTransfoGrid);
serialijse.declarePersistable(GeomTransfoBatch);
serialijse.declarePersistable(ShapeConnector);

GeometryEditor.serialize = serialijse.serialize;
GeometryEditor.deserialize = serialijse.deserialize;
GeometryEditor.serializeZ = serialijse.serializeZ;
GeometryEditor.deserializeZ = serialijse.deserializeZ;

function convertParameterToScript(param) {
    const value = (param.value === null || param.value === undefined) ? param.defaultValue : param.value;
    return "var $" + param.id + " = " + value + ";";
}

function evaluateExpression(expression, parameters) {
    assert(expression instanceof Expression);
    const str = "(function(){ " + parameters.map(convertParameterToScript).join("\n") + " return " + expression.exp + ";})()";
    try {
        const value = eval(str);
        return value;
    }
    catch (err) {
        console.log(str);
        throw err;
    }
}

function evaluateExpressionPoint(expression, parameters) {
    assert(expression instanceof ExpressionPoint);
    const str = "(function(){ " + parameters.map(convertParameterToScript).join("\n") +
        " return [" +
        expression.X.exp + "," +
        expression.Y.exp + "," +
        expression.Z.exp + "]; \n" +
        "})()";
    try {
        const value = eval(str);
        return value;
    }
    catch (err) {
        console.log(str);
        throw err;
    }
}

module.exports = {

    Expression: Expression,
    ExpressionPoint: ExpressionPoint,

    WidgetBase: WidgetBase,
    WidgetBaseConn: WidgetBaseConn,
    WidgetCollection: WidgetCollection,
    WidgetConnector: WidgetConnector,
    WidgetConnectorList: WidgetConnectorList,

    ShapeConnector: ShapeConnector,

    GeomBase: GeomBase,

    GeometryEditor: GeometryEditor,

    GeomPrimitiveBox: GeomPrimitiveBox,
    GeomPrimitiveCylinder: GeomPrimitiveCylinder,
    GeomPrimitiveCone: GeomPrimitiveCone,
    GeomPrimitiveSphere: GeomPrimitiveSphere,
    GeomPrimitiveTorus: GeomPrimitiveTorus,

    GeomOperationCut: GeomOperationCut,
    GeomOperationFuse: GeomOperationFuse,
    GeomOperationCommon: GeomOperationCommon,

    GeomTransfoRotate: GeomTransfoRotate,
    GeomTransfoTranslate: GeomTransfoTranslate,
    GeomTransfoGrid: GeomTransfoGrid,
    GeomTransfoBatch: GeomTransfoBatch,
    //...

    convertParameterToScript: convertParameterToScript,
    evaluateExpression: evaluateExpression,
    evaluateExpressionPoint: evaluateExpressionPoint,

    serialijse: serialijse,

};





