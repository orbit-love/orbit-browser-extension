module.exports = {
  content: ["./src/**/*.html", "./src/components/*.ts"],
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [require("@tailwindcss/forms")],
};
