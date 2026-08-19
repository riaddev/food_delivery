import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
            <p className="text-3xl mb-3 text-zinc-400">:(</p>
            <h1 className="text-xl font-bold text-zinc-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-zinc-500 mb-6">
              An unexpected error occurred. Don&apos;t worry — your data is safe.
            </p>
            <button
              onClick={this.handleReset}
              className="bg-[#E03546] hover:bg-red-600 text-white font-bold px-6 py-3 rounded-xl transition-colors cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}