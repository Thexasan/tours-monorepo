const path = require("path");

module.exports = {
  i18n: {
    defaultLocale: "ru",
    locales: ["ru", "en", "tj"],
    localeDetection: false,
  },
  localePath: path.resolve("./locales"),
  ns: ["common", "tours", "auth", "dashboard"],
  defaultNS: "common",
};
