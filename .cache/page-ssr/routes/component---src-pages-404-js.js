exports.id = "component---src-pages-404-js";
exports.ids = ["component---src-pages-404-js"];
exports.modules = {

/***/ "./src/styles/header.module.css":
/*!**************************************!*\
  !*** ./src/styles/header.module.css ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "header": () => (/* binding */ header),
/* harmony export */   "title": () => (/* binding */ title),
/* harmony export */   "subtitle": () => (/* binding */ subtitle),
/* harmony export */   "description": () => (/* binding */ description)
/* harmony export */ });
// Exports
var header = "header-module--header--UabsJ";
var title = "header-module--title--1aRhn";
var subtitle = "header-module--subtitle--EnKok header-module--title--1aRhn";
var description = "header-module--description--0IObe";


/***/ }),

/***/ "./src/styles/logo.module.css":
/*!************************************!*\
  !*** ./src/styles/logo.module.css ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "logo": () => (/* binding */ logo),
/* harmony export */   "name": () => (/* binding */ name),
/* harmony export */   "svg": () => (/* binding */ svg)
/* harmony export */ });
// Exports
var logo = "logo-module--logo--gKIqX";
var name = "logo-module--name--vTcnq";
var svg = "logo-module--svg--gV+Rv";


/***/ }),

/***/ "./src/styles/navigation.module.css":
/*!******************************************!*\
  !*** ./src/styles/navigation.module.css ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "menu": () => (/* binding */ menu),
/* harmony export */   "menuopen": () => (/* binding */ menuopen),
/* harmony export */   "menuclosed": () => (/* binding */ menuclosed),
/* harmony export */   "link": () => (/* binding */ link),
/* harmony export */   "active": () => (/* binding */ active),
/* harmony export */   "item": () => (/* binding */ item),
/* harmony export */   "bar": () => (/* binding */ bar),
/* harmony export */   "navigation": () => (/* binding */ navigation),
/* harmony export */   "logo": () => (/* binding */ logo),
/* harmony export */   "hamburger": () => (/* binding */ hamburger),
/* harmony export */   "icon": () => (/* binding */ icon)
/* harmony export */ });
// Exports
var menu = "navigation-module--menu--p46AS";
var menuopen = "navigation-module--menuopen--XiflE navigation-module--menu--p46AS";
var menuclosed = "navigation-module--menuclosed--z24aT navigation-module--menu--p46AS";
var link = "navigation-module--link--sqcmv";
var active = "navigation-module--active--CAy3t";
var item = "navigation-module--item--y-DfK";
var bar = "navigation-module--bar--hW7T7";
var navigation = "navigation-module--navigation--Y7+yf";
var logo = "navigation-module--logo--ovzyO";
var hamburger = "navigation-module--hamburger--Hs2gp";
var icon = "navigation-module--icon--s5Xel";


/***/ }),

/***/ "./src/components/container.js":
/*!*************************************!*\
  !*** ./src/components/container.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_1__);



const Container = ({
  children
}) => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
  style: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 1rem'
  }
}, children);

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Container);
Container.propTypes = {
  children: (prop_types__WEBPACK_IMPORTED_MODULE_1___default().node)
};

/***/ }),

/***/ "./src/components/header.js":
/*!**********************************!*\
  !*** ./src/components/header.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _styles_header_module_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../styles/header.module.css */ "./src/styles/header.module.css");




const Header = ({
  title,
  description,
  children,
  large = false
}) => {
  const sizeClass = large ? _styles_header_module_css__WEBPACK_IMPORTED_MODULE_1__.title : _styles_header_module_css__WEBPACK_IMPORTED_MODULE_1__.subtitle;
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("header", {
    className: _styles_header_module_css__WEBPACK_IMPORTED_MODULE_1__.header
  }, title && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h1", {
    className: sizeClass
  }, title), description && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: _styles_header_module_css__WEBPACK_IMPORTED_MODULE_1__.description
  }, description), children);
};

Header.propTypes = {
  title: (prop_types__WEBPACK_IMPORTED_MODULE_2___default().string),
  description: (prop_types__WEBPACK_IMPORTED_MODULE_2___default().string),
  children: (prop_types__WEBPACK_IMPORTED_MODULE_2___default().any),
  large: (prop_types__WEBPACK_IMPORTED_MODULE_2___default().bool)
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Header);

/***/ }),

/***/ "./src/components/layout.js":
/*!**********************************!*\
  !*** ./src/components/layout.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _container__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./container */ "./src/components/container.js");
/* harmony import */ var _navigation__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./navigation */ "./src/components/navigation.js");





