exports.id = "component---src-templates-index-js";
exports.ids = ["component---src-templates-index-js"];
exports.modules = {

/***/ "./node_modules/camelcase/index.js":
/*!*****************************************!*\
  !*** ./node_modules/camelcase/index.js ***!
  \*****************************************/
/***/ ((module) => {

"use strict";


const preserveCamelCase = string => {
	let isLastCharLower = false;
	let isLastCharUpper = false;
	let isLastLastCharUpper = false;

	for (let i = 0; i < string.length; i++) {
		const character = string[i];

		if (isLastCharLower && /[a-zA-Z]/.test(character) && character.toUpperCase() === character) {
			string = string.slice(0, i) + '-' + string.slice(i);
			isLastCharLower = false;
			isLastLastCharUpper = isLastCharUpper;
			isLastCharUpper = true;
			i++;
		} else if (isLastCharUpper && isLastLastCharUpper && /[a-zA-Z]/.test(character) && character.toLowerCase() === character) {
			string = string.slice(0, i - 1) + '-' + string.slice(i - 1);
			isLastLastCharUpper = isLastCharUpper;
			isLastCharUpper = false;
			isLastCharLower = true;
		} else {
			isLastCharLower = character.toLowerCase() === character && character.toUpperCase() !== character;
			isLastLastCharUpper = isLastCharUpper;
			isLastCharUpper = character.toUpperCase() === character && character.toLowerCase() !== character;
		}
	}

	return string;
};

const camelCase = (input, options) => {
	if (!(typeof input === 'string' || Array.isArray(input))) {
		throw new TypeError('Expected the input to be `string | string[]`');
	}

	options = Object.assign({
		pascalCase: false
	}, options);

	const postProcess = x => options.pascalCase ? x.charAt(0).toUpperCase() + x.slice(1) : x;

	if (Array.isArray(input)) {
		input = input.map(x => x.trim())
			.filter(x => x.length)
			.join('-');
	} else {
		input = input.trim();
	}

	if (input.length === 0) {
		return '';
	}

	if (input.length === 1) {
		return options.pascalCase ? input.toUpperCase() : input.toLowerCase();
	}

	const hasUpperCase = input !== input.toLowerCase();

	if (hasUpperCase) {
		input = preserveCamelCase(input);
	}

	input = input
		.replace(/^[_.\- ]+/, '')
		.toLowerCase()
		.replace(/[_.\- ]+(\w|$)/g, (_, p1) => p1.toUpperCase())
		.replace(/\d+(\w|$)/g, m => m.toUpperCase());

	return postProcess(input);
};

module.exports = camelCase;
// TODO: Remove this for the next major release
module.exports["default"] = camelCase;


/***/ }),

/***/ "./src/styles/gallery.module.css":
/*!***************************************!*\
  !*** ./src/styles/gallery.module.css ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "gallery": () => (/* binding */ gallery),
/* harmony export */   "wide": () => (/* binding */ wide)
/* harmony export */ });
// Exports
var gallery = "gallery-module--gallery--k-n5K";
var wide = "gallery-module--wide--xRL9s";


/***/ }),

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

/***/ "./src/styles/pagination.module.css":
/*!******************************************!*\
  !*** ./src/styles/pagination.module.css ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "visuallyHidden": () => (/* binding */ visuallyHidden),
/* harmony export */   "paginaton": () => (/* binding */ paginaton),
/* harmony export */   "icon": () => (/* binding */ icon),
/* harmony export */   "paginationButton": () => (/* binding */ paginationButton),
/* harmony export */   "paginationButtonEnabled": () => (/* binding */ paginationButtonEnabled),
/* harmony export */   "paginationButtonActive": () => (/* binding */ paginationButtonActive)
/* harmony export */ });
// Exports
var visuallyHidden = "pagination-module--visually-hidden--Ys7LL";
var paginaton = "pagination-module--paginaton--kmrU4";
var icon = "pagination-module--icon--0r+d0";
var paginationButton = "pagination-module--paginationButton--rR4U3";
var paginationButtonEnabled = "pagination-module--paginationButtonEnabled--X5p9u pagination-module--paginationButton--rR4U3";
var paginationButtonActive = "pagination-module--paginationButtonActive--xHE8u pagination-module--paginationButton--rR4U3";


/***/ }),

/***/ "./src/styles/preview.module.css":
/*!***************************************!*\
  !*** ./src/styles/preview.module.css ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "item": () => (/* binding */ item)
/* harmony export */ });
// Exports
var item = "preview-module--item--Ypz71";


/***/ }),

/***/ "./node_modules/gatsby-plugin-image/dist/gatsby-image.module.js":
/*!**********************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/dist/gatsby-image.module.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "GatsbyImage": () => (/* binding */ Y),
/* harmony export */   "MainImage": () => (/* binding */ q),
/* harmony export */   "Placeholder": () => (/* binding */ C),
/* harmony export */   "StaticImage": () => (/* binding */ J),
/* harmony export */   "generateImageData": () => (/* binding */ y),
/* harmony export */   "getImage": () => (/* binding */ R),
/* harmony export */   "getImageData": () => (/* binding */ W),
/* harmony export */   "getLowResolutionImageURL": () => (/* binding */ w),
/* harmony export */   "getSrc": () => (/* binding */ x),
/* harmony export */   "getSrcSet": () => (/* binding */ I),
/* harmony export */   "withArtDirection": () => (/* binding */ j)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var common_tags__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! common-tags */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/index.js");
/* harmony import */ var camelcase__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! camelcase */ "./node_modules/camelcase/index.js");
/* harmony import */ var camelcase__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(camelcase__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_3__);






function s() {
  return s = Object.assign || function (e) {
    for (var t = 1; t < arguments.length; t++) {
      var a = arguments[t];

      for (var i in a) Object.prototype.hasOwnProperty.call(a, i) && (e[i] = a[i]);
    }

    return e;
  }, s.apply(this, arguments);
}

function l(e, t) {
  if (null == e) return {};
  var a,
      i,
      r = {},
      n = Object.keys(e);

  for (i = 0; i < n.length; i++) t.indexOf(a = n[i]) >= 0 || (r[a] = e[a]);

  return r;
}

var d,
    u = [.25, .5, 1, 2],
    c = [750, 1080, 1366, 1920],
    h = [320, 654, 768, 1024, 1366, 1600, 1920, 2048, 2560, 3440, 3840, 4096],
    g = function (e) {
  return console.warn(e);
},
    p = function (e, t) {
  return e - t;
},
    m = function (e) {
  return e.map(function (e) {
    return e.src + " " + e.width + "w";
  }).join(",\n");
};

function f(e) {
  var t = e.lastIndexOf(".");

  if (-1 !== t) {
    var a = e.substr(t + 1);
    if ("jpeg" === a) return "jpg";
    if (3 === a.length || 4 === a.length) return a;
  }
}

function v(e) {
  var t = e.layout,
      a = void 0 === t ? "constrained" : t,
      i = e.width,
      n = e.height,
      o = e.sourceMetadata,
      l = e.breakpoints,
      d = e.aspectRatio,
      u = e.formats,
      c = void 0 === u ? ["auto", "webp"] : u;
  return c = c.map(function (e) {
    return e.toLowerCase();
  }), a = camelcase__WEBPACK_IMPORTED_MODULE_2___default()(a), i && n ? s({}, e, {
    formats: c,
    layout: a,
    aspectRatio: i / n
  }) : (o.width && o.height && !d && (d = o.width / o.height), "fullWidth" === a ? (i = i || o.width || l[l.length - 1], n = n || Math.round(i / (d || 1.3333333333333333))) : (i || (i = n && d ? n * d : o.width ? o.width : n ? Math.round(n / 1.3333333333333333) : 800), d && !n ? n = Math.round(i / d) : d || (d = i / n)), s({}, e, {
    width: i,
    height: n,
    aspectRatio: d,
    layout: a,
    formats: c
  }));
}

function w(e, t) {
  var a;
  return void 0 === t && (t = 20), null == (a = (0, (e = v(e)).generateImageSource)(e.filename, t, Math.round(t / e.aspectRatio), e.sourceMetadata.format || "jpg", e.fit, e.options)) ? void 0 : a.src;
}

