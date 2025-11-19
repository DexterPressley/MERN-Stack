import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Login from "../Login";

describe("Login Component", () => {
  test("shows validation errors when fields are empty", () => {
    render(<Login />);

    const button = screen.getByRole("button", { name: /login/i });

    fireEvent.click(button);

    expect(screen.getByText("Username is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
  });
});

