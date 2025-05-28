import { ThemeProvider } from "./components/ThemeProvider";
import AppRoutes from "./routes/AppRoutes";

const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AppRoutes />
    </ThemeProvider>
  );
};

export default App;
