const assert = require("assert");

const serialijse = require("serialijse");

const _ = require("underscore");

const splitRetain = require('split-retain');

function mergeStr(original, left, right) {

    // csg.fuse                 // transfo. multiple
    // csg.fuse(csg.fuse(       // transfo. multiple ²
    // csg.fuse(csg.cut(        // transfo. multiple * cut
    // csg.fuse(csg.common(     // transfo. multiple * common

    const rule = new RegExp("(csg\\.fuse\\(|csg\\.fuse\\(csg\\.fuse\\(|csg\\.fuse\\(csg\\.cut\\(|csg\\.fuse\\(csg\\.common\\()", "g");

    let originalArray = splitRetain(original, rule);
    let leftArray = splitRetain(left, rule);
    let rightArray = splitRetain(right, rule);

    if (originalArray.length !== leftArray.length || originalArray.length !== rightArray.length) {
        let pattern = new RegExp("\\)\.(.*),csg.fuse\\(", "g");
        const matches = originalArray[1].match(pattern);
        let toBeMatched = matches[0].replace(/\(/g, "\\(")
            .replace(/\)/g, "\\)")
            .replace(/\]/g, "\\]")
            .replace(/\[/g, "\\[")
            .replace(/\./g, "\\.")
            .replace(new RegExp(" \\* " + eval(originalArray.length - 1), "g"), " \\* " + "\\d");

        originalArray = splitRetain(original, new RegExp("(" + toBeMatched + ")", "g"));
        leftArray = splitRetain(left, new RegExp("(" + toBeMatched + ")", "g"));
        rightArray = splitRetain(right, new RegExp("(" + toBeMatched + ")", "g"));
    }

    let builtArray = [];
    for (let i = 0; i < originalArray.length; i++) {

        if (originalArray[i] !== leftArray[i]) {
            builtArray.push(leftArray[i]);
        } else if (originalArray[i] !== rightArray[i]) {
            builtArray.push(rightArray[i]);
        } else {
            builtArray.push(originalArray[i])
        }

    }

    return builtArray.join("");
}

function mergeStrNew(original, left, right) {

    // csg.fuse                 // transfo. multiple
    // csg.fuse(csg.fuse(       // transfo. multiple ²
    // csg.fuse(csg.cut(        // transfo. multiple * cut
    // csg.fuse(csg.common(     // transfo. multiple * common

    const rule = new RegExp("(csg\\.fuse\\(|csg\\.fuse\\(csg\\.fuse\\(|csg\\.fuse\\(csg\\.cut\\(|csg\\.fuse\\(csg\\.common\\()", "g");

    let originalArray = splitRetain(original, rule);
    let leftArray = splitRetain(left, rule);
    let rightArray = splitRetain(right, rule);


    // assert(originalArray.length === leftArray.length, "originalArray && leftArray should be the same length");
    // assert(leftArray.length === rightArray.length, "leftArray && rightArray should be the same length");


    if (originalArray.length !== leftArray.length || originalArray.length !== rightArray.length) {
        let pattern = new RegExp("\\)\.(.*),csg.fuse\\(", "g");
        const matches = originalArray[1].match(pattern);
        let toBeMatched = matches[0].replace(/\(/g, "\\(")
            .replace(/\)/g, "\\)")
            .replace(/\]/g, "\\]")
            .replace(/\[/g, "\\[")
            .replace(/\./g, "\\.")
            .replace(new RegExp(" \\* " + eval(originalArray.length - 1), "g"), " \\* " + "\\d");

        originalArray = splitRetain(original, new RegExp("(" + toBeMatched + ")", "g"));
        leftArray = splitRetain(left, new RegExp("(" + toBeMatched + ")", "g"));
        rightArray = splitRetain(right, new RegExp("(" + toBeMatched + ")", "g"));


    }

    let builtArray = [];

    for (let i = 0; i < originalArray.length; i++) {

        const nearbyTranslationRule = new RegExp("\\.translate\\(\\[-?([$()\\s*a-zA-Z0-9]*),([-?$()\\s*a-zA-Z0-9]*),([-?$()\\s*a-zA-Z0-9]*)\\]\\)\\)\\.translate\\(\\[([-?$()\\s*a-zA-Z0-9]*),([-?$()\\s*a-zA-Z0-9]*),([-?$()\\s*a-zA-Z0-9]*)\\]\\)", "g");

        let resultLeft = nearbyTranslationRule.exec(leftArray[i].match(nearbyTranslationRule));
        let resultRight = nearbyTranslationRule.exec(rightArray[i].match(nearbyTranslationRule));
        let reducedLeft, reducedRight = reducedLeft = false;

        if (!!resultLeft) {
            while (!!resultLeft) {
                leftArray[i] = mergeNearbyTranslation(leftArray[i]);
                resultLeft = nearbyTranslationRule.exec(leftArray[i].match(nearbyTranslationRule));
            }
            reducedLeft = true;
        }
        if (!!resultRight) {
            while (!!resultRight) {
                rightArray[i] = mergeNearbyTranslation(rightArray[i]);
                resultRight = nearbyTranslationRule.exec(rightArray[i].match(nearbyTranslationRule));
            }
            reducedRight = true;
        }


        let splittedOriginalI = [];
        let splittedLeftI = [];
        let splittedRightI = [];

        const splittedTranslate = (splitRetain(originalArray[i], "translate")).length;
        const isTranslate = splittedTranslate !== 1;

        if (!isTranslate) {
            splittedOriginalI = splitRetain(originalArray[i], "rotate");
            splittedLeftI = splitRetain(leftArray[i], "rotate");
            splittedRightI = splitRetain(rightArray[i], "rotate");
        } else {
            splittedOriginalI = splitRetain(originalArray[i], "translate");
            splittedLeftI = splitRetain(leftArray[i], "translate");
            splittedRightI = splitRetain(rightArray[i], "translate");
        }

        if (reducedLeft || reducedRight) {
            builtArray = builtArray.concat(mergeLastFuse(originalArray[i], leftArray[i], rightArray[i]));
        } else {
            for (let k = 0; k < splittedOriginalI.length; k++) {
                if (splittedOriginalI[k] !== splittedLeftI[k]) {
                    builtArray.push(splittedLeftI[k]);
                } else if (splittedOriginalI[k] !== splittedRightI[k]) {
                    builtArray.push(splittedRightI[k]);
                } else {
                    builtArray.push(splittedOriginalI[k])
                }
            }
        }
    }

    return builtArray.join("");
}

function mergeLastFuse(originalValue, leftValue, rightValue) {

    const subRegexp = new RegExp("\\.translate\\(.*\\),");
    let builtArray = [];

    let splitOgl = subRegexp.exec(originalValue.match(subRegexp));
    let subSplitOgl = splitRetain(originalValue, splitOgl[0]);
    let splitLeft = subRegexp.exec(leftValue.match(subRegexp));
    let subSplitLeft = splitRetain(leftValue, splitLeft[0]);
    let splitRight = subRegexp.exec(rightValue.match(subRegexp));
    let subSplitRight = splitRetain(rightValue, splitRight[0]);

    for (let k = 0; k < subSplitOgl.length; k++) {
        if (subSplitOgl[k] !== subSplitLeft[k]) {
            builtArray.push(subSplitLeft[k]);
        } else if (subSplitOgl[k] !== subSplitRight[k]) {
            builtArray.push(subSplitRight[k]);
        } else {
            builtArray.push(subSplitOgl[k]);
        }
    }
    return builtArray.join("");
}