function y(e) {
  var t,
      a = (e = v(e)).pluginName,
      r = e.sourceMetadata,
      n = e.generateImageSource,
      o = e.layout,
      l = e.fit,
      h = e.options,
      p = e.width,
      w = e.height,
      y = e.filename,
      M = e.reporter,
      S = void 0 === M ? {
    warn: g
  } : M,
      N = e.backgroundColor,
      R = e.placeholderURL;
  if (a || S.warn('[gatsby-plugin-image] "generateImageData" was not passed a plugin name'), "function" != typeof n) throw new Error("generateImageSource must be a function");
  r && (r.width || r.height) ? r.format || (r.format = f(y)) : r = {
    width: p,
    height: w,
    format: (null == (t = r) ? void 0 : t.format) || f(y) || "auto"
  };
  var x = new Set(e.formats);
  (0 === x.size || x.has("auto") || x.has("")) && (x.delete("auto"), x.delete(""), x.add(r.format)), x.has("jpg") && x.has("png") && (S.warn("[" + a + "] Specifying both 'jpg' and 'png' formats is not supported. Using 'auto' instead"), x.delete("jpg" === r.format ? "png" : "jpg"));

  var I = function (e) {
    var t = e.filename,
        a = e.layout,
        r = void 0 === a ? "constrained" : a,
        n = e.sourceMetadata,
        o = e.reporter,
        l = void 0 === o ? {
      warn: g
    } : o,
        h = e.breakpoints,
        p = void 0 === h ? c : h,
        m = Object.entries({
      width: e.width,
      height: e.height
    }).filter(function (e) {
      var t = e[1];
      return "number" == typeof t && t < 1;
    });
    if (m.length) throw new Error("Specified dimensions for images must be positive numbers (> 0). Problem dimensions you have are " + m.map(function (e) {
      return e.join(": ");
    }).join(", "));
    return "fixed" === r ? function (e) {
      var t = e.filename,
          a = e.sourceMetadata,
          r = e.width,
          n = e.height,
          o = e.fit,
          s = void 0 === o ? "cover" : o,
          l = e.outputPixelDensities,
          c = e.reporter,
          h = void 0 === c ? {
        warn: g
      } : c,
          p = a.width / a.height,
          m = b(void 0 === l ? u : l);

      if (r && n) {
        var f = k(a, {
          width: r,
          height: n,
          fit: s
        });
        r = f.width, n = f.height, p = f.aspectRatio;
      }

      r ? n || (n = Math.round(r / p)) : r = n ? Math.round(n * p) : 800;
      var v,
          w,
          y = r;

      if (a.width < r || a.height < n) {
        var E = a.width < r ? "width" : "height";
        h.warn((0,common_tags__WEBPACK_IMPORTED_MODULE_1__.stripIndent)(d || (v = ["\n    The requested ", ' "', 'px" for the image ', " was larger than the actual image ", " of ", "px. If possible, replace the current image with a larger one."], w || (w = v.slice(0)), v.raw = w, d = v), E, "width" === E ? r : n, t, E, a[E])), "width" === E ? (r = a.width, n = Math.round(r / p)) : r = (n = a.height) * p;
      }

      return {
        sizes: m.filter(function (e) {
          return e >= 1;
        }).map(function (e) {
          return Math.round(e * r);
        }).filter(function (e) {
          return e <= a.width;
        }),
        aspectRatio: p,
        presentationWidth: y,
        presentationHeight: Math.round(y / p),
        unscaledWidth: r
      };
    }(e) : "constrained" === r ? E(e) : "fullWidth" === r ? E(s({
      breakpoints: p
    }, e)) : (l.warn("No valid layout was provided for the image at " + t + ". Valid image layouts are fixed, fullWidth, and constrained. Found " + r), {
      sizes: [n.width],
      presentationWidth: n.width,
      presentationHeight: n.height,
      aspectRatio: n.width / n.height,
      unscaledWidth: n.width
    });
  }(s({}, e, {
    sourceMetadata: r
  })),
      W = {
    sources: []
  },
      j = e.sizes;

  j || (j = function (e, t) {
    switch (t) {
      case "constrained":
        return "(min-width: " + e + "px) " + e + "px, 100vw";

      case "fixed":
        return e + "px";

      case "fullWidth":
        return "100vw";

      default:
        return;
    }
  }(I.presentationWidth, o)), x.forEach(function (e) {
    var t = I.sizes.map(function (t) {
      var i = n(y, t, Math.round(t / I.aspectRatio), e, l, h);
      if (null != i && i.width && i.height && i.src && i.format) return i;
      S.warn("[" + a + "] The resolver for image " + y + " returned an invalid value.");
    }).filter(Boolean);

    if ("jpg" === e || "png" === e || "auto" === e) {
      var i = t.find(function (e) {
        return e.width === I.unscaledWidth;
      }) || t[0];
      i && (W.fallback = {
        src: i.src,
        srcSet: m(t),
        sizes: j
      });
    } else {
      var r;
      null == (r = W.sources) || r.push({
        srcSet: m(t),
        sizes: j,
        type: "image/" + e
      });
    }
  });
  var _ = {
    images: W,
    layout: o,
    backgroundColor: N
  };

  switch (R && (_.placeholder = {
    fallback: R
  }), o) {
    case "fixed":
      _.width = I.presentationWidth, _.height = I.presentationHeight;
      break;

    case "fullWidth":
      _.width = 1, _.height = 1 / I.aspectRatio;
      break;

    case "constrained":
      _.width = e.width || I.presentationWidth || 1, _.height = (_.width || 1) / I.aspectRatio;
  }

  return _;
}

var b = function (e) {
  return Array.from(new Set([1].concat(e))).sort(p);
};

function E(e) {
  var t,
      a = e.sourceMetadata,
      i = e.width,
      r = e.height,
      n = e.fit,
      o = void 0 === n ? "cover" : n,
      s = e.outputPixelDensities,
      l = e.breakpoints,
      d = e.layout,
      c = a.width / a.height,
      h = b(void 0 === s ? u : s);

  if (i && r) {
    var g = k(a, {
      width: i,
      height: r,
      fit: o
    });
    i = g.width, r = g.height, c = g.aspectRatio;
  }

  i = i && Math.min(i, a.width), r = r && Math.min(r, a.height), i || r || (r = (i = Math.min(800, a.width)) / c), i || (i = r * c);
  var m = i;
  return (a.width < i || a.height < r) && (i = a.width, r = a.height), i = Math.round(i), (null == l ? void 0 : l.length) > 0 ? (t = l.filter(function (e) {
    return e <= a.width;
  })).length < l.length && !t.includes(a.width) && t.push(a.width) : t = (t = h.map(function (e) {
    return Math.round(e * i);
  })).filter(function (e) {
    return e <= a.width;
  }), "constrained" !== d || t.includes(i) || t.push(i), {
    sizes: t = t.sort(p),
    aspectRatio: c,
    presentationWidth: m,
    presentationHeight: Math.round(m / c),
    unscaledWidth: i
  };
}

function k(e, t) {
  var a = e.width / e.height,
      i = t.width,
      r = t.height;

  switch (t.fit) {
    case "fill":
      i = t.width ? t.width : e.width, r = t.height ? t.height : e.height;
      break;

    case "inside":
      var n = t.width ? t.width : Number.MAX_SAFE_INTEGER,
          o = t.height ? t.height : Number.MAX_SAFE_INTEGER;
      i = Math.min(n, Math.round(o * a)), r = Math.min(o, Math.round(n / a));
      break;

    case "outside":
      var s = t.width ? t.width : 0,
          l = t.height ? t.height : 0;
      i = Math.max(s, Math.round(l * a)), r = Math.max(l, Math.round(s / a));
      break;

    default:
      t.width && !t.height && (i = t.width, r = Math.round(t.width / a)), t.height && !t.width && (i = Math.round(t.height * a), r = t.height);
  }

  return {
    width: i,
    height: r,
    aspectRatio: i / r
  };
}

var M = ["baseUrl", "urlBuilder", "sourceWidth", "sourceHeight", "pluginName", "formats", "breakpoints", "options"],
    S = ["images", "placeholder"];

function N() {
  return "undefined" != typeof GATSBY___IMAGE && GATSBY___IMAGE;
}

new Set();

var R = function (e) {
  var t;
  return function (e) {
    var t, a;
    return Boolean(null == e || null == (t = e.images) || null == (a = t.fallback) ? void 0 : a.src);
  }(e) ? e : function (e) {
    return Boolean(null == e ? void 0 : e.gatsbyImageData);
  }(e) ? e.gatsbyImageData : null == e || null == (t = e.childImageSharp) ? void 0 : t.gatsbyImageData;
},
    x = function (e) {
  var t, a, i;
  return null == (t = R(e)) || null == (a = t.images) || null == (i = a.fallback) ? void 0 : i.src;
},
    I = function (e) {
  var t, a, i;
  return null == (t = R(e)) || null == (a = t.images) || null == (i = a.fallback) ? void 0 : i.srcSet;
};

function W(e) {
  var t,
      a = e.baseUrl,
      i = e.urlBuilder,
      r = e.sourceWidth,
      n = e.sourceHeight,
      o = e.pluginName,
      d = void 0 === o ? "getImageData" : o,
      u = e.formats,
      c = void 0 === u ? ["auto"] : u,
      g = e.breakpoints,
      p = e.options,
      m = l(e, M);
  return null != (t = g) && t.length || "fullWidth" !== m.layout && "FULL_WIDTH" !== m.layout || (g = h), y(s({}, m, {
    pluginName: d,
    generateImageSource: function (e, t, a, r) {
      return {
        width: t,
        height: a,
        format: r,
        src: i({
          baseUrl: e,
          width: t,
          height: a,
          options: p,
          format: r
        })
      };
    },
    filename: a,
    formats: c,
    breakpoints: g,
    sourceMetadata: {
      width: r,
      height: n,
      format: "auto"
    }
  }));
}

function j(e, t) {
  var a,
      i,
      r,
      n = e.images,
      o = e.placeholder,
      d = s({}, l(e, S), {
    images: s({}, n, {
      sources: []
    }),
    placeholder: o && s({}, o, {
      sources: []
    })
  });
  return t.forEach(function (t) {
    var a,
        i = t.media,
        r = t.image;
    i ? (r.layout !== e.layout && "development" === "development" && console.warn('[gatsby-plugin-image] Mismatched image layout: expected "' + e.layout + '" but received "' + r.layout + '". All art-directed images use the same layout as the default image'), (a = d.images.sources).push.apply(a, r.images.sources.map(function (e) {
      return s({}, e, {
        media: i
      });
    }).concat([{
      media: i,
      srcSet: r.images.fallback.srcSet
    }])), d.placeholder && d.placeholder.sources.push({
      media: i,
      srcSet: r.placeholder.fallback
    })) :  true && console.warn("[gatsby-plugin-image] All art-directed images passed to must have a value set for `media`. Skipping.");
  }), (a = d.images.sources).push.apply(a, n.sources), null != o && o.sources && (null == (i = d.placeholder) || (r = i.sources).push.apply(r, o.sources)), d;
}

var _,
    T = ["src", "srcSet", "loading", "alt", "shouldLoad", "innerRef"],
    A = ["fallback", "sources", "shouldLoad"],
    O = function (t) {
  var a = t.src,
      i = t.srcSet,
      r = t.loading,
      n = t.alt,
      o = void 0 === n ? "" : n,
      d = t.shouldLoad,
      u = t.innerRef,
      c = l(t, T);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("img", s({}, c, {
    decoding: "async",
    loading: r,
    src: d ? a : void 0,
    "data-src": d ? void 0 : a,
    srcSet: d ? i : void 0,
    "data-srcset": d ? void 0 : i,
    alt: o,
    ref: u
  }));
},
    z = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.forwardRef)(function (t, a) {
  var i = t.fallback,
      r = t.sources,
      n = void 0 === r ? [] : r,
      o = t.shouldLoad,
      d = void 0 === o || o,
      u = l(t, A),
      c = u.sizes || (null == i ? void 0 : i.sizes),
      h = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(O, s({}, u, i, {
    sizes: c,
    shouldLoad: d,
    innerRef: a
  }));
  return n.length ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("picture", null, n.map(function (t) {
    var a = t.media,
        i = t.srcSet,
        r = t.type;
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("source", {
      key: a + "-" + r + "-" + i,
      type: r,
      media: a,
      srcSet: d ? i : void 0,
      "data-srcset": d ? void 0 : i,
      sizes: c
    });
  }), h) : h;
});

