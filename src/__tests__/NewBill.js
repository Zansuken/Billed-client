/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";
import { bills } from "../fixtures/bills.js";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  beforeAll(() => {
    // Populating the localStorage:
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "test-email@test.com",
      })
    );
    document.body.innerHTML = NewBillUI({ data: bills });
  });
  afterEach(() => {
    // restore the spy created with spyOn
    jest.restoreAllMocks();
  });
  describe("When I am on NewBill Page", () => {
    test("Then the form should be displayed", () => {
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();

      // Title:
      expect(screen.getByText(/Envoyer une note de frais/)).toBeTruthy();

      // Labels:
      expect(screen.getByText(/Type de dépense/)).toBeTruthy();
      expect(screen.getByText(/Nom de la dépense/)).toBeTruthy();
      expect(screen.getByText(/Date/)).toBeTruthy();
      expect(screen.getByText(/Montant TTC/)).toBeTruthy();
      expect(screen.getByText(/TVA/)).toBeTruthy();
      expect(screen.getByText(/Commentaire/)).toBeTruthy();
      expect(screen.getByText(/Justificatif/)).toBeTruthy();

      // Inputs:
      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();

      // Submit button:
      expect(screen.getByRole("button", { name: "Envoyer" })).toBeTruthy();
    });
  });
  describe("When I change the file input field", () => {
    test("Then the handleChangeFile function should be called", async () => {
      const container = new NewBill({
        document,
        onNavigate: jest.fn,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const fileInput = screen.getByTestId("file");
      const handleChangeFile = jest.fn(container.handleChangeFile);
      fileInput.addEventListener("change", handleChangeFile);
      const file = new File(["test"], "test.jpg", { type: "image/jpg" });

      fireEvent.change(fileInput, {
        target: {
          files: [file],
        },
      });

      await waitFor(() => expect(handleChangeFile).toHaveBeenCalled());
    });
    test("Then the handleChangeFile function should handle errors", async () => {
      const container = new NewBill({
        document,
        onNavigate: jest.fn,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Mock the create function to always reject
      container.store.bills().create = jest.fn(() =>
        Promise.reject(new Error("Test error"))
      );

      const fileInput = screen.getByTestId("file");
      const handleChangeFile = jest.fn(container.handleChangeFile);
      fileInput.addEventListener("change", handleChangeFile);
      const file = new File([""], "test.txt", { type: "text/plain" });
      Object.defineProperty(fileInput, "files", { value: [file] });

      // Spy on console.error
      const errorSpy = jest.spyOn(console, "error");

      fireEvent.change(fileInput);

      // Wait for the handleChangeFile function to be called
      await waitFor(() => expect(handleChangeFile).toHaveBeenCalled());
      await waitFor(() => screen.getByTestId("file"));

      // Check if the console.error function was called
      expect(errorSpy).toHaveBeenCalledWith(new Error("Test error"));

      // Restore the original function after the test
      errorSpy.mockRestore();
    });
  });
  describe("When the user submit the form", () => {
    test("Then the submit function should be called", async () => {
      const container = new NewBill({
        document,
        onNavigate: jest.fn,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(container.handleChangeFile);
      const handleSubmit = jest.fn(container.handleSubmit);

      const newBill = {
        amount: 10,
        commentary: "test-commentary",
        date: "2024-01-01",
        email: "test-email@test.com",
        fileName: "test.jpg",
        fileUrl: "https://localhost:3456/images/test.jpg",
        name: "test-name",
        pct: 40,
        status: "pending",
        type: "Services en ligne",
        vat: "21",
      };

      const form = screen.getByTestId("form-new-bill");
      const fileInput = screen.getByTestId("file");
      const amountInput = screen.getByTestId("amount");
      const dateInput = screen.getByTestId("datepicker");
      const nameInput = screen.getByTestId("expense-name");
      const commentaryInput = screen.getByTestId("commentary");
      const vatInput = screen.getByTestId("vat");
      const pctInput = screen.getByTestId("pct");
      const typeInput = screen.getByTestId("expense-type");

      fileInput.addEventListener("change", handleChangeFile);
      const file = new File(["test"], "test.jpg", { type: "image/jpg" });

      fireEvent.change(fileInput, {
        target: {
          files: [file],
        },
      });

      expect(handleChangeFile).toHaveBeenCalled();

      container.fileName = "test.jpg";
      container.fileUrl = "https://localhost:3456/images/test.jpg";

      fireEvent.change(nameInput, { target: { value: newBill.name } });
      fireEvent.change(amountInput, { target: { value: newBill.amount } });
      fireEvent.change(dateInput, { target: { value: newBill.date } });
      fireEvent.change(commentaryInput, {
        target: { value: newBill.commentary },
      });
      fireEvent.change(vatInput, { target: { value: newBill.vat } });
      fireEvent.change(pctInput, { target: { value: newBill.pct } });
      fireEvent.change(typeInput, { target: { value: newBill.type } });

      await waitFor(() => {
        expect(handleChangeFile).toHaveBeenCalled();
      });

      form.addEventListener("submit", handleSubmit);

      const updateBillSpy = jest.spyOn(container, "updateBill");
      const onNavigateSpy = jest.spyOn(container, "onNavigate");

      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      expect(updateBillSpy).toHaveBeenCalledWith(newBill);
      expect(onNavigateSpy).toHaveBeenCalled();
    });
  });
});
