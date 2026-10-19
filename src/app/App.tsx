import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DataProvider } from "./contexts/DataContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <DataProvider>
          <RouterProvider router={router} />
          <Toaster richColors position="top-right" />
        </DataProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}