O.propTypes = {
  src: prop_types__WEBPACK_IMPORTED_MODULE_3__.string.isRequired,
  alt: prop_types__WEBPACK_IMPORTED_MODULE_3__.string.isRequired,
  sizes: prop_types__WEBPACK_IMPORTED_MODULE_3__.string,
  srcSet: prop_types__WEBPACK_IMPORTED_MODULE_3__.string,
  shouldLoad: prop_types__WEBPACK_IMPORTED_MODULE_3__.bool
}, z.displayName = "Picture", z.propTypes = {
  alt: prop_types__WEBPACK_IMPORTED_MODULE_3__.string.isRequired,
  shouldLoad: prop_types__WEBPACK_IMPORTED_MODULE_3__.bool,
  fallback: prop_types__WEBPACK_IMPORTED_MODULE_3__.exact({
    src: prop_types__WEBPACK_IMPORTED_MODULE_3__.string.isRequired,
    srcSet: prop_types__WEBPACK_IMPORTED_MODULE_3__.string,
    sizes: prop_types__WEBPACK_IMPORTED_MODULE_3__.string
  }),
  sources: prop_types__WEBPACK_IMPORTED_MODULE_3__.arrayOf(prop_types__WEBPACK_IMPORTED_MODULE_3__.oneOfType([prop_types__WEBPACK_IMPORTED_MODULE_3__.exact({
    media: prop_types__WEBPACK_IMPORTED_MODULE_3__.string.isRequired,
    type: prop_types__WEBPACK_IMPORTED_MODULE_3__.string,
    sizes: prop_types__WEBPACK_IMPORTED_MODULE_3__.string,
    srcSet: prop_types__WEBPACK_IMPORTED_MODULE_3__.string.isRequired
  }), prop_types__WEBPACK_IMPORTED_MODULE_3__.exact({
    media: prop_types__WEBPACK_IMPORTED_MODULE_3__.string,
    type: prop_types__WEBPACK_IMPORTED_MODULE_3__.string.isRequired,
    sizes: prop_types__WEBPACK_IMPORTED_MODULE_3__.string,
    srcSet: prop_types__WEBPACK_IMPORTED_MODULE_3__.string.isRequired
  })]))
};

var L = ["fallback"],
    C = function (t) {
  var a = t.fallback,
      i = l(t, L);
  return a ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(z, s({}, i, {
    fallback: {
      src: a
    },
    "aria-hidden": !0,
    alt: ""
  })) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", s({}, i));
};

C.displayName = "Placeholder", C.propTypes = {
  fallback: prop_types__WEBPACK_IMPORTED_MODULE_3__.string,
  sources: null == (_ = z.propTypes) ? void 0 : _.sources,
  alt: function (e, t, a) {
    return e[t] ? new Error("Invalid prop `" + t + "` supplied to `" + a + "`. Validation failed.") : null;
  }
};
var q = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.forwardRef)(function (t, a) {
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(z, s({
    ref: a
  }, t)), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("noscript", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(z, s({}, t, {
    shouldLoad: !0
  }))));
});
q.displayName = "MainImage", q.propTypes = z.propTypes;

