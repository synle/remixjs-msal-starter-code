import { useMeProfile } from "~/utils/frontend/Hooks";

export default function Index() {
  const { data: profile, isLoading } = useMeProfile();

  if (isLoading) {
    return <h2>Loading...</h2>;
  }

  if (!profile) {
    return null;
  }

  return (
    <>
      <pre>{JSON.stringify(profile, null, 2)}</pre>
    </>
  );
}
