module.exports = {
  ci: {
    collect: {
      staticDistDir: "./",
      url: ["http://localhost:8080"]
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.8 }]
      }
    }
  }
};
