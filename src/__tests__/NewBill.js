/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";
import { bills } from "../fixtures/bills.js";
import { ROUTES } from "../constants/routes.js";
import "@testing-library/jest-dom";

jest.mock("../app/Store", () => mockStore);

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

describe("Given I am connected as an employee", () => {
  const { getComputedStyle } = window;
  window.getComputedStyle = (elt) => getComputedStyle(elt);
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
      const formElements = [
        "form-new-bill",
        "expense-type",
        "expense-name",
        "datepicker",
        "amount",
        "vat",
        "pct",
        "commentary",
        "file",
      ];
      formElements.forEach((element) => {
        expect(screen.getByTestId(element)).toBeTruthy();
      });

      const labels = [
        "Envoyer une note de frais",
        "Type de dépense",
        "Nom de la dépense",
        "Date",
        "Montant TTC",
        "TVA",
        "Commentaire",
        "Justificatif",
      ];
      labels.forEach((label) => {
        expect(screen.getByText(new RegExp(label))).toBeTruthy();
      });

      expect(screen.getByRole("button", { name: "Envoyer" })).toBeTruthy();
    });
  });
  describe("When I change the file input field", () => {
    test.each([
      ["test.jpg", "image/jpg", ".jpg", true],
      ["test.txt", "text/plain", ".txt", false],
      ["test.zip", "application/zip", ".zip", false],
      ["test.png", "image/png", ".png", true],
    ])(
      "Then the handleChangeFile function should be called with file type %s",
      async (filename, type, extension, isValidExtension) => {
        const container = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const fileInput = screen.getByTestId("file");
        const handleChangeFile = jest.fn(container.handleChangeFile);
        fileInput.addEventListener("change", handleChangeFile);
        const file = new File([""], filename, { type });

        fireEvent.change(fileInput, {
          target: {
            files: [file],
          },
        });

        await waitFor(() => expect(handleChangeFile).toHaveBeenCalled());

        const errorHelper = screen.queryByTestId("file-error-helper");
        const expectedError = screen.queryByText(
          `This file type: "${extension}" is not allowed. Authorized extensions: .jpeg, .jpg, .png, .gif`
        );
        const submitBtn = screen.getByTestId("btn-send-bill");

        if (!isValidExtension) {
          expect(errorHelper).toBeInTheDocument();
          expect(expectedError).toBeInTheDocument();
          expect(submitBtn).toBeDisabled();
        } else {
          expect(errorHelper).not.toBeInTheDocument();
          expect(expectedError).not.toBeInTheDocument();
          expect(submitBtn).not.toBeDisabled();
        }
      }
    );
    test("Then the handleChangeFile function should handle errors", async () => {
      const container = new NewBill({
        document,
        onNavigate,
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
      const validFile = new File([""], "test.png", { type: "image/png" });
      Object.defineProperty(fileInput, "files", { value: [validFile] });

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
        onNavigate,
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
      const file = new File([""], "test.jpg", { type: "image/jpg" });

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

      await waitFor(() => {
        screen.getByTestId("btn-new-bill");
        screen.getByText("Mes notes de frais");
      });
    });
  });
});