var D = ["children"],
    P = function () {
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("script", {
    type: "module",
    dangerouslySetInnerHTML: {
      __html: 'const t="undefined"!=typeof HTMLImageElement&&"loading"in HTMLImageElement.prototype;if(t){const t=document.querySelectorAll("img[data-main-image]");for(let e of t){e.dataset.src&&(e.setAttribute("src",e.dataset.src),e.removeAttribute("data-src")),e.dataset.srcset&&(e.setAttribute("srcset",e.dataset.srcset),e.removeAttribute("data-srcset"));const t=e.parentNode.querySelectorAll("source[data-srcset]");for(let e of t)e.setAttribute("srcset",e.dataset.srcset),e.removeAttribute("data-srcset");e.complete&&(e.style.opacity=1)}}'
    }
  });
},
    H = function (t) {
  var a = t.layout,
      i = t.width,
      r = t.height;
  return "fullWidth" === a ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    "aria-hidden": !0,
    style: {
      paddingTop: r / i * 100 + "%"
    }
  }) : "constrained" === a ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    style: {
      maxWidth: i,
      display: "block"
    }
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("img", {
    alt: "",
    role: "presentation",
    "aria-hidden": "true",
    src: "data:image/svg+xml;charset=utf-8,%3Csvg height='" + r + "' width='" + i + "' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E%3C/svg%3E",
    style: {
      maxWidth: "100%",
      display: "block",
      position: "static"
    }
  })) : null;
},
    F = function (t) {
  var i = t.children,
      r = l(t, D);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(H, s({}, r)), i, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(P, null));
},
    B = ["as", "children"],
    G = ["as", "className", "class", "style", "image", "loading", "imgClassName", "imgStyle", "backgroundColor", "objectFit", "objectPosition"],
    V = ["style", "className"],
    U = function (e) {
  return e.replace(/\n/g, "");
},
    X = function (t) {
  var a = t.as,
      i = void 0 === a ? "div" : a,
      r = t.children,
      n = l(t, B);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(i, s({}, n), r);
},
    Y = function (t) {
  var a = t.as,
      i = t.className,
      r = t.class,
      n = t.style,
      o = t.image,
      d = t.loading,
      u = void 0 === d ? "lazy" : d,
      c = t.imgClassName,
      h = t.imgStyle,
      g = t.backgroundColor,
      p = t.objectFit,
      m = t.objectPosition,
      f = l(t, G);
  if (!o) return console.warn("[gatsby-plugin-image] Missing image prop"), null;
  r && (i = r), h = s({
    objectFit: p,
    objectPosition: m,
    backgroundColor: g
  }, h);

  var v = o.width,
      w = o.height,
      y = o.layout,
      b = o.images,
      E = o.placeholder,
      k = o.backgroundColor,
      M = function (e, t, a) {
    var i = {},
        r = "gatsby-image-wrapper";
    return N() || (i.position = "relative", i.overflow = "hidden"), "fixed" === a ? (i.width = e, i.height = t) : "constrained" === a && (N() || (i.display = "inline-block", i.verticalAlign = "top"), r = "gatsby-image-wrapper gatsby-image-wrapper-constrained"), {
      className: r,
      "data-gatsby-image-wrapper": "",
      style: i
    };
  }(v, w, y),
      S = M.style,
      R = M.className,
      x = l(M, V),
      I = {
    fallback: void 0,
    sources: []
  };

  return b.fallback && (I.fallback = s({}, b.fallback, {
    srcSet: b.fallback.srcSet ? U(b.fallback.srcSet) : void 0
  })), b.sources && (I.sources = b.sources.map(function (e) {
    return s({}, e, {
      srcSet: U(e.srcSet)
    });
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(X, s({}, x, {
    as: a,
    style: s({}, S, n, {
      backgroundColor: g
    }),
    className: R + (i ? " " + i : "")
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(F, {
    layout: y,
    width: v,
    height: w
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(C, s({}, function (e, t, a, i, r, n, o, l) {
    var d = {};
    n && (d.backgroundColor = n, "fixed" === a ? (d.width = i, d.height = r, d.backgroundColor = n, d.position = "relative") : ("constrained" === a || "fullWidth" === a) && (d.position = "absolute", d.top = 0, d.left = 0, d.bottom = 0, d.right = 0)), o && (d.objectFit = o), l && (d.objectPosition = l);
    var u = s({}, e, {
      "aria-hidden": !0,
      "data-placeholder-image": "",
      style: s({
        opacity: 1,
        transition: "opacity 500ms linear"
      }, d)
    });
    return N() || (u.style = {
      height: "100%",
      left: 0,
      position: "absolute",
      top: 0,
      width: "100%"
    }), u;
  }(E, 0, y, v, w, k, p, m))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(q, s({
    "data-gatsby-image-ssr": "",
    className: c
  }, f, function (e, t, a, i, r, n, o, l) {
    return void 0 === l && (l = {}), N() || (l = s({
      height: "100%",
      left: 0,
      position: "absolute",
      top: 0,
      transform: "translateZ(0)",
      transition: "opacity 250ms linear",
      width: "100%",
      willChange: "opacity"
    }, l)), s({}, a, {
      loading: i,
      shouldLoad: e,
      "data-main-image": "",
      style: s({}, l, {
        opacity: 0
      }),
      onLoad: function (e) {
        var t = e.currentTarget,
            a = new Image();
        a.src = t.currentSrc, a.decode ? a.decode().catch(function () {}).then(function () {
          r(!0);
        }) : r(!0);
      },
      ref: void 0
    });
  }("eager" === u, 0, I, u, void 0, 0, 0, h)))));
},
    Z = ["src", "__imageData", "__error", "width", "height", "aspectRatio", "tracedSVGOptions", "placeholder", "formats", "quality", "transformOptions", "jpgOptions", "pngOptions", "webpOptions", "avifOptions", "blurredOptions"],
    J = function (t) {
  return function (a) {
    var i = a.src,
        r = a.__imageData,
        n = a.__error,
        o = l(a, Z);
    return n && console.warn(n), r ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(t, s({
      image: r
    }, o)) : (console.warn("Image not loaded", i), n || "development" !== "development" || console.warn('Please ensure that "gatsby-plugin-image" is included in the plugins array in gatsby-config.js, and that your version of gatsby is at least 2.24.78'), null);
  };
}(Y),
    K = function (e, t) {
  return "fullWidth" !== e.layout || "width" !== t && "height" !== t || !e[t] ? prop_types__WEBPACK_IMPORTED_MODULE_3___default().number.apply((prop_types__WEBPACK_IMPORTED_MODULE_3___default()), [e, t].concat([].slice.call(arguments, 2))) : new Error('"' + t + '" ' + e[t] + " may not be passed when layout is fullWidth.");
},
    Q = new Set(["fixed", "fullWidth", "constrained"]),
    $ = {
  src: (prop_types__WEBPACK_IMPORTED_MODULE_3___default().string.isRequired),
  alt: function (e, t, a) {
    return e.alt || "" === e.alt ? prop_types__WEBPACK_IMPORTED_MODULE_3___default().string.apply((prop_types__WEBPACK_IMPORTED_MODULE_3___default()), [e, t, a].concat([].slice.call(arguments, 3))) : new Error('The "alt" prop is required in ' + a + '. If the image is purely presentational then pass an empty string: e.g. alt="". Learn more: https://a11y-style-guide.com/style-guide/section-media.html');
  },
  width: K,
  height: K,
  sizes: (prop_types__WEBPACK_IMPORTED_MODULE_3___default().string),
  layout: function (e) {
    if (void 0 !== e.layout && !Q.has(e.layout)) return new Error("Invalid value " + e.layout + '" provided for prop "layout". Defaulting to "constrained". Valid values are "fixed", "fullWidth" or "constrained".');
  }
};

J.displayName = "StaticImage", J.propTypes = $;


/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/TemplateTag.js":
/*!*************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/TemplateTag.js ***!
  \*************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var _templateObject = _taggedTemplateLiteral(['', ''], ['', '']);

function _taggedTemplateLiteral(strings, raw) {
  return Object.freeze(Object.defineProperties(strings, {
    raw: {
      value: Object.freeze(raw)
    }
  }));
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
/**
 * @class TemplateTag
 * @classdesc Consumes a pipeline of composable transformer plugins and produces a template tag.
 */


var TemplateTag = function () {
  /**
   * constructs a template tag
   * @constructs TemplateTag
   * @param  {...Object} [...transformers] - an array or arguments list of transformers
   * @return {Function}                    - a template tag
   */
  function TemplateTag() {
    var _this = this;

    for (var _len = arguments.length, transformers = Array(_len), _key = 0; _key < _len; _key++) {
      transformers[_key] = arguments[_key];
    }

    _classCallCheck(this, TemplateTag);

    this.tag = function (strings) {
      for (var _len2 = arguments.length, expressions = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        expressions[_key2 - 1] = arguments[_key2];
      }

      if (typeof strings === 'function') {
        // if the first argument passed is a function, assume it is a template tag and return
        // an intermediary tag that processes the template using the aforementioned tag, passing the
        // result to our tag
        return _this.interimTag.bind(_this, strings);
      }

      if (typeof strings === 'string') {
        // if the first argument passed is a string, just transform it
        return _this.transformEndResult(strings);
      } // else, return a transformed end result of processing the template with our tag


      strings = strings.map(_this.transformString.bind(_this));
      return _this.transformEndResult(strings.reduce(_this.processSubstitutions.bind(_this, expressions)));
    }; // if first argument is an array, extrude it as a list of transformers


    if (transformers.length > 0 && Array.isArray(transformers[0])) {
      transformers = transformers[0];
    } // if any transformers are functions, this means they are not initiated - automatically initiate them


    this.transformers = transformers.map(function (transformer) {
      return typeof transformer === 'function' ? transformer() : transformer;
    }); // return an ES2015 template tag

    return this.tag;
  }
  /**
   * Applies all transformers to a template literal tagged with this method.
   * If a function is passed as the first argument, assumes the function is a template tag
   * and applies it to the template, returning a template tag.
   * @param  {(Function|String|Array<String>)} strings        - Either a template tag or an array containing template strings separated by identifier
   * @param  {...*}                            ...expressions - Optional list of substitution values.
   * @return {(String|Function)}                              - Either an intermediary tag function or the results of processing the template.
   */


  _createClass(TemplateTag, [{
    key: 'interimTag',

    /**
     * An intermediary template tag that receives a template tag and passes the result of calling the template with the received
     * template tag to our own template tag.
     * @param  {Function}        nextTag          - the received template tag
     * @param  {Array<String>}   template         - the template to process
     * @param  {...*}            ...substitutions - `substitutions` is an array of all substitutions in the template
     * @return {*}                                - the final processed value
     */
    value: function interimTag(previousTag, template) {
      for (var _len3 = arguments.length, substitutions = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
        substitutions[_key3 - 2] = arguments[_key3];
      }

      return this.tag(_templateObject, previousTag.apply(undefined, [template].concat(substitutions)));
    }
    /**
     * Performs bulk processing on the tagged template, transforming each substitution and then
     * concatenating the resulting values into a string.
     * @param  {Array<*>} substitutions - an array of all remaining substitutions present in this template
     * @param  {String}   resultSoFar   - this iteration's result string so far
     * @param  {String}   remainingPart - the template chunk after the current substitution
     * @return {String}                 - the result of joining this iteration's processed substitution with the result
     */

  }, {
    key: 'processSubstitutions',
    value: function processSubstitutions(substitutions, resultSoFar, remainingPart) {
      var substitution = this.transformSubstitution(substitutions.shift(), resultSoFar);
      return ''.concat(resultSoFar, substitution, remainingPart);
    }
    /**
     * Iterate through each transformer, applying the transformer's `onString` method to the template
     * strings before all substitutions are processed.
     * @param {String}  str - The input string
     * @return {String}     - The final results of processing each transformer
     */

  }, {
    key: 'transformString',
    value: function transformString(str) {
      var cb = function cb(res, transform) {
        return transform.onString ? transform.onString(res) : res;
      };

      return this.transformers.reduce(cb, str);
    }
    /**
     * When a substitution is encountered, iterates through each transformer and applies the transformer's
     * `onSubstitution` method to the substitution.
     * @param  {*}      substitution - The current substitution
     * @param  {String} resultSoFar  - The result up to and excluding this substitution.
     * @return {*}                   - The final result of applying all substitution transformations.
     */

  }, {
    key: 'transformSubstitution',
    value: function transformSubstitution(substitution, resultSoFar) {
      var cb = function cb(res, transform) {
        return transform.onSubstitution ? transform.onSubstitution(res, resultSoFar) : res;
      };

      return this.transformers.reduce(cb, substitution);
    }
    /**
     * Iterates through each transformer, applying the transformer's `onEndResult` method to the
     * template literal after all substitutions have finished processing.
     * @param  {String} endResult - The processed template, just before it is returned from the tag
     * @return {String}           - The final results of processing each transformer
     */

  }, {
    key: 'transformEndResult',
    value: function transformEndResult(endResult) {
      var cb = function cb(res, transform) {
        return transform.onEndResult ? transform.onEndResult(res) : res;
      };

      return this.transformers.reduce(cb, endResult);
    }
  }]);

  return TemplateTag;
}();

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (TemplateTag);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/index.js":
/*!*******************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/index.js ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _TemplateTag__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _TemplateTag__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./TemplateTag */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/TemplateTag.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/codeBlock/index.js":
/*!*****************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/codeBlock/index.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _html__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _html__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../html */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/html/index.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/commaLists/commaLists.js":
/*!***********************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/commaLists/commaLists.js ***!
  \***********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _TemplateTag__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../TemplateTag */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/index.js");
/* harmony import */ var _stripIndentTransformer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../stripIndentTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndentTransformer/index.js");
/* harmony import */ var _inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../inlineArrayTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineArrayTransformer/index.js");
/* harmony import */ var _trimResultTransformer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../trimResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/index.js");




var commaLists = new _TemplateTag__WEBPACK_IMPORTED_MODULE_0__["default"]((0,_inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_2__["default"])({
  separator: ','
}), _stripIndentTransformer__WEBPACK_IMPORTED_MODULE_1__["default"], _trimResultTransformer__WEBPACK_IMPORTED_MODULE_3__["default"]);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (commaLists);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/commaLists/index.js":
/*!******************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/commaLists/index.js ***!
  \******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _commaLists__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _commaLists__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./commaLists */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/commaLists/commaLists.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/commaListsAnd/commaListsAnd.js":
/*!*****************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/commaListsAnd/commaListsAnd.js ***!
  \*****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _TemplateTag__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../TemplateTag */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/index.js");
/* harmony import */ var _stripIndentTransformer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../stripIndentTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndentTransformer/index.js");
/* harmony import */ var _inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../inlineArrayTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineArrayTransformer/index.js");
/* harmony import */ var _trimResultTransformer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../trimResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/index.js");




var commaListsAnd = new _TemplateTag__WEBPACK_IMPORTED_MODULE_0__["default"]((0,_inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_2__["default"])({
  separator: ',',
  conjunction: 'and'
}), _stripIndentTransformer__WEBPACK_IMPORTED_MODULE_1__["default"], _trimResultTransformer__WEBPACK_IMPORTED_MODULE_3__["default"]);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (commaListsAnd);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/commaListsAnd/index.js":
/*!*********************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/commaListsAnd/index.js ***!
  \*********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _commaListsAnd__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _commaListsAnd__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./commaListsAnd */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/commaListsAnd/commaListsAnd.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/commaListsOr/commaListsOr.js":
/*!***************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/commaListsOr/commaListsOr.js ***!
  \***************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _TemplateTag__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../TemplateTag */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/index.js");
/* harmony import */ var _stripIndentTransformer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../stripIndentTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndentTransformer/index.js");
/* harmony import */ var _inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../inlineArrayTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineArrayTransformer/index.js");
/* harmony import */ var _trimResultTransformer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../trimResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/index.js");




var commaListsOr = new _TemplateTag__WEBPACK_IMPORTED_MODULE_0__["default"]((0,_inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_2__["default"])({
  separator: ',',
  conjunction: 'or'
}), _stripIndentTransformer__WEBPACK_IMPORTED_MODULE_1__["default"], _trimResultTransformer__WEBPACK_IMPORTED_MODULE_3__["default"]);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (commaListsOr);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/commaListsOr/index.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/commaListsOr/index.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _commaListsOr__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _commaListsOr__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./commaListsOr */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/commaListsOr/commaListsOr.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/html/html.js":
/*!***********************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/html/html.js ***!
  \***********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _TemplateTag__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../TemplateTag */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/index.js");
/* harmony import */ var _stripIndentTransformer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../stripIndentTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndentTransformer/index.js");
/* harmony import */ var _inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../inlineArrayTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineArrayTransformer/index.js");
/* harmony import */ var _trimResultTransformer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../trimResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/index.js");
/* harmony import */ var _splitStringTransformer__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../splitStringTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/splitStringTransformer/index.js");
/* harmony import */ var _removeNonPrintingValuesTransformer__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../removeNonPrintingValuesTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/removeNonPrintingValuesTransformer/index.js");






var html = new _TemplateTag__WEBPACK_IMPORTED_MODULE_0__["default"]((0,_splitStringTransformer__WEBPACK_IMPORTED_MODULE_4__["default"])('\n'), _removeNonPrintingValuesTransformer__WEBPACK_IMPORTED_MODULE_5__["default"], _inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_2__["default"], _stripIndentTransformer__WEBPACK_IMPORTED_MODULE_1__["default"], _trimResultTransformer__WEBPACK_IMPORTED_MODULE_3__["default"]);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (html);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/html/index.js":
/*!************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/html/index.js ***!
  \************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _html__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _html__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./html */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/html/html.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/index.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/index.js ***!
  \*******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TemplateTag": () => (/* reexport safe */ _TemplateTag__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   "trimResultTransformer": () => (/* reexport safe */ _trimResultTransformer__WEBPACK_IMPORTED_MODULE_1__["default"]),
/* harmony export */   "stripIndentTransformer": () => (/* reexport safe */ _stripIndentTransformer__WEBPACK_IMPORTED_MODULE_2__["default"]),
/* harmony export */   "replaceResultTransformer": () => (/* reexport safe */ _replaceResultTransformer__WEBPACK_IMPORTED_MODULE_3__["default"]),
/* harmony export */   "replaceSubstitutionTransformer": () => (/* reexport safe */ _replaceSubstitutionTransformer__WEBPACK_IMPORTED_MODULE_4__["default"]),
/* harmony export */   "replaceStringTransformer": () => (/* reexport safe */ _replaceStringTransformer__WEBPACK_IMPORTED_MODULE_5__["default"]),
/* harmony export */   "inlineArrayTransformer": () => (/* reexport safe */ _inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_6__["default"]),
/* harmony export */   "splitStringTransformer": () => (/* reexport safe */ _splitStringTransformer__WEBPACK_IMPORTED_MODULE_7__["default"]),
/* harmony export */   "removeNonPrintingValuesTransformer": () => (/* reexport safe */ _removeNonPrintingValuesTransformer__WEBPACK_IMPORTED_MODULE_8__["default"]),
/* harmony export */   "commaLists": () => (/* reexport safe */ _commaLists__WEBPACK_IMPORTED_MODULE_9__["default"]),
/* harmony export */   "commaListsAnd": () => (/* reexport safe */ _commaListsAnd__WEBPACK_IMPORTED_MODULE_10__["default"]),
/* harmony export */   "commaListsOr": () => (/* reexport safe */ _commaListsOr__WEBPACK_IMPORTED_MODULE_11__["default"]),
/* harmony export */   "html": () => (/* reexport safe */ _html__WEBPACK_IMPORTED_MODULE_12__["default"]),
/* harmony export */   "codeBlock": () => (/* reexport safe */ _codeBlock__WEBPACK_IMPORTED_MODULE_13__["default"]),
/* harmony export */   "source": () => (/* reexport safe */ _source__WEBPACK_IMPORTED_MODULE_14__["default"]),
/* harmony export */   "safeHtml": () => (/* reexport safe */ _safeHtml__WEBPACK_IMPORTED_MODULE_15__["default"]),
/* harmony export */   "oneLine": () => (/* reexport safe */ _oneLine__WEBPACK_IMPORTED_MODULE_16__["default"]),
/* harmony export */   "oneLineTrim": () => (/* reexport safe */ _oneLineTrim__WEBPACK_IMPORTED_MODULE_17__["default"]),
/* harmony export */   "oneLineCommaLists": () => (/* reexport safe */ _oneLineCommaLists__WEBPACK_IMPORTED_MODULE_18__["default"]),
/* harmony export */   "oneLineCommaListsOr": () => (/* reexport safe */ _oneLineCommaListsOr__WEBPACK_IMPORTED_MODULE_19__["default"]),
/* harmony export */   "oneLineCommaListsAnd": () => (/* reexport safe */ _oneLineCommaListsAnd__WEBPACK_IMPORTED_MODULE_20__["default"]),
/* harmony export */   "inlineLists": () => (/* reexport safe */ _inlineLists__WEBPACK_IMPORTED_MODULE_21__["default"]),
/* harmony export */   "oneLineInlineLists": () => (/* reexport safe */ _oneLineInlineLists__WEBPACK_IMPORTED_MODULE_22__["default"]),
/* harmony export */   "stripIndent": () => (/* reexport safe */ _stripIndent__WEBPACK_IMPORTED_MODULE_23__["default"]),
/* harmony export */   "stripIndents": () => (/* reexport safe */ _stripIndents__WEBPACK_IMPORTED_MODULE_24__["default"])
/* harmony export */ });
/* harmony import */ var _TemplateTag__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./TemplateTag */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/index.js");
/* harmony import */ var _trimResultTransformer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./trimResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/index.js");
/* harmony import */ var _stripIndentTransformer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./stripIndentTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndentTransformer/index.js");
/* harmony import */ var _replaceResultTransformer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./replaceResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceResultTransformer/index.js");
/* harmony import */ var _replaceSubstitutionTransformer__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./replaceSubstitutionTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceSubstitutionTransformer/index.js");
/* harmony import */ var _replaceStringTransformer__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./replaceStringTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceStringTransformer/index.js");
/* harmony import */ var _inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./inlineArrayTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineArrayTransformer/index.js");
/* harmony import */ var _splitStringTransformer__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./splitStringTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/splitStringTransformer/index.js");
/* harmony import */ var _removeNonPrintingValuesTransformer__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./removeNonPrintingValuesTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/removeNonPrintingValuesTransformer/index.js");
/* harmony import */ var _commaLists__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./commaLists */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/commaLists/index.js");
/* harmony import */ var _commaListsAnd__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./commaListsAnd */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/commaListsAnd/index.js");
/* harmony import */ var _commaListsOr__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./commaListsOr */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/commaListsOr/index.js");
/* harmony import */ var _html__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./html */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/html/index.js");
/* harmony import */ var _codeBlock__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./codeBlock */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/codeBlock/index.js");
/* harmony import */ var _source__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./source */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/source/index.js");
/* harmony import */ var _safeHtml__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./safeHtml */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/safeHtml/index.js");
/* harmony import */ var _oneLine__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./oneLine */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLine/index.js");
/* harmony import */ var _oneLineTrim__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./oneLineTrim */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineTrim/index.js");
/* harmony import */ var _oneLineCommaLists__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./oneLineCommaLists */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineCommaLists/index.js");
/* harmony import */ var _oneLineCommaListsOr__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./oneLineCommaListsOr */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineCommaListsOr/index.js");
/* harmony import */ var _oneLineCommaListsAnd__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ./oneLineCommaListsAnd */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineCommaListsAnd/index.js");
/* harmony import */ var _inlineLists__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ./inlineLists */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineLists/index.js");
/* harmony import */ var _oneLineInlineLists__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ./oneLineInlineLists */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineInlineLists/index.js");
/* harmony import */ var _stripIndent__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! ./stripIndent */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndent/index.js");
/* harmony import */ var _stripIndents__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! ./stripIndents */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndents/index.js");
// core

 // transformers
















 // tags


































/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineArrayTransformer/index.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineArrayTransformer/index.js ***!
  \******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./inlineArrayTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineArrayTransformer/inlineArrayTransformer.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineArrayTransformer/inlineArrayTransformer.js":
/*!***********************************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineArrayTransformer/inlineArrayTransformer.js ***!
  \***********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
var defaults = {
  separator: '',
  conjunction: '',
  serial: false
};
/**
 * Converts an array substitution to a string containing a list
 * @param  {String} [opts.separator = ''] - the character that separates each item
 * @param  {String} [opts.conjunction = '']  - replace the last separator with this
 * @param  {Boolean} [opts.serial = false] - include the separator before the conjunction? (Oxford comma use-case)
 *
 * @return {Object}                     - a TemplateTag transformer
 */

var inlineArrayTransformer = function inlineArrayTransformer() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaults;
  return {
    onSubstitution: function onSubstitution(substitution, resultSoFar) {
      // only operate on arrays
      if (Array.isArray(substitution)) {
        var arrayLength = substitution.length;
        var separator = opts.separator;
        var conjunction = opts.conjunction;
        var serial = opts.serial; // join each item in the array into a string where each item is separated by separator
        // be sure to maintain indentation

        var indent = resultSoFar.match(/(\n?[^\S\n]+)$/);

        if (indent) {
          substitution = substitution.join(separator + indent[1]);
        } else {
          substitution = substitution.join(separator + ' ');
        } // if conjunction is set, replace the last separator with conjunction, but only if there is more than one substitution


        if (conjunction && arrayLength > 1) {
          var separatorIndex = substitution.lastIndexOf(separator);
          substitution = substitution.slice(0, separatorIndex) + (serial ? separator : '') + ' ' + conjunction + substitution.slice(separatorIndex + 1);
        }
      }

      return substitution;
    }
  };
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (inlineArrayTransformer);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineLists/index.js":
/*!*******************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineLists/index.js ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _inlineLists__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _inlineLists__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./inlineLists */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineLists/inlineLists.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineLists/inlineLists.js":
/*!*************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineLists/inlineLists.js ***!
  \*************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _TemplateTag__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../TemplateTag */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/index.js");
/* harmony import */ var _stripIndentTransformer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../stripIndentTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndentTransformer/index.js");
/* harmony import */ var _inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../inlineArrayTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineArrayTransformer/index.js");
/* harmony import */ var _trimResultTransformer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../trimResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/index.js");




var inlineLists = new _TemplateTag__WEBPACK_IMPORTED_MODULE_0__["default"](_inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_2__["default"], _stripIndentTransformer__WEBPACK_IMPORTED_MODULE_1__["default"], _trimResultTransformer__WEBPACK_IMPORTED_MODULE_3__["default"]);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (inlineLists);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLine/index.js":
/*!***************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLine/index.js ***!
  \***************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _oneLine__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _oneLine__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./oneLine */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLine/oneLine.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLine/oneLine.js":
/*!*****************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLine/oneLine.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _TemplateTag__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../TemplateTag */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/index.js");
/* harmony import */ var _trimResultTransformer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../trimResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/index.js");
/* harmony import */ var _replaceResultTransformer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../replaceResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceResultTransformer/index.js");



var oneLine = new _TemplateTag__WEBPACK_IMPORTED_MODULE_0__["default"]((0,_replaceResultTransformer__WEBPACK_IMPORTED_MODULE_2__["default"])(/(?:\n(?:\s*))+/g, ' '), _trimResultTransformer__WEBPACK_IMPORTED_MODULE_1__["default"]);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (oneLine);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineCommaLists/index.js":
/*!*************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineCommaLists/index.js ***!
  \*************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _oneLineCommaLists__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _oneLineCommaLists__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./oneLineCommaLists */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineCommaLists/oneLineCommaLists.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineCommaLists/oneLineCommaLists.js":
/*!*************************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineCommaLists/oneLineCommaLists.js ***!
  \*************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _TemplateTag__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../TemplateTag */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/index.js");
/* harmony import */ var _inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../inlineArrayTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineArrayTransformer/index.js");
/* harmony import */ var _trimResultTransformer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../trimResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/index.js");
/* harmony import */ var _replaceResultTransformer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../replaceResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceResultTransformer/index.js");




var oneLineCommaLists = new _TemplateTag__WEBPACK_IMPORTED_MODULE_0__["default"]((0,_inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_1__["default"])({
  separator: ','
}), (0,_replaceResultTransformer__WEBPACK_IMPORTED_MODULE_3__["default"])(/(?:\s+)/g, ' '), _trimResultTransformer__WEBPACK_IMPORTED_MODULE_2__["default"]);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (oneLineCommaLists);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineCommaListsAnd/index.js":
/*!****************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineCommaListsAnd/index.js ***!
  \****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _oneLineCommaListsAnd__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _oneLineCommaListsAnd__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./oneLineCommaListsAnd */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineCommaListsAnd/oneLineCommaListsAnd.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineCommaListsAnd/oneLineCommaListsAnd.js":
/*!*******************************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineCommaListsAnd/oneLineCommaListsAnd.js ***!
  \*******************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _TemplateTag__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../TemplateTag */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/index.js");
/* harmony import */ var _inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../inlineArrayTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineArrayTransformer/index.js");
/* harmony import */ var _trimResultTransformer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../trimResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/index.js");
/* harmony import */ var _replaceResultTransformer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../replaceResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceResultTransformer/index.js");




var oneLineCommaListsAnd = new _TemplateTag__WEBPACK_IMPORTED_MODULE_0__["default"]((0,_inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_1__["default"])({
  separator: ',',
  conjunction: 'and'
}), (0,_replaceResultTransformer__WEBPACK_IMPORTED_MODULE_3__["default"])(/(?:\s+)/g, ' '), _trimResultTransformer__WEBPACK_IMPORTED_MODULE_2__["default"]);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (oneLineCommaListsAnd);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineCommaListsOr/index.js":
/*!***************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineCommaListsOr/index.js ***!
  \***************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _oneLineCommaListsOr__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _oneLineCommaListsOr__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./oneLineCommaListsOr */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineCommaListsOr/oneLineCommaListsOr.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineCommaListsOr/oneLineCommaListsOr.js":
/*!*****************************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineCommaListsOr/oneLineCommaListsOr.js ***!
  \*****************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _TemplateTag__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../TemplateTag */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/index.js");
/* harmony import */ var _inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../inlineArrayTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineArrayTransformer/index.js");
/* harmony import */ var _trimResultTransformer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../trimResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/index.js");
/* harmony import */ var _replaceResultTransformer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../replaceResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceResultTransformer/index.js");




var oneLineCommaListsOr = new _TemplateTag__WEBPACK_IMPORTED_MODULE_0__["default"]((0,_inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_1__["default"])({
  separator: ',',
  conjunction: 'or'
}), (0,_replaceResultTransformer__WEBPACK_IMPORTED_MODULE_3__["default"])(/(?:\s+)/g, ' '), _trimResultTransformer__WEBPACK_IMPORTED_MODULE_2__["default"]);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (oneLineCommaListsOr);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineInlineLists/index.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineInlineLists/index.js ***!
  \**************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _oneLineInlineLists__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _oneLineInlineLists__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./oneLineInlineLists */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineInlineLists/oneLineInlineLists.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineInlineLists/oneLineInlineLists.js":
/*!***************************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineInlineLists/oneLineInlineLists.js ***!
  \***************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _TemplateTag__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../TemplateTag */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/index.js");
/* harmony import */ var _inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../inlineArrayTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineArrayTransformer/index.js");
/* harmony import */ var _trimResultTransformer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../trimResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/index.js");
/* harmony import */ var _replaceResultTransformer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../replaceResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceResultTransformer/index.js");




var oneLineInlineLists = new _TemplateTag__WEBPACK_IMPORTED_MODULE_0__["default"](_inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_1__["default"], (0,_replaceResultTransformer__WEBPACK_IMPORTED_MODULE_3__["default"])(/(?:\s+)/g, ' '), _trimResultTransformer__WEBPACK_IMPORTED_MODULE_2__["default"]);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (oneLineInlineLists);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineTrim/index.js":
/*!*******************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineTrim/index.js ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _oneLineTrim__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _oneLineTrim__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./oneLineTrim */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineTrim/oneLineTrim.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineTrim/oneLineTrim.js":
/*!*************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/oneLineTrim/oneLineTrim.js ***!
  \*************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _TemplateTag__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../TemplateTag */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/index.js");
/* harmony import */ var _trimResultTransformer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../trimResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/index.js");
/* harmony import */ var _replaceResultTransformer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../replaceResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceResultTransformer/index.js");



var oneLineTrim = new _TemplateTag__WEBPACK_IMPORTED_MODULE_0__["default"]((0,_replaceResultTransformer__WEBPACK_IMPORTED_MODULE_2__["default"])(/(?:\n\s*)/g, ''), _trimResultTransformer__WEBPACK_IMPORTED_MODULE_1__["default"]);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (oneLineTrim);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/removeNonPrintingValuesTransformer/index.js":
/*!******************************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/removeNonPrintingValuesTransformer/index.js ***!
  \******************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _removeNonPrintingValuesTransformer__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _removeNonPrintingValuesTransformer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./removeNonPrintingValuesTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/removeNonPrintingValuesTransformer/removeNonPrintingValuesTransformer.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/removeNonPrintingValuesTransformer/removeNonPrintingValuesTransformer.js":
/*!***********************************************************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/removeNonPrintingValuesTransformer/removeNonPrintingValuesTransformer.js ***!
  \***********************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
var isValidValue = function isValidValue(x) {
  return x != null && !Number.isNaN(x) && typeof x !== 'boolean';
};

var removeNonPrintingValuesTransformer = function removeNonPrintingValuesTransformer() {
  return {
    onSubstitution: function onSubstitution(substitution) {
      if (Array.isArray(substitution)) {
        return substitution.filter(isValidValue);
      }

      if (isValidValue(substitution)) {
        return substitution;
      }

      return '';
    }
  };
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (removeNonPrintingValuesTransformer);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceResultTransformer/index.js":
/*!********************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceResultTransformer/index.js ***!
  \********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _replaceResultTransformer__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _replaceResultTransformer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./replaceResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceResultTransformer/replaceResultTransformer.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceResultTransformer/replaceResultTransformer.js":
/*!***************************************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceResultTransformer/replaceResultTransformer.js ***!
  \***************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Replaces tabs, newlines and spaces with the chosen value when they occur in sequences
 * @param  {(String|RegExp)} replaceWhat - the value or pattern that should be replaced
 * @param  {*}               replaceWith - the replacement value
 * @return {Object}                      - a TemplateTag transformer
 */
var replaceResultTransformer = function replaceResultTransformer(replaceWhat, replaceWith) {
  return {
    onEndResult: function onEndResult(endResult) {
      if (replaceWhat == null || replaceWith == null) {
        throw new Error('replaceResultTransformer requires at least 2 arguments.');
      }

      return endResult.replace(replaceWhat, replaceWith);
    }
  };
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (replaceResultTransformer);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceStringTransformer/index.js":
/*!********************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceStringTransformer/index.js ***!
  \********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _replaceStringTransformer__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _replaceStringTransformer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./replaceStringTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceStringTransformer/replaceStringTransformer.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceStringTransformer/replaceStringTransformer.js":
/*!***************************************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceStringTransformer/replaceStringTransformer.js ***!
  \***************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
var replaceStringTransformer = function replaceStringTransformer(replaceWhat, replaceWith) {
  return {
    onString: function onString(str) {
      if (replaceWhat == null || replaceWith == null) {
        throw new Error('replaceStringTransformer requires at least 2 arguments.');
      }

      return str.replace(replaceWhat, replaceWith);
    }
  };
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (replaceStringTransformer);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceSubstitutionTransformer/index.js":
/*!**************************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceSubstitutionTransformer/index.js ***!
  \**************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _replaceSubstitutionTransformer__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _replaceSubstitutionTransformer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./replaceSubstitutionTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceSubstitutionTransformer/replaceSubstitutionTransformer.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceSubstitutionTransformer/replaceSubstitutionTransformer.js":
/*!***************************************************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceSubstitutionTransformer/replaceSubstitutionTransformer.js ***!
  \***************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
var replaceSubstitutionTransformer = function replaceSubstitutionTransformer(replaceWhat, replaceWith) {
  return {
    onSubstitution: function onSubstitution(substitution, resultSoFar) {
      if (replaceWhat == null || replaceWith == null) {
        throw new Error('replaceSubstitutionTransformer requires at least 2 arguments.');
      } // Do not touch if null or undefined


      if (substitution == null) {
        return substitution;
      } else {
        return substitution.toString().replace(replaceWhat, replaceWith);
      }
    }
  };
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (replaceSubstitutionTransformer);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/safeHtml/index.js":
/*!****************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/safeHtml/index.js ***!
  \****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _safeHtml__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _safeHtml__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./safeHtml */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/safeHtml/safeHtml.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/safeHtml/safeHtml.js":
/*!*******************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/safeHtml/safeHtml.js ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _TemplateTag__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../TemplateTag */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/index.js");
/* harmony import */ var _stripIndentTransformer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../stripIndentTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndentTransformer/index.js");
/* harmony import */ var _inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../inlineArrayTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/inlineArrayTransformer/index.js");
/* harmony import */ var _trimResultTransformer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../trimResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/index.js");
/* harmony import */ var _splitStringTransformer__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../splitStringTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/splitStringTransformer/index.js");
/* harmony import */ var _replaceSubstitutionTransformer__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../replaceSubstitutionTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/replaceSubstitutionTransformer/index.js");






var safeHtml = new _TemplateTag__WEBPACK_IMPORTED_MODULE_0__["default"]((0,_splitStringTransformer__WEBPACK_IMPORTED_MODULE_4__["default"])('\n'), _inlineArrayTransformer__WEBPACK_IMPORTED_MODULE_2__["default"], _stripIndentTransformer__WEBPACK_IMPORTED_MODULE_1__["default"], _trimResultTransformer__WEBPACK_IMPORTED_MODULE_3__["default"], (0,_replaceSubstitutionTransformer__WEBPACK_IMPORTED_MODULE_5__["default"])(/&/g, '&amp;'), (0,_replaceSubstitutionTransformer__WEBPACK_IMPORTED_MODULE_5__["default"])(/</g, '&lt;'), (0,_replaceSubstitutionTransformer__WEBPACK_IMPORTED_MODULE_5__["default"])(/>/g, '&gt;'), (0,_replaceSubstitutionTransformer__WEBPACK_IMPORTED_MODULE_5__["default"])(/"/g, '&quot;'), (0,_replaceSubstitutionTransformer__WEBPACK_IMPORTED_MODULE_5__["default"])(/'/g, '&#x27;'), (0,_replaceSubstitutionTransformer__WEBPACK_IMPORTED_MODULE_5__["default"])(/`/g, '&#x60;'));
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (safeHtml);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/source/index.js":
/*!**************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/source/index.js ***!
  \**************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _html__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _html__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../html */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/html/index.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/splitStringTransformer/index.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/splitStringTransformer/index.js ***!
  \******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _splitStringTransformer__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _splitStringTransformer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./splitStringTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/splitStringTransformer/splitStringTransformer.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/splitStringTransformer/splitStringTransformer.js":
/*!***********************************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/splitStringTransformer/splitStringTransformer.js ***!
  \***********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
var splitStringTransformer = function splitStringTransformer(splitBy) {
  return {
    onSubstitution: function onSubstitution(substitution, resultSoFar) {
      if (splitBy != null && typeof splitBy === 'string') {
        if (typeof substitution === 'string' && substitution.includes(splitBy)) {
          substitution = substitution.split(splitBy);
        }
      } else {
        throw new Error('You need to specify a string character to split by.');
      }

      return substitution;
    }
  };
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (splitStringTransformer);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndent/index.js":
/*!*******************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndent/index.js ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _stripIndent__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _stripIndent__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./stripIndent */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndent/stripIndent.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndent/stripIndent.js":
/*!*************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndent/stripIndent.js ***!
  \*************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _TemplateTag__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../TemplateTag */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/index.js");
/* harmony import */ var _stripIndentTransformer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../stripIndentTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndentTransformer/index.js");
/* harmony import */ var _trimResultTransformer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../trimResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/index.js");



var stripIndent = new _TemplateTag__WEBPACK_IMPORTED_MODULE_0__["default"](_stripIndentTransformer__WEBPACK_IMPORTED_MODULE_1__["default"], _trimResultTransformer__WEBPACK_IMPORTED_MODULE_2__["default"]);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (stripIndent);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndentTransformer/index.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndentTransformer/index.js ***!
  \******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _stripIndentTransformer__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _stripIndentTransformer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./stripIndentTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndentTransformer/stripIndentTransformer.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndentTransformer/stripIndentTransformer.js":
/*!***********************************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndentTransformer/stripIndentTransformer.js ***!
  \***********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  } else {
    return Array.from(arr);
  }
}
/**
 * strips indentation from a template literal
 * @param  {String} type = 'initial' - whether to remove all indentation or just leading indentation. can be 'all' or 'initial'
 * @return {Object}                  - a TemplateTag transformer
 */


var stripIndentTransformer = function stripIndentTransformer() {
  var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'initial';
  return {
    onEndResult: function onEndResult(endResult) {
      if (type === 'initial') {
        // remove the shortest leading indentation from each line
        var match = endResult.match(/^[^\S\n]*(?=\S)/gm);
        var indent = match && Math.min.apply(Math, _toConsumableArray(match.map(function (el) {
          return el.length;
        })));

        if (indent) {
          var regexp = new RegExp('^.{' + indent + '}', 'gm');
          return endResult.replace(regexp, '');
        }

        return endResult;
      }

      if (type === 'all') {
        // remove all indentation from each line
        return endResult.replace(/^[^\S\n]+/gm, '');
      }

      throw new Error('Unknown type: ' + type);
    }
  };
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (stripIndentTransformer);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndents/index.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndents/index.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _stripIndents__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _stripIndents__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./stripIndents */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndents/stripIndents.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndents/stripIndents.js":
/*!***************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndents/stripIndents.js ***!
  \***************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _TemplateTag__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../TemplateTag */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/TemplateTag/index.js");
/* harmony import */ var _stripIndentTransformer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../stripIndentTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/stripIndentTransformer/index.js");
/* harmony import */ var _trimResultTransformer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../trimResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/index.js");



var stripIndents = new _TemplateTag__WEBPACK_IMPORTED_MODULE_0__["default"]((0,_stripIndentTransformer__WEBPACK_IMPORTED_MODULE_1__["default"])('all'), _trimResultTransformer__WEBPACK_IMPORTED_MODULE_2__["default"]);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (stripIndents);

/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/index.js":
/*!*****************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/index.js ***!
  \*****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _trimResultTransformer__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _trimResultTransformer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./trimResultTransformer */ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/trimResultTransformer.js");



/***/ }),

/***/ "./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/trimResultTransformer.js":
/*!*********************************************************************************************************************!*\
  !*** ./node_modules/gatsby-plugin-image/node_modules/common-tags/es/trimResultTransformer/trimResultTransformer.js ***!
  \*********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * TemplateTag transformer that trims whitespace on the end result of a tagged template
 * @param  {String} side = '' - The side of the string to trim. Can be 'start' or 'end' (alternatively 'left' or 'right')
 * @return {Object}           - a TemplateTag transformer
 */
var trimResultTransformer = function trimResultTransformer() {
  var side = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  return {
    onEndResult: function onEndResult(endResult) {
      if (side === '') {
        return endResult.trim();
      }

      side = side.toLowerCase();

      if (side === 'start' || side === 'left') {
        return endResult.replace(/^\s*/, '');
      }

      if (side === 'end' || side === 'right') {
        return endResult.replace(/\s*$/, '');
      }

      throw new Error('Side not supported: ' + side);
    }
  };
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (trimResultTransformer);

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

/***/ "./src/components/gallery.js":
/*!***********************************!*\
  !*** ./src/components/gallery.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _styles_gallery_module_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../styles/gallery.module.css */ "./src/styles/gallery.module.css");




const Gallery = ({
  children,
  columnCount = 3,
  wide
}) => {
  const {
    0: numCols,
    1: setNumCols
  } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(columnCount);
  const cols = [...Array(numCols)].map(() => []);

  const fillCols = (children, cols) => {
    children.forEach((child, i) => cols[i % cols.length].push(child));
  };

  fillCols(children, cols);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: `${_styles_gallery_module_css__WEBPACK_IMPORTED_MODULE_1__.gallery} ${wide ? _styles_gallery_module_css__WEBPACK_IMPORTED_MODULE_1__.wide : ''}`
  }, [...Array(numCols)].map((_, index) => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    key: index
  }, cols[index])));
};

Gallery.propTypes = {
  children: (prop_types__WEBPACK_IMPORTED_MODULE_2___default().array.isRequired),
  columnCount: (prop_types__WEBPACK_IMPORTED_MODULE_2___default().number),
  wide: (prop_types__WEBPACK_IMPORTED_MODULE_2___default().bool)
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Gallery);

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

/***/ "./src/components/pagination.js":
/*!**************************************!*\
  !*** ./src/components/pagination.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var gatsby__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! gatsby */ "./.cache/gatsby-browser-entry.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _styles_pagination_module_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../styles/pagination.module.css */ "./src/styles/pagination.module.css");
/* harmony import */ var _images_icon_chevron_left_svg__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../images/icon-chevron-left.svg */ "./src/images/icon-chevron-left.svg");
/* harmony import */ var _images_icon_chevron_left_svg__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_images_icon_chevron_left_svg__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _images_icon_chevron_right_svg__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../images/icon-chevron-right.svg */ "./src/images/icon-chevron-right.svg");
/* harmony import */ var _images_icon_chevron_right_svg__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_images_icon_chevron_right_svg__WEBPACK_IMPORTED_MODULE_4__);







