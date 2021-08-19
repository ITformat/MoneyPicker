/* ========================================
   MoneyPicker v1.0.0
   http://www.format.it/
   Copyright (c) 2021 Format s.r.l.
   Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   
   Requires: moneypicker.css
             jquery 1.3.x, 
             bootstrap 3.x
   ======================================== */

if (typeof jQuery === 'undefined') { throw new Error('MoneyPicker\'s JavaScript requires jQuery') }

+function ($) {
  "use strict";

  // Const
  var separators = {
    dot: '.',
    comma: ','
  }

  // MoneyPicker PUBLIC CLASS DEFINITION
  var MoneyPicker = function (name, element, options) {

    this.name = name;
    this.element = element;
    this.$element = $(element);

    var iconBasePath = this.path() + "img/";
    this.options = $.extend({ iconBasePath: iconBasePath }, MoneyPicker.DEFAULTS, options, this.$element.data());

    this.enabled = true;
    this.init();
  };

  MoneyPicker.DEFAULTS = {

    min  : 0,
    max  : 999999,

    sign: false,
    currency: ' \u20AC',
    setClass: true,

    func : { sign: false, reset: true },
    bills : [100, 50, 10, 5],
    coins: [2, 1, 0.5, 0.1, 0.05, 0.01],

    placement: 'bottom',
    placementTooltip: 'top',

    tooltip: '<span>change amount</span>',

    icons: {
      sign : { img: 'plusminus.gif', desc: 'Change sign' },
      reset: { img: 'clear.gif',     desc: 'Reset amount' },
       0.01: { img: 'cent1.gif',     desc: 'Add 1 cent' },
       0.02: { img: 'cent2.gif',     desc: 'Addd 2 cents' },
       0.05: { img: 'cent5.gif',     desc: 'Add 5 cents' },
        0.1: { img: 'cent10.gif',    desc: 'Add 10 cents' },
        0.2: { img: 'cent20.gif',    desc: 'Add 20 cents' },
        0.5: { img: 'cent50.gif',    desc: 'Add 50 cents' },
          1: { img: 'euro1.gif',     desc: 'Add 1 euro' },
          2: { img: 'euro2.gif',     desc: 'Add 2 euro' },
          5: { img: 'euro5.gif',     desc: 'Add 5 euro' },
         10: { img: 'euro10.gif',    desc: 'Add 10 euro' },
         20: { img: 'euro20.gif',    desc: 'Add 20 euro' },
         50: { img: 'euro50.gif',    desc: 'Add 50 euro' },
        100: { img: 'euro100.gif',   desc: 'Add 100 euro' },
        200: { img: 'euro200.gif',   desc: 'Add 200 euro' },
        500: { img: 'euro500.gif',   desc: 'Add 500 euro' }
    },

    message: {
      min: 'Minimum amount allowed',
      max: 'Maximum amount allowed'
    }
  };

  /* FILE */

  // get script fullpath
  MoneyPicker.prototype.fullPath = function () {
    return $("script[src*='" + moneypicker_fileName + "']").attr('src');
  }

  // get script path
  MoneyPicker.prototype.path = function () {
    var fullPath = this.fullPath();
    return fullPath.substr(0, fullPath.lastIndexOf("/") + 1);
  }

  // get script filename
  MoneyPicker.prototype.fileName = function () {
    var fullPath = this.fullPath();
    return fullPath.substr(fullPath.lastIndexOf("/") + 1, fullPath.length);
  }

  /* EVENTS */

  // Stop propagation on different browser
  MoneyPicker.prototype.stopEvent = function (evt) {

    // IE8 compability
    if (evt) {
      if (evt.preventDefault)
        evt.preventDefault();
      else
        evt.returnValue = false;
    }
    else
      window.event.returnValue = false;
  }

  // Destroy popover on mouseleave
  $(document).on('mouseleave', '.popover-content', function (evt) {

    $('[data-type=moneypicker]').each(function () {
        $(this).popover('hide');
    });
  });

  // click over image
  //Parameters -> value : value to add
  MoneyPicker.prototype.Add = function (evt, obj) {

    var options = this.options;

    // someone might have changed the value
    if (this.elInput != null)
      this.amount = parseFloat(this.elInput.value.replace(separators.comma, separators.dot)) || 0;

    this.amount += obj.value;

    if (options.max != null && this.amount > options.max)
      this.amount = options.max;

    this.Render();
    this.execJsFunction();

    $(obj).popover('hide');
  };

  // click on confirm button
  MoneyPicker.prototype.confirmClick = function (evt) {
    
    var self = this;
    var result = false;

    if (self.CheckAmount()) {     

      // Patch for Firefox 'not fire the command event if we do the postback after disable button'
      setTimeout(function () {
        self.elConfirm.disabled = true;
        self.elConfirm.style.cursor = 'progress';
        $(self.elConfirm).popover('hide');
      }, 100);

      // do post back in case we have attached a validation group
      if (typeof (__doPostBack) === "function")
        __doPostBack(self.elConfirm.name, '');

      result = true;
    }
    else
      self.stopEvent(evt);

    return result;
  }

  // click on amount
  MoneyPicker.prototype.mouseClick = function (evt, obj) {

    var self = this;
    var element = self.element;
    var $element = $(element);
    var options = self.options;

    clearTimeout(element.timeout)

    element.popPlacement = options.placement;
    element.popContent = self.markupLayout();

    $element.popover('show');

    var popover = $element.data('bs.popover').tip;

    // Hide popover on mouseleave
    $(popover).on('mouseleave', '.popover-body', function (evt) {

      $element.popover('hide');
    });
  }

  // mouse over amount
  MoneyPicker.prototype.mouseOver = function (evt, obj) {

    var self = this;
    var element = self.element;
    var $element = $(element);
    var options = self.options;

    element.popPlacement = options.placementTooltip;
    element.popContent = options.tooltip;

    clearTimeout(element.timeout)
    element.hoverState = 'in';

    element.timeout = setTimeout(function () {
      if (element.hoverState == 'in')
        $element.popover('show');
    }, 1000);
  }

  // mouse over amount
  MoneyPicker.prototype.mouseOut = function (evt, el) {

    var self = this;
    var element = self.element;
    var $element = $(element);
    var options = self.options;

    clearTimeout(element.timeout)
    element.hoverState = 'out';

    if (element.popContent == options.tooltip)
      element.timeout = setTimeout(function () {
        if (element.hoverState == 'out')
          $element.popover('hide');
      }, 100);
  }

  /* GLOBAL */

  // Create bootstrap popover
  MoneyPicker.prototype.popOver = function (element, title, content) {

    $(element).popover({
      html: true,
      trigger: 'hover',
      container: 'body',
      placement: 'top',
      delay: { show: 1000, hide: 100 },
      title: title || '',
      content: content
    });
  }

  // Create and append an HTML element tag as child of container
  // (an optional child class and style can be specified)
  MoneyPicker.prototype.appendElement = function (container, childTag, childclass, childstyle) {

    var child = document.createElement(childTag);

    if (childclass != null) child.className = childclass;
    if (childstyle != null) child.style.cssText = childstyle;

    return container.appendChild(child);
  };

  /* MARKUP */

  // Money markup
  MoneyPicker.prototype.markupMoney = function (td, elements, css) {

    // Declarations
    var self = this;
    var options = this.options;

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];

      var img = this.appendElement(td, "img", css);
      img.src = options.iconBasePath + options.icons[el]['img'];
      img.value = el;
      img.onclick = function (evt) { self.Add(evt, this) };

      var content = "<span class='popover-text '>" + options.icons[el]['desc'] + "</span>";
      this.popOver(img, null, content);
    }
  }

  // Functions markup
  MoneyPicker.prototype.markupFunctions = function (td, type) {

    // Declarations
    var self = this;
    var options = this.options;

    var img = this.appendElement(td, "img", "function");
    img.src = options.iconBasePath + options.icons[type]['img'];
    img.type = type;
    img.onclick = function (evt) { self.Functions(evt, this) };

    var content = "<span class='popover-text '>" + options.icons[type]['desc'] + "</span>";
    this.popOver(img, null, content);
  }

  // Create bills and coins buttons
  MoneyPicker.prototype.markupLayout = function () {

    // Declarations
    var self = this;
    var element = self.element;
    var $element = $(element);
    var options = self.options;

    // Render
    var table = document.createElement('table');
    table.cssText = "border-spacing:0; padding:0;";
  
    var tr = this.appendElement(table, "tr");
    var td = this.appendElement(tr, "td");

    this.markupMoney(td, options.bills, "bills");

    if (options.func['sign']) {
      td = this.appendElement(tr, "td");
      this.markupFunctions(td, "sign");
    }
    else
      td.setAttribute("colspan", "2");

    tr = this.appendElement(table, "tr");
    td = this.appendElement(tr, "td");

    this.markupMoney(td, options.coins, "coins");

    td = this.appendElement(tr, "td",null, "text-align:right;");

    if (options.func['reset'])
      this.markupFunctions(td, "reset");

    return table;
  };

  /* GENERIC */

  // Functions
  MoneyPicker.prototype.Functions = function (evt, obj) {

    if (this.elInput != null)
      this.amount = parseFloat(this.elInput.value);

    if (obj.type == 'reset')
      this.amount = (this.options.min <= 0 && this.options.max >= 0) ? 0 : this.options.min;

    if (obj.type == 'sign')
      this.amount = -this.amount;

    this.Render();
    this.execJsFunction();

    $(obj).popover('hide');
  };

  // Check the value on press confirm button
  MoneyPicker.prototype.CheckAmount = function () {

    var self = this;
    var options = self.options;

    var result = true;

    if (self.elError != null) {

      self.elError.style.visibility = 'hidden';

      if (self.elError.validationGroup)
        result = Page_ClientValidate(self.elError.validationGroup);

      if (self.amount < options.min) {
        self.elError.innerHTML = options.message.min + ' ' + options.min + ' ' + options.currency;
        self.elError.style.visibility = 'visible';
        result = false;
      }

      if (self.amount > options.max) {
        self.elError.innerHTML = options.message.max + ' ' + options.max + ' ' + options.currency;
        self.elError.style.visibility = 'visible';
        result = false;
      }
    }

    return result;
  };

  // Execute javascript function
  MoneyPicker.prototype.execJsFunction = function () {

    if (this.jsFunction != null)
      eval(this.jsFunction);
  }

  // format HMTL digit
  MoneyPicker.prototype.formatHTMLdigit = function (amount) {

    var digit = parseFloat(amount).toFixed(2).replace(separators.dot, separators.comma);
    var digitParts = digit.split(separators.comma);

    var retVal = digitParts[0] + "<span class='decimal'>," + digitParts[1] + "</span>";
    return retVal;
  }

  // Render
  MoneyPicker.prototype.Render = function () {

    var sign = '';
    var options = this.options;
    this.total = this.credit + this.amount;

    // Aggiorno il campo nascosto che serve per recuperare il valore dell'importo
    if (this.elInput != null)
      this.elInput.value = this.amount.toFixed(2).replace(separators.dot, separators.comma);

    if (this.elAmount != null) {

      if (options.setClass) {

        this.elAmount.className = 'amount';

        if (this.amount > 0) this.elAmount.className += 'pos';
        if (this.amount < 0) this.elAmount.className += 'neg';
      }

      if (options.sign)
        sign = (this.amount > 0) ? '+' : '';

      this.elAmount.innerHTML = sign + this.formatHTMLdigit(this.amount) + ' ' + options.currency;
    }

    if (this.elCredit != null) {

      if (options.setClass) {
        this.elCredit.className = 'credit';
        if (this.credit > 0) this.elCredit.className += 'pos';
        if (this.credit < 0) this.elCredit.className += 'neg';
      }

      if (options.sign)
        sign = (this.credit > 0) ? '+' : '';

      this.elCredit.innerHTML = sign + this.formatHTMLdigit(this.credit) + ' ' + options.currency;
    }

    if (this.elTotal != null) {

      if (options.setClass) {
        this.elTotal.className = 'total';
        if (this.total > 0) this.elTotal.className += 'pos';
        if (this.total < 0) this.elTotal.className += 'neg';
      }

      if (options.sign)
        sign = (this.total > 0) ? '+' : '';

      this.elTotal.innerHTML = sign + this.formatHTMLdigit(this.total) + ' ' + options.currency;
    }

  };

  /* INIT */

  // Initialize
  MoneyPicker.prototype.init = function () {

    var self = this;
    var element = self.element;
    var $element = $(element);
    var options = self.options;

    this.elInput = document.getElementById(options.input);
    this.elAmount = document.getElementById(options.amount);
    this.elCredit = document.getElementById(options.credit);
    this.elTotal = document.getElementById(options.total)
    this.elError = document.getElementById(options.error);
    this.elConfirm = document.getElementById(options.confirm);

    this.elContainer = document.getElementById(options.container);

    this.jsFunction = options.jsfunction;

    var value = parseFloat(element.innerHTML);
    
    this.amount = !isNaN(value) ? value :
      this.elAmount ? parseFloat(this.elAmount.value) :
      this.elInput ? parseFloat(this.elInput.value) : 0;

    if (this.amount < options.min) this.amount = options.min;
    if (this.amount > options.max) this.amount = options.max;

    if (this.elCredit != null)
      this.credit = parseFloat(this.elCredit.innerHTML.replace(separators.dot, separators.comma));

    if (this.elConfirm != null) {

      // remove the onclick attribute to prevent asp.net validation
      this.elConfirm.removeAttribute('onclick');
      this.elConfirm.onclick = function (evt) { return self.confirmClick(evt) };
    }

    if (this.elContainer != null)
      this.elContainer.appendChild(self.markupLayout());

    else {
      element.style.cursor = "pointer";

      $element.popover({
        html: true,
        trigger: 'manual',
        container: 'body',
        placement: function () { return element.popPlacement; },
        content: function () { return element.popContent; },
      })

      element.onmouseenter = function (evt) { self.mouseOver(evt, this); };
      element.onmouseleave = function (evt) { self.mouseOut(evt, this); };
      element.onclick = function (evt) { self.mouseClick(evt, this); };
    }

    this.Render();
  }

  // MoneyPicker PLUGIN DEFINITION
  
  var moneypicker_version = '1.0.0';
  var moneypicker_pluginName = 'mm.moneypicker';
  var moneypicker_fileName = "jquery.moneypicker";

  var old = $.fn.moneypicker;

  $.fn.moneypicker = function (option) {

    $.fn.moneypicker.loadCSS();

    return this.each(function () {

      var $this = $(this)   
      var data = $this.data(moneypicker_pluginName)
      var options = typeof option == 'object' && option

      if (!data) {
        if (option == 'destroy') return
        var plugin = new MoneyPicker(moneypicker_pluginName, this, options)
        $this.data(moneypicker_pluginName, plugin)
      }

      if (typeof option == 'string') data[option]()
    })
  }

  // load a css file
  $.fn.moneypicker.loadCSS = function () {
    var href = $("script[src*='" + moneypicker_fileName + "']").attr('src').split("-")[0];

    if ($("link[href*='" + moneypicker_fileName + "']").length == 0) {
      var css = $("<link rel='stylesheet' type='text/css' href='" + href + ".min.css'>");
      $("head").append(css);
    }
  };

  $.fn.moneypicker.Constructor = MoneyPicker

  // MoneyPicker NO CONFLICT  
  $.fn.moneypicker.noConflict = function () {
    $.fn.moneypicker = old
    return this
  }

  // Create plugin
  $(document).ready(function () {

    $('[data-type=moneypicker]').moneypicker();

    $('body').on('click touchstart', function (e) {

      $('[data-toggle=popover]').each(function () {

        if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
          $(this).popover('hide');
        }
      });
    });

  });

}(jQuery);
