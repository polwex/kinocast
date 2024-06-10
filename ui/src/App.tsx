import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NewRouter from "./NewRouter";

function App() {
  const queryClient = new QueryClient();
  return (
      <QueryClientProvider client={queryClient}>
        <NewRouter />
      </QueryClientProvider>
  );
}

export default App;