const PaginationButton = props => {
  const {
    type,
    children
  } = props;

  if (type === 'span') {
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", Object.assign({
      className: _styles_pagination_module_css__WEBPACK_IMPORTED_MODULE_2__.paginationButton
    }, props), children);
  } else {
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(gatsby__WEBPACK_IMPORTED_MODULE_1__.Link, Object.assign({
      className: _styles_pagination_module_css__WEBPACK_IMPORTED_MODULE_2__.paginationButtonEnabled
    }, props), children);
  }
};

PaginationButton.propTypes = {
  type: prop_types__WEBPACK_IMPORTED_MODULE_5___default().oneOf(['link', 'span']),
  children: (prop_types__WEBPACK_IMPORTED_MODULE_5___default().node.isRequired)
};

const Pagination = ({
  currentPage,
  numPages,
  basePath = ''
}) => {
  const isFirst = currentPage === 1;
  const isLast = currentPage === numPages;
  const pages = Array.from({
    length: numPages
  }, (_, i) => i + 1);
  const previousLink = currentPage === 1 ? `/${basePath}` : `/${basePath}${currentPage - 1}/`;
  const nextLink = currentPage === numPages ? `/${basePath}` : `/${basePath}${currentPage + 1}/`;
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("nav", {
    className: _styles_pagination_module_css__WEBPACK_IMPORTED_MODULE_2__.paginaton
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(PaginationButton, {
    type: isFirst ? 'span' : 'link',
    to: previousLink,
    key: "pagination-previous"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((_images_icon_chevron_left_svg__WEBPACK_IMPORTED_MODULE_3___default()), {
    className: _styles_pagination_module_css__WEBPACK_IMPORTED_MODULE_2__.icon
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "visually-hidden"
  }, "Previous Page")), pages.map((pageNumber, index) => {
    const midPageLink = index === 0 ? `/${basePath}` : `/${basePath}${index + 1}/`;
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(PaginationButton, {
      key: `pagination-${index}`,
      to: midPageLink,
      type: index + 1 === currentPage ? 'span' : 'link'
    }, pageNumber);
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(PaginationButton, {
    type: currentPage === numPages ? 'span' : 'link',
    to: nextLink,
    key: "pagination-next"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((_images_icon_chevron_right_svg__WEBPACK_IMPORTED_MODULE_4___default()), {
    className: _styles_pagination_module_css__WEBPACK_IMPORTED_MODULE_2__.icon
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "visually-hidden"
  }, "Next Page")));
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Pagination);
Pagination.propTypes = {
  currentPage: (prop_types__WEBPACK_IMPORTED_MODULE_5___default().number.isRequired),
  numPages: (prop_types__WEBPACK_IMPORTED_MODULE_5___default().number.isRequired),
  basePath: (prop_types__WEBPACK_IMPORTED_MODULE_5___default().string)
};

/***/ }),

/***/ "./src/components/preview.js":
/*!***********************************!*\
  !*** ./src/components/preview.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var gatsby__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! gatsby */ "./.cache/gatsby-browser-entry.js");
/* harmony import */ var gatsby_plugin_image__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! gatsby-plugin-image */ "./node_modules/gatsby-plugin-image/dist/gatsby-image.module.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _styles_preview_module_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../styles/preview.module.css */ "./src/styles/preview.module.css");






const Preview = ({
  title,
  path,
  image
}) => {
  const {
    id,
    childImageSharp
  } = image;
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(gatsby__WEBPACK_IMPORTED_MODULE_1__.Link, {
    to: path
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(gatsby_plugin_image__WEBPACK_IMPORTED_MODULE_3__.GatsbyImage, {
    alt: "",
    loading: "lazy",
    className: _styles_preview_module_css__WEBPACK_IMPORTED_MODULE_2__.item,
    key: id,
    image: childImageSharp.gatsbyImageData
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "visually-hidden"
  }, title));
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Preview);
Preview.propTypes = {
  path: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().string.isRequired),
  title: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().string),
  image: prop_types__WEBPACK_IMPORTED_MODULE_4___default().shape({
    id: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().string.isRequired),
    childImageSharp: prop_types__WEBPACK_IMPORTED_MODULE_4___default().shape({
      fluid: (prop_types__WEBPACK_IMPORTED_MODULE_4___default().object.isRequired)
    })
  })
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

/***/ "./src/templates/index.js":
/*!********************************!*\
  !*** ./src/templates/index.js ***!
  \********************************/
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
/* harmony import */ var _components_layout__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../components/layout */ "./src/components/layout.js");
/* harmony import */ var _components_seo_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../components/seo.js */ "./src/components/seo.js");
/* harmony import */ var _components_gallery__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../components/gallery */ "./src/components/gallery.js");
/* harmony import */ var _components_preview__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../components/preview */ "./src/components/preview.js");
/* harmony import */ var _components_header__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../components/header */ "./src/components/header.js");
/* harmony import */ var _components_pagination__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../components/pagination */ "./src/components/pagination.js");









