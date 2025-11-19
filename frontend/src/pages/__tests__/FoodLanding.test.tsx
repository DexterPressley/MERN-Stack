import '@testing-library/jest-dom';
import { render, screen } from "@testing-library/react";
import FoodLanding from "../FoodLanding";

describe("FoodLanding Page", () => {
  test("renders main UI sections", () => {
    render(<FoodLanding />);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/today's meals/i)).toBeInTheDocument();
  });
});

