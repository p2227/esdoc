import AbstractDoc from './AbstractDoc.js';
import ParamParser from '../Parser/ParamParser.js';
import babelGenerator from 'babel-generator';

/**
 * Doc Class from Method Definition AST node.
 */
export default class MethodDoc extends AbstractDoc {
  /**
   * apply own tag.
   * @private
   */
  _apply() {
    super._apply();

    delete this._value.export;
    delete this._value.importPath;
    delete this._value.importStyle;
  }

  /** use kind property of self node. */
  ['@_kind']() {
    AbstractDoc.prototype['@_kind'].call(this);
    if (this._value.kind) return;
    this._value.kind = this._node.kind;
  }

  /** take out self name from self node */
  ['@_name']() {
    AbstractDoc.prototype['@_name'].call(this);
    if (this._value.name) return;

    if (this._node.computed) {
      const expression = babelGenerator(this._node.key).code;
      this._value.name = `[${expression}]`;
    } else {
      this._value.name = this._node.key.name;
    }
  }

  /** take out memberof from parent class node */
  ['@_memberof']() {
    AbstractDoc.prototype['@_memberof'].call(this);
    if (this._value.memberof) return;

    let memberof;
    let parent = this._node.parent;
    while (parent) {
      if (parent.type === 'ClassDeclaration' || parent.type === 'ClassExpression') {
        memberof = `${this._pathResolver.filePath}~${parent.doc.value.name}`;
        this._value.memberof = memberof;
        return;
      }
      parent = parent.parent;
    }
  }

  /** if @param is not exists, guess type of param by using self node. but ``get`` and ``set`` are not guessed. */
  ['@param']() {
    super['@param']();
    if (this._value.params) return;

    if (['set', 'get'].includes(this._value.kind)) return;

    this._value.params = ParamParser.guessParams(this._node.params);
  }

  /** if @type is not exists, guess type by using self node. only ``get`` and ``set`` are guess. */
  ['@type']() {
    super['@type']();
    if (this._value.type) return;

    switch (this._value.kind) {
      case 'set':
        this._value.type = ParamParser.guessType(this._node.right);
        break;
      case 'get':
        let result = ParamParser.guessReturnParam(this._node.body);
        if (result) this._value.type = result;
        break;
    }
  }

  /** if @return is not exists, guess type of return by usigin self node. but ``constructor``, ``get`` and ``set``are not guessed. */
  ['@return']() {
    super['@return']();
    if (this._value.return) return;

    if (['constructor', 'set', 'get'].includes(this._value.kind)) return;

    let result = ParamParser.guessReturnParam(this._node.body);
    if (result) {
      this._value.return = result;
    }
  }

  /** use generator property of self node. */
  ['@_generator']() {
    super['@_generator']();
    if ('generator' in this._value) return;

    this._value.generator = this._node.generator;
  }
}