function mergeNearbyTranslation(str) {

    const rule = new RegExp("\\.translate\\(\\[([-?$()\\s*a-zA-Z0-9]*),([-?$()\\s*a-zA-Z0-9]*),([-?$()\\s*a-zA-Z0-9]*)\\]\\)\\)\\.translate\\(\\[([-?$()\\s*a-zA-Z0-9]*),([-?$()\\s*a-zA-Z0-9]*),([-?$()\\s*a-zA-Z0-9]*)\\]\\)", "g");

    const vector0 = [];
    const vector1 = [];

    const result = rule.exec(str.match(rule));
    const matched = result[0];

    vector0.push(result[1]);
    vector0.push(result[2]);
    vector0.push(result[3]);

    vector1.push(result[4]);
    vector1.push(result[5]);
    vector1.push(result[6]);


    const replacementString = ".translate([" +
        vector0[0] + " + " + vector1[0] + ", " +
        vector0[1] + " + " + vector1[1] + ", " +
        vector0[2] + " + " + vector1[2] +
        "]))"

    return str.replace(matched, replacementString)
}

function redefineNestedFuse(str, itNumber, nameOfShape, shapeNewDefinition) {

    if (!shapeNewDefinition || !shapeNewDefinition.name) {
        return;
    }

    assert(shapeNewDefinition.name.indexOf(nameOfShape) > -1, "expecting the name of the newShape ");

    // let strToInsert = shapeNewDefinition.toScript();
    let strToInsert = shapeNewDefinition.toPlainScript();
    const lastChar = strToInsert[strToInsert.length - 1];
    if (strToInsert[0] !== "(" && lastChar === ")") {
        strToInsert = "(" + strToInsert + ")";
    }
    if (lastChar === ";") {
        strToInsert = "(" + strToInsert.substr(0, strToInsert.length - 1) + ")";
    }


    const matchesToNameOfShape = str.match(new RegExp(nameOfShape, "g"));
    if (!matchesToNameOfShape) {
        return str;
    }

    const nbOfOccurences = matchesToNameOfShape.length;

    return str.replace(RegExp("^(?:.*?" + nameOfShape + "){"
        + parseInt(nbOfOccurences - itNumber) + "}"), function (x) {
        return x.replace(RegExp(nameOfShape + "$"), strToInsert)
    });


};

function redefineNestedFuseWith(originalString, arrayOfPositions, arrayOfNames, arrayOfNewInstances) {

    if (arrayOfNames.length === 0 && arrayOfNewInstances.length === 0) {
        return originalString;
    }

    let resultStr = "";
    arrayOfNames.forEach(name => {
        arrayOfNames[name] = 0;
    });

    if (arrayOfPositions.length === 1) {
        arrayOfPositions.forEach((pos, idx) => {
            resultStr = redefineNestedFuse(
                originalString,
                pos,
                arrayOfNames[idx],
                arrayOfNewInstances[idx]);
        });
    } else {

        let newStr = originalString;
        resultStr = originalString;

        arrayOfPositions.forEach((pos, idx) => {
            newStr = redefineNestedFuse(
                originalString,
                pos,
                arrayOfNames[idx],
                arrayOfNewInstances[idx]);
            resultStr = mergeStr(originalString, resultStr, newStr)
        });

    }

    return resultStr;

};


function redefineNestedFuseNew(str, itNumber, nameOfShape, shapeNewDefinition) {

    if (!shapeNewDefinition || !shapeNewDefinition.name) {
        return;
    }

    assert(shapeNewDefinition.name.indexOf(nameOfShape) > -1, "expecting the name of the newShape ");

    // let strToInsert = shapeNewDefinition.toScript();
    let strToInsert = shapeNewDefinition.toPlainScript(true);
    const lastChar = strToInsert[strToInsert.length - 1];
    if (strToInsert[0] !== "(" && lastChar === ")") {
        strToInsert = "(" + strToInsert + ")";
    }
    if (lastChar === ";") {
        strToInsert = "(" + strToInsert.substr(0, strToInsert.length - 1) + ")";
    }


    const matchesToNameOfShape = str.match(new RegExp(nameOfShape, "g"));
    if (!matchesToNameOfShape) {
        return str;
    }

    const nbOfOccurences = matchesToNameOfShape.length;

    return str.replace(RegExp("^(?:.*?" + nameOfShape + "){"
        + parseInt(nbOfOccurences - itNumber) + "}"), function (x) {
        return x.replace(RegExp(nameOfShape + "$"), strToInsert)
    });


};

function redefineNestedFuseNewWith(originalString, arrayOfPositions, arrayOfNames, arrayOfNewInstances) {

    if (arrayOfNames.length === 0 && arrayOfNewInstances.length === 0) {
        return originalString;
    }

    let resultStr = "";
    arrayOfNames.forEach(name => {
        arrayOfNames[name] = 0;
    });

    if (arrayOfPositions.length === 1) {
        arrayOfPositions.forEach((pos, idx) => {
            resultStr = redefineNestedFuseNew(
                originalString,
                pos,
                arrayOfNames[idx],
                arrayOfNewInstances[idx]);
        });
    } else {

        let newStr = originalString;
        resultStr = originalString;

        arrayOfPositions.forEach((pos, idx) => {

            newStr = redefineNestedFuseNew(
                originalString,
                pos,
                arrayOfNames[idx],
                arrayOfNewInstances[idx]);

            resultStr = mergeStrNew(originalString, resultStr, newStr);
        });

    }

    return resultStr;

};


const WidgetConnector = require("./widget_connector").WidgetConnector;
const WidgetBase = require("./widget_base").WidgetBase;
const WidgetCollection = require("./widget_collection").WidgetCollection;
const WidgetBaseConn = require("./widget_base_conn").WidgetBaseConn;
const WidgetConnectorList = require("./widget_connector_list").WidgetConnectorList;


const Expression = require("./expressions").Expression;
const ExpressionPoint = require("./expressions").ExpressionPoint;
const ExpressionForCutPrimitives = require("./expressions").ExpressionForCutPrimitives;


class ConnectorForCutPrimitives {
    constructor() {
        this.connectorArg = {geom: null};
    }

    set(geom) {
        this.connectorArg.geom = geom;
    }

    get() {
        return this.connectorArg.geom;
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

        this.origin = {
            libGUID: "",
            libName: "",
            geometryName: ""
        };

        this.isVisible = true;
        this.filletMode = false;
        this.filletFactor = 1;

        this.innerTranslation = {
            vector: new ExpressionPoint()
        };

        this.isMeasurementsActive = false;

        this.innerRotation = {
            center: new ExpressionPoint(),
            axis: new ExpressionPoint(),
            angle: new Expression()
        };

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

    breakDependancyItem() {

    }

    checkValidity(errorList, geometriesNames) {
        errorList = errorList || [];

        if (geometriesNames.indexOf(this.name) !== -1) {
            errorList.push("Erreur: Le nom " + this.name + " est déjà pris dans les géométries, renommez svp");
        }
        return errorList.length === 0;
    }

    toggleMeasurements() {
        this.isMeasurementsActive = !this.isMeasurementsActive;
    }

    setCommonProperties(self) {

        this.name = self.name;

        this.isVisible = self.isVisible;
        this.filletFactor = self.filletFactor;
        this.filletMode = self.filletMode;

        this.innerTranslation.vector = self.innerTranslation.vector.clone();

        this.innerRotation.center = self.innerRotation.center.clone();
        this.innerRotation.axis = self.innerRotation.axis.clone();
        this.innerRotation.angle = self.innerRotation.angle.clone();

    }

    innerTransformationsString(isNested = false) {

        const isThereAnyTranslation = (
            this.innerTranslation.vector.X.exp !== "0"
            || this.innerTranslation.vector.Y.exp !== "0"
            || this.innerTranslation.vector.Z.exp !== "0"
        );

        const isThereAnyRotation = this.innerRotation.angle.exp !== "0";

        let script = "";
        // apply Rot+Trans
        if (isThereAnyTranslation && isThereAnyRotation) {
            script = ".rotate(" +
                this.innerRotation.center.toScript() + "," +
                this.innerRotation.axis.toScript() + "," +
                this.innerRotation.angle.toScript()
                + ")"
                + ".translate("
                + this.innerTranslation.vector.toScript()
                + ")";
        }
        // Only Trans
        else if (isThereAnyTranslation) {
            script = ".translate("
                + this.innerTranslation.vector.toScript()
                + ")";
        }
        // Only Rot
        else if (isThereAnyRotation) {
            script = ".rotate(" +
                this.innerRotation.center.toScript() + "," +
                this.innerRotation.axis.toScript() + "," +
                this.innerRotation.angle.toScript()
                + ")";
        }

        if (isNested === true) {
            return script;
        } else {
            return script + ";";
        }

    }

    toPlainScript(isNested = false) {
        return this.toScript(isNested);
    }

}

future_GeomBase = GeomBase;

class GeomPrimitive extends GeomBase {


}

class GeomPrimitiveObject extends GeomPrimitive {

