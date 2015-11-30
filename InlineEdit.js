/**
 * React Inline Edit Component
 * @author: Vasanth Krishnamoorthy
 *
 * Recreated Ben McMahen's react-wysiwyg + Customizations
 */

/**
 * Module Dependencies
 */
var React = require('react');
var ReactDOM = require('react-dom');
var classNames = require('classnames'); // conditionally joins classNames together

var isNotServer = typeof window !== 'undefined';

var selectionRange;
if (isNotServer) {
  selectionRange = require('selection-range');    // get or set the selection range, or cursor position, for 'contenteditable'
}

/**
 * Make an InlineEdit component
 */

var propTypes = {
  autoFocus: React.PropTypes.bool,
  editing: React.PropTypes.bool,
  maxLength: React.PropTypes.number,
  onBlur: React.PropTypes.func,
  onChange: React.PropTypes.func.isRequired,
  onEnterKey: React.PropTypes.func,
  onEscapeKey: React.PropTypes.func,
  placeholder: React.PropTypes.string,
  tagName: React.PropTypes.string,
  text: React.PropTypes.string.isRequired
};

var InlineEdit = React.createClass({
  displayName: 'InlineEdit',
  propTypes: propTypes,

  // Default props
  getDefaultProps: function () {
    return {
      text: ''
    };
  },

  // Initial state
  getInitialState: function () {
    return {};
  },

  componentDidMount: function () {
    if (this.props.editing && this.props.autoFocus) {
      this.autofocus();
    }
  },

  componentDidUpdate: function (prevProps) {
    var element = ReactDOM.findDOMNode(this);
    if (element === document.activeElement) {
      if (!prevProps.editing && this.props.editing && this.props.autoFocus) {
        this.autofocus();
      }

      // Makes sure the cursor position is at the right position on keyUp
      if (this.state && this.state.range) {
        selectionRange(ReactDOM.findDOMNode(this), this.state.range);
      }
    }
  },

  autofocus: function () {
    ReactDOM.findDOMNode(this).focus();
    if (this.props.text.length) {
      this.setCursorToStart();
    }
  },

  render: function () {
    var editing = this.props.editing;
    var className = this.props.className;
    var tagName = this.props.tagName || 'div';  // default tag is 'div'
    var content;

    // setup classes
    var classes = {
      'react-inline-edit': true,
      'is-empty': (!this.props.text.trim().length || (this.props.text === this.props.placeholder))
    };

    // Add in custom classes to the classes array.
    if (className) {
      classes[className] = true;
    }

    // Set content
    if (!this.props.text.trim().length && editing) { // if empty, set placeholder text
      content = this.props.placeholder;
    } else if (!this.props.text.trim().length) {  // if non-editable and empty just add in a <br/>
      content = React.createElement('br');
    } else {
      content = this.props.text;
    }

    // pass along html attributes
    var props = {};
    var componentProps = Object.keys(propTypes);
    Object.keys(this.props)
      .filter(function (key) {
        return componentProps.indexOf(key) < 0 })
      .forEach(function (key) {
        props[key] = this.props[key]; }, this);


    props.tabIndex = this.props.autoFocus ? -1 : 0;
    props.className = classNames(classes);
    props.contentEditable = editing;
    props.onKeyDown = this.onKeyDown;
    props.onPaste = this.onPaste;
    props.onMouseDown = this.onMouseDown;
    props.onTouchStart = this.onMouseDown;
    props.onFocus = this.onFocus;
    props.onBlur = this.onBlur;
    props.onKeyPress = this.onKeyPress;
    props.onInput = this.onInput;
    props.onKeyUp = this.onKeyUp;

    // return element
    return React.createElement(tagName, props, content);
  },

  setPlaceholder: function (text) {
    if (!text.trim().length && this.props.placeholder) {
      ReactDOM.findDOMNode(this).textContent = this.props.placeholder;
      this.setCursorToStart();
    }
  },

  unsetPlaceholder: function () {
    ReactDOM.findDOMNode(this).textContent = '';
  },

  setCursorToStart: function (atStart) {
    ReactDOM.findDOMNode(this).focus();
    if (!isNotServer) {
      return;
    }

    if (typeof window.getSelection !== 'undefined'
      && typeof document.createRange !== 'undefined') {
      // Note: Range and Selection Web APIs have limited Browser support as of now (5/15)
      var sel = window.getSelection();
      var range = document.createRange(); // The Range interface represents a fragment of a document that can contain nodes and parts of text nodes.
      range.selectNodeContents(ReactDOM.findDOMNode(this));
      range.collapse(atStart);  // true collapses the Range to its start, false to its end
      sel.removeAllRanges();  // Removes all ranges from the selection
      sel.addRange(range);  // Adds a Range to a Selection
    } else if (typeof document.body.createTextRange !== 'undefined') {
      var textRange = document.body.createTextRange();
      textRange.moveToElementText(ReactDOM.findDOMNode(this));
      textRange.collapse(atStart);
      textRange.select();
    }
  },

  // Event handlers
  onMouseDown: function (e) {
    if (this.props.text.length) {
      return;
    }
    // if we have a placeholder, set the cursor to the start
    this.setCursorToStart(true);
    e.preventDefault();
  },

  onFocus: function (e) {
    if (this.props.text.length && (this.props.text !== this.props.placeholder)) {
      this.setCursorToStart(false); // Handles scnarios where you Tab or Shift+Tab to a field.
      return;
    }
    // if we have a placeholder, set the cursor to the start
    this.setCursorToStart(true);
    e.preventDefault();
  },

  onBlur: function() {
    if (this.props.onBlur) {
      this.props.onBlur();
    }
  },

  onKeyDown: function (e) {
    var self = this;

    function prev() {
      e.preventDefault();
      e.stopPropagation();
      self._stop = true;
    }

    var keyCode = e.keyCode;

    // Disables 'Bold'ing and 'Italic'izing text using keyboard on 'contenteditable' field
    if (e.metaKey) {
      // ⌘ 'b' or ⌘'i' in Mac for bold/italic
      if (keyCode === 66 || keyCode === 73) {
        return prev();
      }
    }

    if (!this.props.text.trim().length) { // If no text
      switch (keyCode) {
        case 46:     // 'Delete' key
        case 8:      // 'Backspace' key
        case 39:     // 'Arrow right' key
        case 37:     // 'Arrow left' key
        case 40:     // 'Arrow left' key
        case 38:     // 'Arrow left' key
          prev();
          break;

        case 9:      // 'Tab' key
          break;

        default:
          this.unsetPlaceholder();
          break;
      }
    } else {
      // If there is text filled in.
      switch (keyCode) {
        case 13:
          // 'Enter' key
          prev();
          if (this.props.onEnterKey) {
            this.props.onEnterKey();
            e.target.blur();  // On enter - blur the current element
          }
          break;

        case 27:
          // 'Escape' key
          prev();
          if (this.props.onEscapeKey) {
            this.props.onEscapeKey();
          }
          break;

        default:
          // If placeholder text present - Remove it on keydown.
          if (this.props.text === this.props.placeholder) {
            this.unsetPlaceholder();
          }
          break;
      }
    }
  },

  onPaste: function (e) {
    // Paste handler ensures that we unset our placeholder
    e.preventDefault();

    // unset placeholder
    if (!this.props.text.length) {
      this.unsetPlaceholder();
    }

    var data = e.clipboardData.getData('text/plain');

    // restrict text pasted to our specified maxlength
    if (this.props.maxLength) {
      data = data.slice(0, this.props.maxLength);
    }
    this.setText(data);
  },

  onKeyPress: function (e) {
    var val = e.target.textContent;

    // max-length validation on the fly
    if (this.props.maxLength && (val.length > this.props.maxLength)) {
      e.preventDefault();
      e.stopPropagation();
    }
  },

  onKeyUp: function (e) {
    if (e.keyCode === 9) {  // 'Tab' key
      this._stop = true;
    }
    
    var stop = this._stop;
    this._stop = false;

    // hack to support IE, which doesn't support 'input' event on contenteditable.
    // TODO: Check if there is a better way to handle this
    if (!stop && !this._ignoreKeyup) {
      this.setText(e.target.textContent);
    }

    this.setPlaceholder(e.target.textContent);
  },

  onInput: function (e) {
    this._ignoreKeyup = true;
    this.setText(e.target.textContent);
  },

  setText: function (val) {
    var range = selectionRange(ReactDOM.findDOMNode(this));
    this.setState({range: range});
    this.props.onChange(val);
  }
});

module.exports = InlineEdit;
