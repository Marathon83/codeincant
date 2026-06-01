import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, color: "var(--red)", fontFamily: "var(--font-mono)" }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Something went wrong in this tab.</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 16 }}>
            {this.state.error.message}
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => this.setState({ error: null })}
          >
            Reload tab
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