const IndexPage = ({
  data,
  pageContext
}) => {
  const {
    edges
  } = data.allMarkdownRemark;
  const {
    numPages,
    currentPage,
    site
  } = pageContext;
  const pageTitle = 'Delight your users'; // Iterate over the data and populate an array of Previews

  const previews = edges.map((edge, index) => {
    const {
      title,
      image
    } = edge.node.frontmatter;
    const {
      slug
    } = edge.node.fields;
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_components_preview__WEBPACK_IMPORTED_MODULE_4__["default"], {
      key: index,
      title: title,
      path: slug,
      image: image
    });
  });
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_components_layout__WEBPACK_IMPORTED_MODULE_1__["default"], null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_components_seo_js__WEBPACK_IMPORTED_MODULE_2__["default"], null), currentPage === 1 ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_components_header__WEBPACK_IMPORTED_MODULE_5__["default"], {
    large: true,
    title: pageTitle,
    description: site.siteMetadata.description
  }) : '', /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_components_gallery__WEBPACK_IMPORTED_MODULE_3__["default"], null, previews), numPages > 1 && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_components_pagination__WEBPACK_IMPORTED_MODULE_6__["default"], {
    numPages: numPages,
    currentPage: currentPage
  }));
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (IndexPage);
const pageQuery = "335053796";
IndexPage.propTypes = {
  data: prop_types__WEBPACK_IMPORTED_MODULE_7___default().shape({
    allMarkdownRemark: prop_types__WEBPACK_IMPORTED_MODULE_7___default().shape({
      edges: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().array.isRequired)
    })
  }),
  pageContext: prop_types__WEBPACK_IMPORTED_MODULE_7___default().shape({
    numPages: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().number.isRequired),
    currentPage: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().number.isRequired),
    site: prop_types__WEBPACK_IMPORTED_MODULE_7___default().shape({
      siteMetadata: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().object.isRequired)
    })
  })
};

