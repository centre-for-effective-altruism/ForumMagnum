import React, { FC, ReactNode, createContext, useContext, useMemo } from "react";

export type LoginAction = "login" | "signup";

type LoginPopoverContext = {
  onLogin: () => void,
  onSignup: () => void,
}

const loginPopoverContext = createContext<LoginPopoverContext | null>(null);

export const redirectToLoginPage = (action: LoginAction) => {
  const params = new URLSearchParams({
    returnTo: window.location.pathname + window.location.search,
  });
  if (action === "signup") {
    params.set("signup", "true");
  }
  window.location.href = `/login?${params}`;
}

export const LoginPopoverContextProvider: FC<{
  children?: ReactNode,
}> = ({children}) => {
  const providedContext: LoginPopoverContext = useMemo(() => ({
    onLogin: () => redirectToLoginPage("login"),
    onSignup: () => redirectToLoginPage("signup"),
  }), []);
  
  return (
    <loginPopoverContext.Provider value={providedContext}>
      {children}
    </loginPopoverContext.Provider>
  );
}

export const useLoginPopoverContext = () => {
  const value = useContext(loginPopoverContext);
  if (!value) {
    throw new Error("No login popover context provider");
  }
  return value;
}
