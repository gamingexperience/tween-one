import React, { PropTypes, Component, createElement } from 'react';
import TweenOne from './TweenOne';
import {
  dataToArray,
  toArrayChildren,
  getChildrenFromProps,
  mergeChildren,
  transformArguments,
  findChildInChildrenByKey,
} from './util';

function noop() {
}

class TweenOneGroup extends Component {
  constructor() {
    super(...arguments);
    this.keysToEnter = [];
    this.keysToLeave = [];
    this.onEnterBool = false;
    this.enterAnimEnd = false;
    // 第一进入，appear 为 true 时默认用 enter 或 tween-one 上的效果
    const children = toArrayChildren(getChildrenFromProps(this.props));
    children.forEach(child => {
      if (!child || !child.key) {
        return;
      }
      this.keysToEnter.push(child.key);
    });
    this.originalChildren = children;
    this.state = {
      children,
    };
    [
      'getChildrenToRender',
      'getCoverAnimation',
      'onChange',
    ].forEach((method) => this[method] = this[method].bind(this));
  }

  componentDidMount() {
    this.onEnterBool = true;
  }

  componentWillReceiveProps(nextProps) {
    const nextChildren = toArrayChildren(nextProps.children);
    const currentChildren = this.originalChildren;
    const newChildren = mergeChildren(currentChildren, nextChildren);

    this.keysToEnter = [];
    this.keysToLeave = [];
    nextChildren.forEach((c) => {
      if (!c) {
        return;
      }
      const key = c.key;
      const hasPrev = findChildInChildrenByKey(currentChildren, key);
      if (!hasPrev && key) {
        this.keysToEnter.push(key);
      }
    });

    currentChildren.forEach((c) => {
      if (!c) {
        return;
      }
      const key = c.key;
      const hasNext = findChildInChildrenByKey(nextChildren, key);
      if (!hasNext && key) {
        this.keysToLeave.push(key);
      }
    });
    if (this.keysToEnter.length || this.keysToLeave.length) {
      this.enterAnimEnd = false;
    }
    this.setState({
      children: newChildren,
    });
  }

  componentDidUpdate() {
    this.originalChildren = toArrayChildren(getChildrenFromProps(this.props));
  }

  onChange(animation, key, type, obj) {
    const length = dataToArray(animation).length;
    if (obj.index === length - 1 && obj.mode === 'onComplete') {
      let children;
      if (type === 'enter') {
        children = this.state.children;
        this.enterAnimEnd = true;
      } else {
        children = this.state.children.filter(child => key !== child.key);
      }
      this.setState({
        children,
      });
      const _obj = { key, type };
      this.props.onEnd(_obj);
    }
  }

  getCoverAnimation(child, i, type) {
    let animation;
    let onChange;
    let className = child.props.className || '';
    if (type) {
      animation = type === 'leave' ? this.props.leave : this.props.enter;
      onChange = this.onChange.bind(this, animation, child.key, type);
      if (!this.enterAnimEnd) {
        className = `${className} ${type === 'leave' ?
          this.props.animatingClassName[1] : this.props.animatingClassName[0]}`.trim();
      }
    }
    return (<TweenOne
      {...child.props}
      key={child.key}
      component={child.type}
      animation={transformArguments(animation, child.key, i)}
      onChange={onChange}
      className={className}
    />);
  }

  getChildrenToRender(children) {
    return children.map((child, i) => {
      if (!child || !child.key) {
        return child;
      }
      const key = child.key;
      if (this.keysToLeave.indexOf(key) >= 0) {
        return this.getCoverAnimation(child, i, 'leave');
      }
      const appear = transformArguments(this.props.appear, key, i);
      if (this.keysToEnter.indexOf(key) >= 0) {
        if (appear || this.onEnterBool) {
          return this.getCoverAnimation(child, i, 'enter');
        }
      }
      return this.getCoverAnimation(child, i);
    });
  }

  render() {
    const childrenToRender = this.getChildrenToRender(this.state.children);
    return createElement(this.props.component, this.props, childrenToRender);
  }
}

const objectOrArray = PropTypes.oneOfType([PropTypes.object, PropTypes.array]);
const objectOrArrayOrFunc = PropTypes.oneOfType([objectOrArray, PropTypes.func]);

TweenOneGroup.propTypes = {
  component: PropTypes.any,
  children: PropTypes.any,
  style: PropTypes.object,
  appear: PropTypes.bool,
  enter: objectOrArrayOrFunc,
  leave: objectOrArrayOrFunc,
  animatingClassName: PropTypes.array,
  onEnd: PropTypes.func,
};

TweenOneGroup.defaultProps = {
  component: 'div',
  appear: true,
  animatingClassName: ['tween-one-entering', 'tween-one-leaving'],
  enter: { x: 50, opacity: 0, type: 'from' },
  leave: { x: -50, opacity: 0 },
  onEnd: noop,
};
export default TweenOneGroup;
