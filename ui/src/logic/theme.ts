import { createContext, useContext, useState } from 'react';


export function setTheme2() {
  const wantsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (wantsDark) document.documentElement.setAttribute('data-theme', "dark")
  else document.documentElement.setAttribute('data-theme', "light")
}

export function toggleTheme() {
  // const { darkMode, setDarkMode } = useGlobalState.getState()
  // const nextTheme = darkMode ? "light" : "dark";
  // setDarkMode(!darkMode);
  // document.documentElement.setAttribute('data-theme', nextTheme)
}

export type Theme = "default" | "light" | "dark"
const ThemeContext = createContext({
  theme: "dark",
  setTheme: (theme: Theme) => { }
});

// export const ThemeProvider = ({ children }) => {
//   const [theme, setTTheme] = useState('dark'); // Start with the default theme
//   const setTheme = (theme: Theme) => {
//     setTTheme(theme);
//   };

//   return (
//     <ThemeContext.Provider value={{ theme, setTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// };

export const useTheme = () => {
  const context = useContext(ThemeContext)
  return context
};