const Layout = ({
  children
}) => {
  const {
    0: menuState,
    1: setMenuState
  } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('closed');

  const toggleMenu = () => {
    menuState === 'closed' ? setMenuState('open') : setMenuState('closed');
  };

  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_navigation__WEBPACK_IMPORTED_MODULE_2__["default"], {
    onHamburgerClick: toggleMenu,
    state: menuState
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_container__WEBPACK_IMPORTED_MODULE_1__["default"], null, children));
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Layout);
Layout.propTypes = {
  children: (prop_types__WEBPACK_IMPORTED_MODULE_3___default().node.isRequired)
};

/***/ }),

/***/ "./src/components/logo.js":
/*!********************************!*\
  !*** ./src/components/logo.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _public_page_data_sq_d_3159585216_json__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../public/page-data/sq/d/3159585216.json */ "./public/page-data/sq/d/3159585216.json");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var gatsby__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! gatsby */ "./.cache/gatsby-browser-entry.js");
/* harmony import */ var _styles_logo_module_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../styles/logo.module.css */ "./src/styles/logo.module.css");
/* harmony import */ var _images_logo_svg__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../images/logo.svg */ "./src/images/logo.svg");
/* harmony import */ var _images_logo_svg__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_images_logo_svg__WEBPACK_IMPORTED_MODULE_4__);






const Logo = () => {
  const data = _public_page_data_sq_d_3159585216_json__WEBPACK_IMPORTED_MODULE_0__.data;
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(gatsby__WEBPACK_IMPORTED_MODULE_2__.Link, {
    className: _styles_logo_module_css__WEBPACK_IMPORTED_MODULE_3__.logo,
    to: "/"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement((_images_logo_svg__WEBPACK_IMPORTED_MODULE_4___default()), {
    className: _styles_logo_module_css__WEBPACK_IMPORTED_MODULE_3__.svg
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement("span", {
    className: _styles_logo_module_css__WEBPACK_IMPORTED_MODULE_3__.name
  }, data.site.siteMetadata.title));
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Logo);

/***/ }),

/***/ "./src/components/navigation.js":
/*!**************************************!*\
  !*** ./src/components/navigation.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var gatsby__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! gatsby */ "./.cache/gatsby-browser-entry.js");
/* harmony import */ var _images_icon_menu_svg__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../images/icon-menu.svg */ "./src/images/icon-menu.svg");
/* harmony import */ var _images_icon_menu_svg__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_images_icon_menu_svg__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _images_icon_close_svg__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../images/icon-close.svg */ "./src/images/icon-close.svg");
/* harmony import */ var _images_icon_close_svg__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_images_icon_close_svg__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _container__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./container */ "./src/components/container.js");
/* harmony import */ var _logo__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./logo */ "./src/components/logo.js");
/* harmony import */ var _styles_navigation_module_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../styles/navigation.module.css */ "./src/styles/navigation.module.css");








const navigationItems = [{
  anchorText: 'Latest',
  path: '/'
}, {
  anchorText: 'Mobile',
  path: '/tags/mobile/'
}, {
  anchorText: 'Desktop',
  path: '/tags/desktop/'
}, {
  anchorText: 'iOS',
  path: '/tags/ios/'
}, {
  anchorText: 'Android',
  path: '/tags/android/'
}]; // To Do: Provide an array and loop through it

const Navigation = ({
  onHamburgerClick,
  state
}) => {
  const clickedEvent = state === 'open' ? onHamburgerClick : null;
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("nav", {
    role: "navigation"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _styles_navigation_module_css__WEBPACK_IMPORTED_MODULE_6__.bar
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_container__WEBPACK_IMPORTED_MODULE_4__["default"], null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _styles_navigation_module_css__WEBPACK_IMPORTED_MODULE_6__.navigation
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    onClick: clickedEvent,
    className: _styles_navigation_module_css__WEBPACK_IMPORTED_MODULE_6__.logo
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_logo__WEBPACK_IMPORTED_MODULE_5__["default"], null)), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    onClick: onHamburgerClick,
    className: _styles_navigation_module_css__WEBPACK_IMPORTED_MODULE_6__.hamburger
  }, state === 'closed' && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((_images_icon_menu_svg__WEBPACK_IMPORTED_MODULE_2___default()), {
    className: _styles_navigation_module_css__WEBPACK_IMPORTED_MODULE_6__.icon
  }), state === 'open' && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((_images_icon_close_svg__WEBPACK_IMPORTED_MODULE_3___default()), {
    className: _styles_navigation_module_css__WEBPACK_IMPORTED_MODULE_6__.icon
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("ul", {
    className: state === 'open' ? _styles_navigation_module_css__WEBPACK_IMPORTED_MODULE_6__.menuopen : _styles_navigation_module_css__WEBPACK_IMPORTED_MODULE_6__.menuclosed
  }, navigationItems.map((item, index) => {
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("li", {
      className: _styles_navigation_module_css__WEBPACK_IMPORTED_MODULE_6__.item,
      key: index
    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(gatsby__WEBPACK_IMPORTED_MODULE_1__.Link, {
      activeClassName: _styles_navigation_module_css__WEBPACK_IMPORTED_MODULE_6__.active,
      className: _styles_navigation_module_css__WEBPACK_IMPORTED_MODULE_6__.link,
      partiallyActive: item.path !== '/',
      to: item.path,
      onClick: clickedEvent
    }, item.anchorText));
  }))))));
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Navigation);
Navigation.propTypes = {
  onHamburgerClick: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().func),
  state: prop_types__WEBPACK_IMPORTED_MODULE_7___default().oneOf(['open', 'closed'])
};
Navigation.defaultProps = {
  state: 'closed'
};