/***/ }),

/***/ "./src/images/icon-chevron-left.svg":
/*!******************************************!*\
  !*** ./src/images/icon-chevron-left.svg ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var React = __webpack_require__(/*! react */ "react");

function IconChevronLeft (props) {
    return React.createElement("svg",props,React.createElement("path",{"d":"M23.0957-35.3203l-16.7363-16.3281c-.587239-.587239-.880859-1.24609-.880859-1.97656 0-.372396.0751953-.730469.225586-1.07422 .150391-.34375.375977-.651693.676758-.923828l16.7148-16.3281c.486979-.486979 1.08138-.730469 1.7832-.730469 .472656 0 .902343.111003 1.28906.333008 .386719.222005.691081.526367.913086.913086 .222005.386719.333008.816405.333008 1.28906 0 .70182-.257813 1.31771-.773438 1.84766l-16.1133 15.6836v-2.0625l16.1133 15.7266c.515625.529948.773438 1.14583.773438 1.84766 0 .472656-.111003.898763-.333008 1.27832 -.222005.379557-.526367.683919-.913086.913086 -.386719.229167-.816405.34375-1.28906.34375 -.358073 0-.683919-.064453-.977539-.193359 -.29362-.128906-.562175-.315104-.805664-.558594Z","fill":"currentColor"}));
}