    constructor(name) {
        super(name);
        this.geometries = []; // GeomPrimitives
        this.parameters = []; // GeomParameters
    }


    getName() {
        return this.geometries.length > 0 ? this.geometries[0].name : null;
        // return this.geometries.map(x => x.name).join("U");
    }

    getLibGUID() {
        return this.geometries[0].geometriesLibGUID;
    }

    toScript(isNested) {
        // return csg.makeCylinder;// this.geometries.map(x => x.toScript()).join("\n");

        let stringToReturn = (this.geometries.length > 0) ? this.geometries[0].toScript().slice(0, -1) : "null";

        // for (var j = 1; j < this.parameters.length; j++) {
        //
        // }

        for (var j = 1; j < this.geometries.length; j++) {

            stringToReturn = "csg.fuse(" + this.geometries[j].toScript().slice(0, -1) + "," + stringToReturn + ")";

        }
        return stringToReturn + this.innerTransformationsString(isNested);

    }

    clone() {

        const clone = new GeomPrimitiveObject();
        clone.setCommonProperties(this);

        clone.geometries = this.geometries;
        clone.origin = this.origin;
        clone.parameters = this.parameters;

        return clone;

    }

}

class GeomPrimitiveBox extends GeomPrimitive {

    constructor(name) {
        super(name);
        this.point1 = new ExpressionPoint();
        this.point2 = new ExpressionPoint();
    }

    toScript(isNested) {
        return "csg.makeBox("
            + this.point1.toScript() + ","
            + this.point2.toScript() + ")"
            + this.innerTransformationsString(isNested);
    }

    clone() {

        const clone = new GeomPrimitiveBox();
        clone.setCommonProperties(this);

        clone.point1 = this.point1.clone();
        clone.point2 = this.point2.clone();

        // si issue d'une redéfinition de transformation
        if (!!this.geometry) {
            clone.geometry = this.geometry;
        }

        return clone;
    }
}

class GeomPrimitiveStep extends GeomPrimitive {

    constructor(name) {
        super(name);
        this.pathToSTEPFile = "";
    }

    toScript(isNested) {
        return "csg.makeStep(\"" + this.pathToSTEPFile + "\")"
            + this.innerTransformationsString(isNested);
    }