/***/ }),

/***/ "./src/components/seo.js":
/*!*******************************!*\
  !*** ./src/components/seo.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _public_page_data_sq_d_3764592887_json__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../public/page-data/sq/d/3764592887.json */ "./public/page-data/sq/d/3764592887.json");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var react_helmet__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-helmet */ "./node_modules/react-helmet/es/Helmet.js");


/**
 * SEO component that queries for data with
 *  Gatsby's useStaticQuery React hook
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */




const SEO = ({
  description,
  lang,
  meta,
  keywords,
  title,
  image
}) => {
  const {
    site
  } = _public_page_data_sq_d_3764592887_json__WEBPACK_IMPORTED_MODULE_0__.data;
  const metaDescription = description || site.siteMetadata.description;
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(react_helmet__WEBPACK_IMPORTED_MODULE_2__.Helmet, {
    htmlAttributes: {
      lang
    },
    defaultTitle: `${site.siteMetadata.title}`,
    title: title,
    titleTemplate: `%s — ${site.siteMetadata.title}`,
    meta: [{
      name: 'description',
      content: metaDescription
    }, {
      property: 'og:title',
      content: title
    }, {
      property: 'og:description',
      content: metaDescription
    }, // {
    //   property: 'og:image',
    //   content: ogImageUrl,
    // },
    // {
    //   property: 'image',
    //   content: ogImageUrl,
    // },
    {
      property: 'og:type',
      content: 'website'
    }, {
      name: 'twitter:card',
      content: 'summary'
    }, {
      name: 'twitter:creator',
      content: '@emptystates'
    }, {
      name: 'twitter:title',
      content: title
    }, {
      name: 'twitter:description',
      content: metaDescription
    } // {
    //   property: 'twitter:image',
    //   content: ogImageUrl,
    // },
    ].concat(keywords.length > 0 ? {
      name: 'keywords',
      content: keywords.join(', ')
    } : []).concat(meta)
  });
};

SEO.defaultProps = {
  lang: 'en',
  meta: [],
  keywords: ['inspiration', 'gatsby', 'empty states', 'design']
};
SEO.propTypes = {
  description: (prop_types__WEBPACK_IMPORTED_MODULE_3___default().string),
  lang: (prop_types__WEBPACK_IMPORTED_MODULE_3___default().string),
  meta: (prop_types__WEBPACK_IMPORTED_MODULE_3___default().array),
  keywords: prop_types__WEBPACK_IMPORTED_MODULE_3___default().arrayOf((prop_types__WEBPACK_IMPORTED_MODULE_3___default().string)),
  title: (prop_types__WEBPACK_IMPORTED_MODULE_3___default().string)
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (SEO);

/***/ }),

/***/ "./src/pages/404.js":
/*!**************************!*\
  !*** ./src/pages/404.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _components_layout__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../components/layout */ "./src/components/layout.js");
/* harmony import */ var _components_seo__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../components/seo */ "./src/components/seo.js");
/* harmony import */ var _components_header__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../components/header */ "./src/components/header.js");
/* harmony import */ var _components_container__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../components/container */ "./src/components/container.js");






const NotFoundPage = () => {
  const text = "There should probably be an empty state here but... the page you're looking for doesn't exist.";
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_components_layout__WEBPACK_IMPORTED_MODULE_1__["default"], null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_components_seo__WEBPACK_IMPORTED_MODULE_2__["default"], {
    title: "404: Not found"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_components_container__WEBPACK_IMPORTED_MODULE_4__["default"], null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_components_header__WEBPACK_IMPORTED_MODULE_3__["default"], {
    title: "Page Not Found"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, text)));
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (NotFoundPage);

