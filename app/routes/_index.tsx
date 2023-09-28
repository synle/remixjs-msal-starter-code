import { useMeProfile } from "~/utils/frontend/hooks/Auth";
import DataTable, { ColumnFilter } from "~/components/DataTable";
import { Paper } from "@mui/material";

export default function Index() {
  const { data: profile, isLoading } = useMeProfile();

  if (isLoading) {
    return <h2>Loading...</h2>;
  }

  if (!profile) {
    return null;
  }

  // generate dummy an array of data to be shown for table
  const data = Object.entries(profile).map(([key, value]) => ({ key, value }));

  return (
    <>
      <Paper>
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
    </>
  );
}