    clone() {

        const clone = new GeomPrimitiveStep();
        clone.setCommonProperties(this);

        clone.pathToSTEPFile = this.pathToSTEPFile;

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

    toScript(isNested) {
        return "csg.makeCylinder("
            + this.point1.toScript() + ","
            + this.point2.toScript() + ","
            + this.radius.toScript() + ")"
            + this.innerTransformationsString(isNested);
    }

    getHeight() {

        const longX = "((" + this.point1.X.exp + ") - (" + this.point2.X.exp + "))";
        const longX2 = longX + "*" + longX;
        const longY = "((" + this.point1.Y.exp + ") - (" + this.point2.Y.exp + "))";
        const longY2 = longY + "*" + longY;
        const longZ = "((" + this.point1.Z.exp + ") - (" + this.point2.Z.exp + "))";
        const longZ2 = longZ + "*" + longZ;
        return "Math.sqrt(" + longX2 + "+" + longY2 + "+" + longZ2 + ")";
    }

    clone() {

        const clone = new GeomPrimitiveCylinder();
        clone.setCommonProperties(this);

        clone.point1 = this.point1.clone();
        clone.point2 = this.point2.clone();
        clone.radius = this.radius.clone();

        // si issue d'une redéfinition de transformation
        if (!!this.geometry) {
            clone.geometry = this.geometry;
        }
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

    toScript(isNested) {
        return "csg.makeCone("
            + this.point1.toScript() + ","
            + this.radius1.toScript() + ","
            + this.point2.toScript() + ","
            + this.radius2.toScript() + ")"
            + this.innerTransformationsString(isNested);
    }


    getHeight() {
        const longX = "((" + this.point1.X.exp + ") - (" + this.point2.X.exp + "))";
        const longX2 = longX + "*" + longX;
        const longY = "((" + this.point1.Y.exp + ") - (" + this.point2.Y.exp + "))";
        const longY2 = longY + "*" + longY;
        const longZ = "((" + this.point1.Z.exp + ") - (" + this.point2.Z.exp + "))";
        const longZ2 = longZ + "*" + longZ;
        return "Math.sqrt(" + longX2 + "+" + longY2 + "+" + longZ2 + ")";
    }

    clone() {

        const clone = new GeomPrimitiveCone();
        clone.setCommonProperties(this);

        clone.point1 = this.point1.clone();
        clone.radius1 = this.radius1.clone();
        clone.point2 = this.point2.clone();
        clone.radius2 = this.radius2.clone();

        // si issue d'une redéfinition de transformation
        if (!!this.geometry) {
            clone.geometry = this.geometry;
        }

        return clone;
    }
}

class GeomPrimitiveSphere extends GeomPrimitive {

    constructor(name) {
        super(name);
        this.center = new ExpressionPoint();
        this.radius = new Expression();
    }

    toScript(isNested) {
        return "csg.makeSphere("
            + this.center.toScript() + ","
            + this.radius.toScript() + ")"
            + this.innerTransformationsString(isNested);
    }

    clone() {

        const clone = new GeomPrimitiveSphere();
        clone.setCommonProperties(this);

        clone.center = this.center.clone();
        clone.radius = this.radius.clone();

        // si issue d'une redéfinition de transformation
        if (!!this.geometry) {
            clone.geometry = this.geometry;
        }

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

    toScript(isNested) {
        return "csg.makeTorus("
            + this.center.toScript() + ","
            + this.axis.toScript() + ","
            + this.mainRadius.toScript() + ","
            + this.smallRadius.toScript() + ")"
            + this.innerTransformationsString(isNested);
    }

    clone() {

        const clone = new GeomPrimitiveTorus();
        clone.setCommonProperties(this);

        clone.center = this.center.clone();
        clone.axis = this.axis.clone();
        clone.mainRadius = this.mainRadius.clone();
        clone.smallRadius = this.smallRadius.clone();

        // si issue d'une redéfinition de transformation
        if (!!this.geometry) {
            clone.geometry = this.geometry;
        }

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

    // Simple geoemtries
    if (arg.get() && !arg.get().geometries) {
        return arg.get().name;
    }

    // CompoundObject
    if (arg.get() && arg.get().geometries) {
        return arg.get().getName();
    }

    return "null";
}

class GeomOperationCut extends GeomOperation {

    constructor(name, arg1, arg2) {
        super(name, arg1, arg2);
    }


    toScript() {
        return "csg.cut(" + t(this.leftArg) + "," + t(this.rightArg) + ")"
            + this.innerTransformationsString();
    }

    toPlainScript(isNested = false) {

        if (!this.leftArg.get() || !this.rightArg.get()) {
            return "";
        }

        return "csg.cut(" + this.leftArg.get().toPlainScript(true) + ","
            + this.rightArg.get().toPlainScript(true) + ")"
            + this.innerTransformationsString(isNested);
    }

    clone() {

        const clone = new GeomOperationCut(this.name);
        clone.setCommonProperties(this);

        clone.leftArg.set(this.leftArg.get());
        clone.rightArg.set(this.rightArg.get());

        // si issue d'une redéfinition de transformation
        if (!!this.geometry) {
            clone.geometry = this.geometry;
        }

        return clone;
    }
}

class GeomOperationCutPrimitive extends GeomBase {

    constructor(name, arg1, arg2) {
        super(name, arg1, arg2);

        assert(!arg1 || arg1 instanceof GeomBase);
        assert(!arg2 || arg2 instanceof GeomBase);

        const self = this;


        // No WidgetConnector (since not an item from Geometry Editor) -> ConnectorForCutPrimitives
        this.leftArg = new ConnectorForCutPrimitives();
        this.leftArg.set(arg1);

        this.rightArg = new ConnectorForCutPrimitives();
        this.rightArg.set(arg2);


        this.thickness = new ExpressionForCutPrimitives(null, this);

        this.thickness.set(0);

    }

    overridExpSet(expArg) {

        const self = this;
        const cloned = expArg.clone();

        return new ExpressionForCutPrimitives("" + expArg.exp, self);

    }

    //interface
    refreshRightArg() {
        throw new Error("refreshRightArg unimplemented");
    }


    toScript() {
        return "csg.cut(" + this.leftArg.get().toScript(true) + "," + this.rightArg.get().toScript(true) + ")"
            + this.innerTransformationsString();
    }

    toPlainScript(isNested = false) {

        if (!this.leftArg.get() || !this.rightArg.get()) {
            return "";
        }

        return "csg.cut(" + this.leftArg.get().toPlainScript(true) + ","
            + this.rightArg.get().toPlainScript(true) + ")"
            + this.innerTransformationsString(isNested);
    }


    clone(clonedPrimitive) {

        clonedPrimitive.setCommonProperties(this);

        clonedPrimitive.leftArg.set(this.leftArg.get());
        clonedPrimitive.rightArg.set(this.rightArg.get());
        clonedPrimitive.thickness.set(this.thickness.exp);

        return clonedPrimitive;
    }
}

class GeomOperationCutBox extends GeomOperationCutPrimitive {

    constructor(name) {

        super(name, new GeomPrimitiveBox(), new GeomPrimitiveBox());

        // Override setter to trigger reresh on rgithArg depending on thickness value
        this.leftArg.get().point1.X = this.overridExpSet(this.leftArg.get().point1.X);
        this.leftArg.get().point1.Y = this.overridExpSet(this.leftArg.get().point1.Y);
        this.leftArg.get().point1.Z = this.overridExpSet(this.leftArg.get().point1.Z);

        this.leftArg.get().point2.X = this.overridExpSet(this.leftArg.get().point2.X);
        this.leftArg.get().point2.Y = this.overridExpSet(this.leftArg.get().point2.Y);
        this.leftArg.get().point2.Z = this.overridExpSet(this.leftArg.get().point2.Z);
    }


    refreshRightArg() {

        this.rightArg.get().point1.X.set(this.leftArg.get().point1.X.exp + "+" + this.thickness.exp);
        this.rightArg.get().point1.Y.set(this.leftArg.get().point1.Y.exp + "+" + this.thickness.exp);
        this.rightArg.get().point1.Z.set(this.leftArg.get().point1.Z.exp + "+" + this.thickness.exp);


        this.rightArg.get().point2.X.set(this.leftArg.get().point2.X.exp + "-" + this.thickness.exp);
        this.rightArg.get().point2.Y.set(this.leftArg.get().point2.Y.exp + "-" + this.thickness.exp);
        this.rightArg.get().point2.Z.set(this.leftArg.get().point2.Z.exp + "-" + this.thickness.exp);

    }


    clone() {
        return super.clone(new GeomOperationCutBox(this.name));
    }
}

class GeomOperationCutCylinder extends GeomOperationCutPrimitive {

    constructor(name) {

        super(name, new GeomPrimitiveCylinder(), new GeomPrimitiveCylinder());

        const self = this;


        // Override setter to trigger reresh on rgithArg depending on thickness value
        this.leftArg.get().point1.X = this.overridExpSet(this.leftArg.get().point1.X);
        this.leftArg.get().point1.Y = this.overridExpSet(this.leftArg.get().point1.Y);
        this.leftArg.get().point1.Z = this.overridExpSet(this.leftArg.get().point1.Z);

        this.leftArg.get().point2.X = this.overridExpSet(this.leftArg.get().point2.X);
        this.leftArg.get().point2.Y = this.overridExpSet(this.leftArg.get().point2.Y);
        this.leftArg.get().point2.Z = this.overridExpSet(this.leftArg.get().point2.Z);

        this.leftArg.get().radius = this.overridExpSet(this.leftArg.get().radius);


    }

    refreshRightArg() {

        if (this.leftArg.get().point1.X.exp === this.leftArg.get().point2.X.exp) {
            this.rightArg.get().point1.X.set(this.leftArg.get().point1.X.exp);
            this.rightArg.get().point2.X.set(this.leftArg.get().point2.X.exp);
        } else {
            this.rightArg.get().point1.X.set(this.leftArg.get().point1.X.exp + "+" + this.thickness.exp);
            this.rightArg.get().point2.X.set(this.leftArg.get().point2.X.exp + "-" + this.thickness.exp);
        }
        if (this.leftArg.get().point1.Y.exp === this.leftArg.get().point2.Y.exp) {
            this.rightArg.get().point1.Y.set(this.leftArg.get().point1.Y.exp);
            this.rightArg.get().point2.Y.set(this.leftArg.get().point2.Y.exp);
        } else {
            this.rightArg.get().point1.Y.set(this.leftArg.get().point1.Y.exp + "+" + this.thickness.exp);
            this.rightArg.get().point2.Y.set(this.leftArg.get().point2.Y.exp + "-" + this.thickness.exp);
        }
        if (this.leftArg.get().point1.Z.exp === this.leftArg.get().point2.Z.exp) {
            this.rightArg.get().point1.Z.set(this.leftArg.get().point1.Z.exp);
            this.rightArg.get().point2.Z.set(this.leftArg.get().point2.Z.exp);
        } else {
            this.rightArg.get().point1.Z.set(this.leftArg.get().point1.Z.exp + "+" + this.thickness.exp);
            this.rightArg.get().point2.Z.set(this.leftArg.get().point2.Z.exp + "-" + this.thickness.exp);
        }


        this.rightArg.get().radius.set(this.leftArg.get().radius.exp + "-" + this.thickness.exp);


    }

    clone() {
        return super.clone(new GeomOperationCutCylinder(this.name));
    }
}

class GeomOperationCutCone extends GeomOperationCutPrimitive {

    constructor(name) {

        super(name, new GeomPrimitiveCone(), new GeomPrimitiveCone());

        const self = this;


        // Override setter to trigger reresh on rgithArg depending on thickness value
        this.leftArg.get().point1.X = this.overridExpSet(this.leftArg.get().point1.X);
        this.leftArg.get().point1.Y = this.overridExpSet(this.leftArg.get().point1.Y);
        this.leftArg.get().point1.Z = this.overridExpSet(this.leftArg.get().point1.Z);

        this.leftArg.get().point2.X = this.overridExpSet(this.leftArg.get().point2.X);
        this.leftArg.get().point2.Y = this.overridExpSet(this.leftArg.get().point2.Y);
        this.leftArg.get().point2.Z = this.overridExpSet(this.leftArg.get().point2.Z);

        this.leftArg.get().radius1 = this.overridExpSet(this.leftArg.get().radius1);
        this.leftArg.get().radius2 = this.overridExpSet(this.leftArg.get().radius2);


    }

    refreshRightArg() {
        //TODO fix from here
        if (this.leftArg.get().point1.X.exp === this.leftArg.get().point2.X.exp) {
            this.rightArg.get().point1.X.set(this.leftArg.get().point1.X.exp);
            this.rightArg.get().point2.X.set(this.leftArg.get().point2.X.exp);
        } else {
            this.rightArg.get().point1.X.set(this.leftArg.get().point1.X.exp + "+" + this.thickness.exp);
            this.rightArg.get().point2.X.set(this.leftArg.get().point2.X.exp + "-" + this.thickness.exp);
        }
        if (this.leftArg.get().point1.Y.exp === this.leftArg.get().point2.Y.exp) {
            this.rightArg.get().point1.Y.set(this.leftArg.get().point1.Y.exp);
            this.rightArg.get().point2.Y.set(this.leftArg.get().point2.Y.exp);
        } else {
            this.rightArg.get().point1.Y.set(this.leftArg.get().point1.Y.exp + "+" + this.thickness.exp);
            this.rightArg.get().point2.Y.set(this.leftArg.get().point2.Y.exp + "-" + this.thickness.exp);
        }
        if (this.leftArg.get().point1.Z.exp === this.leftArg.get().point2.Z.exp) {
            this.rightArg.get().point1.Z.set(this.leftArg.get().point1.Z.exp);
            this.rightArg.get().point2.Z.set(this.leftArg.get().point2.Z.exp);
        } else {
            this.rightArg.get().point1.Z.set(this.leftArg.get().point1.Z.exp + "+" + this.thickness.exp);
            this.rightArg.get().point2.Z.set(this.leftArg.get().point2.Z.exp + "-" + this.thickness.exp);
        }

        const ratio = this.rightArg.get().getHeight() + "/" + this.leftArg.get().getHeight();

        this.rightArg.get().radius1.set(this.leftArg.get().radius1.exp + "*" + ratio);
        this.rightArg.get().radius2.set(this.leftArg.get().radius2.exp + "*" + ratio);


    }


    clone() {
        return super.clone(new GeomOperationCutCone(this.name));
    }
}

class GeomOperationCutTorus extends GeomOperationCutPrimitive {

    constructor(name) {

        super(name, new GeomPrimitiveTorus(), new GeomPrimitiveTorus());

        const self = this;


        // Override setter to trigger reresh on rgithArg depending on thickness value
        this.leftArg.get().center.X = this.overridExpSet(this.leftArg.get().center.X);
        this.leftArg.get().center.Y = this.overridExpSet(this.leftArg.get().center.Y);
        this.leftArg.get().center.Z = this.overridExpSet(this.leftArg.get().center.Z);


        this.leftArg.get().mainRadius = this.overridExpSet(this.leftArg.get().mainRadius);
        this.leftArg.get().smallRadius = this.overridExpSet(this.leftArg.get().smallRadius);


    }

    refreshRightArg() {

        this.rightArg.get().center.X.set(this.leftArg.get().center.X.exp);
        this.rightArg.get().center.Y.set(this.leftArg.get().center.Y.exp);
        this.rightArg.get().center.Z.set(this.leftArg.get().center.Z.exp);

        this.rightArg.get().axis.X.set(this.leftArg.get().axis.X.exp);
        this.rightArg.get().axis.Y.set(this.leftArg.get().axis.Y.exp);
        this.rightArg.get().axis.Z.set(this.leftArg.get().axis.Z.exp);

        this.rightArg.get().mainRadius.set(this.leftArg.get().mainRadius.exp);
        this.rightArg.get().smallRadius.set(this.leftArg.get().smallRadius.exp + "-" + this.thickness.exp);

    }

    clone() {
        return super.clone(new GeomOperationCutTorus(this.name));
    }
}

class GeomOperationCutSphere extends GeomOperationCutPrimitive {

    constructor(name) {

        super(name, new GeomPrimitiveSphere(), new GeomPrimitiveSphere());

        const self = this;


        // Override setter to trigger reresh on rgithArg depending on thickness value
        this.leftArg.get().radius = this.overridExpSet(this.leftArg.get().radius);
        this.leftArg.get().center.X = this.overridExpSet(this.leftArg.get().center.X);
        this.leftArg.get().center.Y = this.overridExpSet(this.leftArg.get().center.Y);
        this.leftArg.get().center.Z = this.overridExpSet(this.leftArg.get().center.Z);

    }

    refreshRightArg() {


        this.rightArg.get().center.X.set(this.leftArg.get().center.X.exp);
        this.rightArg.get().center.Y.set(this.leftArg.get().center.Y.exp);
        this.rightArg.get().center.Z.set(this.leftArg.get().center.Z.exp);

        this.rightArg.get().radius.set(this.leftArg.get().radius.exp + "-" + this.thickness.exp);

    }

    clone() {
        return super.clone(new GeomOperationCutSphere(this.name));
    }
}


class GeomOperationFuse extends GeomOperation {

    constructor(name, arg1, arg2) {
        super(name, arg1, arg2);
    }

    toScript() {
        return "csg.fuse(" + t(this.leftArg) + "," + t(this.rightArg) + ")"
            + this.innerTransformationsString();
    }

    toPlainScript(isNested = false) {

        // const isNested = true;

        if (!this.leftArg.get() || !this.rightArg.get()) {
            return "";
        }

        return "csg.fuse(" + this.leftArg.get().toPlainScript(true) + ","
            + this.rightArg.get().toPlainScript(true) + ")"
            + this.innerTransformationsString(isNested);
    }

    clone() {

        const clone = new GeomOperationFuse(this.name);
        clone.setCommonProperties(this);

        clone.leftArg.set(this.leftArg.get());
        clone.rightArg.set(this.rightArg.get());

        // si issue d'une redéfinition de transformation
        if (!!this.geometry) {
            clone.geometry = this.geometry;
        }

        return clone;
    }

}

class GeomOperationCommon extends GeomOperation {
    constructor(name, arg1, arg2) {
        super(name, arg1, arg2);
    }

    toScript(isNested) {
        return "csg.common(" + t(this.leftArg) + "," + t(this.rightArg) + ")"
            + this.innerTransformationsString(isNested);
    }

    toPlainScript(isNested = true) {


        if (!this.leftArg.get() || !this.rightArg.get()) {
            return "";
        }

        return "csg.common(" + this.leftArg.get().toPlainScript(true) + "," + this.rightArg.get().toPlainScript(true) + ")"
            + this.innerTransformationsString(isNested);
    }

    clone() {

        const clone = new GeomOperationCommon(this.name);
        clone.setCommonProperties(this);

        clone.leftArg.set(this.leftArg.get());
        clone.rightArg.set(this.rightArg.get());

        // si issue d'une redéfinition de transformation
        if (!!this.geometry) {
            clone.geometry = this.geometry;
        }

        return clone;
    }

}

class GeomTransfo extends GeomBase {

    constructor(name) {

        super(name);
        this.geometry = new ShapeConnector(this);

        this.isThereSomeRedefinitions = false;
        this.redefinedObjects = [];
        this.redefinedGeomInstance = null;

    }

    setGeometry(geo) {
        assert(geo instanceof GeomBase);
        assert(this.geometry instanceof ShapeConnector);
        this.geometry.set(geo);
    }
}


class GeomTransfoTranslate extends GeomTransfo {

    constructor(name) {
        super(name);
        this.vector = new ExpressionPoint();
        this.batchItems = [];
        this.times = new Expression();
        this.times.set(1);
    }

    toScript(isNested = false) {

        const it = Math.floor(parseFloat(this.times.toScript()));
        if (this.batchItems.length == 0 && it == 1) {
            return t(this.geometry) + ".translate(" +
                this.vector.toScript() + ");";
        } else {


            let res = [];
            this.batchItems.forEach(l => {
                l.vector = this.vector;

                let stringToReturn = "";
                if (it > 1) {
                    stringToReturn = batchTranslateOn(stringToReturn, l.vector, l.geometry, it);
                    res.push(stringToReturn)
                } else {
                    res.push(
                        t(l.geometry) + ".translate(" +
                        l.vector.toScript() + ")"
                    )
                }
            });

            // let strRes = "";
            // for (var i = 0; i < res.length; i++) {
            //     strRes += "var " + this.batchItems[i].name + "_plus_" + i + " = " + res[i] + "\n";
            //
            // }


            // let str = "var " + item.name + " = ";
            // str += item.toScript(context);
            //
            // if (item.isVisible) {
            //     str += "\ndisplay(" + item.name + ");";
            // }
            // return str;


            let res2 = "";
            if (it > 1) {
                res2 = batchTranslateOn(res2, this.vector, this.geometry, it);
            } else {
                res2 = t(this.geometry) + ".translate(" +
                    this.vector.toScript() + ")";
            }

            for (var i = 0; i < res.length; i++) {
                res2 = "csg.fuse(" + res[i] + ", " + res2 + ")";

            }


            // Override return string in case of redefinitions
            if (this.isThereSomeRedefinitions) {

                const copyOfStr = res2;

                const redefinitionIts = this.redefinedObjects.map(w => w.redefinitionIt).filter(u => !!u || u === 0);
                const newDefinitions = this.redefinedObjects.map(w => w.redefinedGeomInstance).filter(u => !!u);
                const namesOfRedefinedShapes = this.redefinedObjects.map(w => w.namesOfRedefinedShape).filter(u => !!u);


                res2 = redefineNestedFuseNewWith(copyOfStr,
                    redefinitionIts,
                    namesOfRedefinedShapes,
                    newDefinitions);

            }

            if (isNested === true) {
                return res2;
            } else {
                return res2 + ";";
            }

        }
    }


    shallowClone() {

        const clone = new GeomTransfoTranslate();

        clone.setCommonProperties(this);

        clone.geometry.set(this.geometry.get());
        clone.vector = this.vector.clone();
        clone.batchItems = this.batchItems;

        clone.times = this.times.clone();

        // redefinitions
        clone.isThereSomeRedefinitions = this.isThereSomeRedefinitions || false;
        clone.redefinedGeomInstance = !!this.redefinedGeomInstance ? this.redefinedGeomInstance.clone() : null;
        clone.namesOfRedefinedShape = this.namesOfRedefinedShape;
        clone.redefinitionIt = this.redefinitionIt;


        return clone;

    }

    clone() {

        const clone = this.shallowClone();

        // clone.redefinedObjects = this.redefinedObjects || [];
        clone.redefinedObjects = this.redefinedObjects.map(function (u) {
            const cloned = u.shallowClone();
            cloned.redefinedObjects = clone.redefinedObjects;
            // cloned.namesOfRedefinedShape = clone.namesOfRedefinedShape;
            return cloned;
        }) || [];

        return clone;

    }

}

class GeomTransfoRotate extends GeomTransfo {

    constructor(name) {
        super(name);
        this.center = new ExpressionPoint();
        this.axis = new ExpressionPoint();
        this.angle = new Expression();
        this.batchItems = [];
        this.times = new Expression();
        this.times.set(1);
    }

    toScript() {
        const it = Math.floor(parseFloat(this.times.toScript()));
        if (this.batchItems.length == 0 && it == 1) {
            return t(this.geometry) + ".rotate(" +
                this.center.toScript() + "," +
                this.axis.toScript() + "," +
                this.angle.toScript() + ");";
        } else {

            let res = [];
            this.batchItems.forEach(l => {

                l.center = this.center;
                l.axis = this.axis;
                l.angle = this.angle;

                let stringToReturn = "";
                if (it > 1) {
                    stringToReturn = batchRotateOn(stringToReturn, l.center, l.axis, l.angle, l.geometry, it);
                    res.push(stringToReturn);
                } else {
                    res.push(
                        t(l.geometry) + ".rotate(" +
                        l.center.toScript() + "," +
                        l.axis.toScript() + "," +
                        l.angle.toScript() + ")"
                    )
                }

            });


            let res2 = "";
            if (it > 1) {
                res2 = batchRotateOn(res2, this.center, this.axis, this.angle, this.geometry, it);
            } else {
                res2 = t(this.geometry) + ".rotate(" +
                    this.center.toScript() + "," +
                    this.axis.toScript() + "," +
                    this.angle.toScript() + ")"
            }

            for (var i = 0; i < res.length; i++) {
                res2 = "csg.fuse(" + res[i] + ", " + res2 + ")";
            }

            // Override return string in case of redefinitions
            if (this.isThereSomeRedefinitions) {

                const copyOfStr = res2;

                const redefinitionIts = this.redefinedObjects.map(w => w.redefinitionIt).filter(u => !!u || u === 0);
                const newDefinitions = this.redefinedObjects.map(w => w.redefinedGeomInstance).filter(u => !!u);
                const namesOfRedefinedShapes = this.redefinedObjects.map(w => w.namesOfRedefinedShape).filter(u => !!u);

                res2 = redefineNestedFuseWith(copyOfStr,
                    redefinitionIts,
                    namesOfRedefinedShapes,
                    newDefinitions);

            }


            return res2;
        }

    }

    shallowClone() {

        const clone = new GeomTransfoRotate();

        clone.setCommonProperties(this);

        clone.geometry.set(this.geometry.get());
        clone.batchItems = this.batchItems;

        clone.center = this.center.clone();
        clone.axis = this.axis.clone();
        clone.angle = this.angle.clone();

        clone.batchItems = this.batchItems;
        clone.times = this.times.clone();
        
		// redefinitions
        clone.isThereSomeRedefinitions = this.isThereSomeRedefinitions || false;
        clone.redefinedGeomInstance = !!this.redefinedGeomInstance ? this.redefinedGeomInstance.clone() : null;
        clone.namesOfRedefinedShape = this.namesOfRedefinedShape;
        clone.redefinitionIt = this.redefinitionIt;

        return clone;

    }

    clone() {

        const clone = this.shallowClone();

        // clone.redefinedObjects = this.redefinedObjects || [];
        clone.redefinedObjects = this.redefinedObjects.map(function (u) {
            const cloned = u.shallowClone();
            cloned.redefinedObjects = clone.redefinedObjects;
            // cloned.namesOfRedefinedShape = clone.namesOfRedefinedShape;
            return cloned;
        }) || [];

        return clone;

    }
}


function batchRotateOn(stringToReturn, center, axis, angle, geometry, it) {
    const name = (geometry.name) ? (geometry.name) : (t(geometry));
    for (var j = 2; j < it + 1; j++) {

        stringToReturn = "csg.fuse(" + name + ".rotate(" +
            center.toScript() + "," +
            axis.toScript() + "," +
            "(" + angle.toScript() + ") * " + j + ")," + (stringToReturn || name + ".rotate(" + center.toScript() + "," + axis.toScript() + "," + angle.toScript() + ")") + ")";

    }
    return stringToReturn;

}

function batchTranslateOn(stringToReturn, vector, geometry, it) {

    const name = (geometry.name) ? (geometry.name) : (t(geometry));
    for (var j = 2; j < it + 1; j++) {
        const currentVector = new ExpressionPoint(
            "(" + vector.X.toScript() + ") * " + j,
            "(" + vector.Y.toScript() + ") * " + j,
            "(" + vector.Z.toScript() + ") * " + j);
        stringToReturn = "csg.fuse(" + name + ".translate(" +
            currentVector.toScript() + ")," + (stringToReturn || name + ".translate([" + vector.X.toScript() + "," + vector.Y.toScript() + "," + vector.Z.toScript() + "])") + ")";
    }
    return stringToReturn;

}

class GeomTransfoBatch extends GeomTransfo {


    constructor(name) {

        super(name);

        // this.redefinitionIts = [];
        // this.namesOfRedefinedShapes = [];
        // this.newDefinitions = [];

        this.transformType = "Translate";
        this.times = new Expression();
        this.times.set(2);

        this.unlinked = false;

        this.unlinkedTimes = new Expression();
        this.unlinkedTimes.set(2);

        this.center = new ExpressionPoint();
        this.axis = new ExpressionPoint();
        this.angle = new Expression();

        this.vector = new ExpressionPoint();

        this.additionalSource = null;
        this.additionalSourceName = "";

    }

    setSelectedTransform(string) {
        this.transformType = string;
    }

    toScript() {

        let stringToReturn = "";

        let it;
        if (!this.unlinked) {
            it = Math.floor(parseFloat(this.times.toScript()));
        } else {
            it = Math.floor(parseFloat(this.unlinkedTimes.toScript()));
        }
        if (this.transformType == "Rotate") {
            stringToReturn = batchRotateOn(stringToReturn, this.center, this.axis, this.angle, this.geometry, it);
            // if (this.additionalSourceName !== '') {
            //     stringToReturn = batchRotateOn(stringToReturn, this.center, this.axis, this.angle, this.additionalSource, it);
            // }
        } else {
            stringToReturn = batchTranslateOn(stringToReturn, this.vector, this.geometry, it);
            // if (this.additionalSourceName !== '') {
            //     stringToReturn = batchTranslateOn(stringToReturn, this.vector, this.additionalSource, it);
            // }
        }

        if (this.isThereSomeRedefinitions) {

            const copyOfStr = stringToReturn;

            this.redefinitionIts.forEach((redefinitionIt, idx) => {

                redefineNestedFuse(copyOfStr,
                    stringToReturn,
                    redefinitionIt,
                    this.namesOfRedefinedShapes[idx],
                    this.newDefinitions[idx]);

            });

        }


        stringToReturn += ";"
        return stringToReturn || "null;";
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
        clone.times = this.times.clone();

        clone.redefinitionIts = this.redefinitionIts || [];
        clone.namesOfRedefine = this.namesOfRedefine || [];
        // clone.newDefinitions = this.newDefinitions || [];
        clone.redefinedGeomInstance = this.redefinedGeomInstance || null;

        return clone;
    }
}


class GeomTransfoClone extends GeomTransfo {

    constructor(name) {
        super(name);
        this.batchItems = [];
        this.vector = new ExpressionPoint();
    }

    toScript() {

        if (this.vector.X.exp === this.vector.Y.exp === this.vector.Z.exp === "0") {
            return t(this.geometry) + ".clone()"
                + this.innerTransformationsString();
        }

        return t(this.geometry) + ".clone().translate(" +
            this.vector.toScript() + ")"
            + this.innerTransformationsString();

    }

    toPlainScript(isNested = false) {

        if (this.vector.X.exp === this.vector.Y.exp === this.vector.Z.exp === "0") {
            return t(this.geometry) + ".clone()"
                + this.innerTransformationsString(isNested);
        }

        return t(this.geometry) + ".clone().translate(" +
            this.vector.toScript() + ")"
            + this.innerTransformationsString(isNested);

    }

    clone() {

        const clone = new GeomTransfoClone();
        clone.setCommonProperties(this);

        clone.batchItems = this.batchItems;
        clone.geometry.set(this.geometry.get());
        clone.vector = this.vector.clone();

        return clone;

    }

}


class GeometryEditor extends WidgetCollection {

    constructor(options) {
        super();
    }

    getWidgetBaseClass() {
        return GeomBase;
    }

    getPersistedObjects() {
        let a = [];
        this.items.map(x => {
            if (!!x.geometries) {
                a.push(x);
            }
        });

        return a;
    }

    _registerShape(shape) {
        assert(shape instanceof GeomBase);
        return this._registerWidget(shape);
    }

    addObject() {
        const shape = new GeomPrimitiveObject(this.__getNextName());
        // shape.geometries = [];
        return this._registerShape(shape);
    }

    // addObjectTrunk() {
    //     const shape = new GeomPrimitiveObject(this.__getNextName());
    //     // shape.geometries = [];
    //     return this._registerShape(shape);
    // }

    addBox() {
        const shape = new GeomPrimitiveBox(this.__getNextName());
        shape.point2.set(10, 10, 10);
        return this._registerShape(shape);
    }

    addCutBox() {
        const shape = new GeomOperationCutBox(this.__getNextName());
        return this._registerShape(shape);
    }

    addCutSphere() {
        const shape = new GeomOperationCutSphere(this.__getNextName());
        return this._registerShape(shape);
    }

    addCutCone() {
        const shape = new GeomOperationCutCone(this.__getNextName());
        return this._registerShape(shape);
    }

    addCutCylinder() {
        const shape = new GeomOperationCutCylinder(this.__getNextName());
        return this._registerShape(shape);
    }

    addCutTorus() {
        const shape = new GeomOperationCutTorus(this.__getNextName());
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

    addStep() {
        const shape = new GeomPrimitiveStep(this.__getNextName());
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

    addClone() {
        const shape = new GeomTransfoClone(this.__getNextName());
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

            // TODO: add getEdges to have fillet
            // str += item.name + " = csg.makeFillet(" + item.name + "," + item.name + ".getEdges(),2);\n";
            // str += item.name + " = csg.makeFillet(" + item.name + "," + item.name + ".getCommonEdges(" + item.name +".faces.front, "+ item.name +".faces.left),2);\n";
            // solid.getCommonEdges(solid.faces.front, solid.faces.left);

            if (item.isVisible) {
                if (!item.filletMode) {
                    str += "\ndisplay(" + item.name + ");";
                } else {
                    str += "    displayFillet(" + item.name + ",\"" + item._id + "\"," + item.filletFactor + ");\n";
                }
            }
            return str;
        }

        function convertParameterToScript(param) {
            const value = (param.value === null || param.value === undefined) ? param.defaultValue : param.value;
            if (isNaN(value) && typeof value === "string") {
                return "var $" + param.id + " = '" + value + "';";
            }
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
        // _parameters on a Geometry (Geometry to display)
        // parametersEditor on a GeometryObject (shared Geometry in a Library)
        let parameters;
        if (this.parametersEditor) {
            return this._parameters || this.parametersEditor.items;
        }
        return this._parameters || [];
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
        clone.items.forEach(i => {

            // Si Géométrie composite en tant qu'objet et sans lien persistant
            if (!!i.geometries && i.origin.libGUID == "") {
                const found = this.items.filter(w => w.$$hashKey == i.$$hashKey)[0];
                if (!!found && typeof found.geometries === 'Array' && found.geometries.length > 0) {
                    i.parameters = found.geometries[0].parameters
                }
                if (i.geometries.length > 0 && i.geometries[0].parameters) {
                    i.parameters = i.geometries[0].parameters;
                }
            }


            // TBD: Si géométrie composite importée en tant qu'objet avec lien persistant
            // origin.libGUID = originalItem.geometriesLibGUID;
            // i.origin = originalItem.origin;
            // Utilisation de origin.libGUID dans le geometryEditor pour reconstruire la géométrie avec lien persistant
            else if (!!i.geometries && i.origin.libGUID != "") {


            }
            // Si Géométrie composite importée en avec toutes les sous géométries visibles dans l'étude
            else {
                const originalItem = this.items.filter(w => {
                    return w.name == i.name
                })[0];

                i.origin = originalItem.origin;

                if (!!originalItem && originalItem.parameters) {
                    originalItem.parameters.forEach(p => {
                        if (p.id.indexOf(originalItem.origin.geometryName) == -1 && p.id.indexOf(originalItem.origin.libName) == -1) {
                            p.id = p.id + "_" + originalItem.origin.geometryName + "_" + originalItem.origin.libName;
                            p.name = p.name + "_" + originalItem.origin.geometryName + "_" + originalItem.origin.libName;
                        }
                    });
                    this.items.forEach(a => {
                        i.parameters = i.parameters || [];
                        i.parameters = i.parameters.concat(originalItem.parameters);
                        a.parameters = a.parameters || [];
                        i.parameters = [].concat(i.parameters, a.parameters);
                        i.parameters = _.uniq(i.parameters, function (w) {
                            if (w) {
                                return w.name
                            }
                            return false;
                        });
                    });
                }
            }
        });

        return clone;
    }

    overrideGeomObjectParameters() {

        const items = this.items;
        items.forEach(item => {

            if (item instanceof GeomPrimitiveObject) {
                item.parameters.forEach(p => {
                    p.id = p.id + "_" + item.getName() + "_" + item.getLibGUID();
                    p.name = p.name + "_" + item.getName() + "_" + item.getLibGUID();
                    p.displayName = p.displayName + "_" + item.getName() + "_" + item.getLibGUID();
                });
            }
            // else
            // {
            //     item.parameters.forEach(p => {
            //         p.id = p.id + "_" + item.name;
            //         p.name = p.name + "_" + item.name;
            //         p.displayName = p.displayName + item.name;
            //     });
            // }

        });

    }

    findIdenticalTansformedGeoms(linkedGeom) {

        const items = this.items;

        const returnedArray = [];
        items.forEach(u => {

            if (!u.geometry) {
                return;
            }

            const nameOfLinkedGeom = linkedGeom.geometry.get().name;
            const nameOfInitialGeom = u.geometry.get().name;
            const nameOfParentLinkedGeom = linkedGeom.geometry._parent.name;
            const nameOfParentGeom = u.geometry._parent.name;

            if (u.constructor.name === linkedGeom.constructor.name
                && nameOfLinkedGeom === nameOfInitialGeom
                && nameOfParentGeom === nameOfParentLinkedGeom
                && nameOfParentGeom !== u.name) {
                returnedArray.push(u);
            }

        });

        return returnedArray;

    }

    getCommonAncestors(leftGeometry, rightGeometry) {

        let leftParentOrSelf = [leftGeometry.name];
        let rightParentOrSelf = [rightGeometry.name];

        while (leftGeometry instanceof GeomTransfo) {
            leftGeometry = leftGeometry.geometry._linked;
            leftParentOrSelf.push(leftGeometry.name);
        }

        while (rightGeometry instanceof GeomTransfo) {
            rightGeometry = rightGeometry.geometry._linked;
            rightParentOrSelf.push(rightGeometry.name);
        }

        return rightParentOrSelf.filter(right => leftParentOrSelf.indexOf(right) !== -1);

    }

    /**
     * @param linkedGeom : the geom which we look for identical ones
     * @returns {[]}
     */
    findIdenticalTansformedGeomsOnGeomEditor(linkedGeom) {

        assert(linkedGeom instanceof GeomTransfo, "linkedGeom should be a GeomTransfo");

        const items = this.items;

        const returnedArray = [];
        items.forEach(u => {

            if (!u.geometry) {
                return;
            }

            if (!linkedGeom._parent && !u.geometry._parent) {
                return;
            }

            let uParentOrSelf = [u.name];
            let linkedGeomParentOrSelf = [linkedGeom.name];
            let iterU = u;
            while (iterU instanceof GeomTransfo) {
                iterU = iterU.geometry._linked;
                uParentOrSelf.push(iterU.name);
            }
            while (linkedGeom instanceof GeomTransfo) {
                linkedGeom = linkedGeom.geometry._linked;
                linkedGeomParentOrSelf.push(linkedGeom.name);
            }
            const commonAncestors = this.getCommonAncestors(u, linkedGeom);
            if (commonAncestors.length > 0 && u.times.exp == 1) {
                returnedArray.push(u);
            }

        });

        return returnedArray;

    }
}


serialijse.declarePersistable(Expression);
serialijse.declarePersistable(ExpressionPoint);
serialijse.declarePersistable(ExpressionForCutPrimitives);

serialijse.declarePersistable(GeometryEditor);
serialijse.declarePersistable(GeomPrimitiveObject);
serialijse.declarePersistable(GeomPrimitiveBox);
serialijse.declarePersistable(GeomPrimitiveCylinder);
serialijse.declarePersistable(GeomPrimitiveCone);
serialijse.declarePersistable(GeomPrimitiveSphere);
serialijse.declarePersistable(GeomPrimitiveTorus);
serialijse.declarePersistable(GeomPrimitiveStep);

serialijse.declarePersistable(GeomOperationCutBox);
serialijse.declarePersistable(GeomOperationCutCylinder);
serialijse.declarePersistable(GeomOperationCutCone);
serialijse.declarePersistable(GeomOperationCutSphere);
serialijse.declarePersistable(GeomOperationCutTorus);

serialijse.declarePersistable(GeomOperationCut);
serialijse.declarePersistable(GeomOperationCutPrimitive);
serialijse.declarePersistable(GeomOperationFuse);
serialijse.declarePersistable(GeomOperationCommon);

serialijse.declarePersistable(GeomTransfoRotate);
serialijse.declarePersistable(GeomTransfoTranslate);
serialijse.declarePersistable(GeomTransfoClone);

serialijse.declarePersistable(GeomTransfoBatch);
serialijse.declarePersistable(ShapeConnector);
serialijse.declarePersistable(ConnectorForCutPrimitives);

GeometryEditor.serialize = serialijse.serialize;
GeometryEditor.deserialize = serialijse.deserialize;
GeometryEditor.serializeZ = serialijse.serializeZ;
GeometryEditor.deserializeZ = serialijse.deserializeZ;


function convertParameterToScript(param) {
    const value = (param.value === null || param.value === undefined) ? param.defaultValue : param.value;
    if (isNaN(value) && typeof value === "string") {
        return "var $" + param.id + " = '" + value + "';";
    }
    return "var $" + param.id + " = " + value + ";";
}

function evaluateExpression(expression, parameters) {
    if (!expression) return;
    assert(expression instanceof Expression);
    assert(_.isArray(parameters), "you should provide an array of params please");
    const str = "(function(){ " + parameters.map(convertParameterToScript).join("\n") + " return " + expression.exp + ";})()";
    try {
        const value = eval(str);
        return value;
    } catch (err) {
        console.log(str);
        throw err;
    }
}

function evaluateExpressionPoint(expression, parameters) {
    assert(expression instanceof ExpressionPoint);
    assert(_.isArray(parameters), "you should provide an array of params please");
    const str = "(function(){ " + parameters.map(convertParameterToScript).join("\n") +
        " return [" +
        expression.X.exp + "," +
        expression.Y.exp + "," +
        expression.Z.exp + "]; \n" +
        "})()";
    try {
        const value = eval(str);
        return value;
    } catch (err) {
        console.log(str);
        throw err;
    }
}

module.exports = {

    Expression: Expression,
    ExpressionPoint: ExpressionPoint,
    ExpressionForCutPrimitives: ExpressionForCutPrimitives,

    WidgetBase: WidgetBase,
    WidgetBaseConn: WidgetBaseConn,
    WidgetCollection: WidgetCollection,
    WidgetConnector: WidgetConnector,
    WidgetConnectorList: WidgetConnectorList,

    ShapeConnector: ShapeConnector,

    GeomBase: GeomBase,

    GeometryEditor: GeometryEditor,

    GeomPrimitive: GeomPrimitive,
    GeomPrimitiveObject: GeomPrimitiveObject,
    GeomPrimitiveBox: GeomPrimitiveBox,
    GeomPrimitiveCylinder: GeomPrimitiveCylinder,
    GeomPrimitiveCone: GeomPrimitiveCone,
    GeomPrimitiveSphere: GeomPrimitiveSphere,
    GeomPrimitiveTorus: GeomPrimitiveTorus,
    GeomPrimitiveStep: GeomPrimitiveStep,

    GeomOperationCutBox: GeomOperationCutBox,
    GeomOperationCutCylinder: GeomOperationCutCylinder,
    GeomOperationCutCone: GeomOperationCutCone,
    GeomOperationCutSphere: GeomOperationCutSphere,
    GeomOperationCutTorus: GeomOperationCutTorus,

    GeomOperationCut: GeomOperationCut,
    GeomOperationCutPrimitive: GeomOperationCutPrimitive,
    GeomOperationFuse: GeomOperationFuse,
    GeomOperationCommon: GeomOperationCommon,

    GeomTransfo: GeomTransfo,
    GeomTransfoRotate: GeomTransfoRotate,
    GeomTransfoTranslate: GeomTransfoTranslate,
    GeomTransfoClone: GeomTransfoClone,
    GeomTransfoBatch: GeomTransfoBatch,
    //...

    convertParameterToScript: convertParameterToScript,
    evaluateExpression: evaluateExpression,
    evaluateExpressionPoint: evaluateExpressionPoint,

    mergeStr,
    mergeStrNew,
    mergeNearbyTranslation,
    redefineNestedFuseWith,
    redefineNestedFuse,
    redefineNestedFuseNew,
    redefineNestedFuseNewWith,

    serialijse: serialijse,

};
