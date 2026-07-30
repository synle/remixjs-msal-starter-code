import {
  AppBar,
  Avatar,
  Box,
  Button,
  CssBaseline,
  Divider,
  IconButton,
  Link,
  Menu,
  MenuItem,
  Paper,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import { ActionDialogsContext } from "react-dialog-mui";
import { QueryClient, QueryClientProvider } from "react-query";
import Loading from "~/components/Loading";
import { useMeProfile } from "~/utils/frontend/hooks/Auth";

/**
 * Returns the upper-case initials of a full name (e.g. "Jane Doe" → "JD").
 *
 * Used to populate the avatar in the top-right user menu.
 */
function _getInitials(fullName: string) {
  const names = fullName.split(" ");
  return names
    .map((name) => name.charAt(0))
    .join("")
    .toUpperCase();
}

/** Remix `links` export — wires in the css-bundle stylesheet when available. */
export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

const theme = createTheme({});
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // notifyOnChangeProps: 'tracked',
      refetchOnWindowFocus: false,
      retry: (failureCount, error?: any) => {
        // don't retry on these errors
        switch (error?.status) {
          case 400: // bad request
          case 401: // unauthorized - not authenticated
          case 403: // forbidden - not allowed
          case 404: // not found
            return false;
        }

        return true;
      },
    },
  },
});

/**
 * Top-level app shell.
 *
 * Renders one of three states based on `useMeProfile()`:
 * - loading spinner while the profile is being fetched
 * - "Welcome back" + login button when no profile is returned (unauthenticated)
 * - app bar with user menu + `<Outlet />` for the active route when authenticated
 */
function App() {
  const { data: profile, isLoading } = useMeProfile();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  let contentDom = <></>;

  if (isLoading) {
    contentDom = <Loading>Loading...</Loading>;
  } else if (!profile) {
    contentDom = (
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Paper
          sx={{
            px: 4,
            py: 3,
          }}
        >
          <Typography variant="h6" sx={{ marginBottom: 4 }}>
            Welcome back.
          </Typography>
          <Typography sx={{ marginBottom: 4 }}>
            You are not authenticated, please log in to continue.
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              component={Link}
              href="/api/auth/microsoft/login"
            >
              Log in with Microsoft
            </Button>
            <Button
              variant="outlined"
              component={Link}
              href="/api/auth/google/login"
            >
              Log in with Google
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  } else {
    const linkStyles = {
      color: "white",
      fontWeight: "bold",
    };

    const fullName = `${profile.displayName}`;

    contentDom = (
      <>
        <AppBar position="static">
          <Toolbar sx={{ display: "flex", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Link href="/" underline="hover">
                <Typography variant="h6" sx={linkStyles}>
                  Sample App
                </Typography>
              </Link>
              {/* TODO: add more links / button if needed*/}
            </Box>
            <Box sx={{ marginLeft: "auto" }}>
              <IconButton
                aria-label="profile"
                aria-controls="current-user-profile-menu"
                aria-haspopup="true"
                onClick={(event) => setAnchorEl(event.currentTarget)}
              >
                <Avatar>{_getInitials(fullName)}</Avatar>
              </IconButton>
              <Menu
                id="current-user-profile-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
              >
                <MenuItem disabled>{fullName}</MenuItem>
                <MenuItem disabled>{profile.email}</MenuItem>
                <Divider sx={{ my: 1 }} />
                <MenuItem component={Link} href="/api/auth/logout">
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
        <Box sx={{ py: 2, px: 3 }}>
          <Outlet />
        </Box>
      </>
    );
  }

  return (
    <Box
      sx={{
        height: "100vh",
        bgcolor: "background.default",
      }}
    >
      {contentDom}
    </Box>
  );
}

/**
 * Wraps children with the React Query, MUI ThemeProvider, and ActionDialogs contexts.
 *
 * Computes the MUI palette from the user's `prefers-color-scheme` media query and
 * defers rendering until after the first effect tick to avoid SSR/CSR theme mismatch.
 */
function AppContextReducer(props: { children: JSX.Element | JSX.Element[] }) {
  const contexts = [ActionDialogsContext];

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode: prefersDarkMode ? "dark" : "light",
      },
    });
  }, [prefersDarkMode]);

  useEffect(() => {
    setInit(true);
  }, []);

  const [init, setInit] = useState(false);

  if (!init) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {contexts.reduceRight(
          (acc, ContextProvider) => (
            <ContextProvider>{acc}</ContextProvider>
          ),
          <>{props.children}</>,
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/**
 * Remix root — the only HTML document the app produces. All route content is
 * rendered through `<App />` → `<Outlet />`. Wraps children in `AppContextReducer`
 * so every route inherits the React Query, MUI theme, and dialog contexts.
 */
export default function () {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <CssBaseline />
        <AppContextReducer>
          <App />
        </AppContextReducer>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
