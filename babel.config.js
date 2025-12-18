module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "18",
          browsers: ["> 1%", "last 2 versions", "not dead"],
        },
      },
    ],
    ["@babel/preset-react", { runtime: "automatic" }],
    "@babel/preset-typescript",
  ],
  env: {
    test: {
      presets: [
        [
          "@babel/preset-env",
          {
            targets: {
              node: "current",
            },
          },
        ],
      ],
    },
  },
};
