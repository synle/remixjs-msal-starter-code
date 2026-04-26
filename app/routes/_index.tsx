/** Root index route — renders the signed-in user's Graph profile as JSON, a sortable table, and a sample modal. */
import { Box, Button, Paper } from "@mui/material";
import { useActionDialogs } from "react-dialog-mui";
import DataTable, { ColumnFilter } from "~/components/DataTable";
import { useMeProfile } from "~/utils/frontend/hooks/Auth";

/**
 * Main page shown after the user is authenticated.
 *
 * Shows a `<pre>` JSON dump of the profile, a key/value DataTable view of the
 * same data, and a "Test" button that opens a sample modal via `react-dialog-mui`.
 */
export default function Index() {
  const { data: profile, isLoading } = useMeProfile();
  const { modal } = useActionDialogs();

  if (isLoading) {
    return <h2>Loading...</h2>;
  }

  if (!profile) {
    return null;
  }

  // generate dummy an array of data to be shown for table
  const data = Object.entries(profile).map(([key, value]) => ({ key, value }));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Paper sx={{ px: 2, py: 1 }}>
        <pre>{JSON.stringify(profile, null, 2)}</pre>
      </Paper>
      <DataTable
        data={data}
        columns={[
          {
            Header: "Key",
            accessor: "key",
            Filter: ColumnFilter,
            Cell: (cell) => {
              return <strong>{cell.value}</strong>;
            },
          },
          {
            Header: "Value",
            accessor: "value",
            Filter: ColumnFilter,
          },
        ]}
      />
      <Box>
        <Button
          variant="outlined"
          onClick={async () => {
            // more info here: https://github.com/synle/react-dialog-mui
            try {
              await modal({
                title: "Test Dialog",
                message: (
                  <>
                    <div>
                      <strong>Name:</strong> Mocked Name
                    </div>
                  </>
                ),
              });

              // when users close out of modal
            } catch (err) {}
          }}
        >
          Test
        </Button>
      </Box>
    </Box>
  );
}