/***/ }),

/***/ "./src/images/icon-close.svg":
/*!***********************************!*\
  !*** ./src/images/icon-close.svg ***!
  \***********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var React = __webpack_require__(/*! react */ "react");

function IconClose (props) {
    return React.createElement("svg",props,[React.createElement("title",{"key":0},"Close"),React.createElement("path",{"fill":"currentColor","d":"M14.3,12.179a.25.25,0,0,1,0-.354l9.263-9.262A1.5,1.5,0,0,0,21.439.442L12.177,9.7a.25.25,0,0,1-.354,0L2.561.442A1.5,1.5,0,0,0,.439,2.563L9.7,11.825a.25.25,0,0,1,0,.354L.439,21.442a1.5,1.5,0,0,0,2.122,2.121L11.823,14.3a.25.25,0,0,1,.354,0l9.262,9.263a1.5,1.5,0,0,0,2.122-2.121Z","key":1})]);
}

IconClose.defaultProps = {"viewBox":"0 0 24 24"};

module.exports = IconClose;

IconClose.default = IconClose;


/***/ }),

/***/ "./src/images/icon-menu.svg":
/*!**********************************!*\
  !*** ./src/images/icon-menu.svg ***!
  \**********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var React = __webpack_require__(/*! react */ "react");

function IconMenu (props) {
    return React.createElement("svg",props,React.createElement("g",{"fill":"currentColor"},[React.createElement("rect",{"width":"23","height":"3","x":".5","y":"2.5","rx":".55228","ry":"0","key":0}),React.createElement("rect",{"width":"23","height":"3","x":".5","y":"10.5","rx":".55228","ry":"0","key":1}),React.createElement("rect",{"width":"23","height":"3","x":".5","y":"18.5","rx":".55228","ry":"0","key":2})]));
}

IconMenu.defaultProps = {"version":"1.1","viewBox":"0 0 24 24"};

module.exports = IconMenu;

IconMenu.default = IconMenu;


/***/ }),

/***/ "./src/images/logo.svg":
/*!*****************************!*\
  !*** ./src/images/logo.svg ***!
  \*****************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var React = __webpack_require__(/*! react */ "react");

function Logo (props) {
    return React.createElement("svg",props,React.createElement("path",{"fillRule":"evenodd","d":"M119.501 49.499L169 0l49.499 49.499h70.002v70.002L338 169l-49.499 49.499v70.002h-70.002L169 338l-49.499-49.499H49.499v-70.002L0 169l49.499-49.499V49.499h70.002zm49.639 18.525c-55.859 0-101.116 45.257-101.116 101.116 0 55.858 45.258 101.116 101.116 101.116s101.116-45.258 101.116-101.116c0-55.859-45.258-101.116-101.116-101.116zm32.618 68.498c7.217 0 13.047 5.83 13.047 13.047 0 7.217-5.83 13.047-13.047 13.047a13.033 13.033 0 0 1-13.047-13.047c0-7.217 5.83-13.047 13.047-13.047zm-65.236 0c7.217 0 13.047 5.83 13.047 13.047 0 7.217-5.83 13.047-13.047 13.047a13.033 13.033 0 0 1-13.047-13.047c0-7.217 5.83-13.047 13.047-13.047zm79.425 69.395c-11.62 13.944-28.663 21.936-46.807 21.936-18.144 0-35.187-7.992-46.807-21.936-5.545-6.646 4.485-14.964 10.03-8.359 9.133 10.968 22.506 17.207 36.777 17.207 14.27 0 27.644-6.28 36.777-17.206 5.463-6.606 15.534 1.712 10.03 8.358z"}));
}

Logo.defaultProps = {"fill":"currentColor","viewBox":"0 0 338 338"};

module.exports = Logo;

Logo.default = Logo;


/***/ }),

/***/ "./public/page-data/sq/d/3159585216.json":
/*!***********************************************!*\
  !*** ./public/page-data/sq/d/3159585216.json ***!
  \***********************************************/
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"data":{"site":{"siteMetadata":{"title":"Empty States"}}}}');

/***/ }),

/***/ "./public/page-data/sq/d/3764592887.json":
/*!***********************************************!*\
  !*** ./public/page-data/sq/d/3764592887.json ***!
  \***********************************************/
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"data":{"site":{"siteMetadata":{"title":"Empty States","description":"A curated gallery showcasing designs where no data is available in the UI.","siteUrl":"https://emptystat.es"}}}}');

/***/ })

};
;
//# sourceMappingURL=component---src-pages-404-js.js.map