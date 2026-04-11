module.exports = [{
      plugin: require('../node_modules/gatsby-plugin-manifest/gatsby-browser.js'),
      options: {"plugins":[],"name":"Empty States","short_name":"Empty States","start_url":"/","background_color":"#f8f8fe","theme_color":"#3c4858","display":"standalone","icon":"src/images/logo.svg","legacy":true,"theme_color_in_head":true,"cache_busting_mode":"query","crossOrigin":"anonymous","include_favicon":true,"cacheDigest":"91bb4989286c2c4b19482f357512d910"},
    },{
      plugin: require('../node_modules/gatsby-plugin-offline/gatsby-browser.js'),
      options: {"plugins":[],"precachePages":["/mobile/"],"workboxConfig":{"globPatterns":["**/icon*"]}},
    },{
      plugin: require('../gatsby-browser.js'),
      options: {"plugins":[]},
    }]
