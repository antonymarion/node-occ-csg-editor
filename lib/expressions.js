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

class ExpressionForCutPrimitives extends Expression {

    constructor(exp, parent) {
        super(exp);
        this.parent = parent;
    }

    set(exp) {
        super.set(exp);
        this.parent.refreshRightArg();
    }

}


module.exports = {
    Expression: Expression,
    ExpressionPoint: ExpressionPoint,
    ExpressionForCutPrimitives: ExpressionForCutPrimitives
}
