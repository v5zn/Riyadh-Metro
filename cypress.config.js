const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:8080", // or whatever local address you test on
    specPattern: "cypress/e2e/**/*.cy.js"
  }
});
