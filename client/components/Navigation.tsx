import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Shield, Terminal } from "lucide-react";

export default function Navigation() {
  const location = useLocation();

  if (location.pathname === "/admin") {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Link to="/">
          <Button
            variant="outline"
            className="border-terminal-green text-terminal-green hover:bg-terminal-green/10"
          >
            <Terminal className="w-4 h-4 mr-2" />
            Submission Form
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link to="/admin">
        <Button
          variant="outline"
          size="sm"
          className="border-terminal-green-dim text-terminal-green-dim hover:bg-terminal-green/10 hover:border-terminal-green hover:text-terminal-green"
        >
          <Shield className="w-4 h-4 mr-2" />
          Admin
        </Button>
      </Link>
    </div>
  );
}
