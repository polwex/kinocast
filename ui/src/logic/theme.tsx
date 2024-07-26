export function setTheme() {
  const wantsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (wantsDark) document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.setAttribute("data-theme", "light");
}

export function toggleTheme() {
  // const { darkMode, setDarkMode } = useGlobalState.getState()
  // const nextTheme = darkMode ? "light" : "dark";
  // setDarkMode(!darkMode);
  // document.documentElement.setAttribute('data-theme', nextTheme)
}
