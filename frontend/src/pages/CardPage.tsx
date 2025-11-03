import PageTitle from "../components/PageTitle";
import LoggedInName from "../components/LoggedInName";
import CardUI from "../components/CardUI";

export default function CardPage() {
  return (
    <div className="layout">
      {/* Left sidebar */}
      <aside className="sidebar">
        <div className="sidebar-section">
          <h3>Dashboard</h3>
          <ul>
            <li className="active">Cards</li>
            <li>Trends</li>
            <li>Reports</li>
          </ul>
        </div>
      </aside>

      {/* Main content */}
      <main className="main">
        <PageTitle />
        <LoggedInName />

        <div className="grid">
          <section className="card span-2">
            <h2>Cards</h2>
            <CardUI />
          </section>

          <section className="card">
            <h2>Today</h2>
            <p className="muted">Quick summary (placeholder)</p>
          </section>

          <section className="card">
            <h2>Recent</h2>
            <p className="muted">Your latest actions (placeholder)</p>
          </section>
        </div>
      </main>
    </div>
  );
}
