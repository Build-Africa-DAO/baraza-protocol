import ProposalsClient from "./ProposalsClient";

export const metadata = {
  title: "Proposals · Baraza",
};

// DESIGN-ONLY mode: the page renders from local mock fixtures via the client
// component (votes are in-memory). When the backend returns, this server
// component is where the real data fetch will live, passed down as props.
export default function ProposalsPage() {
  return <ProposalsClient />;
}
