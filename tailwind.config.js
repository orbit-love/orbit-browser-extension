module.exports = {
  content: ["./src/**/*.html", "./src/components/*.js"],
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [require("@tailwindcss/forms")],
};
