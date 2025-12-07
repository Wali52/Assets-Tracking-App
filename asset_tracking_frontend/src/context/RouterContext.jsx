import React, { createContext, useContext, useState, useEffect } from 'react';

// --- Router Context ---
export const RouterContext = createContext({
  currentPath: '/',
  navigate: () => {},
});

// --- Custom hook ---
export const useRouter = () => useContext(RouterContext);

// --- Router Provider ---
export const RouterProvider = ({ children }) => {
  const [currentPath, setCurrentPath] = useState(() => window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handleHashChange = () => setCurrentPath(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path) => {
    window.location.hash = path;
  };

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};