IconChevronLeft.defaultProps = {"version":"1.1","viewBox":"5.47852 -72.6816 21.9355 38.1133"};

module.exports = IconChevronLeft;

IconChevronLeft.default = IconChevronLeft;


/***/ }),

/***/ "./src/images/icon-chevron-right.svg":
/*!*******************************************!*\
  !*** ./src/images/icon-chevron-right.svg ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var React = __webpack_require__(/*! react */ "react");

function IconChevronRight (props) {
    return React.createElement("svg",props,React.createElement("path",{"d":"M8.03516-34.5898c.70182 0 1.29622-.24349 1.7832-.730469l16.7148-16.3281c.300781-.300781.522787-.612305.666016-.93457 .143229-.322265.214844-.676759.214844-1.06348 0-.77344-.29362-1.43229-.880859-1.97656l-16.6934-16.3281c-.257813-.243489-.533529-.429687-.827148-.558594 -.29362-.128906-.619466-.193359-.977539-.193359 -.486979 0-.920246.111003-1.2998.333008 -.379557.222005-.683919.526367-.913086.913086 -.229167.386719-.34375.823569-.34375 1.31055 0 .6875.257813 1.29622.773438 1.82617l16.1348 15.7266v-2.0625l-16.1348 15.6836c-.515625.529948-.773438 1.14583-.773438 1.84766 0 .472656.114583.902343.34375 1.28906 .229167.386719.533529.691081.913086.913086 .379557.222005.812824.333008 1.2998.333008Z","transform":"matrix(.997027 0 0 .997027 .064854 0)","fill":"currentColor"}));
}

IconChevronRight.defaultProps = {"version":"1.1","viewBox":"5.46223 -72.487 22 38"};

module.exports = IconChevronRight;

IconChevronRight.default = IconChevronRight;


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
//# sourceMappingURL=component---src-templates-index-js.js.map